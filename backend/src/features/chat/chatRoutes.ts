import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createConversation,
  createMessage,
  listContacts,
  listConversations,
  listMessages,
} from "./chatController";

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas mensagens enviadas em pouco tempo" },
});

export const chatRouter = Router();

chatRouter.use(authMiddleware);

chatRouter.get("/chat/contacts", asyncHandler(listContacts));
chatRouter.get("/chat/conversations", asyncHandler(listConversations));
chatRouter.post("/chat/conversations", asyncHandler(createConversation));
chatRouter.get("/chat/conversations/:id/messages", asyncHandler(listMessages));
chatRouter.post(
  "/chat/conversations/:id/messages",
  messageLimiter,
  asyncHandler(createMessage),
);
