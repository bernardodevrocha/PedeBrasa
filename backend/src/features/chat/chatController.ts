import type { Response } from "express";
import { Op } from "sequelize";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { User } from "../../models/auth/User";
import { Conversation } from "../../models/chat/Conversation";
import { Message } from "../../models/chat/Message";
import { emitChatEvent } from "./chatSocket";

const DEFAULT_MESSAGE_LIMIT = 30;
const MAX_MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LENGTH = 2000;

function normalizeParticipantPair(
  firstUserId: number,
  secondUserId: number,
): [number, number] {
  return firstUserId < secondUserId
    ? [firstUserId, secondUserId]
    : [secondUserId, firstUserId];
}

function sanitizeMessageBody(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
  };
}

function getOtherParticipantId(conversation: Conversation, currentUserId: number) {
  return conversation.participantOneId === currentUserId
    ? conversation.participantTwoId
    : conversation.participantOneId;
}

async function ensureConversationAccess(
  conversationId: number,
  userId: number,
) {
  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    return null;
  }

  const isParticipant =
    conversation.participantOneId === userId ||
    conversation.participantTwoId === userId;

  if (!isParticipant) {
    return false;
  }

  return conversation;
}

async function serializeConversationSummary(
  conversation: Conversation,
  currentUserId: number,
) {
  const otherParticipantId = getOtherParticipantId(conversation, currentUserId);
  const [participant, lastMessage] = await Promise.all([
    User.findByPk(otherParticipantId),
    Message.findOne({
      where: { conversationId: conversation.id },
      order: [["createdAt", "DESC"], ["id", "DESC"]],
    }),
  ]);

  if (!participant) {
    return null;
  }

  return {
    id: conversation.id,
    participant: toPublicUser(participant),
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          body: lastMessage.body,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
        }
      : null,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
  };
}

function serializeMessage(message: Message) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    body: message.body,
    createdAt: message.createdAt,
  };
}

export async function listContacts(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  const contacts = await User.findAll({
    where: {
      id: { [Op.ne]: req.user.sub },
    },
    attributes: ["id", "name", "role"],
    order: [
      ["role", "ASC"],
      ["name", "ASC"],
      ["id", "ASC"],
    ],
  });

  return res.json(contacts.map(toPublicUser));
}

export async function listConversations(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  const conversations = await Conversation.findAll({
    where: {
      [Op.or]: [
        { participantOneId: req.user.sub },
        { participantTwoId: req.user.sub },
      ],
    },
    order: [["lastMessageAt", "DESC"], ["id", "DESC"]],
  });

  const serialized = await Promise.all(
    conversations.map((conversation) =>
      serializeConversationSummary(conversation, req.user!.sub),
    ),
  );

  return res.json(serialized.filter(Boolean));
}

export async function createConversation(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  const participantId = Number(req.body?.participantId);

  if (Number.isNaN(participantId)) {
    return res.status(400).json({ message: "participantId invalido" });
  }

  if (participantId === req.user.sub) {
    return res.status(400).json({ message: "Nao e possivel conversar consigo mesmo" });
  }

  const participant = await User.findByPk(participantId);
  if (!participant) {
    return res.status(404).json({ message: "Participante nao encontrado" });
  }

  const [participantOneId, participantTwoId] = normalizeParticipantPair(
    req.user.sub,
    participantId,
  );

  const [conversation] = await Conversation.findOrCreate({
    where: {
      participantOneId,
      participantTwoId,
    },
    defaults: {
      participantOneId,
      participantTwoId,
      lastMessageAt: new Date(),
    },
  });

  const serialized = await serializeConversationSummary(
    conversation,
    req.user.sub,
  );

  return res.status(201).json(serialized);
}

export async function listMessages(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  const conversationId = Number(req.params.id);
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isNaN(requestedLimit)
    ? DEFAULT_MESSAGE_LIMIT
    : Math.min(Math.max(requestedLimit, 1), MAX_MESSAGE_LIMIT);

  if (Number.isNaN(conversationId)) {
    return res.status(400).json({ message: "ID da conversa invalido" });
  }

  const access = await ensureConversationAccess(conversationId, req.user.sub);
  if (access === null) {
    return res.status(404).json({ message: "Conversa nao encontrada" });
  }
  if (access === false) {
    return res.status(403).json({ message: "Sem acesso a esta conversa" });
  }

  const beforeId = Number(req.query.beforeId);
  const where = {
    conversationId,
    ...(Number.isNaN(beforeId) ? {} : { id: { [Op.lt]: beforeId } }),
  };

  const messages = await Message.findAll({
    where,
    order: [["createdAt", "DESC"], ["id", "DESC"]],
    limit,
  });

  return res.json(messages.reverse().map(serializeMessage));
}

export async function createMessage(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  const conversationId = Number(req.params.id);
  if (Number.isNaN(conversationId)) {
    return res.status(400).json({ message: "ID da conversa invalido" });
  }

  const access = await ensureConversationAccess(conversationId, req.user.sub);
  if (access === null) {
    return res.status(404).json({ message: "Conversa nao encontrada" });
  }
  if (access === false) {
    return res.status(403).json({ message: "Sem acesso a esta conversa" });
  }

  const rawBody = typeof req.body?.body === "string" ? req.body.body : "";
  const body = sanitizeMessageBody(rawBody);

  if (!body) {
    return res.status(400).json({ message: "A mensagem nao pode ficar vazia" });
  }

  if (body.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      message: `A mensagem deve ter no maximo ${MAX_MESSAGE_LENGTH} caracteres`,
    });
  }

  const message = await Message.create({
    conversationId,
    senderId: req.user.sub,
    body,
  });

  access.lastMessageAt = message.createdAt ?? new Date();
  await access.save();

  const payload = {
    conversationId,
    message: serializeMessage(message),
  };

  emitChatEvent(
    [access.participantOneId, access.participantTwoId],
    "chat:message",
    payload,
  );

  return res.status(201).json(payload);
}
