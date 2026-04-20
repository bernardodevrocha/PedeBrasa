"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = createBooking;
exports.reviewBooking = reviewBooking;
exports.listMyChurrasqueiroBookings = listMyChurrasqueiroBookings;
exports.listMyBookings = listMyBookings;
exports.listAllBookingsAdmin = listAllBookingsAdmin;
const Booking_1 = require("../../models/bookings/Booking");
const Churrasqueiro_1 = require("../../models/churrasqueiros/Churrasqueiro");
const User_1 = require("../../models/auth/User");
const bookingService_1 = require("./bookingService");
const PLATFORM_FEE_RATE = 0.07;
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
    const serviceAmount = Number(churrasqueiro.pricePerHour) * timeWindow.window.durationInHours;
    const platformFeeAmount = Number((serviceAmount * PLATFORM_FEE_RATE).toFixed(2));
    const travelFee = 0;
    const estimatedPrice = Number((serviceAmount + platformFeeAmount + travelFee).toFixed(2));
    const booking = await Booking_1.Booking.create({
        userId: req.user.sub,
        churrasqueiroId,
        date,
        startTime,
        endTime,
        serviceAmount,
        platformFeeAmount,
        travelFee,
        estimatedPrice,
        approvedPrice: null,
        partnerId: partnerSelection?.partner?.id ?? null,
        partnerName: partnerSelection?.partner?.name ?? null,
        partnerCouponCode: partnerSelection?.normalizedCoupon ?? null,
        selectedCuts: normalizedCuts.length > 0 ? JSON.stringify(normalizedCuts) : null,
        notes: notes ?? null,
        totalPrice: estimatedPrice,
        status: "EM_ANALISE_CHURRASQUEIRO",
    });
    return res.status(201).json(booking);
}
async function reviewBooking(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
    }
    const bookingId = Number(req.params.bookingId);
    if (Number.isNaN(bookingId)) {
        return res.status(400).json({ message: "bookingId invalido" });
    }
    const booking = await Booking_1.Booking.findByPk(bookingId);
    if (!booking) {
        return res.status(404).json({ message: "Agendamento nao encontrado" });
    }
    const churrasqueiro = await Churrasqueiro_1.Churrasqueiro.findByPk(booking.churrasqueiroId);
    if (!churrasqueiro) {
        return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
    }
    if (req.user.role !== "churrasqueiro" || churrasqueiro.userId !== req.user.sub) {
        return res.status(403).json({
            message: "Voce nao pode analisar este agendamento",
        });
    }
    if (booking.status === "PAGO") {
        return res.status(400).json({
            message: "Um agendamento pago nao pode mais ser reavaliado",
        });
    }
    if (booking.status === "RECUSADO" || booking.status === "CANCELADO") {
        return res.status(400).json({
            message: "Este agendamento nao esta disponivel para analise",
        });
    }
    const payload = (0, bookingService_1.parseReviewBookingPayload)(req.body);
    if (!payload.action || !["approve", "adjust", "reject"].includes(payload.action)) {
        return res.status(400).json({
            message: "action deve ser approve, adjust ou reject",
        });
    }
    if (payload.action === "reject") {
        booking.approvedPrice = null;
        booking.status = "RECUSADO";
        await booking.save();
        return res.json(booking);
    }
    const estimatedPrice = Number(booking.estimatedPrice);
    const approvedPrice = typeof payload.approvedPrice === "number"
        ? Number(payload.approvedPrice.toFixed(2))
        : estimatedPrice;
    if (approvedPrice <= 0) {
        return res.status(400).json({
            message: "approvedPrice deve ser maior que zero",
        });
    }
    booking.approvedPrice = approvedPrice;
    booking.totalPrice = approvedPrice;
    booking.status =
        payload.action === "adjust"
            ? "AJUSTADO_PELO_CHURRASQUEIRO"
            : "APROVADO_PARA_PAGAMENTO";
    await booking.save();
    return res.json(booking);
}
async function listMyChurrasqueiroBookings(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
    }
    if (req.user.role !== "churrasqueiro") {
        return res.status(403).json({
            message: "Apenas o churrasqueiro responsavel pode acessar estas solicitacoes",
        });
    }
    const churrasqueiro = await Churrasqueiro_1.Churrasqueiro.findOne({
        where: { userId: req.user.sub },
        order: [["id", "ASC"]],
    });
    if (!churrasqueiro) {
        return res.status(404).json({
            message: "Perfil de churrasqueiro nao encontrado",
        });
    }
    const bookings = await Booking_1.Booking.findAll({
        where: { churrasqueiroId: churrasqueiro.id },
        order: [
            ["date", "ASC"],
            ["startTime", "ASC"],
            ["createdAt", "DESC"],
        ],
    });
    const customerIds = Array.from(new Set(bookings.map((booking) => booking.userId)));
    const customers = customerIds.length
        ? await User_1.User.findAll({
            where: { id: customerIds },
            attributes: ["id", "name", "email"],
        })
        : [];
    const customerById = new Map(customers.map((customer) => [customer.id, customer.get({ plain: true })]));
    return res.json(bookings.map((booking) => ({
        ...booking.get({ plain: true }),
        customer: customerById.get(booking.userId) ?? null,
    })));
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