import { z } from 'zod';
import {
  Role,
  VehicleType,
  VehicleStatus,
  DriverStatus,
  TripStatus,
  LicenseCategory,
  MaintenanceStatus,
  ExpenseType,
  DocumentType,
} from '../enums';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const vehicleFiltersSchema = paginationSchema.extend({
  status: z.nativeEnum(VehicleStatus).optional(),
  type: z.nativeEnum(VehicleType).optional(),
  region: z.string().optional(),
  search: z.string().optional(),
});

export type VehicleFiltersInput = z.infer<typeof vehicleFiltersSchema>;

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1).max(20).regex(/^[A-Z0-9\-]+$/i, 'Registration number must be alphanumeric with hyphens'),
  name: z.string().min(1).max(100),
  model: z.string().max(100).optional(),
  type: z.nativeEnum(VehicleType),
  maxLoadCapacityKg: z.number().positive('Max load capacity must be positive'),
  acquisitionCost: z.number().nonnegative('Acquisition cost cannot be negative'),
  region: z.string().max(50).optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.nativeEnum(VehicleStatus).optional(),
});

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

export const driverFiltersSchema = paginationSchema.extend({
  status: z.nativeEnum(DriverStatus).optional(),
  licenseExpiring: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});

export type DriverFiltersInput = z.infer<typeof driverFiltersSchema>;

export const createDriverSchema = z.object({
  userId: z.string().cuid().optional(),
  name: z.string().min(1).max(100),
  licenseNumber: z.string().min(1).max(50).regex(/^[A-Z0-9]+$/i, 'License number must be alphanumeric'),
  licenseCategory: z.nativeEnum(LicenseCategory),
  licenseExpiryDate: z.string().datetime({ offset: true }).refine(
    (date) => new Date(date) > new Date(),
    'License expiry date must be in the future'
  ),
  contactNumber: z.string().min(10).max(20).regex(/^[\d\+\-\s\(\)]+$/, 'Invalid phone number format'),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;

export const updateDriverSchema = createDriverSchema.partial().extend({
  status: z.nativeEnum(DriverStatus).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
});

export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

export const tripFiltersSchema = paginationSchema.extend({
  status: z.nativeEnum(TripStatus).optional(),
  vehicleId: z.string().cuid().optional(),
  driverId: z.string().cuid().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
});

export type TripFiltersInput = z.infer<typeof tripFiltersSchema>;

export const createTripSchema = z.object({
  source: z.string().min(1).max(200),
  destination: z.string().min(1).max(200),
  vehicleId: z.string().cuid(),
  driverId: z.string().cuid(),
  cargoWeightKg: z.number().positive('Cargo weight must be positive'),
  plannedDistanceKm: z.number().positive('Planned distance must be positive'),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const dispatchTripSchema = z.object({});

export const completeTripSchema = z.object({
  actualDistanceKm: z.number().positive('Actual distance must be positive'),
  endOdometerKm: z.number().positive('End odometer must be positive'),
  fuelConsumedLiters: z.number().positive('Fuel consumed must be positive'),
  revenue: z.number().nonnegative().optional(),
});

export type CompleteTripInput = z.infer<typeof completeTripSchema>;

export const cancelTripSchema = z.object({
  reason: z.string().min(1).max(500),
});

export type CancelTripInput = z.infer<typeof cancelTripSchema>;

export const availableVehiclesSchema = z.object({
  cargoWeightKg: z.number().positive().optional(),
  date: z.string().datetime({ offset: true }).optional(),
});

export type AvailableVehiclesInput = z.infer<typeof availableVehiclesSchema>;

export const availableDriversSchema = z.object({
  date: z.string().datetime({ offset: true }).optional(),
});

export type AvailableDriversInput = z.infer<typeof availableDriversSchema>;

export const maintenanceFiltersSchema = paginationSchema.extend({
  vehicleId: z.string().cuid().optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
});

export type MaintenanceFiltersInput = z.infer<typeof maintenanceFiltersSchema>;

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().cuid(),
  description: z.string().min(1).max(1000),
  cost: z.number().nonnegative().default(0),
  odometerAtStart: z.number().positive('Odometer at start must be positive'),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;

export const closeMaintenanceSchema = z.object({
  odometerAtEnd: z.number().positive('Odometer at end must be positive'),
  actualCost: z.number().nonnegative().optional(),
});

export type CloseMaintenanceInput = z.infer<typeof closeMaintenanceSchema>;

export const fuelFiltersSchema = paginationSchema.extend({
  vehicleId: z.string().cuid().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
});

export type FuelFiltersInput = z.infer<typeof fuelFiltersSchema>;

export const createFuelLogSchema = z.object({
  vehicleId: z.string().cuid(),
  liters: z.number().positive('Liters must be positive'),
  costPerLiter: z.number().positive('Cost per liter must be positive'),
  date: z.string().datetime({ offset: true }),
  odometerKm: z.number().positive('Odometer must be positive'),
  stationName: z.string().max(100).optional(),
  receiptNumber: z.string().max(50).optional(),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;

export const expenseFiltersSchema = paginationSchema.extend({
  vehicleId: z.string().cuid().optional(),
  type: z.nativeEnum(ExpenseType).optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
});

export type ExpenseFiltersInput = z.infer<typeof expenseFiltersSchema>;

export const createExpenseSchema = z.object({
  vehicleId: z.string().cuid(),
  type: z.nativeEnum(ExpenseType),
  description: z.string().min(1).max(500),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().datetime({ offset: true }),
  receiptUrl: z.string().url().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const dashboardFiltersSchema = z.object({
  vehicleType: z.nativeEnum(VehicleType).optional(),
  region: z.string().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
});

export type DashboardFiltersInput = z.infer<typeof dashboardFiltersSchema>;

export const chartParamsSchema = z.object({
  metric: z.enum(['utilization', 'fuelEfficiency', 'operationalCost', 'revenue']),
  period: z.enum(['7d', '30d', '90d', '1y']),
});

export type ChartParamsInput = z.infer<typeof chartParamsSchema>;

export const reportFiltersSchema = z.object({
  vehicleId: z.string().cuid().optional(),
  vehicleType: z.nativeEnum(VehicleType).optional(),
  region: z.string().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
});

export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;

export const exportParamsSchema = z.object({
  reportType: z.enum(['fuel-efficiency', 'fleet-utilization', 'operational-cost', 'vehicle-roi']),
  format: z.enum(['csv', 'pdf']),
}).merge(reportFiltersSchema);

export type ExportParamsInput = z.infer<typeof exportParamsSchema>;

export const documentFiltersSchema = paginationSchema.extend({
  vehicleId: z.string().cuid().optional(),
  driverId: z.string().cuid().optional(),
  type: z.nativeEnum(DocumentType).optional(),
  expiring: z.coerce.boolean().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
});

export type DocumentFiltersInput = z.infer<typeof documentFiltersSchema>;

export const createDocumentSchema = z.object({
  vehicleId: z.string().cuid().optional(),
  driverId: z.string().cuid().optional(),
  type: z.nativeEnum(DocumentType),
  title: z.string().min(1).max(200),
  expiryDate: z.string().datetime({ offset: true }).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const expiringDocumentsSchema = z.object({
  days: z.coerce.number().int().positive().default(30),
});

export type ExpiringDocumentsInput = z.infer<typeof expiringDocumentsSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.nativeEnum(Role).default(Role.VIEWER),
});

export type RegisterInput = z.infer<typeof registerSchema>;

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const requestRegistrationOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  password: passwordSchema,
  passwordConfirmation: z.string(),
  captchaToken: z.string().min(1, 'Please complete the CAPTCHA'),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
});

export const verifyRegistrationOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().regex(/^\d{6}$/, 'Enter the six-digit code from your email'),
});

export const userFiltersSchema = paginationSchema.extend({
  role: z.nativeEnum(Role).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type UserFiltersInput = z.infer<typeof userFiltersSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const licenseExpirySchema = z.object({
  days: z.coerce.number().int().positive().default(30),
});

export type LicenseExpiryInput = z.infer<typeof licenseExpirySchema>;
