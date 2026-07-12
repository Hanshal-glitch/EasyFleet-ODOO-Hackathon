"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.licenseExpirySchema = exports.changePasswordSchema = exports.updateUserSchema = exports.userFiltersSchema = exports.registerSchema = exports.loginSchema = exports.expiringDocumentsSchema = exports.createDocumentSchema = exports.documentFiltersSchema = exports.exportParamsSchema = exports.reportFiltersSchema = exports.chartParamsSchema = exports.dashboardFiltersSchema = exports.createExpenseSchema = exports.expenseFiltersSchema = exports.createFuelLogSchema = exports.fuelFiltersSchema = exports.closeMaintenanceSchema = exports.createMaintenanceSchema = exports.maintenanceFiltersSchema = exports.availableDriversSchema = exports.availableVehiclesSchema = exports.cancelTripSchema = exports.completeTripSchema = exports.dispatchTripSchema = exports.createTripSchema = exports.tripFiltersSchema = exports.updateDriverSchema = exports.createDriverSchema = exports.driverFiltersSchema = exports.updateVehicleSchema = exports.createVehicleSchema = exports.vehicleFiltersSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    sort: zod_1.z.string().optional(),
    order: zod_1.z.enum(['asc', 'desc']).optional(),
});
exports.vehicleFiltersSchema = exports.paginationSchema.extend({
    status: zod_1.z.nativeEnum(enums_1.VehicleStatus).optional(),
    type: zod_1.z.nativeEnum(enums_1.VehicleType).optional(),
    region: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
});
exports.createVehicleSchema = zod_1.z.object({
    registrationNumber: zod_1.z.string().min(1).max(20).regex(/^[A-Z0-9\-]+$/i, 'Registration number must be alphanumeric with hyphens'),
    name: zod_1.z.string().min(1).max(100),
    model: zod_1.z.string().max(100).optional(),
    type: zod_1.z.nativeEnum(enums_1.VehicleType),
    maxLoadCapacityKg: zod_1.z.number().positive('Max load capacity must be positive'),
    acquisitionCost: zod_1.z.number().nonnegative('Acquisition cost cannot be negative'),
    region: zod_1.z.string().max(50).optional(),
});
exports.updateVehicleSchema = exports.createVehicleSchema.partial().extend({
    status: zod_1.z.nativeEnum(enums_1.VehicleStatus).optional(),
});
exports.driverFiltersSchema = exports.paginationSchema.extend({
    status: zod_1.z.nativeEnum(enums_1.DriverStatus).optional(),
    licenseExpiring: zod_1.z.coerce.number().int().positive().optional(),
    search: zod_1.z.string().optional(),
});
exports.createDriverSchema = zod_1.z.object({
    userId: zod_1.z.string().cuid().optional(),
    name: zod_1.z.string().min(1).max(100),
    licenseNumber: zod_1.z.string().min(1).max(50).regex(/^[A-Z0-9]+$/i, 'License number must be alphanumeric'),
    licenseCategory: zod_1.z.nativeEnum(enums_1.LicenseCategory),
    licenseExpiryDate: zod_1.z.string().datetime({ offset: true }).refine((date) => new Date(date) > new Date(), 'License expiry date must be in the future'),
    contactNumber: zod_1.z.string().min(10).max(20).regex(/^[\d\+\-\s\(\)]+$/, 'Invalid phone number format'),
});
exports.updateDriverSchema = exports.createDriverSchema.partial().extend({
    status: zod_1.z.nativeEnum(enums_1.DriverStatus).optional(),
    safetyScore: zod_1.z.number().min(0).max(100).optional(),
});
exports.tripFiltersSchema = exports.paginationSchema.extend({
    status: zod_1.z.nativeEnum(enums_1.TripStatus).optional(),
    vehicleId: zod_1.z.string().cuid().optional(),
    driverId: zod_1.z.string().cuid().optional(),
    dateFrom: zod_1.z.string().datetime({ offset: true }).optional(),
    dateTo: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.createTripSchema = zod_1.z.object({
    source: zod_1.z.string().min(1).max(200),
    destination: zod_1.z.string().min(1).max(200),
    vehicleId: zod_1.z.string().cuid(),
    driverId: zod_1.z.string().cuid(),
    cargoWeightKg: zod_1.z.number().positive('Cargo weight must be positive'),
    plannedDistanceKm: zod_1.z.number().positive('Planned distance must be positive'),
});
exports.dispatchTripSchema = zod_1.z.object({});
exports.completeTripSchema = zod_1.z.object({
    actualDistanceKm: zod_1.z.number().positive('Actual distance must be positive'),
    endOdometerKm: zod_1.z.number().positive('End odometer must be positive'),
    fuelConsumedLiters: zod_1.z.number().positive('Fuel consumed must be positive'),
    revenue: zod_1.z.number().nonnegative().optional(),
});
exports.cancelTripSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1).max(500),
});
exports.availableVehiclesSchema = zod_1.z.object({
    cargoWeightKg: zod_1.z.number().positive().optional(),
    date: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.availableDriversSchema = zod_1.z.object({
    date: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.maintenanceFiltersSchema = exports.paginationSchema.extend({
    vehicleId: zod_1.z.string().cuid().optional(),
    status: zod_1.z.nativeEnum(enums_1.MaintenanceStatus).optional(),
    dateFrom: zod_1.z.string().datetime({ offset: true }).optional(),
    dateTo: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.createMaintenanceSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().cuid(),
    description: zod_1.z.string().min(1).max(1000),
    cost: zod_1.z.number().nonnegative().default(0),
    odometerAtStart: zod_1.z.number().positive('Odometer at start must be positive'),
});
exports.closeMaintenanceSchema = zod_1.z.object({
    odometerAtEnd: zod_1.z.number().positive('Odometer at end must be positive'),
    actualCost: zod_1.z.number().nonnegative().optional(),
});
exports.fuelFiltersSchema = exports.paginationSchema.extend({
    vehicleId: zod_1.z.string().cuid().optional(),
    dateFrom: zod_1.z.string().datetime({ offset: true }).optional(),
    dateTo: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.createFuelLogSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().cuid(),
    liters: zod_1.z.number().positive('Liters must be positive'),
    costPerLiter: zod_1.z.number().positive('Cost per liter must be positive'),
    date: zod_1.z.string().datetime({ offset: true }),
    odometerKm: zod_1.z.number().positive('Odometer must be positive'),
    stationName: zod_1.z.string().max(100).optional(),
    receiptNumber: zod_1.z.string().max(50).optional(),
});
exports.expenseFiltersSchema = exports.paginationSchema.extend({
    vehicleId: zod_1.z.string().cuid().optional(),
    type: zod_1.z.nativeEnum(enums_1.ExpenseType).optional(),
    dateFrom: zod_1.z.string().datetime({ offset: true }).optional(),
    dateTo: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.createExpenseSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().cuid(),
    type: zod_1.z.nativeEnum(enums_1.ExpenseType),
    description: zod_1.z.string().min(1).max(500),
    amount: zod_1.z.number().positive('Amount must be positive'),
    date: zod_1.z.string().datetime({ offset: true }),
    receiptUrl: zod_1.z.string().url().optional(),
});
exports.dashboardFiltersSchema = zod_1.z.object({
    vehicleType: zod_1.z.nativeEnum(enums_1.VehicleType).optional(),
    region: zod_1.z.string().optional(),
    dateFrom: zod_1.z.string().datetime({ offset: true }).optional(),
    dateTo: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.chartParamsSchema = zod_1.z.object({
    metric: zod_1.z.enum(['utilization', 'fuelEfficiency', 'operationalCost', 'revenue']),
    period: zod_1.z.enum(['7d', '30d', '90d', '1y']),
});
exports.reportFiltersSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().cuid().optional(),
    vehicleType: zod_1.z.nativeEnum(enums_1.VehicleType).optional(),
    region: zod_1.z.string().optional(),
    dateFrom: zod_1.z.string().datetime({ offset: true }).optional(),
    dateTo: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.exportParamsSchema = zod_1.z.object({
    reportType: zod_1.z.enum(['fuel-efficiency', 'fleet-utilization', 'operational-cost', 'vehicle-roi']),
    format: zod_1.z.enum(['csv', 'pdf']),
}).merge(exports.reportFiltersSchema);
exports.documentFiltersSchema = exports.paginationSchema.extend({
    vehicleId: zod_1.z.string().cuid().optional(),
    driverId: zod_1.z.string().cuid().optional(),
    type: zod_1.z.nativeEnum(enums_1.DocumentType).optional(),
    expiring: zod_1.z.coerce.boolean().optional(),
    dateFrom: zod_1.z.string().datetime({ offset: true }).optional(),
    dateTo: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.createDocumentSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().cuid().optional(),
    driverId: zod_1.z.string().cuid().optional(),
    type: zod_1.z.nativeEnum(enums_1.DocumentType),
    title: zod_1.z.string().min(1).max(200),
    expiryDate: zod_1.z.string().datetime({ offset: true }).optional(),
});
exports.expiringDocumentsSchema = zod_1.z.object({
    days: zod_1.z.coerce.number().int().positive().default(30),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    role: zod_1.z.nativeEnum(enums_1.Role).default(enums_1.Role.VIEWER),
});
exports.userFiltersSchema = exports.paginationSchema.extend({
    role: zod_1.z.nativeEnum(enums_1.Role).optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    search: zod_1.z.string().optional(),
});
exports.updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(50).optional(),
    lastName: zod_1.z.string().min(1).max(50).optional(),
    role: zod_1.z.nativeEnum(enums_1.Role).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});
exports.licenseExpirySchema = zod_1.z.object({
    days: zod_1.z.coerce.number().int().positive().default(30),
});
