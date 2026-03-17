"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payBooking = payBooking;
const zod_1 = require("zod");
const stripe_1 = require("../services/stripe");
const Booking_1 = require("../models/Booking");
const Payment_1 = require("../models/Payment");
const payBookingSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
});
async function payBooking(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Não autenticado" });
    }
    const bookingId = Number(req.params.bookingId);
    if (Number.isNaN(bookingId)) {
        return res.status(400).json({ message: "bookingId inválido" });
    }
    const booking = await Booking_1.Booking.findByPk(bookingId);
    if (!booking) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
    }
    if (booking.userId !== req.user.sub && req.user.role !== "admin") {
        return res
            .status(403)
            .json({ message: "Você não pode pagar este agendamento" });
    }
    const idempotencyKey = req.header("Idempotency-Key") ?? req.header("idempotency-key");
    if (!idempotencyKey) {
        return res
            .status(400)
            .json({ message: "Idempotency-Key é obrigatório no cabeçalho" });
    }
    const parseResult = payBookingSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res
            .status(400)
            .json({
            message: "Requisição inválida",
            errors: parseResult.error.errors,
        });
    }
    const { token } = parseResult.data;
    const existingPayment = await Payment_1.Payment.findOne({ where: { idempotencyKey } });
    if (existingPayment) {
        if (existingPayment.bookingId !== bookingId) {
            return res
                .status(409)
                .json({ message: "Idempotency-Key já usada para outro agendamento" });
        }
        return res.json({
            booking,
            payment: existingPayment,
            clientSecret: existingPayment.stripeClientSecret,
        });
    }
    const amountInCents = Math.round(Number(booking.totalPrice) * 100);
    const currency = stripe_1.stripeConfig.currency;
    let paymentIntent;
    try {
        paymentIntent = await stripe_1.stripe.paymentIntents.create({
            amount: amountInCents,
            currency,
            payment_method: token,
            confirmation_method: "automatic",
            confirm: true,
            metadata: {
                bookingId: String(bookingId),
            },
        }, {
            idempotencyKey,
        });
    }
    catch (error) {
        console.error("Stripe payment creation failed", error);
        return res
            .status(502)
            .json({ message: "Falha ao criar pagamento no gateway" });
    }
    const payment = await Payment_1.Payment.create({
        bookingId,
        amount: booking.totalPrice,
        status: paymentIntent.status === "succeeded" ? "paid" : "pending",
        provider: "stripe",
        transactionId: paymentIntent.id,
        idempotencyKey,
        stripeClientSecret: paymentIntent.client_secret ?? null,
    });
    if (paymentIntent.status === "succeeded") {
        booking.status = "confirmed";
        await booking.save();
    }
    return res.json({
        booking,
        payment,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
    });
}
//# sourceMappingURL=paymentController.js.map