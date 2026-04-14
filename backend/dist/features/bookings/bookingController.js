"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = createBooking;
exports.listMyBookings = listMyBookings;
exports.listAllBookingsAdmin = listAllBookingsAdmin;
const Booking_1 = require("../../models/bookings/Booking");
const Churrasqueiro_1 = require("../../models/churrasqueiros/Churrasqueiro");
const bookingService_1 = require("./bookingService");
async function createBooking(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
    }
    const payload = (0, bookingService_1.parseCreateBookingPayload)(req.body);
    const { churrasqueiroId, date, startTime, endTime, notes, partnerId, partnerCouponCode, selectedCuts, } = payload;
    if (!churrasqueiroId || !date || !startTime || !endTime) {
        return res.status(400).json({
            message: "churrasqueiroId, date, startTime e endTime sao obrigatorios",
        });
    }
    const churrasqueiro = await Churrasqueiro_1.Churrasqueiro.findByPk(churrasqueiroId);
    if (!churrasqueiro) {
        return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
    }
    const partnerSelection = await (0, bookingService_1.validatePartnerSelection)(churrasqueiroId, partnerId, partnerCouponCode);
    if (partnerSelection?.error) {
        return res.status(partnerSelection.status).json({
            message: partnerSelection.error,
        });
    }
    const timeWindow = (0, bookingService_1.parseBookingTimeWindow)(date, startTime, endTime);
    if (!timeWindow.window) {
        return res.status(400).json({
            message: (0, bookingService_1.getBookingTimeWindowErrorMessage)(timeWindow.error),
        });
    }
    if ((0, bookingService_1.isPastBookingDate)(date)) {
        return res.status(400).json({
            message: "Nao e possivel agendar no passado",
        });
    }
    const conflict = await (0, bookingService_1.findBookingConflict)(churrasqueiroId, date);
    if (conflict) {
        return res.status(409).json({
            message: "Churrasqueiro ja possui agendamento nesta data",
        });
    }
    const normalizedCuts = (0, bookingService_1.normalizeSelectedCuts)(selectedCuts);
    const totalPrice = Number(churrasqueiro.pricePerHour) * timeWindow.window.durationInHours;
    const booking = await Booking_1.Booking.create({
        userId: req.user.sub,
        churrasqueiroId,
        date,
        startTime,
        endTime,
        partnerId: partnerSelection?.partner?.id ?? null,
        partnerName: partnerSelection?.partner?.name ?? null,
        partnerCouponCode: partnerSelection?.normalizedCoupon ?? null,
        selectedCuts: normalizedCuts.length > 0 ? JSON.stringify(normalizedCuts) : null,
        notes: notes ?? null,
        totalPrice,
        status: "pending",
    });
    return res.status(201).json(booking);
}
async function listMyBookings(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
    }
    const bookings = await Booking_1.Booking.findAll({
        where: { userId: req.user.sub },
        order: [["date", "DESC"]],
    });
    return res.json(bookings);
}
async function listAllBookingsAdmin(req, res) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Apenas admin" });
    }
    const bookings = await Booking_1.Booking.findAll({
        order: [["createdAt", "DESC"]],
    });
    return res.json(bookings);
}
//# sourceMappingURL=bookingController.js.map