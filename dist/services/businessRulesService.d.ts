import { prisma } from '../config/database';
import { VehicleStatus, DriverStatus } from '@transport-ops/shared/enums';
type Vehicle = Awaited<ReturnType<typeof prisma.vehicle.findUnique>>;
type Driver = Awaited<ReturnType<typeof prisma.driver.findUnique>>;
type Trip = Awaited<ReturnType<typeof prisma.trip.findUnique>>;
type MaintenanceLog = Awaited<ReturnType<typeof prisma.maintenanceLog.findUnique>>;
export declare class BusinessRulesService {
    static assertVehicleAvailable(vehicleId: string): Promise<Vehicle>;
    static getAvailableVehiclesForDispatch(cargoWeightKg?: number): Promise<Vehicle[]>;
    static assertCargoWeightValid(vehicle: Vehicle, cargoWeightKg: number): void;
    static setVehicleStatus(vehicleId: string, status: VehicleStatus): Promise<Vehicle>;
    static assertDriverEligible(driverId: string): Promise<Driver>;
    static getAvailableDriversForDispatch(): Promise<Driver[]>;
    static setDriverStatus(driverId: string, status: DriverStatus): Promise<Driver>;
    static dispatchTrip(tripId: string, userId: string): Promise<Trip>;
    static completeTrip(tripId: string, data: {
        actualDistanceKm: number;
        endOdometerKm: number;
        fuelConsumedLiters: number;
        revenue?: number;
    }, userId: string): Promise<Trip>;
    static cancelTrip(tripId: string, reason: string, userId: string): Promise<Trip>;
    static openMaintenance(data: {
        vehicleId: string;
        description: string;
        cost: number;
        odometerAtStart: number;
    }, userId: string): Promise<MaintenanceLog>;
    static closeMaintenance(maintenanceId: string, data: {
        odometerAtEnd: number;
        actualCost?: number;
    }, userId: string): Promise<MaintenanceLog>;
}
export {};
//# sourceMappingURL=businessRulesService.d.ts.map