"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.register = exports.me = exports.logout = exports.login = void 0;
const database_1 = require("../config/database");
const authService_1 = require("../services/authService");
const errorHandler_1 = require("../middleware/errorHandler");
const schemas_1 = require("@transport-ops/shared/schemas");
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = schemas_1.loginSchema.parse(req.body);
    const user = await authService_1.AuthService.login(email, password);
    req.session.userId = user.id;
    req.session.save();
    res.json({ user });
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.clearCookie('transport_ops_sid');
        res.json({ success: true });
    });
});
exports.me = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await authService_1.AuthService.getUserById(req.session.userId);
    if (!user) {
        req.session.destroy(() => { });
        return res.status(401).json({ error: 'Session invalid' });
    }
    res.json({ user });
});
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.registerSchema.parse(req.body);
    const user = await authService_1.AuthService.register(data);
    res.status(201).json({ user });
});
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = schemas_1.changePasswordSchema.parse(req.body);
    const user = await database_1.prisma.user.findUnique({
        where: { id: req.session.userId },
        select: { passwordHash: true },
    });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const isValid = await authService_1.AuthService.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const passwordHash = await authService_1.AuthService.hashPassword(newPassword);
    await database_1.prisma.user.update({
        where: { id: req.session.userId },
        data: { passwordHash },
    });
    res.json({ success: true });
});
