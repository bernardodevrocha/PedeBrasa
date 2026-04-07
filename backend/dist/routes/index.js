"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const authRoutes_1 = require("../features/auth/authRoutes");
const churrasqueirosRoutes_1 = require("../features/churrasqueiros/churrasqueirosRoutes");
const bookingRoutes_1 = require("../features/bookings/bookingRoutes");
const paymentRoutes_1 = require("../features/payments/paymentRoutes");
const adminRoutes_1 = require("../features/admin/adminRoutes");
exports.router = (0, express_1.Router)();
exports.router.get("/health", (_req, res) => {
    return res.json({ status: "ok" });
});
exports.router.use(authRoutes_1.authRouter);
exports.router.use(churrasqueirosRoutes_1.churrasqueirosRouter);
exports.router.use(bookingRoutes_1.bookingRouter);
exports.router.use(paymentRoutes_1.paymentRouter);
exports.router.use(adminRoutes_1.adminRouter);
//# sourceMappingURL=index.js.map