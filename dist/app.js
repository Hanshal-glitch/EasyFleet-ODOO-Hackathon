"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const session_1 = require("./config/session");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const logger_1 = require("./utils/logger");
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const vehicleRoutes_1 = __importDefault(require("./routes/vehicleRoutes"));
const driverRoutes_1 = __importDefault(require("./routes/driverRoutes"));
const tripRoutes_1 = __importDefault(require("./routes/tripRoutes"));
const maintenanceRoutes_1 = __importDefault(require("./routes/maintenanceRoutes"));
const fuelRoutes_1 = __importDefault(require("./routes/fuelRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const app = (0, express_1.default)();
// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Session middleware
app.use(session_1.sessionMiddleware);
// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info(`${req.method} ${req.path}`, {
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
        });
    });
    next();
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/vehicles', auth_1.requireAuth, vehicleRoutes_1.default);
app.use('/api/drivers', auth_1.requireAuth, driverRoutes_1.default);
app.use('/api/trips', auth_1.requireAuth, tripRoutes_1.default);
app.use('/api/maintenance', auth_1.requireAuth, maintenanceRoutes_1.default);
app.use('/api/fuel', auth_1.requireAuth, fuelRoutes_1.default);
app.use('/api/expenses', auth_1.requireAuth, expenseRoutes_1.default);
app.use('/api/dashboard', auth_1.requireAuth, dashboardRoutes_1.default);
app.use('/api/reports', auth_1.requireAuth, reportRoutes_1.default);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
