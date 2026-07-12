"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRulesService = void 0;
const database_1 = require("../config/database");
const enums_1 = require("@transport-ops/shared/enums");
const errorHandler_1 = require("../middleware/errorHandler");
class BusinessRulesService {
    // ========== VEHICLE RULES ==========
    static async assertVehicleAvailable(vehicleId) {
        const vehicle = await database_1.prisma.vehicle.findUnique({
            where: { id: vehicleId },
        });
        if (!vehicle) {
            throw new errorHandler_1.AppError(404, 'Vehicle not found', 'NOT_FOUND');
        }
        if (vehicle.status === enums_1.VehicleStatus.RETIRED) {
            throw new errorHandler_1.BusinessRuleError('Retired vehicles cannot be assigned to trips');
        }
        if (vehicle.status === enums_1.VehicleStatus.IN_SHOP) {
            throw new errorHandler_1.BusinessRuleError('Vehicles in maintenance cannot be assigned to trips');
        }
        if (vehicle.status === enums_1.VehicleStatus.ON_TRIP) {
            throw new errorHandler_1.BusinessRuleError('Vehicle is already on a trip');
        }
        return vehicle;
    }
    static async getAvailableVehiclesForDispatch(cargoWeightKg) {
        const where = {
            status: enums_1.VehicleStatus.AVAILABLE,
        };
        if (cargoWeightKg) {
            where.maxLoadCapacityKg = { gte: cargoWeightKg };
        }
        return database_1.prisma.vehicle.findMany({
            where,
            orderBy: { registrationNumber: 'asc' },
        });
    }
    static assertCargoWeightValid(vehicle, cargoWeightKg) {
        if (cargoWeightKg > vehicle.maxLoadCapacityKg) {
            throw new errorHandler_1.BusinessRuleError(`Cargo weight (${cargoWeightKg} kg) exceeds vehicle capacity (${vehicle.maxLoadCapacityKg} kg)`);
        }
    }
    static async setVehicleStatus(vehicleId, status) {
        return database_1.prisma.vehicle.update({
            where: { id: vehicleId },
            data: { status },
        });
    }
    // ========== DRIVER RULES ==========
    static async assertDriverEligible(driverId) {
        const driver = await database_1.prisma.driver.findUnique({
            where: { id: driverId },
        });
        if (!driver) {
            throw new errorHandler_1.AppError(404, 'Driver not found', 'NOT_FOUND');
        }
        if (driver.status === enums_1.DriverStatus.SUSPENDED) {
            throw new errorHandler_1.BusinessRuleError('Suspended drivers cannot be assigned to trips');
        }
        if (driver.status === enums_1.DriverStatus.OFF_DUTY) {
            throw new errorHandler_1.BusinessRuleError('Off-duty drivers cannot be assigned to trips');
        }
        if (driver.status === enums_1.DriverStatus.ON_TRIP) {
            throw new errorHandler_1.BusinessRuleError('Driver is already on a trip');
        }
        if (new Date(driver.licenseExpiryDate) <= new Date()) {
            throw new errorHandler_1.BusinessRuleError('Driver license has expired');
        }
        return driver;
    }
    static async getAvailableDriversForDispatch() {
        return database_1.prisma.driver.findMany({
            where: {
                status: enums_1.DriverStatus.AVAILABLE,
                licenseExpiryDate: { gt: new Date() },
            },
            orderBy: { name: 'asc' },
        });
    }
    static async setDriverStatus(driverId, status) {
        return database_1.prisma.driver.update({
            where: { id: driverId },
            data: { status },
        });
    }
    // ========== TRIP LIFECYCLE RULES ==========
    static async dispatchTrip(tripId, userId) {
        return database_1.prisma.$transaction(async (tx) => {
            const trip = await tx.trip.findUnique({
                where: { id: tripId },
                include: { vehicle: true, driver: true },
            });
            if (!trip) {
                throw new errorHandler_1.AppError(404, 'Trip not found', 'NOT_FOUND');
            }
            if (trip.status !== enums_1.TripStatus.DRAFT) {
                throw new errorHandler_1.BusinessRuleError(`Cannot dispatch trip in ${trip.status} status`);
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
                    status: enums_1.TripStatus.DISPATCHED,
                    dispatchedAt: new Date(),
                    startOdometerKm: trip.vehicle.odometerKm,
                    updatedById: userId,
                },
                include: { vehicle: true, driver: true },
            });
            // Update vehicle and driver status
            await tx.vehicle.update({
                where: { id: trip.vehicleId },
                data: { status: enums_1.VehicleStatus.ON_TRIP },
            });
            await tx.driver.update({
                where: { id: trip.driverId },
                data: { status: enums_1.DriverStatus.ON_TRIP },
            });
            return updatedTrip;
        });
    }
    static async completeTrip(tripId, data, userId) {
        return database_1.prisma.$transaction(async (tx) => {
            const trip = await tx.trip.findUnique({
                where: { id: tripId },
                include: { vehicle: true, driver: true },
            });
            if (!trip) {
                throw new errorHandler_1.AppError(404, 'Trip not found', 'NOT_FOUND');
            }
            if (trip.status !== enums_1.TripStatus.DISPATCHED) {
                throw new errorHandler_1.BusinessRuleError(`Cannot complete trip in ${trip.status} status`);
            }
            // Validate odometer progression
            if (data.endOdometerKm <= (trip.startOdometerKm || trip.vehicle.odometerKm)) {
                throw new errorHandler_1.BusinessRuleError('End odometer must be greater than start odometer');
            }
            const updatedTrip = await tx.trip.update({
                where: { id: tripId },
                data: {
                    status: enums_1.TripStatus.COMPLETED,
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
                    status: enums_1.VehicleStatus.AVAILABLE,
                },
            });
            // Update driver status
            await tx.driver.update({
                where: { id: trip.driverId },
                data: { status: enums_1.DriverStatus.AVAILABLE },
            });
            return updatedTrip;
        });
    }
    static async cancelTrip(tripId, reason, userId) {
        return database_1.prisma.$transaction(async (tx) => {
            const trip = await tx.trip.findUnique({
                where: { id: tripId },
                include: { vehicle: true, driver: true },
            });
            if (!trip) {
                throw new errorHandler_1.AppError(404, 'Trip not found', 'NOT_FOUND');
            }
            if (![enums_1.TripStatus.DRAFT, enums_1.TripStatus.DISPATCHED].includes(trip.status)) {
                throw new errorHandler_1.BusinessRuleError(`Cannot cancel trip in ${trip.status} status`);
            }
            const updatedTrip = await tx.trip.update({
                where: { id: tripId },
                data: {
                    status: enums_1.TripStatus.CANCELLED,
                    cancelledAt: new Date(),
                    cancellationReason: reason,
                    updatedById: userId,
                },
                include: { vehicle: true, driver: true },
            });
            // If dispatched, restore vehicle and driver status
            if (trip.status === enums_1.TripStatus.DISPATCHED) {
                await tx.vehicle.update({
                    where: { id: trip.vehicleId },
                    data: { status: enums_1.VehicleStatus.AVAILABLE },
                });
                await tx.driver.update({
                    where: { id: trip.driverId },
                    data: { status: enums_1.DriverStatus.AVAILABLE },
                });
            }
            return updatedTrip;
        });
    }
    // ========== MAINTENANCE RULES ==========
    static async openMaintenance(data, userId) {
        return database_1.prisma.$transaction(async (tx) => {
            const vehicle = await tx.vehicle.findUnique({
                where: { id: data.vehicleId },
            });
            if (!vehicle) {
                throw new errorHandler_1.AppError(404, 'Vehicle not found', 'NOT_FOUND');
            }
            if (vehicle.status === enums_1.VehicleStatus.RETIRED) {
                throw new errorHandler_1.BusinessRuleError('Cannot create maintenance for retired vehicle');
            }
            // If vehicle is on a trip, we need to handle that
            if (vehicle.status === enums_1.VehicleStatus.ON_TRIP) {
                // Find and cancel the active trip
                const activeTrip = await tx.trip.findFirst({
                    where: { vehicleId: data.vehicleId, status: enums_1.TripStatus.DISPATCHED },
                });
                if (activeTrip) {
                    await tx.trip.update({
                        where: { id: activeTrip.id },
                        data: {
                            status: enums_1.TripStatus.CANCELLED,
                            cancelledAt: new Date(),
                            cancellationReason: 'Vehicle sent for maintenance',
                        },
                    });
                    // Restore driver
                    await tx.driver.update({
                        where: { id: activeTrip.driverId },
                        data: { status: enums_1.DriverStatus.AVAILABLE },
                    });
                }
            }
            const maintenance = await tx.maintenanceLog.create({
                data: {
                    vehicleId: data.vehicleId,
                    description: data.description,
                    status: enums_1.MaintenanceStatus.OPEN,
                    cost: data.cost,
                    odometerAtStart: data.odometerAtStart,
                    startedAt: new Date(),
                    createdById: userId,
                },
            });
            // Set vehicle to IN_SHOP
            await tx.vehicle.update({
                where: { id: data.vehicleId },
                data: { status: enums_1.VehicleStatus.IN_SHOP },
            });
            return maintenance;
        });
    }
    static async closeMaintenance(maintenanceId, data, userId) {
        return database_1.prisma.$transaction(async (tx) => {
            const maintenance = await tx.maintenanceLog.findUnique({
                where: { id: maintenanceId },
                include: { vehicle: true },
            });
            if (!maintenance) {
                throw new errorHandler_1.AppError(404, 'Maintenance record not found', 'NOT_FOUND');
            }
            if (maintenance.status === enums_1.MaintenanceStatus.COMPLETED) {
                throw new errorHandler_1.BusinessRuleError('Maintenance already completed');
            }
            if (data.odometerAtEnd <= maintenance.odometerAtStart) {
                throw new errorHandler_1.BusinessRuleError('End odometer must be greater than start odometer');
            }
            const updatedMaintenance = await tx.maintenanceLog.update({
                where: { id: maintenanceId },
                data: {
                    status: enums_1.MaintenanceStatus.COMPLETED,
                    completedAt: new Date(),
                    odometerAtEnd: data.odometerAtEnd,
                    cost: data.actualCost ?? maintenance.cost,
                    updatedById: userId,
                },
            });
            // Restore vehicle to AVAILABLE unless RETIRED
            if (maintenance.vehicle.status !== enums_1.VehicleStatus.RETIRED) {
                await tx.vehicle.update({
                    where: { id: maintenance.vehicleId },
                    data: { status: enums_1.VehicleStatus.AVAILABLE },
                });
            }
            return updatedMaintenance;
        });
    }
}
exports.BusinessRulesService = BusinessRulesService;
