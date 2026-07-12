export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DRIVER = 'DRIVER',
  VIEWER = 'VIEWER',
}

export enum VehicleType {
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  TRAILER = 'TRAILER',
  PICKUP = 'PICKUP',
  OTHER = 'OTHER',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  ON_TRIP = 'ON_TRIP',
  IN_SHOP = 'IN_SHOP',
  RETIRED = 'RETIRED',
}

export enum DriverStatus {
  AVAILABLE = 'AVAILABLE',
  ON_TRIP = 'ON_TRIP',
  OFF_DUTY = 'OFF_DUTY',
  SUSPENDED = 'SUSPENDED',
}

export enum TripStatus {
  DRAFT = 'DRAFT',
  DISPATCHED = 'DISPATCHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum LicenseCategory {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  BE = 'BE',
  CE = 'CE',
  DE = 'DE',
}

export enum MaintenanceStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ExpenseType {
  FUEL = 'FUEL',
  MAINTENANCE = 'MAINTENANCE',
  TOLL = 'TOLL',
  PARKING = 'PARKING',
  INSURANCE = 'INSURANCE',
  PERMIT = 'PERMIT',
  OTHER = 'OTHER',
}

export enum DocumentType {
  REGISTRATION = 'REGISTRATION',
  INSURANCE = 'INSURANCE',
  INSPECTION = 'INSPECTION',
  PERMIT = 'PERMIT',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  MEDICAL_CERT = 'MEDICAL_CERT',
  OTHER = 'OTHER',
}