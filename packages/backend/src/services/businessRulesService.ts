import { prisma } from '../config/database';
import {
  VehicleStatus,
  DriverStatus,
  TripStatus,
  MaintenanceStatus,
} from '@transport-ops/shared/enums';
import { AppError, BusinessRuleError } from '../middleware/errorHandler';

type Vehicle = Awaited<ReturnType<typeof prisma.vehicle.findUnique>>;
type Driver = Awaited<ReturnType<typeof prisma.driver.findUnique>>;
type Trip = Awaited<ReturnType<typeof prisma.trip.findUnique>>;
type MaintenanceLog = Awaited<ReturnType<typeof prisma.maintenanceLog.findUnique>>;

export class BusinessRulesService {
  // ========== VEHICLE RULES ==========

  static async assertVehicleAvailable(vehicleId: string): Promise<Vehicle> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
    }

    if (vehicle.status === VehicleStatus.RETIRED) {
      throw new BusinessRuleError('Retired vehicles cannot be assigned to trips');
    }

    if (vehicle.status === VehicleStatus.IN_SHOP) {
      throw new BusinessRuleError('Vehicles in maintenance cannot be assigned to trips');
    }

    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw new BusinessRuleError('Vehicle is already on a trip');
    }

    return vehicle;
  }

  static async getAvailableVehiclesForDispatch(cargoWeightKg?: number): Promise<Vehicle[]> {
    const where: any = {
      status: VehicleStatus.AVAILABLE,
    };

    if (cargoWeightKg) {
      where.maxLoadCapacityKg = { gte: cargoWeightKg };
    }

    return prisma.vehicle.findMany({
      where,
      orderBy: { registrationNumber: 'asc' },
    });
  }

  static assertCargoWeightValid(vehicle: Vehicle, cargoWeightKg: number): void {
    if (!vehicle) return;
    if (cargoWeightKg > vehicle.maxLoadCapacityKg) {
      throw new BusinessRuleError(
        `Cargo weight (${cargoWeightKg} kg) exceeds vehicle capacity (${vehicle.maxLoadCapacityKg} kg)`
      );
    }
  }

  static async setVehicleStatus(vehicleId: string, status: VehicleStatus): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status },
    });
  }

  // ========== DRIVER RULES ==========

  static async assertDriverEligible(driverId: string): Promise<Driver> {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new AppError(404, 'Driver not found', 'NOT_FOUND');
    }

    if (driver.status === DriverStatus.SUSPENDED) {
      throw new BusinessRuleError('Suspended drivers cannot be assigned to trips');
    }

    if (driver.status === DriverStatus.OFF_DUTY) {
      throw new BusinessRuleError('Off-duty drivers cannot be assigned to trips');
    }

    if (driver.status === DriverStatus.ON_TRIP) {
      throw new BusinessRuleError('Driver is already on a trip');
    }

    if (new Date(driver.licenseExpiryDate) <= new Date()) {
      throw new BusinessRuleError('Driver license has expired');
    }

    return driver;
  }

  static async getAvailableDriversForDispatch(): Promise<Driver[]> {
    return prisma.driver.findMany({
      where: {
        status: DriverStatus.AVAILABLE,
        licenseExpiryDate: { gt: new Date() },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async setDriverStatus(driverId: string, status: DriverStatus): Promise<Driver> {
    return prisma.driver.update({
      where: { id: driverId },
      data: { status },
    });
  }

  // ========== TRIP LIFECYCLE RULES ==========

  static async dispatchTrip(tripId: string, userId: string): Promise<Trip> {
    return prisma.$transaction(async (tx: any) => {
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        include: { vehicle: true, driver: true },
      });

      if (!trip) {
        throw new AppError(404, 'Trip not found', 'NOT_FOUND');
      }

      if (trip.status !== TripStatus.DRAFT) {
        throw new BusinessRuleError(`Cannot dispatch trip in ${trip.status} status`);
      }

      // Re-validate vehicle and driver availability
      await this.assertVehicleAvailable(trip.vehicleId);
      await this.assertDriverEligible(trip.driverId);

      // Validate cargo weight
      this.assertCargoWeightValid(trip.vehicle, trip.cargoWeightKg);

      // Update trip status
      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.DISPATCHED,
          dispatchedAt: new Date(),
          startOdometerKm: trip.vehicle.odometerKm,
          updatedById: userId,
        },
        include: { vehicle: true, driver: true },
      });

      // Update vehicle and driver status
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.ON_TRIP },
      });

      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.ON_TRIP },
      });

      return updatedTrip;
    });
  }

  static async completeTrip(
    tripId: string,
    data: { actualDistanceKm: number; endOdometerKm: number; fuelConsumedLiters: number; revenue?: number },
    userId: string
  ): Promise<Trip> {
    return prisma.$transaction(async (tx: any) => {
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        include: { vehicle: true, driver: true },
      });

      if (!trip) {
        throw new AppError(404, 'Trip not found', 'NOT_FOUND');
      }

      if (trip.status !== TripStatus.DISPATCHED) {
        throw new BusinessRuleError(`Cannot complete trip in ${trip.status} status`);
      }

      // Validate odometer progression
      if (data.endOdometerKm <= (trip.startOdometerKm || trip.vehicle.odometerKm)) {
        throw new BusinessRuleError('End odometer must be greater than start odometer');
      }

      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.COMPLETED,
          completedAt: new Date(),
          actualDistanceKm: data.actualDistanceKm,
          endOdometerKm: data.endOdometerKm,
          fuelConsumedLiters: data.fuelConsumedLiters,
          revenue: data.revenue,
          updatedById: userId,
        },
        include: { vehicle: true, driver: true },
      });

      // Update vehicle odometer and status
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          odometerKm: data.endOdometerKm,
          status: VehicleStatus.AVAILABLE,
        },
      });

      // Update driver status
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.AVAILABLE },
      });

      return updatedTrip;
    });
  }

  static async cancelTrip(tripId: string, reason: string, userId: string): Promise<Trip> {
    return prisma.$transaction(async (tx: any) => {
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        include: { vehicle: true, driver: true },
      });

      if (!trip) {
        throw new AppError(404, 'Trip not found', 'NOT_FOUND');
      }

      if (![TripStatus.DRAFT, TripStatus.DISPATCHED].includes(trip.status)) {
        throw new BusinessRuleError(`Cannot cancel trip in ${trip.status} status`);
      }

      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
          updatedById: userId,
        },
        include: { vehicle: true, driver: true },
      });

      // If dispatched, restore vehicle and driver status
      if (trip.status === TripStatus.DISPATCHED) {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });

        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.AVAILABLE },
        });
      }

      return updatedTrip;
    });
  }

  // ========== MAINTENANCE RULES ==========

  static async openMaintenance(
    data: { vehicleId: string; description: string; cost: number; odometerAtStart: number },
    userId: string
  ): Promise<MaintenanceLog> {
    return prisma.$transaction(async (tx: any) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: data.vehicleId },
      });

      if (!vehicle) {
        throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
      }

      if (vehicle.status === VehicleStatus.RETIRED) {
        throw new BusinessRuleError('Cannot create maintenance for retired vehicle');
      }

      // If vehicle is on a trip, we need to handle that
      if (vehicle.status === VehicleStatus.ON_TRIP) {
        // Find and cancel the active trip
        const activeTrip = await tx.trip.findFirst({
          where: { vehicleId: data.vehicleId, status: TripStatus.DISPATCHED },
        });

        if (activeTrip) {
          await tx.trip.update({
            where: { id: activeTrip.id },
            data: {
              status: TripStatus.CANCELLED,
              cancelledAt: new Date(),
              cancellationReason: 'Vehicle sent for maintenance',
            },
          });

          // Restore driver
          await tx.driver.update({
            where: { id: activeTrip.driverId },
            data: { status: DriverStatus.AVAILABLE },
          });
        }
      }

      const maintenance = await tx.maintenanceLog.create({
        data: {
          vehicleId: data.vehicleId,
          description: data.description,
          status: MaintenanceStatus.OPEN,
          cost: data.cost,
          odometerAtStart: data.odometerAtStart,
          startedAt: new Date(),
          createdById: userId,
        },
      });

      // Set vehicle to IN_SHOP
      await tx.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: VehicleStatus.IN_SHOP },
      });

      return maintenance;
    });
  }

  static async closeMaintenance(
    maintenanceId: string,
    data: { odometerAtEnd: number; actualCost?: number },
    userId: string
  ): Promise<MaintenanceLog> {
    return prisma.$transaction(async (tx: any) => {
      const maintenance = await tx.maintenanceLog.findUnique({
        where: { id: maintenanceId },
        include: { vehicle: true },
      });

      if (!maintenance) {
        throw new AppError(404, 'Maintenance record not found', 'NOT_FOUND');
      }

      if (maintenance.status === MaintenanceStatus.COMPLETED) {
        throw new BusinessRuleError('Maintenance already completed');
      }

      if (data.odometerAtEnd <= maintenance.odometerAtStart) {
        throw new BusinessRuleError('End odometer must be greater than start odometer');
      }

      const updatedMaintenance = await tx.maintenanceLog.update({
        where: { id: maintenanceId },
        data: {
          status: MaintenanceStatus.COMPLETED,
          completedAt: new Date(),
          odometerAtEnd: data.odometerAtEnd,
          cost: data.actualCost ?? maintenance.cost,
          updatedById: userId,
        },
      });

      // Restore vehicle to AVAILABLE unless RETIRED
      if (maintenance.vehicle.status !== VehicleStatus.RETIRED) {
        await tx.vehicle.update({
          where: { id: maintenance.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }

      return updatedMaintenance;
    });
  }
}