import { Request, Response, NextFunction } from 'express';
import { Role } from '@transport-ops/shared/enums';

type RoleValue = `${Role}`;

export function requireRole(...allowedRoles: RoleValue[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    if (!allowedRoles.includes(req.user.role as RoleValue)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }

    next();
  };
}

export function hasRole(userRole: RoleValue, requiredRoles: RoleValue[]): boolean {
  return requiredRoles.includes(userRole);
}

export function hasPermission(userRole: RoleValue, permission: string): boolean {
  const rolePermissions: Record<RoleValue, string[]> = {
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

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    if (!hasPermission(req.user.role as RoleValue, permission)) {
      return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
    }

    next();
  };
}