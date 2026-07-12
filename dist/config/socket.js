"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
exports.getIO = getIO;
exports.emitKPIUpdate = emitKPIUpdate;
exports.emitTripStatusChange = emitTripStatusChange;
exports.emitVehicleStatusChange = emitVehicleStatusChange;
exports.emitDriverStatusChange = emitDriverStatusChange;
exports.emitMaintenanceStatusChange = emitMaintenanceStatusChange;
exports.emitLicenseExpiryWarning = emitLicenseExpiryWarning;
exports.emitDocumentExpiryWarning = emitDocumentExpiryWarning;
const socket_io_1 = require("socket.io");
const SOCKET_EVENTS = {
    KPI_UPDATE: 'kpi:update',
    TRIP_STATUS_CHANGE: 'trip:statusChange',
    VEHICLE_STATUS_CHANGE: 'vehicle:statusChange',
    DRIVER_STATUS_CHANGE: 'driver:statusChange',
    MAINTENANCE_STATUS_CHANGE: 'maintenance:statusChange',
    LICENSE_EXPIRY_WARNING: 'license:expiryWarning',
    DOCUMENT_EXPIRY_WARNING: 'document:expiryWarning',
};
let io = null;
function initializeSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const sessionCookie = socket.handshake.headers.cookie;
        if (sessionCookie) {
            next();
        }
        else {
            next();
        }
    });
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        socket.on('authenticate', (user) => {
            socket.user = user;
            socket.join(`user:${user.id}`);
            socket.join(`role:${user.role}`);
            socket.join('global');
            console.log(`Socket ${socket.id} authenticated as user ${user.id} (${user.role})`);
        });
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
    return io;
}
function getIO() {
    return io;
}
function emitKPIUpdate(kpis) {
    io?.to('global').emit(SOCKET_EVENTS.KPI_UPDATE, kpis);
    io?.to('role:ADMIN').emit(SOCKET_EVENTS.KPI_UPDATE, kpis);
    io?.to('role:MANAGER').emit(SOCKET_EVENTS.KPI_UPDATE, kpis);
}
function emitTripStatusChange(tripId, oldStatus, newStatus) {
    io?.to('global').emit(SOCKET_EVENTS.TRIP_STATUS_CHANGE, { tripId, oldStatus, newStatus });
}
function emitVehicleStatusChange(vehicleId, oldStatus, newStatus) {
    io?.to('global').emit(SOCKET_EVENTS.VEHICLE_STATUS_CHANGE, { vehicleId, oldStatus, newStatus });
}
function emitDriverStatusChange(driverId, oldStatus, newStatus) {
    io?.to('global').emit(SOCKET_EVENTS.DRIVER_STATUS_CHANGE, { driverId, oldStatus, newStatus });
}
function emitMaintenanceStatusChange(maintenanceId, oldStatus, newStatus) {
    io?.to('global').emit(SOCKET_EVENTS.MAINTENANCE_STATUS_CHANGE, { maintenanceId, oldStatus, newStatus });
}
function emitLicenseExpiryWarning(driverId, daysUntilExpiry) {
    io?.to('role:ADMIN').emit(SOCKET_EVENTS.LICENSE_EXPIRY_WARNING, { driverId, daysUntilExpiry });
    io?.to('role:MANAGER').emit(SOCKET_EVENTS.LICENSE_EXPIRY_WARNING, { driverId, daysUntilExpiry });
}
function emitDocumentExpiryWarning(documentId, daysUntilExpiry) {
    io?.to('role:ADMIN').emit(SOCKET_EVENTS.DOCUMENT_EXPIRY_WARNING, { documentId, daysUntilExpiry });
    io?.to('role:MANAGER').emit(SOCKET_EVENTS.DOCUMENT_EXPIRY_WARNING, { documentId, daysUntilExpiry });
}
