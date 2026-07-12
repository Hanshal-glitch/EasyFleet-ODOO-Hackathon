import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { Role } from '@transport-ops/shared/enums';
import { AppError } from './errorHandler';

type RoleValue = `${Role}`;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
  }
  next();
}

export function requireRole(...roles: RoleValue[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'User not found or inactive', 'UNAUTHORIZED');
    }

    if (!roles.includes(user.role as RoleValue)) {
      throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
    }

    req.user = user as any;
    next();
  };
}

export function requireOwnershipOrRole(getResourceUserId: (req: Request) => Promise<string>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new AppError(401, 'User not found', 'UNAUTHORIZED');
    }

    const resourceUserId = await getResourceUserId(req);

    if (user.role === Role.ADMIN || user.id === resourceUserId) {
      req.user = user as any;
      return next();
    }

    throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
  };
}