"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const paymentController_1 = require("./paymentController");
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
exports.paymentRouter = (0, express_1.Router)();
exports.paymentRouter.post("/pagamentos/:bookingId", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(paymentController_1.payBooking));
//# sourceMappingURL=paymentRoutes.js.map