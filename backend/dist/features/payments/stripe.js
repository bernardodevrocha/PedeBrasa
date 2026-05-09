"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeConfig = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
exports.stripe = stripeSecretKey
    ? new stripe_1.default(stripeSecretKey, {
        apiVersion: "2022-11-15",
    })
    : null;
exports.stripeConfig = {
    isConfigured: Boolean(stripeSecretKey),
    currency: process.env.STRIPE_CURRENCY ?? "brl",
    frontendUrl: process.env.FRONTEND_URL,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};
//# sourceMappingURL=stripe.js.map