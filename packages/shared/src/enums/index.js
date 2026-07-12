"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentType = exports.ExpenseType = exports.MaintenanceStatus = exports.LicenseCategory = exports.TripStatus = exports.DriverStatus = exports.VehicleStatus = exports.VehicleType = exports.Role = void 0;
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["MANAGER"] = "MANAGER";
    Role["DRIVER"] = "DRIVER";
    Role["VIEWER"] = "VIEWER";
})(Role || (exports.Role = Role = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["VAN"] = "VAN";
    VehicleType["TRUCK"] = "TRUCK";
    VehicleType["TRAILER"] = "TRAILER";
    VehicleType["PICKUP"] = "PICKUP";
    VehicleType["OTHER"] = "OTHER";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var VehicleStatus;
(function (VehicleStatus) {
    VehicleStatus["AVAILABLE"] = "AVAILABLE";
    VehicleStatus["ON_TRIP"] = "ON_TRIP";
    VehicleStatus["IN_SHOP"] = "IN_SHOP";
    VehicleStatus["RETIRED"] = "RETIRED";
})(VehicleStatus || (exports.VehicleStatus = VehicleStatus = {}));
var DriverStatus;
(function (DriverStatus) {
    DriverStatus["AVAILABLE"] = "AVAILABLE";
    DriverStatus["ON_TRIP"] = "ON_TRIP";
    DriverStatus["OFF_DUTY"] = "OFF_DUTY";
    DriverStatus["SUSPENDED"] = "SUSPENDED";
})(DriverStatus || (exports.DriverStatus = DriverStatus = {}));
var TripStatus;
(function (TripStatus) {
    TripStatus["DRAFT"] = "DRAFT";
    TripStatus["DISPATCHED"] = "DISPATCHED";
    TripStatus["COMPLETED"] = "COMPLETED";
    TripStatus["CANCELLED"] = "CANCELLED";
})(TripStatus || (exports.TripStatus = TripStatus = {}));
var LicenseCategory;
(function (LicenseCategory) {
    LicenseCategory["A"] = "A";
    LicenseCategory["B"] = "B";
    LicenseCategory["C"] = "C";
    LicenseCategory["D"] = "D";
    LicenseCategory["E"] = "E";
    LicenseCategory["BE"] = "BE";
    LicenseCategory["CE"] = "CE";
    LicenseCategory["DE"] = "DE";
})(LicenseCategory || (exports.LicenseCategory = LicenseCategory = {}));
var MaintenanceStatus;
(function (MaintenanceStatus) {
    MaintenanceStatus["OPEN"] = "OPEN";
    MaintenanceStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MaintenanceStatus["COMPLETED"] = "COMPLETED";
    MaintenanceStatus["CANCELLED"] = "CANCELLED";
})(MaintenanceStatus || (exports.MaintenanceStatus = MaintenanceStatus = {}));
var ExpenseType;
(function (ExpenseType) {
    ExpenseType["FUEL"] = "FUEL";
    ExpenseType["MAINTENANCE"] = "MAINTENANCE";
    ExpenseType["TOLL"] = "TOLL";
    ExpenseType["PARKING"] = "PARKING";
    ExpenseType["INSURANCE"] = "INSURANCE";
    ExpenseType["PERMIT"] = "PERMIT";
    ExpenseType["OTHER"] = "OTHER";
})(ExpenseType || (exports.ExpenseType = ExpenseType = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["REGISTRATION"] = "REGISTRATION";
    DocumentType["INSURANCE"] = "INSURANCE";
    DocumentType["INSPECTION"] = "INSPECTION";
    DocumentType["PERMIT"] = "PERMIT";
    DocumentType["DRIVER_LICENSE"] = "DRIVER_LICENSE";
    DocumentType["MEDICAL_CERT"] = "MEDICAL_CERT";
    DocumentType["OTHER"] = "OTHER";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
