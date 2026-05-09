"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookHandler = stripeWebhookHandler;
const stripe_1 = require("./stripe");
const Booking_1 = require("../../models/bookings/Booking");
const Payment_1 = require("../../models/payments/Payment");
async function stripeWebhookHandler(req, res) {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        return res.status(400).json({ message: "Missing Stripe signature" });
    }
    const webhookSecret = stripe_1.stripeConfig.webhookSecret;
    if (!stripe_1.stripe || !webhookSecret) {
        console.error("Stripe webhook is not configured");
        return res.status(410).json({ message: "Stripe removido desta versao" });
    }
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (error) {
        console.error("Stripe webhook signature validation failed", error);
        return res.status(400).json({ message: "Invalid webhook signature" });
    }
    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const bookingId = Number(session.metadata?.bookingId ?? NaN);
                if (Number.isNaN(bookingId)) {
                    console.warn("Webhook received without bookingId metadata");
                    break;
                }
                const payment = await Payment_1.Payment.findOne({
                    where: { transactionId: session.id },
                });
                if (!payment) {
                    console.warn("Webhook received for unknown checkout session", session.id);
                    break;
                }
                payment.status = "paid";
                await payment.save();
                const booking = await Booking_1.Booking.findByPk(bookingId);
                if (booking) {
                    booking.status = "PAGO";
                    await booking.save();
                }
                break;
            }
            case "checkout.session.expired":
            case "checkout.session.async_payment_failed": {
                const session = event.data.object;
                const payment = await Payment_1.Payment.findOne({
                    where: { transactionId: session.id },
                });
                if (payment) {
                    payment.status = "failed";
                    await payment.save();
                }
                break;
            }
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const bookingId = Number(paymentIntent.metadata?.bookingId ?? NaN);
                if (Number.isNaN(bookingId)) {
                    console.warn("Webhook received without bookingId metadata");
                    break;
                }
                const payment = await Payment_1.Payment.findOne({
                    where: { transactionId: paymentIntent.id },
                });
                if (!payment) {
                    console.warn("Webhook received for unknown payment intent", paymentIntent.id);
                    break;
                }
                payment.status = "paid";
                await payment.save();
                const booking = await Booking_1.Booking.findByPk(bookingId);
                if (booking) {
                    booking.status = "PAGO";
                    await booking.save();
                }
                break;
            }
            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;
                const payment = await Payment_1.Payment.findOne({
                    where: { transactionId: paymentIntent.id },
                });
                if (payment) {
                    payment.status = "failed";
                    await payment.save();
                }
                break;
            }
            default:
                // Ignore other event types
                break;
        }
    }
    catch (error) {
        console.error("Error processing Stripe webhook", error);
        return res.status(500).json({ message: "Webhook processing error" });
    }
    return res.json({ received: true });
}
//# sourceMappingURL=stripeWebhookController.js.map