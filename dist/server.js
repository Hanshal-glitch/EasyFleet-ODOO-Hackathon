"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./config/socket");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const PORT = process.env.PORT || 3001;
async function startServer() {
    try {
        // Test database connection
        await database_1.prisma.$connect();
        logger_1.logger.info('Database connected successfully');
        const httpServer = (0, http_1.createServer)(app_1.default);
        // Initialize Socket.io
        const io = (0, socket_1.initializeSocket)(httpServer);
        // Make io available globally for emitting events
        global.io = io;
        // Periodic KPI updates (every 30 seconds)
        setInterval(async () => {
            try {
                // Get fresh KPIs and emit to connected clients
                // This is a simplified version - in production you'd want to be more efficient
            }
            catch (error) {
                logger_1.logger.error('Failed to emit KPI update', { error });
            }
        }, 30000);
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`Server running on port ${PORT}`);
            logger_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger_1.logger.info('SIGTERM received, shutting down gracefully');
            httpServer.close(() => {
                logger_1.logger.info('HTTP server closed');
            });
            await database_1.prisma.$disconnect();
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            logger_1.logger.info('SIGINT received, shutting down gracefully');
            httpServer.close(() => {
                logger_1.logger.info('HTTP server closed');
            });
            await database_1.prisma.$disconnect();
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', { error });
        process.exit(1);
    }
}
startServer();
