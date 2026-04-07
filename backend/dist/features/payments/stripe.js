"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeConfig = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error("Missing required environment variable STRIPE_SECRET_KEY");
}
exports.stripe = new stripe_1.default(stripeSecretKey, {
    apiVersion: "2022-11-15",
});
exports.stripeConfig = {
    currency: process.env.STRIPE_CURRENCY ?? "brl",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};
//# sourceMappingURL=stripe.js.map