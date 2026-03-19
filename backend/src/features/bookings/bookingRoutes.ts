import { Router } from "express";
import {
  createBooking,
  listAllBookingsAdmin,
  listMyBookings,
} from "./bookingController";
import { authMiddleware, requireAdmin } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";

export const bookingRouter = Router();

bookingRouter.post(
  "/agendamentos",
  authMiddleware,
  asyncHandler(createBooking),
);
bookingRouter.get(
  "/agendamentos",
  authMiddleware,
  asyncHandler(listMyBookings),
);
bookingRouter.get(
  "/admin/agendamentos",
  authMiddleware,
  requireAdmin,
  asyncHandler(listAllBookingsAdmin),
);
