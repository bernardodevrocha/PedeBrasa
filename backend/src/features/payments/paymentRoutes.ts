import { Router } from "express";
import { payBooking } from "./paymentController";
import { authMiddleware } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";

export const paymentRouter = Router();

paymentRouter.post(
  "/pagamentos/:bookingId",
  authMiddleware,
  asyncHandler(payBooking),
);
