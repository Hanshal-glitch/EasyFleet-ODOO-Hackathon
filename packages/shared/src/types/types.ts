import type {
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

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  hasCompletedOnboardingTour: boolean;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  model: string | null;
  type: VehicleType;
  maxLoadCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string | null;
  createdById: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleWithRelations extends Vehicle {
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName'>;
  updatedBy: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
  _count?: {
    trips: number;
    maintenanceLogs: number;
    fuelLogs: number;
    expenses: number;
    documents: number;
  };
}

export interface Driver {
  id: string;
  userId: string | null;
  name: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory;
  licenseExpiryDate: Date;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  createdById: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverWithRelations extends Driver {
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | null;
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName'>;
  updatedBy: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
  _count?: {
    trips: number;
  };
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  actualDistanceKm: number | null;
  fuelConsumedLiters: number | null;
  startOdometerKm: number | null;
  endOdometerKm: number | null;
  status: TripStatus;
  revenue: number | null;
  dispatchedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdById: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripWithRelations extends Trip {
  vehicle: Pick<Vehicle, 'id' | 'registrationNumber' | 'name' | 'type' | 'maxLoadCapacityKg' | 'status'>;
  driver: Pick<Driver, 'id' | 'name' | 'licenseNumber' | 'status'>;
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName'>;
  updatedBy: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  status: MaintenanceStatus;
  cost: number;
  startedAt: Date;
  completedAt: Date | null;
  odometerAtStart: number;
  odometerAtEnd: number | null;
  createdById: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceLogWithVehicle extends MaintenanceLog {
  vehicle: Pick<Vehicle, 'id' | 'registrationNumber' | 'name' | 'status'>;
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName'>;
  updatedBy: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  date: Date;
  odometerKm: number;
  stationName: string | null;
  receiptNumber: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FuelLogWithVehicle extends FuelLog {
  vehicle: Pick<Vehicle, 'id' | 'registrationNumber' | 'name'>;
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface Expense {
  id: string;
  vehicleId: string;
  type: ExpenseType;
  description: string;
  amount: number;
  date: Date;
  receiptUrl: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseWithVehicle extends Expense {
  vehicle: Pick<Vehicle, 'id' | 'registrationNumber' | 'name'>;
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface Document {
  id: string;
  vehicleId: string | null;
  driverId: string | null;
  type: DocumentType;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  expiryDate: Date | null;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentWithRelations extends Document {
  vehicle: Pick<Vehicle, 'id' | 'registrationNumber' | 'name'> | null;
  driver: Pick<Driver, 'id' | 'name' | 'licenseNumber'> | null;
  uploadedBy: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

export interface KPIs {
  activeVehicles: number;
  availableVehicles: number;
  inShopVehicles: number;
  retiredVehicles: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  availableDrivers: number;
  fleetUtilizationPct: number;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface FuelEfficiencyRow {
  vehicleId: string;
  vehicleRegistration: string;
  vehicleName: string;
  totalDistance: number;
  totalFuel: number;
  efficiency: number;
}

export interface UtilizationRow {
  vehicleId: string;
  vehicleRegistration: string;
  vehicleName: string;
  tripDays: number;
  totalDays: number;
  utilizationPct: number;
}

export interface CostRow {
  vehicleId: string;
  vehicleRegistration: string;
  vehicleName: string;
  fuelCost: number;
  maintenanceCost: number;
  totalCost: number;
}

export interface ROIRow {
  vehicleId: string;
  vehicleRegistration: string;
  vehicleName: string;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  acquisitionCost: number;
  roi: number;
}

export interface TripStats {
  activeTrips: number;
  pendingTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalRevenue: number;
  totalDistance: number;
}

export interface LicenseExpiryRow {
  driverId: string;
  driverName: string;
  licenseNumber: string;
  licenseExpiryDate: Date;
  daysUntilExpiry: number;
}

export interface ExpiringDocumentRow {
  documentId: string;
  documentTitle: string;
  documentType: DocumentType;
  expiryDate: Date | null;
  daysUntilExpiry: number | null;
  vehicleRegistration: string | null;
  driverName: string | null;
}
