export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

export const VEHICLE_REGISTRATION_REGEX = /^[A-Z0-9\-]+$/i;
export const LICENSE_NUMBER_REGEX = /^[A-Z0-9]+$/i;
export const PHONE_REGEX = /^[\d\+\-\s\(\)]+$/;

export const SAFETY_SCORE_MIN = 0;
export const SAFETY_SCORE_MAX = 100;

export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
} as const;

export const SESSION_CONFIG = {
  name: 'transport_ops_sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const;

export const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
} as const;

export const LICENSE_EXPIRY_WARNING_DAYS = [30, 14, 7, 1];

export const DOCUMENT_EXPIRY_WARNING_DAYS = [30, 14, 7, 1];

export const CRON_SCHEDULES = {
  licenseExpiryCheck: '0 9 * * *', // Daily at 9 AM
} as const;