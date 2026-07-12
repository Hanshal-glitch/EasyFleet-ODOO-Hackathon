"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehicleOperationalCost = exports.createExpense = exports.listExpenses = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const errorHandler_2 = require("../middleware/errorHandler");
const schemas_1 = require("@transport-ops/shared/schemas");
const enums_1 = require("@transport-ops/shared/enums");
exports.listExpenses = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = schemas_1.expenseFiltersSchema.parse(req.query);
    const { page, limit, sort, order, ...where } = filters;
    const whereClause = {};
    if (where.vehicleId)
        whereClause.vehicleId = where.vehicleId;
    if (where.type)
        whereClause.type = where.type;
    if (where.dateFrom || where.dateTo) {
        whereClause.date = {};
        if (where.dateFrom)
            whereClause.date.gte = new Date(where.dateFrom);
        if (where.dateTo)
            whereClause.date.lte = new Date(where.dateTo);
    }
    const [expenses, total] = await Promise.all([
        database_1.prisma.expense.findMany({
            where: whereClause,
            orderBy: sort ? { [sort]: order || 'desc' } : { date: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                vehicle: { select: { id: true, registrationNumber: true, name: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true } },
            },
        }),
        database_1.prisma.expense.count({ where: whereClause }),
    ]);
    res.json({
        data: expenses,
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
exports.createExpense = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = schemas_1.createExpenseSchema.parse(req.body);
    const vehicle = await database_1.prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) {
        throw new errorHandler_2.BusinessRuleError('Vehicle not found');
    }
    const expense = await database_1.prisma.expense.create({
        data: {
            ...data,
            date: new Date(data.date),
            createdById: req.session.userId,
        },
        include: {
            vehicle: { select: { id: true, registrationNumber: true, name: true } },
            createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
    });
    res.status(201).json({ expense });
});
exports.getVehicleOperationalCost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { vehicleId } = req.params;
    const { dateFrom, dateTo } = req.query;
    const where = { vehicleId };
    if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom)
            where.date.gte = new Date(dateFrom);
        if (dateTo)
            where.date.lte = new Date(dateTo);
    }
    const [fuelLogs, expenses] = await Promise.all([
        database_1.prisma.fuelLog.findMany({ where: { vehicleId, ...(dateFrom || dateTo ? { date: where.date } : {}) }, select: { totalCost: true } }),
        database_1.prisma.expense.findMany({ where: { vehicleId, type: { not: enums_1.ExpenseType.FUEL }, ...(dateFrom || dateTo ? { date: where.date } : {}) }, select: { amount: true } }),
    ]);
    const fuelCost = fuelLogs.reduce((sum, log) => sum + log.totalCost, 0);
    const maintenanceCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    res.json({
        vehicleId,
        fuelCost,
        maintenanceCost,
        totalCost: fuelCost + maintenanceCost,
    });
});
