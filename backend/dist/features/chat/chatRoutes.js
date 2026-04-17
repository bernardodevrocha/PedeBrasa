"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const chatController_1 = require("./chatController");
const messageLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 45,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Muitas mensagens enviadas em pouco tempo" },
});
exports.chatRouter = (0, express_1.Router)();
exports.chatRouter.use(auth_1.authMiddleware);
exports.chatRouter.get("/chat/contacts", (0, asyncHandler_1.asyncHandler)(chatController_1.listContacts));
exports.chatRouter.get("/chat/conversations", (0, asyncHandler_1.asyncHandler)(chatController_1.listConversations));
exports.chatRouter.post("/chat/conversations", (0, asyncHandler_1.asyncHandler)(chatController_1.createConversation));
exports.chatRouter.get("/chat/conversations/:id/messages", (0, asyncHandler_1.asyncHandler)(chatController_1.listMessages));
exports.chatRouter.post("/chat/conversations/:id/messages", messageLimiter, (0, asyncHandler_1.asyncHandler)(chatController_1.createMessage));
//# sourceMappingURL=chatRoutes.js.map