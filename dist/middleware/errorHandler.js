"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.BusinessRuleError = exports.AppError = void 0;
exports.asyncHandler = asyncHandler;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const zod_1 = require("zod");
const library_1 = require("@prisma/client/runtime/library");
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BusinessRuleError extends AppError {
    constructor(message) {
        super(409, message, 'BUSINESS_RULE_VIOLATION');
        this.name = 'BusinessRuleError';
    }
}
exports.BusinessRuleError = BusinessRuleError;
class ValidationError extends AppError {
    errors;
    constructor(errors) {
        super(400, 'Validation failed', 'VALIDATION_ERROR');
        this.errors = errors;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
function errorHandler(err, req, res, next) {
    logger_1.logger.error({ err, path: req.path, method: req.method, userId: req.user?.id }, err.message);
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: err.format(),
        });
    }
    if (err instanceof library_1.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const target = err.meta?.target?.join(', ') || 'field';
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
function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Not found',
        code: 'NOT_FOUND',
    });
}
