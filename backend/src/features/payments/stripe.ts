import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2022-11-15",
    })
  : null;

export const stripeConfig = {
  isConfigured: Boolean(stripeSecretKey),
  currency: process.env.STRIPE_CURRENCY ?? "brl",
  frontendUrl: process.env.FRONTEND_URL,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};
