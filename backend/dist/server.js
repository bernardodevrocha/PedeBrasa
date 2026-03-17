"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const sequelize_1 = require("./db/sequelize");
const routes_1 = require("./routes");
const stripeWebhookController_1 = require("./controllers/stripeWebhookController");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ||
        (process.env.NODE_ENV === "development" ? "*" : undefined),
}));
// Stripe requires the raw body to validate webhook signatures.
app.post("/api/webhooks/stripe", express_1.default.raw({ type: "application/json", limit: process.env.JSON_BODY_LIMIT || "1mb" }), stripeWebhookController_1.stripeWebhookHandler);
app.use(express_1.default.json({
    limit: process.env.JSON_BODY_LIMIT || "1mb",
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use("/api", routes_1.router);
app.use(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
(err, _req, res, _next) => {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
});
const PORT = Number(process.env.PORT) || 3000;
async function bootstrap() {
    try {
        await sequelize_1.sequelize.authenticate();
        await sequelize_1.sequelize.sync({ alter: true });
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
}
void bootstrap();
//# sourceMappingURL=server.js.map