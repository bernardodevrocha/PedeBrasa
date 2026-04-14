import type { Response } from "express";
import { Booking } from "../../models/bookings/Booking";
import { Churrasqueiro } from "../../models/churrasqueiros/Churrasqueiro";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import {
  findBookingConflict,
  getBookingTimeWindowErrorMessage,
  isPastBookingDate,
  normalizeSelectedCuts,
  parseBookingTimeWindow,
  parseCreateBookingPayload,
  validatePartnerSelection,
} from "./bookingService";

export async function createBooking(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  const payload = parseCreateBookingPayload(req.body);
  const {
    churrasqueiroId,
    date,
    startTime,
    endTime,
    notes,
    partnerId,
    partnerCouponCode,
    selectedCuts,
  } = payload;

  if (!churrasqueiroId || !date || !startTime || !endTime) {
    return res.status(400).json({
      message: "churrasqueiroId, date, startTime e endTime sao obrigatorios",
    });
  }

  const churrasqueiro = await Churrasqueiro.findByPk(churrasqueiroId);
  if (!churrasqueiro) {
    return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
  }

  const partnerSelection = await validatePartnerSelection(
    churrasqueiroId,
    partnerId,
    partnerCouponCode,
  );
  if (partnerSelection?.error) {
    return res.status(partnerSelection.status).json({
      message: partnerSelection.error,
    });
  }

  const timeWindow = parseBookingTimeWindow(date, startTime, endTime);
  if (!timeWindow.window) {
    return res.status(400).json({
      message: getBookingTimeWindowErrorMessage(timeWindow.error),
    });
  }

  if (isPastBookingDate(date)) {
    return res.status(400).json({
      message: "Nao e possivel agendar no passado",
    });
  }

  const conflict = await findBookingConflict(churrasqueiroId, date);
  if (conflict) {
    return res.status(409).json({
      message: "Churrasqueiro ja possui agendamento nesta data",
    });
  }

  const normalizedCuts = normalizeSelectedCuts(selectedCuts);
  const totalPrice =
    Number(churrasqueiro.pricePerHour) * timeWindow.window.durationInHours;

  const booking = await Booking.create({
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

export async function listMyBookings(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  const bookings = await Booking.findAll({
    where: { userId: req.user.sub },
    order: [["date", "DESC"]],
  });

  return res.json(bookings);
}

export async function listAllBookingsAdmin(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Apenas admin" });
  }

  const bookings = await Booking.findAll({
    order: [["createdAt", "DESC"]],
  });

  return res.json(bookings);
}
