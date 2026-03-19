import type { Response } from "express";
import { z } from "zod";
import { stripe, stripeConfig } from "../features/payments/stripe";
import { Booking } from "../models/bookings/Booking";
import { Payment } from "../models/payments/Payment";
import type { AuthenticatedRequest } from "../middlewares/auth";

const payBookingSchema = z.object({
  token: z.string().min(1),
});

export async function payBooking(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const bookingId = Number(req.params.bookingId);
  if (Number.isNaN(bookingId)) {
    return res.status(400).json({ message: "bookingId inválido" });
  }

  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    return res.status(404).json({ message: "Agendamento não encontrado" });
  }

  if (booking.userId !== req.user.sub && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Você não pode pagar este agendamento" });
  }

  const idempotencyKey =
    req.header("Idempotency-Key") ?? req.header("idempotency-key");
  if (!idempotencyKey) {
    return res
      .status(400)
      .json({ message: "Idempotency-Key é obrigatório no cabeçalho" });
  }

  const parseResult = payBookingSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      message: "Requisição inválida",
      errors: parseResult.error.errors,
    });
  }

  const { token } = parseResult.data;

  const alreadyPaid = await Payment.findOne({
    where: { bookingId, status: "paid" },
  });
  if (alreadyPaid) {
    return res.status(400).json({ message: "Agendamento já está pago" });
  }

  const existingPayment = await Payment.findOne({ where: { idempotencyKey } });
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
  const currency = stripeConfig.currency;

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency,
        payment_method: token,
        confirmation_method: "automatic",
        confirm: true,
        metadata: {
          bookingId: String(bookingId),
        },
      },
      {
        idempotencyKey,
      },
    );
  } catch (error: unknown) {
    console.error("Stripe payment creation failed", error);
    return res
      .status(502)
      .json({ message: "Falha ao criar pagamento no gateway" });
  }

  const payment = await Payment.create({
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
