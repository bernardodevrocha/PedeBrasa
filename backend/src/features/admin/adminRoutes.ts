import { Router } from "express";
import { getAdminMenu } from "./adminController";
import { authMiddleware, requireAdmin } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";

export const adminRouter = Router();

adminRouter.get(
  "/admin/menu",
  authMiddleware,
  requireAdmin,
  asyncHandler(getAdminMenu),
);
