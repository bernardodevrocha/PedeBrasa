import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { AuthPayload } from "../../middlewares/auth";

let io: Server | null = null;

function readToken(rawHeader?: string) {
  if (!rawHeader) {
    return null;
  }

  return rawHeader.startsWith("Bearer ") ? rawHeader.slice(7) : rawHeader;
}

function parseSocketUser(token: string): AuthPayload | null {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      ignoreExpiration: false,
    }) as JwtPayload | string;

    if (typeof decoded === "string" || typeof decoded.sub === "undefined") {
      return null;
    }

    return {
      sub: Number(decoded.sub),
      role: decoded.role as AuthPayload["role"],
    };
  } catch {
    return null;
  }
}

export function initChatSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin:
        process.env.CORS_ORIGIN ||
        (process.env.NODE_ENV === "development" ? "*" : undefined),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      typeof socket.handshake.auth.token === "string"
        ? socket.handshake.auth.token
        : readToken(socket.handshake.headers.authorization);

    if (!token) {
      return next(new Error("Token nao informado"));
    }

    const user = parseSocketUser(token);
    if (!user) {
      return next(new Error("Token invalido"));
    }

    socket.data.user = user;
    return next();
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as AuthPayload | undefined;
    if (!user) {
      socket.disconnect();
      return;
    }

    socket.join(`user:${user.sub}`);
  });

  return io;
}

export function emitChatEvent(userIds: number[], event: string, payload: unknown) {
  if (!io) {
    return;
  }

  const uniqueUserIds = Array.from(new Set(userIds));
  uniqueUserIds.forEach((userId) => {
    io?.to(`user:${userId}`).emit(event, payload);
  });
}
