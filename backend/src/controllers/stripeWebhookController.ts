import type { Request, Response } from "express";
import Stripe from "stripe";
import { stripe, stripeConfig } from "../features/payments/stripe";
import { Booking } from "../models/bookings/Booking";
import { Payment } from "../models/payments/Payment";

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig) {
    return res.status(400).json({ message: "Missing Stripe signature" });
  }

  const webhookSecret = stripeConfig.webhookSecret;
  if (!webhookSecret) {
    console.error(
      "Stripe webhook secret (STRIPE_WEBHOOK_SECRET) is not configured",
    );
    return res.status(500).json({ message: "Webhook configuration error" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error: unknown) {
    console.error("Stripe webhook signature validation failed", error);
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = Number(paymentIntent.metadata?.bookingId ?? NaN);
        if (Number.isNaN(bookingId)) {
          console.warn("Webhook received without bookingId metadata");
          break;
        }

        const payment = await Payment.findOne({
          where: { transactionId: paymentIntent.id },
        });
        if (!payment) {
          console.warn(
            "Webhook received for unknown payment intent",
            paymentIntent.id,
          );
          break;
        }

        payment.status = "paid";
        await payment.save();

        const booking = await Booking.findByPk(bookingId);
        if (booking) {
          booking.status = "confirmed";
          await booking.save();
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const payment = await Payment.findOne({
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
  } catch (error) {
    console.error("Error processing Stripe webhook", error);
    return res.status(500).json({ message: "Webhook processing error" });
  }

  return res.json({ received: true });
}
