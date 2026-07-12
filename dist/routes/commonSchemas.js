"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateBody = exports.validateQuery = exports.idParamSchema = void 0;
const zod_1 = require("zod");
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
const validateQuery = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
exports.validateQuery = validateQuery;
const validateBody = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
exports.validateBody = validateBody;
const validateParams = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
exports.validateParams = validateParams;
