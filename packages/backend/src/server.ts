import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { initializeSocket, emitKPIUpdate } from './config/socket';
import { prisma } from './config/database';
import { getDashboardStats } from './services/dashboardService';
import { logger } from './utils/logger';
import { initializeCronJobs } from './utils/cronJobs';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    const httpServer = createServer(app);

    // Initialize Socket.io
    const io = initializeSocket(httpServer);

    // Make io available globally for emitting events
    (global as any).io = io;

    // Start cron jobs
    initializeCronJobs();

    // Periodic KPI updates (every 30 seconds)
    setInterval(async () => {
      try {
        // Get fresh KPIs and emit to connected clients
        const stats = await getDashboardStats();
        emitKPIUpdate(stats);
      } catch (error) {
        logger.error('Failed to emit KPI update', { error });
      }
    }, 30000);

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      httpServer.close(() => {
        logger.info('HTTP server closed');
      });
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      httpServer.close(() => {
        logger.info('HTTP server closed');
      });
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();