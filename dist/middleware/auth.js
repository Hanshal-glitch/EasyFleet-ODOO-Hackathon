"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requireOwnershipOrRole = requireOwnershipOrRole;
const database_1 = require("../config/database");
const enums_1 = require("@transport-ops/shared/enums");
const errorHandler_1 = require("./errorHandler");
function requireAuth(req, res, next) {
    if (!req.session?.userId) {
        throw new errorHandler_1.AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }
    next();
}
function requireRole(...roles) {
    return async (req, res, next) => {
        if (!req.session?.userId) {
            throw new errorHandler_1.AppError(401, 'Authentication required', 'UNAUTHORIZED');
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.session.userId },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
        });
        if (!user || !user.isActive) {
            throw new errorHandler_1.AppError(401, 'User not found or inactive', 'UNAUTHORIZED');
        }
        if (!roles.includes(user.role)) {
            throw new errorHandler_1.AppError(403, 'Insufficient permissions', 'FORBIDDEN');
        }
        req.user = user;
        next();
    };
}
function requireOwnershipOrRole(getResourceUserId) {
    return async (req, res, next) => {
        if (!req.session?.userId) {
            throw new errorHandler_1.AppError(401, 'Authentication required', 'UNAUTHORIZED');
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.session.userId },
            select: { id: true, role: true },
        });
        if (!user) {
            throw new errorHandler_1.AppError(401, 'User not found', 'UNAUTHORIZED');
        }
        const resourceUserId = await getResourceUserId(req);
        if (user.role === enums_1.Role.ADMIN || user.id === resourceUserId) {
            req.user = user;
            return next();
        }
        throw new errorHandler_1.AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    };
}
