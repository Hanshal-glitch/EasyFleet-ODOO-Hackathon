import { prisma } from '../config/database';
import { VehicleType, VehicleStatus, LicenseCategory, DriverStatus, TripStatus, MaintenanceStatus } from '@transport-ops/shared/enums';
import { logger } from '../utils/logger';

export const generateTourData = async (adminId: string) => {
  logger.info('🌱 Seeding tour data...');

  try {
    // Check if vehicles already exist to prevent duplicate seeding
    const vehicleCount = await prisma.vehicle.count();
    if (vehicleCount > 0) {
      throw new Error('Database is not empty. Cannot start tour.');
    }

    // Create sample vehicles
    const vehicles = await Promise.all([
      prisma.vehicle.create({
        data: {
          registrationNumber: 'MH-12-AB-1234',
          name: 'Delivery Van 1',
          model: 'Tata Ace',
          type: VehicleType.VAN,
          maxLoadCapacityKg: 1000,
          odometerKm: 45000,
          acquisitionCost: 650000,
          status: VehicleStatus.AVAILABLE,
          region: 'Maharashtra',
          createdById: adminId,
        },
      }),
      prisma.vehicle.create({
        data: {
          registrationNumber: 'KA-01-XY-9876',
          name: 'Heavy Truck 1',
          model: 'Tata Prima',
          type: VehicleType.TRUCK,
          maxLoadCapacityKg: 25000,
          odometerKm: 120000,
          acquisitionCost: 3500000,
          status: VehicleStatus.AVAILABLE,
          region: 'Karnataka',
          createdById: adminId,
        },
      }),
      prisma.vehicle.create({
        data: {
          registrationNumber: 'DL-04-CN-5678',
          name: 'Delivery Van 2',
          model: 'Ashok Leyland Dost',
          type: VehicleType.VAN,
          maxLoadCapacityKg: 1200,
          odometerKm: 32000,
          acquisitionCost: 750000,
          status: VehicleStatus.AVAILABLE,
          region: 'Delhi',
          createdById: adminId,
        },
      }),
      prisma.vehicle.create({
        data: {
          registrationNumber: 'GJ-05-PQ-1122',
          name: 'Pickup 1',
          model: 'Mahindra Bolero',
          type: VehicleType.PICKUP,
          maxLoadCapacityKg: 1500,
          odometerKm: 28000,
          acquisitionCost: 950000,
          status: VehicleStatus.AVAILABLE,
          region: 'Gujarat',
          createdById: adminId,
        },
      }),
    ]);
    logger.info('✅ Created sample vehicles');

    // Create sample drivers
    const drivers = await Promise.all([
      prisma.driver.create({
        data: {
          name: 'Rajesh Kumar',
          licenseNumber: 'MH-14-2020-0011223',
          licenseCategory: LicenseCategory.C,
          licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          contactNumber: '+91-9876543210',
          safetyScore: 95,
          status: DriverStatus.AVAILABLE,
          createdById: adminId,
        },
      }),
      prisma.driver.create({
        data: {
          name: 'Amit Singh',
          licenseNumber: 'KA-01-2019-0044556',
          licenseCategory: LicenseCategory.CE,
          licenseExpiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
          contactNumber: '+91-9988776655',
          safetyScore: 92,
          status: DriverStatus.AVAILABLE,
          createdById: adminId,
        },
      }),
      prisma.driver.create({
        data: {
          name: 'Suresh Patel',
          licenseNumber: 'DL-04-2021-0077889',
          licenseCategory: LicenseCategory.C,
          licenseExpiryDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
          contactNumber: '+91-9123456789',
          safetyScore: 88,
          status: DriverStatus.AVAILABLE,
          createdById: adminId,
        },
      }),
      prisma.driver.create({
        data: {
          name: 'Priya Sharma',
          licenseNumber: 'GJ-05-2018-0099112',
          licenseCategory: LicenseCategory.B,
          licenseExpiryDate: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000),
          contactNumber: '+91-9876501234',
          safetyScore: 98,
          status: DriverStatus.AVAILABLE,
          createdById: adminId,
        },
      }),
    ]);
    logger.info('✅ Created sample drivers');

    // Create sample trips
    await prisma.trip.create({
      data: {
        source: 'Mumbai Port',
        destination: 'Pune Warehouse',
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        cargoWeightKg: 800,
        plannedDistanceKm: 150,
        status: TripStatus.COMPLETED,
        actualDistanceKm: 155,
        fuelConsumedLiters: 25,
        revenue: 45000,
        startOdometerKm: 44800,
        endOdometerKm: 44955,
        dispatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdById: adminId,
      },
    });

    await prisma.trip.create({
      data: {
        source: 'Delhi Distribution Center',
        destination: 'Gurugram Retail Store',
        vehicleId: vehicles[1].id,
        driverId: drivers[1].id,
        cargoWeightKg: 20000,
        plannedDistanceKm: 300,
        status: TripStatus.DISPATCHED,
        startOdometerKm: 119800,
        dispatchedAt: new Date(),
        createdById: adminId,
      },
    });

    await prisma.trip.create({
      data: {
        source: 'Bengaluru Hub',
        destination: 'Mysuru Facility',
        vehicleId: vehicles[2].id,
        driverId: drivers[3].id,
        cargoWeightKg: 900,
        plannedDistanceKm: 75,
        status: TripStatus.DRAFT,
        createdById: adminId,
      },
    });
    logger.info('✅ Created sample trips');

    // Create sample maintenance
    await prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[3].id,
        description: 'Oil change and filter replacement',
        status: MaintenanceStatus.COMPLETED,
        cost: 5500,
        odometerAtStart: 27800,
        odometerAtEnd: 27800,
        startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        createdById: adminId,
      },
    });
    logger.info('✅ Created sample maintenance');

    // Create sample fuel logs
    await prisma.fuelLog.create({
      data: {
        vehicleId: vehicles[0].id,
        liters: 50,
        costPerLiter: 106.50,
        totalCost: 5325,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        odometerKm: 44850,
        stationName: 'IndianOil',
        receiptNumber: 'RCPT-001',
        createdById: adminId,
      },
    });
    logger.info('✅ Created sample fuel logs');

    // Create sample expenses
    await prisma.expense.create({
      data: {
        vehicleId: vehicles[0].id,
        type: 'TOLL',
        description: 'Highway toll (Fastag)',
        amount: 450,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdById: adminId,
      },
    });
    logger.info('✅ Created sample expenses');

    return { success: true };
  } catch (error) {
    logger.error('❌ Tour seeding failed:', { error });
    throw error;
  }
};

export const endTourData = async () => {
  logger.info('🧹 Wiping tour data...');
  try {
    // Delete all operational data except Users and core audit logs
    await prisma.auditLog.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.fuelLog.deleteMany({});
    await prisma.maintenanceLog.deleteMany({});
    await prisma.trip.deleteMany({});
    await prisma.vehicle.deleteMany({});
    await prisma.driver.deleteMany({});
    logger.info('✅ Tour data wiped successfully');
    return { success: true };
  } catch (error) {
    logger.error('❌ Failed to wipe tour data:', { error });
    throw error;
  }
};
