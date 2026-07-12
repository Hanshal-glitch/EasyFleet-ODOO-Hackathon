"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpiringLicenses = exports.getAvailableForDispatch = exports.deleteDriver = exports.updateDriver = exports.createDriver = exports.getDriver = exports.listDrivers = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const errorHandler_2 = require("../middleware/errorHandler");
const schemas_1 = require("@transport-ops/shared/schemas");
const enums_1 = require("@transport-ops/shared/enums");
exports.listDrivers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = schemas_1.driverFiltersSchema.parse(req.query);
    const { page, limit, sort, order, licenseExpiring, search, ...where } = filters;
    const whereClause = {};
    if (where.status)
        whereClause.status = where.status;
    if (search) {
        whereClause.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { licenseNumber: { contains: search, mode: 'insensitive' } },
            { contactNumber: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (licenseExpiring) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + licenseExpiring);
        whereClause.licenseExpiryDate = { lte: expiryDate };
    }
    const [drivers, total] = await Promise.all([
        database_1.prisma.driver.findMany({
            where: whereClause,
            orderBy: sort ? { [sort]: order || 'asc' } : { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                updatedBy: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { trips: true } },
            },
        }),
        database_1.prisma.driver.count({ where: whereClause }),
    ]);
    res.json({
        data: drivers,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    });
});
exports.getDriver = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const driver = await database_1.prisma.driver.findUnique({
        where: { id: req.params.id },
        include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            updatedBy: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { trips: true } },
        },
    });
    if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ driver });
});
exports.createDriver = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.createDriverSchema.parse(req.body);
    const existing = await database_1.prisma.driver.findUnique({
        where: { licenseNumber: data.licenseNumber },
    });
    if (existing) {
        throw new errorHandler_2.BusinessRuleError('License number already exists');
    }
    const driver = await database_1.prisma.driver.create({
        data: {
            ...data,
            licenseExpiryDate: new Date(data.licenseExpiryDate),
            createdById: req.session.userId,
        },
        include: {
            createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    res.status(201).json({ driver });
});
exports.updateDriver = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.updateDriverSchema.parse(req.body);
    const existing = await database_1.prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!existing) {
        return res.status(404).json({ error: 'Driver not found' });
    }
    const updateData = { ...data, updatedById: req.session.userId };
    if (data.licenseExpiryDate) {
        updateData.licenseExpiryDate = new Date(data.licenseExpiryDate);
    }
    const driver = await database_1.prisma.driver.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            updatedBy: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    res.json({ driver });
});
exports.deleteDriver = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const driver = await database_1.prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
    }
    if (driver.status === enums_1.DriverStatus.ON_TRIP) {
        throw new errorHandler_2.BusinessRuleError('Cannot delete driver that is on a trip');
    }
    await database_1.prisma.driver.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});
exports.getAvailableForDispatch = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const drivers = await database_1.prisma.driver.findMany({
        where: {
            status: enums_1.DriverStatus.AVAILABLE,
            licenseExpiryDate: { gt: new Date() },
        },
        select: {
            id: true,
            name: true,
            licenseNumber: true,
            licenseCategory: true,
            safetyScore: true,
        },
        orderBy: { name: 'asc' },
    });
    res.json({ drivers });
});
exports.getExpiringLicenses = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { days = 30 } = req.query;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));
    const drivers = await database_1.prisma.driver.findMany({
        where: {
            licenseExpiryDate: { lte: expiryDate },
            isActive: true,
        },
        include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { licenseExpiryDate: 'asc' },
    });
    res.json({ drivers });
});
