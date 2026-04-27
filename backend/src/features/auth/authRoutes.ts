import { Router } from "express";
import { getMe, login, register } from "./authController";
import { authMiddleware } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(register));
authRouter.post("/login", asyncHandler(login));
authRouter.get("/me", authMiddleware, asyncHandler(getMe));
