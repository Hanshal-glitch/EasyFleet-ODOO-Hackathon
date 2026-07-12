"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableDrivers = exports.getAvailableVehicles = exports.getTripStats = exports.cancelTrip = exports.completeTrip = exports.dispatchTrip = exports.createTrip = exports.getTrip = exports.listTrips = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const errorHandler_2 = require("../middleware/errorHandler");
const schemas_1 = require("@transport-ops/shared/schemas");
const businessRulesService_1 = require("../services/businessRulesService");
const enums_1 = require("@transport-ops/shared/enums");
exports.listTrips = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = schemas_1.tripFiltersSchema.parse(req.query);
    const { page, limit, sort, order, ...where } = filters;
    const whereClause = {};
    if (where.status)
        whereClause.status = where.status;
    if (where.vehicleId)
        whereClause.vehicleId = where.vehicleId;
    if (where.driverId)
        whereClause.driverId = where.driverId;
    if (where.dateFrom || where.dateTo) {
        whereClause.createdAt = {};
        if (where.dateFrom)
            whereClause.createdAt.gte = new Date(where.dateFrom);
        if (where.dateTo)
            whereClause.createdAt.lte = new Date(where.dateTo);
    }
    const [trips, total] = await Promise.all([
        database_1.prisma.trip.findMany({
            where: whereClause,
            orderBy: sort ? { [sort]: order || 'desc' } : { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                vehicle: { select: { id: true, registrationNumber: true, name: true, type: true, maxLoadCapacityKg: true } },
                driver: { select: { id: true, name: true, licenseNumber: true, status: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                updatedBy: { select: { id: true, firstName: true, lastName: true } },
            },
        }),
        database_1.prisma.trip.count({ where: whereClause }),
    ]);
    res.json({
        data: trips,
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
exports.getTrip = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const trip = await database_1.prisma.trip.findUnique({
        where: { id: req.params.id },
        include: {
            vehicle: {
                select: {
                    id: true,
                    registrationNumber: true,
                    name: true,
                    type: true,
                    maxLoadCapacityKg: true,
                    odometerKm: true,
                    status: true,
                },
            },
            driver: {
                select: {
                    id: true,
                    name: true,
                    licenseNumber: true,
                    licenseCategory: true,
                    licenseExpiryDate: true,
                    safetyScore: true,
                    status: true,
                },
            },
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            updatedBy: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
    }
    res.json({ trip });
});
exports.createTrip = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.createTripSchema.parse(req.body);
    const vehicle = await database_1.prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle)
        throw new errorHandler_2.BusinessRuleError('Vehicle not found');
    const driver = await database_1.prisma.driver.findUnique({ where: { id: data.driverId } });
    if (!driver)
        throw new errorHandler_2.BusinessRuleError('Driver not found');
    await businessRulesService_1.BusinessRulesService.assertVehicleAvailable(data.vehicleId);
    await businessRulesService_1.BusinessRulesService.assertDriverEligible(data.driverId);
    businessRulesService_1.BusinessRulesService.assertCargoWeightValid(vehicle, data.cargoWeightKg);
    const trip = await database_1.prisma.trip.create({
        data: {
            ...data,
            createdById: req.session.userId,
            status: enums_1.TripStatus.DRAFT,
        },
        include: {
            vehicle: { select: { id: true, registrationNumber: true, name: true } },
            driver: { select: { id: true, name: true, licenseNumber: true } },
        },
    });
    res.status(201).json({ trip });
});
exports.dispatchTrip = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const trip = await businessRulesService_1.BusinessRulesService.dispatchTrip(req.params.id, req.session.userId);
    res.json({ trip });
});
exports.completeTrip = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.completeTripSchema.parse(req.body);
    const trip = await businessRulesService_1.BusinessRulesService.completeTrip(req.params.id, data, req.session.userId);
    res.json({ trip });
});
exports.cancelTrip = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.cancelTripSchema.parse(req.body);
    const trip = await businessRulesService_1.BusinessRulesService.cancelTrip(req.params.id, data.reason, req.session.userId);
    res.json({ trip });
});
exports.getTripStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { dateFrom, dateTo, vehicleType, region } = req.query;
    const where = {};
    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom)
            where.createdAt.gte = new Date(dateFrom);
        if (dateTo)
            where.createdAt.lte = new Date(dateTo);
    }
    const [activeTrips, pendingTrips, completedTrips, cancelledTrips, totalRevenue, totalDistance] = await Promise.all([
        database_1.prisma.trip.count({ where: { ...where, status: enums_1.TripStatus.DISPATCHED } }),
        database_1.prisma.trip.count({ where: { ...where, status: enums_1.TripStatus.DRAFT } }),
        database_1.prisma.trip.count({ where: { ...where, status: enums_1.TripStatus.COMPLETED } }),
        database_1.prisma.trip.count({ where: { ...where, status: enums_1.TripStatus.CANCELLED } }),
        database_1.prisma.trip.aggregate({
            where: { ...where, status: enums_1.TripStatus.COMPLETED },
            _sum: { revenue: true },
        }),
        database_1.prisma.trip.aggregate({
            where: { ...where, status: enums_1.TripStatus.COMPLETED },
            _sum: { actualDistanceKm: true },
        }),
    ]);
    res.json({
        activeTrips,
        pendingTrips,
        completedTrips,
        cancelledTrips,
        totalRevenue: totalRevenue._sum.revenue || 0,
        totalDistance: totalDistance._sum.actualDistanceKm || 0,
    });
});
exports.getAvailableVehicles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { cargoWeightKg } = schemas_1.availableVehiclesSchema.parse(req.query);
    const vehicles = await businessRulesService_1.BusinessRulesService.getAvailableVehiclesForDispatch(cargoWeightKg);
    res.json({ vehicles });
});
exports.getAvailableDrivers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const drivers = await businessRulesService_1.BusinessRulesService.getAvailableDriversForDispatch();
    res.json({ drivers });
});
