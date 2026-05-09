import { Router } from "express";
import { authRouter } from "../features/auth/authRoutes";
import { churrasqueirosRouter } from "../features/churrasqueiros/churrasqueirosRoutes";
import { bookingRouter } from "../features/bookings/bookingRoutes";
import { adminRouter } from "../features/admin/adminRoutes";
import { parceirosRouter } from "../features/parceiros/parceirosRoutes";
import { blogRouter } from "../features/blog/blogRoutes";
import { chatRouter } from "../features/chat/chatRoutes";

export const router = Router();

router.get("/health", (_req, res) => {
  return res.json({ status: "ok" });
});

router.use(authRouter);
router.use(churrasqueirosRouter);
router.use(bookingRouter);
router.use(adminRouter);
router.use(parceirosRouter);
router.use(blogRouter);
router.use(chatRouter);
