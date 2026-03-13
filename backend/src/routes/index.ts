import { Router } from "express";
import { register, login } from "../controllers/authController";
import {
  listChurrasqueiros,
  getChurrasqueiro,
  createChurrasqueiro,
} from "../controllers/churrasqueirosController";
import { getAdminMenu } from "../controllers/adminController";
import {
  createBooking,
  listAllBookingsAdmin,
  listMyBookings,
} from "../controllers/bookingController";
import { payBooking } from "../controllers/paymentController";
import {
  createReview,
  listReviewsForChurrasqueiro,
} from "../controllers/reviewController";
import { authMiddleware, requireAdmin } from "../middlewares/auth";

export const router = Router();

router.get("/health", (_req, res) => {
  return res.json({ status: "ok" });
});

router.post("/register", register);
router.post("/login", login);

router.get("/churrasqueiros", listChurrasqueiros);
router.get("/churrasqueiros/:id", getChurrasqueiro);
router.post(
  "/churrasqueiros",
  authMiddleware,
  requireAdmin,
  createChurrasqueiro,
);

router.get("/churrasqueiros/:id/reviews", listReviewsForChurrasqueiro);
router.post("/churrasqueiros/:id/reviews", authMiddleware, createReview);

router.post("/agendamentos", authMiddleware, createBooking);
router.get("/agendamentos", authMiddleware, listMyBookings);
router.get(
  "/admin/agendamentos",
  authMiddleware,
  requireAdmin,
  listAllBookingsAdmin,
);

router.post("/pagamentos/:bookingId", authMiddleware, payBooking);

router.get("/admin/menu", authMiddleware, requireAdmin, getAdminMenu);
