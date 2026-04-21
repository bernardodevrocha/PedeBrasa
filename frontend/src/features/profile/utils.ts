import { CUT_PRICE_PER_PERSON } from "./constants";

export const PLATFORM_FEE_RATE = 0.07;

export function formatCurrency(value: string | number) {
  const amount = Number(value);
  return Number.isNaN(amount)
    ? "R$ --"
    : amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
}

export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function buildCalendarDays(totalDays = 180) {
  const days: string[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let index = 0; index < totalDays; index += 1) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + index);
    days.push(nextDate.toISOString().slice(0, 10));
  }

  return days;
}

export function calculateEstimatedPrice(
  pricePerHour: string | number,
  startTime: string,
  endTime: string,
  guestCount: number,
  selectedCuts: string[],
) {
  if (!startTime || !endTime) {
    return 0;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  if (
    [startHour, startMinute, endHour, endMinute].some((item) =>
      Number.isNaN(item),
    )
  ) {
    return 0;
  }

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  if (endTotalMinutes <= startTotalMinutes) {
    return 0;
  }

  const hours = (endTotalMinutes - startTotalMinutes) / 60;
  const baseServiceAmount = Number(pricePerHour) * hours;
  const validGuestCount = Number.isFinite(guestCount)
    ? Math.max(0, Math.floor(guestCount))
    : 0;
  const cutPrices = selectedCuts
    .map((cut) => CUT_PRICE_PER_PERSON[cut] ?? 0)
    .filter((price) => price > 0);
  const averageCutPrice =
    cutPrices.length > 0
      ? cutPrices.reduce((total, price) => total + price, 0) / cutPrices.length
      : 0;
  const cutsAmount = validGuestCount * averageCutPrice;

  return Number((baseServiceAmount + cutsAmount).toFixed(2));
}

export function calculatePlatformFee(amount: number) {
  return Number((amount * PLATFORM_FEE_RATE).toFixed(2));
}

export function calculateEstimatedTotalPrice(
  pricePerHour: string | number,
  startTime: string,
  endTime: string,
  guestCount: number,
  selectedCuts: string[],
) {
  const serviceAmount = calculateEstimatedPrice(
    pricePerHour,
    startTime,
    endTime,
    guestCount,
    selectedCuts,
  );
  const platformFeeAmount = calculatePlatformFee(serviceAmount);

  return {
    serviceAmount,
    platformFeeAmount,
    totalPrice: Number((serviceAmount + platformFeeAmount).toFixed(2)),
  };
}
