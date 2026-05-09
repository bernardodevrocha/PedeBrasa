import "dotenv/config";
import express from "express";
import http from "http";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { sequelize } from "./db/sequelize";
import { router } from "./routes";
import { initChatSocket } from "./features/chat/chatSocket";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ||
      (process.env.NODE_ENV === "development" ? "*" : undefined),
  }),
);

app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || "1mb",
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get("/", (_req, res) => {
  return res.json({
    status: "ok",
    service: "PedeBrasa API",
    message:
      "API online. Acesse o frontend na porta configurada para o web app ou use /api/health para o healthcheck.",
    routes: {
      health: "/api/health",
      apiBase: "/api",
    },
  });
});

app.use("/api", router);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err instanceof SyntaxError) {
      return res.status(400).json({ message: "Error!" });
    }

    return next(err);
  },
);

app.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  },
);

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    initChatSocket(server);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void bootstrap();
