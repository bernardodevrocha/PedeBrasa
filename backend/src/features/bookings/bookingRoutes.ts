import { Router } from "express";
import {
  createBooking,
  listAllBookingsAdmin,
  listMyChurrasqueiroBookings,
  listMyBookings,
  reviewBooking,
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
  "/churrasqueiros/me/agendamentos",
  authMiddleware,
  asyncHandler(listMyChurrasqueiroBookings),
);
bookingRouter.get(
  "/admin/agendamentos",
  authMiddleware,
  requireAdmin,
  asyncHandler(listAllBookingsAdmin),
);
bookingRouter.patch(
  "/agendamentos/:bookingId/aprovacao",
  authMiddleware,
  asyncHandler(reviewBooking),
);
