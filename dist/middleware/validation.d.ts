import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
export declare function validate(schema: AnyZodObject): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function validateQuery(schema: AnyZodObject): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function validateBody(schema: AnyZodObject): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function validateParams(schema: AnyZodObject): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=validation.d.ts.map