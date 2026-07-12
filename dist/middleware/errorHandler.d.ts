import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
export declare class AppError extends Error {
    statusCode: number;
    code?: string | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined);
}
export declare class BusinessRuleError extends AppError {
    constructor(message: string);
}
export declare class ValidationError extends AppError {
    errors: ReturnType<ZodError['format']>;
    constructor(errors: ReturnType<ZodError['format']>);
}
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
export declare function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
export declare function notFoundHandler(req: Request, res: Response): void;
//# sourceMappingURL=errorHandler.d.ts.map