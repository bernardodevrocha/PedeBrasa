"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payBooking = payBooking;
const Booking_1 = require("../models/Booking");
const Payment_1 = require("../models/Payment");
async function payBooking(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
    }
    const bookingId = Number(req.params.bookingId);
    if (Number.isNaN(bookingId)) {
        return res.status(400).json({ message: 'bookingId inválido' });
    }
    const booking = await Booking_1.Booking.findByPk(bookingId);
    if (!booking) {
        return res.status(404).json({ message: 'Agendamento não encontrado' });
    }
    if (booking.userId !== req.user.sub && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Você não pode pagar este agendamento' });
    }
    const existingPayment = await Payment_1.Payment.findOne({ where: { bookingId } });
    if (existingPayment && existingPayment.status === 'paid') {
        return res.status(400).json({ message: 'Agendamento já está pago' });
    }
    const amount = booking.totalPrice;
    const payment = existingPayment ??
        (await Payment_1.Payment.create({
            bookingId,
            amount,
            status: 'pending',
            provider: 'manual',
            transactionId: null,
        }));
    payment.status = 'paid';
    await payment.save();
    booking.status = 'confirmed';
    await booking.save();
    return res.json({ booking, payment });
}
//# sourceMappingURL=paymentController.js.map