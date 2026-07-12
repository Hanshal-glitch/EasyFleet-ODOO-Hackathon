export declare const PAGINATION_DEFAULTS: {
    readonly page: 1;
    readonly limit: 20;
    readonly maxLimit: 100;
};
export declare const VEHICLE_REGISTRATION_REGEX: RegExp;
export declare const LICENSE_NUMBER_REGEX: RegExp;
export declare const PHONE_REGEX: RegExp;
export declare const SAFETY_SCORE_MIN = 0;
export declare const SAFETY_SCORE_MAX = 100;
export declare const FILE_UPLOAD: {
    readonly maxSize: number;
    readonly allowedMimeTypes: readonly ["application/pdf", "image/jpeg", "image/png"];
    readonly allowedExtensions: readonly [".pdf", ".jpg", ".jpeg", ".png"];
};
export declare const SESSION_CONFIG: {
    readonly name: "transport_ops_sid";
    readonly secret: string;
    readonly resave: false;
    readonly saveUninitialized: false;
    readonly cookie: {
        readonly httpOnly: true;
        readonly secure: boolean;
        readonly sameSite: "lax";
        readonly maxAge: number;
    };
};
export declare const RATE_LIMIT: {
    readonly windowMs: number;
    readonly max: 100;
};
export declare const LICENSE_EXPIRY_WARNING_DAYS: number[];
export declare const DOCUMENT_EXPIRY_WARNING_DAYS: number[];
export declare const CRON_SCHEDULES: {
    readonly licenseExpiryCheck: "0 9 * * *";
};
//# sourceMappingURL=index.d.ts.map