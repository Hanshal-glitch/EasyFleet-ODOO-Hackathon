import { z } from 'zod';
import { Role, VehicleType, VehicleStatus, DriverStatus, TripStatus, LicenseCategory, MaintenanceStatus, ExpenseType, DocumentType } from '../enums';
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
}>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export declare const vehicleFiltersSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
} & {
    status: z.ZodOptional<z.ZodNativeEnum<typeof VehicleStatus>>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof VehicleType>>;
    region: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    type?: VehicleType | undefined;
    status?: VehicleStatus | undefined;
    region?: string | undefined;
    search?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    type?: VehicleType | undefined;
    status?: VehicleStatus | undefined;
    region?: string | undefined;
    search?: string | undefined;
}>;
export type VehicleFiltersInput = z.infer<typeof vehicleFiltersSchema>;
export declare const createVehicleSchema: z.ZodObject<{
    registrationNumber: z.ZodString;
    name: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof VehicleType>;
    maxLoadCapacityKg: z.ZodNumber;
    acquisitionCost: z.ZodNumber;
    region: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: VehicleType;
    registrationNumber: string;
    maxLoadCapacityKg: number;
    acquisitionCost: number;
    region?: string | undefined;
    model?: string | undefined;
}, {
    name: string;
    type: VehicleType;
    registrationNumber: string;
    maxLoadCapacityKg: number;
    acquisitionCost: number;
    region?: string | undefined;
    model?: string | undefined;
}>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export declare const updateVehicleSchema: z.ZodObject<{
    registrationNumber: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof VehicleType>>;
    maxLoadCapacityKg: z.ZodOptional<z.ZodNumber>;
    acquisitionCost: z.ZodOptional<z.ZodNumber>;
    region: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodNativeEnum<typeof VehicleStatus>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    type?: VehicleType | undefined;
    status?: VehicleStatus | undefined;
    region?: string | undefined;
    registrationNumber?: string | undefined;
    model?: string | undefined;
    maxLoadCapacityKg?: number | undefined;
    acquisitionCost?: number | undefined;
}, {
    name?: string | undefined;
    type?: VehicleType | undefined;
    status?: VehicleStatus | undefined;
    region?: string | undefined;
    registrationNumber?: string | undefined;
    model?: string | undefined;
    maxLoadCapacityKg?: number | undefined;
    acquisitionCost?: number | undefined;
}>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export declare const driverFiltersSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
} & {
    status: z.ZodOptional<z.ZodNativeEnum<typeof DriverStatus>>;
    licenseExpiring: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    status?: DriverStatus | undefined;
    search?: string | undefined;
    licenseExpiring?: number | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    status?: DriverStatus | undefined;
    search?: string | undefined;
    licenseExpiring?: number | undefined;
}>;
export type DriverFiltersInput = z.infer<typeof driverFiltersSchema>;
export declare const createDriverSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    licenseNumber: z.ZodString;
    licenseCategory: z.ZodNativeEnum<typeof LicenseCategory>;
    licenseExpiryDate: z.ZodEffects<z.ZodString, string, string>;
    contactNumber: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    licenseNumber: string;
    licenseCategory: LicenseCategory;
    licenseExpiryDate: string;
    contactNumber: string;
    userId?: string | undefined;
}, {
    name: string;
    licenseNumber: string;
    licenseCategory: LicenseCategory;
    licenseExpiryDate: string;
    contactNumber: string;
    userId?: string | undefined;
}>;
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export declare const updateDriverSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    name: z.ZodOptional<z.ZodString>;
    licenseNumber: z.ZodOptional<z.ZodString>;
    licenseCategory: z.ZodOptional<z.ZodNativeEnum<typeof LicenseCategory>>;
    licenseExpiryDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    contactNumber: z.ZodOptional<z.ZodString>;
} & {
    status: z.ZodOptional<z.ZodNativeEnum<typeof DriverStatus>>;
    safetyScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    userId?: string | undefined;
    status?: DriverStatus | undefined;
    licenseNumber?: string | undefined;
    licenseCategory?: LicenseCategory | undefined;
    licenseExpiryDate?: string | undefined;
    contactNumber?: string | undefined;
    safetyScore?: number | undefined;
}, {
    name?: string | undefined;
    userId?: string | undefined;
    status?: DriverStatus | undefined;
    licenseNumber?: string | undefined;
    licenseCategory?: LicenseCategory | undefined;
    licenseExpiryDate?: string | undefined;
    contactNumber?: string | undefined;
    safetyScore?: number | undefined;
}>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export declare const tripFiltersSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
} & {
    status: z.ZodOptional<z.ZodNativeEnum<typeof TripStatus>>;
    vehicleId: z.ZodOptional<z.ZodString>;
    driverId: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    status?: TripStatus | undefined;
    vehicleId?: string | undefined;
    driverId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    status?: TripStatus | undefined;
    vehicleId?: string | undefined;
    driverId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
export type TripFiltersInput = z.infer<typeof tripFiltersSchema>;
export declare const createTripSchema: z.ZodObject<{
    source: z.ZodString;
    destination: z.ZodString;
    vehicleId: z.ZodString;
    driverId: z.ZodString;
    cargoWeightKg: z.ZodNumber;
    plannedDistanceKm: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    vehicleId: string;
    driverId: string;
    source: string;
    destination: string;
    cargoWeightKg: number;
    plannedDistanceKm: number;
}, {
    vehicleId: string;
    driverId: string;
    source: string;
    destination: string;
    cargoWeightKg: number;
    plannedDistanceKm: number;
}>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export declare const dispatchTripSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const completeTripSchema: z.ZodObject<{
    actualDistanceKm: z.ZodNumber;
    endOdometerKm: z.ZodNumber;
    fuelConsumedLiters: z.ZodNumber;
    revenue: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    actualDistanceKm: number;
    endOdometerKm: number;
    fuelConsumedLiters: number;
    revenue?: number | undefined;
}, {
    actualDistanceKm: number;
    endOdometerKm: number;
    fuelConsumedLiters: number;
    revenue?: number | undefined;
}>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;
export declare const cancelTripSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export type CancelTripInput = z.infer<typeof cancelTripSchema>;
export declare const availableVehiclesSchema: z.ZodObject<{
    cargoWeightKg: z.ZodOptional<z.ZodNumber>;
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date?: string | undefined;
    cargoWeightKg?: number | undefined;
}, {
    date?: string | undefined;
    cargoWeightKg?: number | undefined;
}>;
export type AvailableVehiclesInput = z.infer<typeof availableVehiclesSchema>;
export declare const availableDriversSchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date?: string | undefined;
}, {
    date?: string | undefined;
}>;
export type AvailableDriversInput = z.infer<typeof availableDriversSchema>;
export declare const maintenanceFiltersSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
} & {
    vehicleId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof MaintenanceStatus>>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    status?: MaintenanceStatus | undefined;
    vehicleId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    status?: MaintenanceStatus | undefined;
    vehicleId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
export type MaintenanceFiltersInput = z.infer<typeof maintenanceFiltersSchema>;
export declare const createMaintenanceSchema: z.ZodObject<{
    vehicleId: z.ZodString;
    description: z.ZodString;
    cost: z.ZodDefault<z.ZodNumber>;
    odometerAtStart: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    vehicleId: string;
    description: string;
    cost: number;
    odometerAtStart: number;
}, {
    vehicleId: string;
    description: string;
    odometerAtStart: number;
    cost?: number | undefined;
}>;
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export declare const closeMaintenanceSchema: z.ZodObject<{
    odometerAtEnd: z.ZodNumber;
    actualCost: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    odometerAtEnd: number;
    actualCost?: number | undefined;
}, {
    odometerAtEnd: number;
    actualCost?: number | undefined;
}>;
export type CloseMaintenanceInput = z.infer<typeof closeMaintenanceSchema>;
export declare const fuelFiltersSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
} & {
    vehicleId: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    vehicleId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    vehicleId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
export type FuelFiltersInput = z.infer<typeof fuelFiltersSchema>;
export declare const createFuelLogSchema: z.ZodObject<{
    vehicleId: z.ZodString;
    liters: z.ZodNumber;
    costPerLiter: z.ZodNumber;
    date: z.ZodString;
    odometerKm: z.ZodNumber;
    stationName: z.ZodOptional<z.ZodString>;
    receiptNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date: string;
    vehicleId: string;
    liters: number;
    costPerLiter: number;
    odometerKm: number;
    stationName?: string | undefined;
    receiptNumber?: string | undefined;
}, {
    date: string;
    vehicleId: string;
    liters: number;
    costPerLiter: number;
    odometerKm: number;
    stationName?: string | undefined;
    receiptNumber?: string | undefined;
}>;
export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
export declare const expenseFiltersSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
} & {
    vehicleId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof ExpenseType>>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    type?: ExpenseType | undefined;
    vehicleId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    type?: ExpenseType | undefined;
    vehicleId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}>;
export type ExpenseFiltersInput = z.infer<typeof expenseFiltersSchema>;
export declare const createExpenseSchema: z.ZodObject<{
    vehicleId: z.ZodString;
    type: z.ZodNativeEnum<typeof ExpenseType>;
    description: z.ZodString;
    amount: z.ZodNumber;
    date: z.ZodString;
    receiptUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: ExpenseType;
    date: string;
    vehicleId: string;
    description: string;
    amount: number;
    receiptUrl?: string | undefined;
}, {
    type: ExpenseType;
    date: string;
    vehicleId: string;
    description: string;
    amount: number;
    receiptUrl?: string | undefined;
}>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export declare const dashboardFiltersSchema: z.ZodObject<{
    vehicleType: z.ZodOptional<z.ZodNativeEnum<typeof VehicleType>>;
    region: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    region?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    vehicleType?: VehicleType | undefined;
}, {
    region?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    vehicleType?: VehicleType | undefined;
}>;
export type DashboardFiltersInput = z.infer<typeof dashboardFiltersSchema>;
export declare const chartParamsSchema: z.ZodObject<{
    metric: z.ZodEnum<["utilization", "fuelEfficiency", "operationalCost", "revenue"]>;
    period: z.ZodEnum<["7d", "30d", "90d", "1y"]>;
}, "strip", z.ZodTypeAny, {
    metric: "revenue" | "utilization" | "fuelEfficiency" | "operationalCost";
    period: "7d" | "30d" | "90d" | "1y";
}, {
    metric: "revenue" | "utilization" | "fuelEfficiency" | "operationalCost";
    period: "7d" | "30d" | "90d" | "1y";
}>;
export type ChartParamsInput = z.infer<typeof chartParamsSchema>;
export declare const reportFiltersSchema: z.ZodObject<{
    vehicleId: z.ZodOptional<z.ZodString>;
    vehicleType: z.ZodOptional<z.ZodNativeEnum<typeof VehicleType>>;
    region: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    region?: string | undefined;
    vehicleId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    vehicleType?: VehicleType | undefined;
}, {
    region?: string | undefined;
    vehicleId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    vehicleType?: VehicleType | undefined;
}>;
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
export declare const exportParamsSchema: z.ZodObject<{
    reportType: z.ZodEnum<["fuel-efficiency", "fleet-utilization", "operational-cost", "vehicle-roi"]>;
    format: z.ZodEnum<["csv", "pdf"]>;
} & {
    vehicleId: z.ZodOptional<z.ZodString>;
    vehicleType: z.ZodOptional<z.ZodNativeEnum<typeof VehicleType>>;
    region: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    format: "csv" | "pdf";
    reportType: "fuel-efficiency" | "fleet-utilization" | "operational-cost" | "vehicle-roi";
    region?: string | undefined;
    vehicleId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    vehicleType?: VehicleType | undefined;
}, {
    format: "csv" | "pdf";
    reportType: "fuel-efficiency" | "fleet-utilization" | "operational-cost" | "vehicle-roi";
    region?: string | undefined;
    vehicleId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    vehicleType?: VehicleType | undefined;
}>;
export type ExportParamsInput = z.infer<typeof exportParamsSchema>;
export declare const documentFiltersSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
} & {
    vehicleId: z.ZodOptional<z.ZodString>;
    driverId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof DocumentType>>;
    expiring: z.ZodOptional<z.ZodBoolean>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    type?: DocumentType | undefined;
    vehicleId?: string | undefined;
    driverId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    expiring?: boolean | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    type?: DocumentType | undefined;
    vehicleId?: string | undefined;
    driverId?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    expiring?: boolean | undefined;
}>;
export type DocumentFiltersInput = z.infer<typeof documentFiltersSchema>;
export declare const createDocumentSchema: z.ZodObject<{
    vehicleId: z.ZodOptional<z.ZodString>;
    driverId: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof DocumentType>;
    title: z.ZodString;
    expiryDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: DocumentType;
    title: string;
    vehicleId?: string | undefined;
    driverId?: string | undefined;
    expiryDate?: string | undefined;
}, {
    type: DocumentType;
    title: string;
    vehicleId?: string | undefined;
    driverId?: string | undefined;
    expiryDate?: string | undefined;
}>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export declare const expiringDocumentsSchema: z.ZodObject<{
    days: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    days: number;
}, {
    days?: number | undefined;
}>;
export type ExpiringDocumentsInput = z.infer<typeof expiringDocumentsSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodDefault<z.ZodNativeEnum<typeof Role>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export declare const userFiltersSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
} & {
    role: z.ZodOptional<z.ZodNativeEnum<typeof Role>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    search?: string | undefined;
    role?: Role | undefined;
    isActive?: boolean | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    search?: string | undefined;
    role?: Role | undefined;
    isActive?: boolean | undefined;
}>;
export type UserFiltersInput = z.infer<typeof userFiltersSchema>;
export declare const updateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodNativeEnum<typeof Role>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: Role | undefined;
    isActive?: boolean | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: Role | undefined;
    isActive?: boolean | undefined;
}>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export declare const licenseExpirySchema: z.ZodObject<{
    days: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    days: number;
}, {
    days?: number | undefined;
}>;
export type LicenseExpiryInput = z.infer<typeof licenseExpirySchema>;
//# sourceMappingURL=index.d.ts.map