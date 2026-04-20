"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRouter = void 0;
const express_1 = require("express");
const bookingController_1 = require("./bookingController");
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
exports.bookingRouter = (0, express_1.Router)();
exports.bookingRouter.post("/agendamentos", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(bookingController_1.createBooking));
exports.bookingRouter.get("/agendamentos", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(bookingController_1.listMyBookings));
exports.bookingRouter.get("/churrasqueiros/me/agendamentos", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(bookingController_1.listMyChurrasqueiroBookings));
exports.bookingRouter.get("/admin/agendamentos", auth_1.authMiddleware, auth_1.requireAdmin, (0, asyncHandler_1.asyncHandler)(bookingController_1.listAllBookingsAdmin));
exports.bookingRouter.patch("/agendamentos/:bookingId/aprovacao", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(bookingController_1.reviewBooking));
//# sourceMappingURL=bookingRoutes.js.map