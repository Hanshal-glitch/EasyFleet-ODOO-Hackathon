"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateQuery = validateQuery;
exports.validateBody = validateBody;
exports.validateParams = validateParams;
const zod_1 = require("zod");
function validate(schema) {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: error.flatten().fieldErrors,
                });
            }
            next(error);
        }
    };
}
function validateQuery(schema) {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: error.flatten().fieldErrors,
                });
            }
            next(error);
        }
    };
}
function validateBody(schema) {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: error.flatten().fieldErrors,
                });
            }
            next(error);
        }
    };
}
function validateParams(schema) {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: error.flatten().fieldErrors,
                });
            }
            next(error);
        }
    };
}
