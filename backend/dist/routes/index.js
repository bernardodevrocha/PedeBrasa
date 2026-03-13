"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const churrasqueirosController_1 = require("../controllers/churrasqueirosController");
const adminController_1 = require("../controllers/adminController");
const bookingController_1 = require("../controllers/bookingController");
const paymentController_1 = require("../controllers/paymentController");
const reviewController_1 = require("../controllers/reviewController");
const auth_1 = require("../middlewares/auth");
exports.router = (0, express_1.Router)();
exports.router.get('/health', (_req, res) => {
    return res.json({ status: 'ok' });
});
exports.router.post('/register', authController_1.register);
exports.router.post('/login', authController_1.login);
exports.router.get('/churrasqueiros', churrasqueirosController_1.listChurrasqueiros);
exports.router.get('/churrasqueiros/:id', churrasqueirosController_1.getChurrasqueiro);
exports.router.post('/churrasqueiros', auth_1.authMiddleware, auth_1.requireAdmin, churrasqueirosController_1.createChurrasqueiro);
exports.router.get('/churrasqueiros/:id/reviews', reviewController_1.listReviewsForChurrasqueiro);
exports.router.post('/churrasqueiros/:id/reviews', auth_1.authMiddleware, reviewController_1.createReview);
exports.router.post('/agendamentos', auth_1.authMiddleware, bookingController_1.createBooking);
exports.router.get('/agendamentos', auth_1.authMiddleware, bookingController_1.listMyBookings);
exports.router.get('/admin/agendamentos', auth_1.authMiddleware, auth_1.requireAdmin, bookingController_1.listAllBookingsAdmin);
exports.router.post('/pagamentos/:bookingId', auth_1.authMiddleware, paymentController_1.payBooking);
exports.router.get('/admin/menu', auth_1.authMiddleware, auth_1.requireAdmin, adminController_1.getAdminMenu);
//# sourceMappingURL=index.js.map