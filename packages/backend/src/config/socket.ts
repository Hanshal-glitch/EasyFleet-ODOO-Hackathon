import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    role: string;
  };
}

const SOCKET_EVENTS = {
  KPI_UPDATE: 'kpi:update',
  TRIP_STATUS_CHANGE: 'trip:statusChange',
  VEHICLE_STATUS_CHANGE: 'vehicle:statusChange',
  DRIVER_STATUS_CHANGE: 'driver:statusChange',
  MAINTENANCE_STATUS_CHANGE: 'maintenance:statusChange',
  LICENSE_EXPIRY_WARNING: 'license:expiryWarning',
  DOCUMENT_EXPIRY_WARNING: 'document:expiryWarning',
} as const;

let io: Server | null = null;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const sessionCookie = socket.handshake.headers.cookie;
    if (sessionCookie) {
      next();
    } else {
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('authenticate', (user: { id: string; role: string }) => {
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

export function getIO(): Server | null {
  return io;
}

export function emitKPIUpdate(kpis: any) {
  io?.to('global').emit(SOCKET_EVENTS.KPI_UPDATE, kpis);
  io?.to('role:ADMIN').emit(SOCKET_EVENTS.KPI_UPDATE, kpis);
  io?.to('role:MANAGER').emit(SOCKET_EVENTS.KPI_UPDATE, kpis);
}

export function emitTripStatusChange(tripId: string, oldStatus: string, newStatus: string) {
  io?.to('global').emit(SOCKET_EVENTS.TRIP_STATUS_CHANGE, { tripId, oldStatus, newStatus });
}

export function emitVehicleStatusChange(vehicleId: string, oldStatus: string, newStatus: string) {
  io?.to('global').emit(SOCKET_EVENTS.VEHICLE_STATUS_CHANGE, { vehicleId, oldStatus, newStatus });
}

export function emitDriverStatusChange(driverId: string, oldStatus: string, newStatus: string) {
  io?.to('global').emit(SOCKET_EVENTS.DRIVER_STATUS_CHANGE, { driverId, oldStatus, newStatus });
}

export function emitMaintenanceStatusChange(maintenanceId: string, oldStatus: string, newStatus: string) {
  io?.to('global').emit(SOCKET_EVENTS.MAINTENANCE_STATUS_CHANGE, { maintenanceId, oldStatus, newStatus });
}

export function emitLicenseExpiryWarning(driverId: string, daysUntilExpiry: number) {
  io?.to('role:ADMIN').emit(SOCKET_EVENTS.LICENSE_EXPIRY_WARNING, { driverId, daysUntilExpiry });
  io?.to('role:MANAGER').emit(SOCKET_EVENTS.LICENSE_EXPIRY_WARNING, { driverId, daysUntilExpiry });
}

export function emitDocumentExpiryWarning(documentId: string, daysUntilExpiry: number) {
  io?.to('role:ADMIN').emit(SOCKET_EVENTS.DOCUMENT_EXPIRY_WARNING, { documentId, daysUntilExpiry });
  io?.to('role:MANAGER').emit(SOCKET_EVENTS.DOCUMENT_EXPIRY_WARNING, { documentId, daysUntilExpiry });
}