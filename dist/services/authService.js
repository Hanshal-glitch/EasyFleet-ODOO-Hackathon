"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = require("../config/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const errorHandler_1 = require("../middleware/errorHandler");
const BCRYPT_COST = 12;
class AuthService {
    static async hashPassword(password) {
        return bcrypt_1.default.hash(password, BCRYPT_COST);
    }
    static async verifyPassword(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
    static async login(email, password) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user || !user.isActive) {
            throw new errorHandler_1.AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
        }
        const isValid = await this.verifyPassword(password, user.passwordHash);
        if (!isValid) {
            throw new errorHandler_1.AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    static async getUserById(id) {
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user || !user.isActive)
            return null;
        return user;
    }
    static async register(data) {
        const existing = await database_1.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (existing) {
            throw new errorHandler_1.AppError(409, 'Email already registered', 'EMAIL_EXISTS');
        }
        const passwordHash = await this.hashPassword(data.password);
        const user = await database_1.prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
            },
        });
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
exports.AuthService = AuthService;
