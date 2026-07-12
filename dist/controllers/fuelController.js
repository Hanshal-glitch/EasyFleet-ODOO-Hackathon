"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFuelLog = exports.getFuelLog = exports.listFuelLogs = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const errorHandler_2 = require("../middleware/errorHandler");
const schemas_1 = require("@transport-ops/shared/schemas");
exports.listFuelLogs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = schemas_1.fuelFiltersSchema.parse(req.query);
    const { page, limit, sort, order, ...where } = filters;
    const whereClause = {};
    if (where.vehicleId)
        whereClause.vehicleId = where.vehicleId;
    if (where.dateFrom || where.dateTo) {
        whereClause.date = {};
        if (where.dateFrom)
            whereClause.date.gte = new Date(where.dateFrom);
        if (where.dateTo)
            whereClause.date.lte = new Date(where.dateTo);
    }
    const [fuelLogs, total] = await Promise.all([
        database_1.prisma.fuelLog.findMany({
            where: whereClause,
            orderBy: sort ? { [sort]: order || 'desc' } : { date: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                vehicle: { select: { id: true, registrationNumber: true, name: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true } },
            },
        }),
        database_1.prisma.fuelLog.count({ where: whereClause }),
    ]);
    res.json({
        data: fuelLogs,
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
exports.getFuelLog = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const fuelLog = await database_1.prisma.fuelLog.findUnique({
        where: { id: req.params.id },
        include: {
            vehicle: { select: { id: true, registrationNumber: true, name: true, type: true } },
            createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    if (!fuelLog) {
        return res.status(404).json({ error: 'Fuel log not found' });
    }
    res.json({ fuelLog });
});
exports.createFuelLog = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.createFuelLogSchema.parse(req.body);
    const vehicle = await database_1.prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) {
        throw new errorHandler_2.BusinessRuleError('Vehicle not found');
    }
    const totalCost = data.liters * data.costPerLiter;
    const fuelLog = await database_1.prisma.fuelLog.create({
        data: {
            ...data,
            totalCost,
            date: new Date(data.date),
            createdById: req.session.userId,
        },
        include: {
            vehicle: { select: { id: true, registrationNumber: true, name: true } },
            createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    res.status(201).json({ fuelLog });
});
