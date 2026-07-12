"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.session = exports.sessionMiddleware = void 0;
const express_session_1 = __importDefault(require("express-session"));
exports.session = express_session_1.default;
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const pg_1 = require("pg");
const env_1 = require("./env");
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
const pgPool = new pg_1.Pool({
    connectionString: env_1.env.DATABASE_URL,
});
exports.sessionMiddleware = (0, express_session_1.default)({
    store: new PgSession({
        pool: pgPool,
        tableName: 'Session',
        createTableIfMissing: true,
    }),
    name: 'transport_ops_sid',
    secret: env_1.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: env_1.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    rolling: true,
});
