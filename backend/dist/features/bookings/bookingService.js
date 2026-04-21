"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCreateBookingPayload = parseCreateBookingPayload;
exports.parseReviewBookingPayload = parseReviewBookingPayload;
exports.normalizeSelectedCuts = normalizeSelectedCuts;
exports.normalizeGuestCount = normalizeGuestCount;
exports.calculateCutsAmount = calculateCutsAmount;
exports.parseBookingTimeWindow = parseBookingTimeWindow;
exports.getBookingTimeWindowErrorMessage = getBookingTimeWindowErrorMessage;
exports.isPastBookingDate = isPastBookingDate;
exports.validatePartnerSelection = validatePartnerSelection;
exports.findBookingConflict = findBookingConflict;
const sequelize_1 = require("sequelize");
const Booking_1 = require("../../models/bookings/Booking");
const ChurrasqueiroParceiro_1 = require("../../models/parceiros/ChurrasqueiroParceiro");
const Parceiro_1 = require("../../models/parceiros/Parceiro");
const CUT_PRICE_PER_PERSON = {
    Picanha: 32,
    Fraldinha: 24,
    Costela: 22,
    "Linguica artesanal": 14,
    Ancho: 30,
    "Pao de alho": 8,
};
function parseCreateBookingPayload(body) {
    return body;
}
function parseReviewBookingPayload(body) {
    return body;
}
function normalizeSelectedCuts(selectedCuts) {
    return Array.isArray(selectedCuts)
        ? Array.from(new Set(selectedCuts
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter(Boolean)))
        : [];
}
function normalizeGuestCount(guestCount) {
    if (!Number.isFinite(guestCount)) {
        return 0;
    }
    return Math.max(0, Math.floor(Number(guestCount)));
}
function calculateCutsAmount(guestCount, selectedCuts) {
    const validGuestCount = normalizeGuestCount(guestCount);
    const cutPrices = selectedCuts
        .map((cut) => CUT_PRICE_PER_PERSON[cut] ?? 0)
        .filter((price) => price > 0);
    if (validGuestCount === 0 || cutPrices.length === 0) {
        return 0;
    }
    const averageCutPrice = cutPrices.reduce((total, price) => total + price, 0) / cutPrices.length;
    return Number((validGuestCount * averageCutPrice).toFixed(2));
}
function normalizeCouponCode(value) {
    return typeof value === "string" && value.trim()
        ? value.trim().toUpperCase()
        : null;
}
function parseBookingTimeWindow(date, startTime, endTime) {
    const bookingDate = new Date(date);
    if (Number.isNaN(bookingDate.getTime())) {
        return { window: null, error: "invalid_date" };
    }
    const startParts = startTime.split(":");
    const endParts = endTime.split(":");
    const startHour = Number(startParts[0] ?? Number.NaN);
    const startMinute = Number(startParts[1] ?? Number.NaN);
    const endHour = Number(endParts[0] ?? Number.NaN);
    const endMinute = Number(endParts[1] ?? Number.NaN);
    if (Number.isNaN(startHour) ||
        Number.isNaN(startMinute) ||
        Number.isNaN(endHour) ||
        Number.isNaN(endMinute)) {
        return { window: null, error: "invalid_time" };
    }
    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    const endDateTime = new Date(bookingDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);
    if (endDateTime <= startDateTime) {
        return { window: null, error: "invalid_range" };
    }
    return {
        window: {
            startDateTime,
            endDateTime,
            durationInHours: (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60),
        },
        error: null,
    };
}
function getBookingTimeWindowErrorMessage(error) {
    switch (error) {
        case "invalid_time":
            return "Horario invalido";
        case "invalid_range":
            return "Horario final deve ser maior que o horario inicial";
        case "invalid_date":
        default:
            return "Data invalida";
    }
}
function isPastBookingDate(date) {
    const bookingDate = new Date(date);
    if (Number.isNaN(bookingDate.getTime())) {
        return false;
    }
    const today = new Date();
    return bookingDate < new Date(today.toDateString());
}
async function validatePartnerSelection(churrasqueiroId, partnerId, partnerCouponCode) {
    if (partnerId == null) {
        return null;
    }
    const partner = await Parceiro_1.Parceiro.findByPk(partnerId);
    if (!partner) {
        return { error: "Parceiro nao encontrado", status: 404 };
    }
    const recommendation = await ChurrasqueiroParceiro_1.ChurrasqueiroParceiro.findOne({
        where: {
            parceiroId: partnerId,
            churrasqueiroId,
        },
    });
    if (!recommendation) {
        return {
            error: "Este parceiro nao esta vinculado ao churrasqueiro selecionado",
            status: 400,
        };
    }
    const normalizedCoupon = normalizeCouponCode(partnerCouponCode);
    if (!normalizedCoupon) {
        return {
            error: "Informe o codigo do parceiro para seguir com o agendamento",
            status: 400,
        };
    }
    if (partner.couponCode.toUpperCase() !== normalizedCoupon) {
        return {
            error: "Codigo do parceiro invalido para este agendamento",
            status: 400,
        };
    }
    return {
        partner,
        normalizedCoupon,
    };
}
function convertTimeToMinutes(value) {
    const [hoursPart, minutesPart] = value.split(":");
    const hours = Number(hoursPart ?? Number.NaN);
    const minutes = Number(minutesPart ?? Number.NaN);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return Number.NaN;
    }
    return hours * 60 + minutes;
}
async function findBookingConflict(churrasqueiroId, date, startTime, endTime) {
    const requestedStartMinutes = convertTimeToMinutes(startTime);
    const requestedEndMinutes = convertTimeToMinutes(endTime);
    if (Number.isNaN(requestedStartMinutes) ||
        Number.isNaN(requestedEndMinutes)) {
        return null;
    }
    const sameDayBookings = await Booking_1.Booking.findAll({
        where: {
            churrasqueiroId,
            date,
            status: {
                [sequelize_1.Op.notIn]: ["RECUSADO", "CANCELADO"],
            },
        },
    });
    return sameDayBookings.find((booking) => {
        const existingStartMinutes = convertTimeToMinutes(booking.startTime);
        const existingEndMinutes = convertTimeToMinutes(booking.endTime);
        if (Number.isNaN(existingStartMinutes) ||
            Number.isNaN(existingEndMinutes)) {
            return false;
        }
        return (requestedStartMinutes < existingEndMinutes &&
            requestedEndMinutes > existingStartMinutes);
    });
}
//# sourceMappingURL=bookingService.js.map