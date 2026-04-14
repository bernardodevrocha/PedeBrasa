import { Op } from "sequelize";
import { Booking } from "../../models/bookings/Booking";
import { ChurrasqueiroParceiro } from "../../models/parceiros/ChurrasqueiroParceiro";
import { Parceiro } from "../../models/parceiros/Parceiro";
import type {
  BookingTimeWindowResult,
  CreateBookingPayload,
} from "./bookingTypes";

export function parseCreateBookingPayload(body: unknown): CreateBookingPayload {
  return body as CreateBookingPayload;
}

export function normalizeSelectedCuts(selectedCuts?: string[] | null) {
  return Array.isArray(selectedCuts)
    ? Array.from(
        new Set(
          selectedCuts
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter(Boolean),
        ),
      )
    : [];
}

function normalizeCouponCode(value?: string | null) {
  return typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : null;
}

export function parseBookingTimeWindow(
  date: string,
  startTime: string,
  endTime: string,
): BookingTimeWindowResult {
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

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
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
      durationInHours:
        (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60),
    },
    error: null,
  };
}

export function getBookingTimeWindowErrorMessage(
  error: BookingTimeWindowResult["error"],
) {
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

export function isPastBookingDate(date: string) {
  const bookingDate = new Date(date);
  if (Number.isNaN(bookingDate.getTime())) {
    return false;
  }

  const today = new Date();
  return bookingDate < new Date(today.toDateString());
}

export async function validatePartnerSelection(
  churrasqueiroId: number,
  partnerId?: number | null,
  partnerCouponCode?: string | null,
) {
  if (partnerId == null) {
    return null;
  }

  const partner = await Parceiro.findByPk(partnerId);
  if (!partner) {
    return { error: "Parceiro nao encontrado", status: 404 } as const;
  }

  const recommendation = await ChurrasqueiroParceiro.findOne({
    where: {
      parceiroId: partnerId,
      churrasqueiroId,
    },
  });

  if (!recommendation) {
    return {
      error: "Este parceiro nao esta vinculado ao churrasqueiro selecionado",
      status: 400,
    } as const;
  }

  const normalizedCoupon = normalizeCouponCode(partnerCouponCode);
  if (!normalizedCoupon) {
    return {
      error: "Informe o codigo do parceiro para seguir com o agendamento",
      status: 400,
    } as const;
  }

  if (partner.couponCode.toUpperCase() !== normalizedCoupon) {
    return {
      error: "Codigo do parceiro invalido para este agendamento",
      status: 400,
    } as const;
  }

  return {
    partner,
    normalizedCoupon,
  } as const;
}

export async function findBookingConflict(churrasqueiroId: number, date: string) {
  return Booking.findOne({
    where: {
      churrasqueiroId,
      date,
      status: { [Op.ne]: "cancelled" },
    },
  });
}
