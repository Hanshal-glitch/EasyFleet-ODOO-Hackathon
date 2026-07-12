"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.hasRole = hasRole;
exports.hasPermission = hasPermission;
exports.requirePermission = requirePermission;
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
        }
        next();
    };
}
function hasRole(userRole, requiredRoles) {
    return requiredRoles.includes(userRole);
}
function hasPermission(userRole, permission) {
    const rolePermissions = {
        ADMIN: ['*'],
        MANAGER: [
            'dashboard:read',
            'vehicles:read', 'vehicles:write',
            'drivers:read', 'drivers:write',
            'trips:read', 'trips:write', 'trips:dispatch', 'trips:complete', 'trips:cancel',
            'maintenance:read', 'maintenance:write',
            'fuel:read', 'fuel:write',
            'expenses:read', 'expenses:write',
            'reports:read', 'reports:export',
            'documents:read', 'documents:write',
        ],
        DRIVER: [
            'dashboard:read',
            'vehicles:read',
            'drivers:read:own',
            'trips:read:own', 'trips:write:own',
            'maintenance:read:own',
            'fuel:write:own',
            'expenses:write:own',
            'documents:read:own', 'documents:write:own',
        ],
        VIEWER: [
            'dashboard:read',
            'vehicles:read',
            'drivers:read',
            'trips:read',
            'maintenance:read',
            'fuel:read',
            'expenses:read',
            'reports:read',
            'documents:read',
        ],
    };
    const permissions = rolePermissions[userRole] || [];
    return permissions.includes('*') || permissions.includes(permission);
}
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        }
        if (!hasPermission(req.user.role, permission)) {
            return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
        }
        next();
    };
}
