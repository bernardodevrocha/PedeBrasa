"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const authController_1 = require("./authController");
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/register", (0, asyncHandler_1.asyncHandler)(authController_1.register));
exports.authRouter.post("/login", (0, asyncHandler_1.asyncHandler)(authController_1.login));
exports.authRouter.get("/me", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(authController_1.getMe));
//# sourceMappingURL=authRoutes.js.map