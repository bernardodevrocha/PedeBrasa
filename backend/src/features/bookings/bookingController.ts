import type { Response } from "express";
import { Booking } from "../../models/bookings/Booking";
import { Churrasqueiro } from "../../models/churrasqueiros/Churrasqueiro";
import { User } from "../../models/auth/User";
import { Payment } from "../../models/payments/Payment";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import {
  calculateCutsAmount,
  findBookingConflict,
  getBookingTimeWindowErrorMessage,
  isPastBookingDate,
  normalizeGuestCount,
  normalizeSelectedCuts,
  parseBookingTimeWindow,
  parseCreateBookingPayload,
  parseReviewBookingPayload,
  validatePartnerSelection,
} from "./bookingService";

const PLATFORM_FEE_RATE = 0.07;

async function serializeBookingsForChurrasqueiro(churrasqueiroId: number) {
  const bookings = await Booking.findAll({
    where: { churrasqueiroId },
    order: [
      ["date", "ASC"],
      ["startTime", "ASC"],
      ["createdAt", "DESC"],
    ],
  });

  const customerIds = Array.from(new Set(bookings.map((booking) => booking.userId)));
  const customers = customerIds.length
    ? await User.findAll({
        where: { id: customerIds },
        attributes: ["id", "name", "email"],
      })
    : [];
  const customerById = new Map(
    customers.map((customer) => [customer.id, customer.get({ plain: true })]),
  );

  const bookingIds = bookings.map((booking) => booking.id);
  const payments = bookingIds.length
    ? await Payment.findAll({
        where: { bookingId: bookingIds },
        order: [
          ["bookingId", "ASC"],
          ["createdAt", "DESC"],
        ],
      })
    : [];
  const latestPaymentByBookingId = new Map<number, Payment>();
  payments.forEach((payment) => {
    if (!latestPaymentByBookingId.has(payment.bookingId)) {
      latestPaymentByBookingId.set(payment.bookingId, payment);
    }
  });

  return bookings.map((booking) => ({
    ...booking.get({ plain: true }),
    customer: customerById.get(booking.userId) ?? null,
    payment: latestPaymentByBookingId.get(booking.id)?.get({ plain: true }) ?? null,
  }));
}

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
    guestCount,
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

  const conflict = await findBookingConflict(
    churrasqueiroId,
    date,
    startTime,
    endTime,
  );
  if (conflict) {
    return res.status(409).json({
      message: "Ja existe outro agendamento que conflita com esse horario",
    });
  }

  const normalizedCuts = normalizeSelectedCuts(selectedCuts);
  const normalizedGuestCount = normalizeGuestCount(guestCount);
  if (normalizedGuestCount <= 0) {
    return res.status(400).json({
      message: "guestCount deve ser maior que zero",
    });
  }

  const baseServiceAmount =
    Number(churrasqueiro.pricePerHour) * timeWindow.window.durationInHours;
  const cutsAmount = calculateCutsAmount(normalizedGuestCount, normalizedCuts);
  const serviceAmount = Number((baseServiceAmount + cutsAmount).toFixed(2));
  const platformFeeAmount = Number((serviceAmount * PLATFORM_FEE_RATE).toFixed(2));
  const travelFee = 0;
  const estimatedPrice = Number(
    (serviceAmount + platformFeeAmount + travelFee).toFixed(2),
  );

  const booking = await Booking.create({
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
    notes:
      [
        normalizedGuestCount > 0
          ? `Convidados estimados: ${normalizedGuestCount}`
          : "",
        notes ?? "",
      ]
        .filter(Boolean)
        .join("\n") || null,
    totalPrice: estimatedPrice,
    status: "EM_ANALISE_CHURRASQUEIRO",
  });

  return res.status(201).json(booking);
}

export async function reviewBooking(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  const bookingId = Number(req.params.bookingId);
  if (Number.isNaN(bookingId)) {
    return res.status(400).json({ message: "bookingId invalido" });
  }

  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    return res.status(404).json({ message: "Agendamento nao encontrado" });
  }

  const churrasqueiro = await Churrasqueiro.findByPk(booking.churrasqueiroId);
  if (!churrasqueiro) {
    return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
  }

  if (
    req.user.role !== "admin" &&
    (req.user.role !== "churrasqueiro" || churrasqueiro.userId !== req.user.sub)
  ) {
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

  const payload = parseReviewBookingPayload(req.body);
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
  const approvedPrice =
    typeof payload.approvedPrice === "number"
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

export async function listMyChurrasqueiroBookings(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  if (req.user.role !== "churrasqueiro" && req.user.role !== "admin") {
    return res.status(403).json({
      message: "Apenas admins e churrasqueiros podem acessar estas solicitacoes",
    });
  }

  const requestedChurrasqueiroId = Number(req.query.churrasqueiroId);
  const churrasqueiro =
    req.user.role === "admin" && Number.isInteger(requestedChurrasqueiroId)
      ? await Churrasqueiro.findByPk(requestedChurrasqueiroId)
      : await Churrasqueiro.findOne({
          where: { userId: req.user.sub },
          order: [["id", "ASC"]],
        });

  if (!churrasqueiro) {
    return res.status(404).json({
      message: "Perfil de churrasqueiro nao encontrado",
    });
  }

  return res.json(await serializeBookingsForChurrasqueiro(churrasqueiro.id));
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
