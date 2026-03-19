import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing required environment variable STRIPE_SECRET_KEY");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2022-11-15",
});

export const stripeConfig = {
  currency: process.env.STRIPE_CURRENCY ?? "brl",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};
