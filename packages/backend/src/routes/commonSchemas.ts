import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

export const validateQuery = (schema: z.ZodObject<any>) => {
  return async (req: any, res: any, next: any) => {
    try {
      await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.flatten().fieldErrors,
        });
      }
      next(error);
    }
  };
};

export const validateBody = (schema: z.ZodObject<any>) => {
  return async (req: any, res: any, next: any) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.flatten().fieldErrors,
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema: z.ZodObject<any>) => {
  return async (req: any, res: any, next: any) => {
    try {
      await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.flatten().fieldErrors,
        });
      }
      next(error);
    }
  };
};