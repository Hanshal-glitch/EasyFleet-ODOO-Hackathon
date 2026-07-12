"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRON_SCHEDULES = exports.DOCUMENT_EXPIRY_WARNING_DAYS = exports.LICENSE_EXPIRY_WARNING_DAYS = exports.RATE_LIMIT = exports.SESSION_CONFIG = exports.FILE_UPLOAD = exports.SAFETY_SCORE_MAX = exports.SAFETY_SCORE_MIN = exports.PHONE_REGEX = exports.LICENSE_NUMBER_REGEX = exports.VEHICLE_REGISTRATION_REGEX = exports.PAGINATION_DEFAULTS = void 0;
exports.PAGINATION_DEFAULTS = {
    page: 1,
    limit: 20,
    maxLimit: 100,
};
exports.VEHICLE_REGISTRATION_REGEX = /^[A-Z0-9\-]+$/i;
exports.LICENSE_NUMBER_REGEX = /^[A-Z0-9]+$/i;
exports.PHONE_REGEX = /^[\d\+\-\s\(\)]+$/;
exports.SAFETY_SCORE_MIN = 0;
exports.SAFETY_SCORE_MAX = 100;
exports.FILE_UPLOAD = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
};
exports.SESSION_CONFIG = {
    name: 'transport_ops_sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
};
exports.RATE_LIMIT = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
};
exports.LICENSE_EXPIRY_WARNING_DAYS = [30, 14, 7, 1];
exports.DOCUMENT_EXPIRY_WARNING_DAYS = [30, 14, 7, 1];
exports.CRON_SCHEDULES = {
    licenseExpiryCheck: '0 9 * * *', // Daily at 9 AM
};
