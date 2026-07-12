"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehicleMaintenanceHistory = exports.closeMaintenance = exports.createMaintenance = exports.getMaintenance = exports.listMaintenance = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const schemas_1 = require("@transport-ops/shared/schemas");
const businessRulesService_1 = require("../services/businessRulesService");
exports.listMaintenance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = schemas_1.maintenanceFiltersSchema.parse(req.query);
    const { page, limit, sort, order, ...where } = filters;
    const whereClause = {};
    if (where.vehicleId)
        whereClause.vehicleId = where.vehicleId;
    if (where.status)
        whereClause.status = where.status;
    if (where.dateFrom || where.dateTo) {
        whereClause.startedAt = {};
        if (where.dateFrom)
            whereClause.startedAt.gte = new Date(where.dateFrom);
        if (where.dateTo)
            whereClause.startedAt.lte = new Date(where.dateTo);
    }
    const [maintenance, total] = await Promise.all([
        database_1.prisma.maintenanceLog.findMany({
            where: whereClause,
            orderBy: sort ? { [sort]: order || 'asc' } : { startedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                vehicle: { select: { id: true, registrationNumber: true, name: true, status: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                updatedBy: { select: { id: true, firstName: true, lastName: true } },
            },
        }),
        database_1.prisma.maintenanceLog.count({ where: whereClause }),
    ]);
    res.json({
        data: maintenance,
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
exports.getMaintenance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const maintenance = await database_1.prisma.maintenanceLog.findUnique({
        where: { id: req.params.id },
        include: {
            vehicle: { select: { id: true, registrationNumber: true, name: true, status: true, odometerKm: true } },
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            updatedBy: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    if (!maintenance) {
        return res.status(404).json({ error: 'Maintenance record not found' });
    }
    res.json({ maintenance });
});
exports.createMaintenance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.createMaintenanceSchema.parse(req.body);
    const maintenance = await businessRulesService_1.BusinessRulesService.openMaintenance(data, req.session.userId);
    res.status(201).json({ maintenance });
});
exports.closeMaintenance = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.closeMaintenanceSchema.parse(req.body);
    const maintenance = await businessRulesService_1.BusinessRulesService.closeMaintenance(req.params.id, data, req.session.userId);
    res.json({ maintenance });
});
exports.getVehicleMaintenanceHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const logs = await database_1.prisma.maintenanceLog.findMany({
        where: { vehicleId: req.params.vehicleId },
        orderBy: { startedAt: 'desc' },
        include: {
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            updatedBy: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    res.json({ logs });
});
