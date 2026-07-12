"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableForDispatch = exports.deleteVehicle = exports.updateVehicle = exports.createVehicle = exports.getVehicle = exports.listVehicles = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const errorHandler_2 = require("../middleware/errorHandler");
const enums_1 = require("@transport-ops/shared/enums");
const schemas_1 = require("@transport-ops/shared/schemas");
exports.listVehicles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = schemas_1.vehicleFiltersSchema.parse(req.query);
    const { page, limit, sort, order, ...where } = filters;
    const whereClause = {};
    if (where.status)
        whereClause.status = where.status;
    if (where.type)
        whereClause.type = where.type;
    if (where.region)
        whereClause.region = where.region;
    if (where.search) {
        whereClause.OR = [
            { registrationNumber: { contains: where.search, mode: 'insensitive' } },
            { name: { contains: where.search, mode: 'insensitive' } },
            { model: { contains: where.search, mode: 'insensitive' } },
        ];
    }
    const [vehicles, total] = await Promise.all([
        database_1.prisma.vehicle.findMany({
            where: whereClause,
            orderBy: sort ? { [sort]: order || 'asc' } : { registrationNumber: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                updatedBy: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { trips: true, maintenanceLogs: true, fuelLogs: true, expenses: true, documents: true } },
            },
        }),
        database_1.prisma.vehicle.count({ where: whereClause }),
    ]);
    res.json({
        data: vehicles,
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
exports.getVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const vehicle = await database_1.prisma.vehicle.findUnique({
        where: { id: req.params.id },
        include: {
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            updatedBy: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { trips: true, maintenanceLogs: true, fuelLogs: true, expenses: true, documents: true } },
        },
    });
    if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ vehicle });
});
exports.createVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.createVehicleSchema.parse(req.body);
    const existing = await database_1.prisma.vehicle.findUnique({
        where: { registrationNumber: data.registrationNumber },
    });
    if (existing) {
        throw new errorHandler_2.BusinessRuleError('Registration number already exists');
    }
    const vehicle = await database_1.prisma.vehicle.create({
        data: {
            ...data,
            createdById: req.session.userId,
        },
        include: {
            createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    res.status(201).json({ vehicle });
});
exports.updateVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.updateVehicleSchema.parse(req.body);
    const existing = await database_1.prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) {
        return res.status(404).json({ error: 'Vehicle not found' });
    }
    if (data.registrationNumber && data.registrationNumber !== existing.registrationNumber) {
        const duplicate = await database_1.prisma.vehicle.findUnique({
            where: { registrationNumber: data.registrationNumber },
        });
        if (duplicate) {
            throw new errorHandler_2.BusinessRuleError('Registration number already exists');
        }
    }
    const vehicle = await database_1.prisma.vehicle.update({
        where: { id: req.params.id },
        data: { ...data, updatedById: req.session.userId },
        include: {
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            updatedBy: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    res.json({ vehicle });
});
exports.deleteVehicle = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const vehicle = await database_1.prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
    }
    if (vehicle.status === enums_1.VehicleStatus.ON_TRIP) {
        throw new errorHandler_2.BusinessRuleError('Cannot retire vehicle that is on a trip');
    }
    await database_1.prisma.vehicle.update({
        where: { id: req.params.id },
        data: { status: enums_1.VehicleStatus.RETIRED, updatedById: req.session.userId },
    });
    res.json({ success: true });
});
exports.getAvailableForDispatch = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { cargoWeightKg } = schemas_1.availableVehiclesSchema.parse(req.query);
    const where = {
        status: enums_1.VehicleStatus.AVAILABLE,
    };
    if (cargoWeightKg) {
        where.maxLoadCapacityKg = { gte: cargoWeightKg };
    }
    const vehicles = await database_1.prisma.vehicle.findMany({
        where,
        select: {
            id: true,
            registrationNumber: true,
            name: true,
            type: true,
            maxLoadCapacityKg: true,
            odometerKm: true,
        },
        orderBy: { registrationNumber: 'asc' },
    });
    res.json({ vehicles });
});
