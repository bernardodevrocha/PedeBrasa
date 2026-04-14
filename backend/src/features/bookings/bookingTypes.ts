export interface CreateBookingPayload {
  churrasqueiroId?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  partnerId?: number | null;
  partnerCouponCode?: string | null;
  selectedCuts?: string[] | null;
}

export interface BookingTimeWindow {
  startDateTime: Date;
  endDateTime: Date;
  durationInHours: number;
}

export interface BookingTimeWindowResult {
  window: BookingTimeWindow | null;
  error: "invalid_date" | "invalid_time" | "invalid_range" | null;
}
