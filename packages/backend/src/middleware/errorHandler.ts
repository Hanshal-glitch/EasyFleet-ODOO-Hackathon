import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(409, message, 'BUSINESS_RULE_VIOLATION');
    this.name = 'BusinessRuleError';
  }
}

export class ValidationError extends AppError {
  constructor(public errors: ReturnType<ZodError['format']>) {
    super(400, 'Validation failed', 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error({ err, path: req.path, method: req.method, userId: (req as any).user?.id }, err.message);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.format(),
    });
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      return res.status(409).json({
        error: `${target} already exists`,
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        error: 'Foreign key constraint violation',
        code: 'FOREIGN_KEY_VIOLATION',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
        code: 'NOT_FOUND',
      });
    }
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
  });
}