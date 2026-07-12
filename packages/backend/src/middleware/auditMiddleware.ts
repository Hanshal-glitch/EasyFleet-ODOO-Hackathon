import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export const auditLog = async (req: Request, res: Response, next: NextFunction) => {
  // We only want to log mutations
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    // Wait for the response to finish
    res.on('finish', async () => {
      try {
        const userId = (req as any).user?.id || null;
        const action = req.method;
        const resource = req.baseUrl || req.path;
        
        // Try to extract resourceId from params or path
        const resourceId = req.params.id || null;
        
        let details: string | null = null;
        if (req.body && Object.keys(req.body).length > 0) {
          // Don't log passwords or sensitive data
          const safeBody = { ...req.body };
          delete safeBody.password;
          delete safeBody.passwordConfirm;
          details = JSON.stringify(safeBody);
        }

        await prisma.auditLog.create({
          data: {
            userId,
            action,
            resource,
            resourceId,
            details,
          },
        });
      } catch (error) {
        logger.error('Failed to create audit log', { error });
      }
    });
  }
  next();
};
