"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = createBooking;
exports.listMyBookings = listMyBookings;
exports.listAllBookingsAdmin = listAllBookingsAdmin;
const sequelize_1 = require("sequelize");
const Booking_1 = require("../models/Booking");
const Churrasqueiro_1 = require("../models/Churrasqueiro");
async function createBooking(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Não autenticado" });
    }
    const { churrasqueiroId, date, startTime, endTime } = req.body;
    if (!churrasqueiroId || !date || !startTime || !endTime) {
        return res.status(400).json({
            message: "churrasqueiroId, date, startTime e endTime são obrigatórios",
        });
    }
    const churrasqueiro = await Churrasqueiro_1.Churrasqueiro.findByPk(churrasqueiroId);
    if (!churrasqueiro) {
        return res.status(404).json({ message: "Churrasqueiro não encontrado" });
    }
    const bookingDate = new Date(date);
    if (Number.isNaN(bookingDate.getTime())) {
        return res.status(400).json({ message: "Data inválida" });
    }
    const now = new Date();
    if (bookingDate < new Date(now.toDateString())) {
        return res
            .status(400)
            .json({ message: "Não é possível agendar no passado" });
    }
    const startParts = startTime.split(":");
    const endParts = endTime.split(":");
    const startHour = Number(startParts[0]);
    const startMinute = Number(startParts[1]);
    const endHour = Number(endParts[0]);
    const endMinute = Number(endParts[1]);
    if (Number.isNaN(startHour) ||
        Number.isNaN(startMinute) ||
        Number.isNaN(endHour) ||
        Number.isNaN(endMinute)) {
        return res.status(400).json({ message: "Horário inválido" });
    }
    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    const endDateTime = new Date(bookingDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);
    if (endDateTime <= startDateTime) {
        return res
            .status(400)
            .json({ message: "Horário final deve ser maior que o horário inicial" });
    }
    const durationInHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    const totalPrice = Number(churrasqueiro.pricePerHour) * durationInHours;
    const conflict = await Booking_1.Booking.findOne({
        where: {
            churrasqueiroId,
            date,
            status: { [sequelize_1.Op.ne]: "cancelled" },
        },
    });
    if (conflict) {
        return res
            .status(409)
            .json({ message: "Churrasqueiro já possui agendamento nesta data" });
    }
    const booking = await Booking_1.Booking.create({
        userId: req.user.sub,
        churrasqueiroId,
        date,
        startTime,
        endTime,
        totalPrice,
        status: "pending",
    });
    return res.status(201).json(booking);
}
async function listMyBookings(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Não autenticado" });
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