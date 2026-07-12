"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // Create admin user
    const adminPassword = await bcrypt_1.default.hash('Admin@123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@transport-ops.com' },
        update: {},
        create: {
            email: 'admin@transport-ops.com',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: client_1.Role.ADMIN,
            isActive: true,
        },
    });
    console.log('✅ Created admin user:', admin.email);
    // Create manager user
    const managerPassword = await bcrypt_1.default.hash('Manager@123', 12);
    const manager = await prisma.user.upsert({
        where: { email: 'manager@transport-ops.com' },
        update: {},
        create: {
            email: 'manager@transport-ops.com',
            passwordHash: managerPassword,
            firstName: 'Fleet',
            lastName: 'Manager',
            role: client_1.Role.MANAGER,
            isActive: true,
        },
    });
    console.log('✅ Created manager user:', manager.email);
    // Create sample vehicles
    const vehicles = await Promise.all([
        prisma.vehicle.upsert({
            where: { registrationNumber: 'VAN-001' },
            update: {},
            create: {
                registrationNumber: 'VAN-001',
                name: 'Delivery Van 1',
                model: 'Ford Transit',
                type: client_1.VehicleType.VAN,
                maxLoadCapacityKg: 1000,
                odometerKm: 45000,
                acquisitionCost: 35000,
                status: client_1.VehicleStatus.AVAILABLE,
                region: 'North',
                createdById: admin.id,
            },
        }),
        prisma.vehicle.upsert({
            where: { registrationNumber: 'TRK-001' },
            update: {},
            create: {
                registrationNumber: 'TRK-001',
                name: 'Heavy Truck 1',
                model: 'Volvo FH16',
                type: client_1.VehicleType.TRUCK,
                maxLoadCapacityKg: 25000,
                odometerKm: 120000,
                acquisitionCost: 120000,
                status: client_1.VehicleStatus.AVAILABLE,
                region: 'North',
                createdById: admin.id,
            },
        }),
        prisma.vehicle.upsert({
            where: { registrationNumber: 'VAN-002' },
            update: {},
            create: {
                registrationNumber: 'VAN-002',
                name: 'Delivery Van 2',
                model: 'Mercedes Sprinter',
                type: client_1.VehicleType.VAN,
                maxLoadCapacityKg: 1200,
                odometerKm: 32000,
                acquisitionCost: 38000,
                status: client_1.VehicleStatus.AVAILABLE,
                region: 'South',
                createdById: admin.id,
            },
        }),
        prisma.vehicle.upsert({
            where: { registrationNumber: 'PUP-001' },
            update: {},
            create: {
                registrationNumber: 'PUP-001',
                name: 'Pickup 1',
                model: 'Toyota Hilux',
                type: client_1.VehicleType.PICKUP,
                maxLoadCapacityKg: 1500,
                odometerKm: 28000,
                acquisitionCost: 28000,
                status: client_1.VehicleStatus.AVAILABLE,
                region: 'East',
                createdById: admin.id,
            },
        }),
    ]);
    console.log('✅ Created sample vehicles');
    // Create sample drivers
    const drivers = await Promise.all([
        prisma.driver.upsert({
            where: { licenseNumber: 'DL-001' },
            update: {},
            create: {
                userId: null,
                name: 'John Smith',
                licenseNumber: 'DL-001',
                licenseCategory: client_1.LicenseCategory.C,
                licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
                contactNumber: '+1-555-0101',
                safetyScore: 95,
                status: client_1.DriverStatus.AVAILABLE,
                createdById: admin.id,
            },
        }),
        prisma.driver.upsert({
            where: { licenseNumber: 'DL-002' },
            update: {},
            create: {
                userId: null,
                name: 'Sarah Johnson',
                licenseNumber: 'DL-002',
                licenseCategory: client_1.LicenseCategory.CE,
                licenseExpiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000), // 200 days
                contactNumber: '+1-555-0102',
                safetyScore: 92,
                status: client_1.DriverStatus.AVAILABLE,
                createdById: admin.id,
            },
        }),
        prisma.driver.upsert({
            where: { licenseNumber: 'DL-003' },
            update: {},
            create: {
                userId: null,
                name: 'Mike Wilson',
                licenseNumber: 'DL-003',
                licenseCategory: client_1.LicenseCategory.C,
                licenseExpiryDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days - expiring soon
                contactNumber: '+1-555-0103',
                safetyScore: 88,
                status: client_1.DriverStatus.AVAILABLE,
                createdById: admin.id,
            },
        }),
        prisma.driver.upsert({
            where: { licenseNumber: 'DL-004' },
            update: {},
            create: {
                userId: null,
                name: 'Emily Davis',
                licenseNumber: 'DL-004',
                licenseCategory: client_1.LicenseCategory.B,
                licenseExpiryDate: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000), // 400 days
                contactNumber: '+1-555-0104',
                safetyScore: 98,
                status: client_1.DriverStatus.AVAILABLE,
                createdById: admin.id,
            },
        }),
    ]);
    console.log('✅ Created sample drivers');
    // Create sample trips
    const trip1 = await prisma.trip.create({
        data: {
            source: 'Warehouse A',
            destination: 'Client Site B',
            vehicleId: vehicles[0].id,
            driverId: drivers[0].id,
            cargoWeightKg: 800,
            plannedDistanceKm: 150,
            status: TripStatus.COMPLETED,
            actualDistanceKm: 155,
            fuelConsumedLiters: 25,
            revenue: 500,
            startOdometerKm: 44800,
            endOdometerKm: 44955,
            dispatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            createdById: admin.id,
        },
    });
    const trip2 = await prisma.trip.create({
        data: {
            source: 'Distribution Center',
            destination: 'Retail Store',
            vehicleId: vehicles[1].id,
            driverId: drivers[1].id,
            cargoWeightKg: 20000,
            plannedDistanceKm: 300,
            status: TripStatus.DISPATCHED,
            startOdometerKm: 119800,
            dispatchedAt: new Date(),
            createdById: admin.id,
        },
    });
    const trip3 = await prisma.trip.create({
        data: {
            source: 'Factory',
            destination: 'Warehouse',
            vehicleId: vehicles[2].id,
            driverId: drivers[3].id,
            cargoWeightKg: 900,
            plannedDistanceKm: 75,
            status: TripStatus.DRAFT,
            createdById: admin.id,
        },
    });
    console.log('✅ Created sample trips');
    // Create sample maintenance
    await prisma.maintenanceLog.create({
        data: {
            vehicleId: vehicles[3].id,
            description: 'Oil change and filter replacement',
            status: MaintenanceStatus.COMPLETED,
            cost: 250,
            odometerAtStart: 27800,
            odometerAtEnd: 27800,
            startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
            createdById: admin.id,
        },
    });
    console.log('✅ Created sample maintenance');
    // Create sample fuel logs
    await prisma.fuelLog.create({
        data: {
            vehicleId: vehicles[0].id,
            liters: 50,
            costPerLiter: 1.50,
            totalCost: 75,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            odometerKm: 44850,
            stationName: 'Shell Station',
            receiptNumber: 'RCPT-001',
            createdById: admin.id,
        },
    });
    console.log('✅ Created sample fuel logs');
    // Create sample expenses
    await prisma.expense.create({
        data: {
            vehicleId: vehicles[0].id,
            type: 'TOLL',
            description: 'Highway toll',
            amount: 15,
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            createdById: admin.id,
        },
    });
    console.log('✅ Created sample expenses');
    console.log('🎉 Database seeding completed!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin: admin@transport-ops.com / Admin@123');
    console.log('   Manager: manager@transport-ops.com / Manager@123');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
