import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
export declare function initializeSocket(httpServer: HttpServer): Server;
export declare function getIO(): Server | null;
export declare function emitKPIUpdate(kpis: any): void;
export declare function emitTripStatusChange(tripId: string, oldStatus: string, newStatus: string): void;
export declare function emitVehicleStatusChange(vehicleId: string, oldStatus: string, newStatus: string): void;
export declare function emitDriverStatusChange(driverId: string, oldStatus: string, newStatus: string): void;
export declare function emitMaintenanceStatusChange(maintenanceId: string, oldStatus: string, newStatus: string): void;
export declare function emitLicenseExpiryWarning(driverId: string, daysUntilExpiry: number): void;
export declare function emitDocumentExpiryWarning(documentId: string, daysUntilExpiry: number): void;
//# sourceMappingURL=socket.d.ts.map