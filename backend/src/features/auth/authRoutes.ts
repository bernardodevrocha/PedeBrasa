import { Router } from "express";
import { login, register } from "./authController";
import { asyncHandler } from "../../utils/asyncHandler";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(register));
authRouter.post("/login", asyncHandler(login));
