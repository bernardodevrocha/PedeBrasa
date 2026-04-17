"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChatSocket = initChatSocket;
exports.emitChatEvent = emitChatEvent;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let io = null;
function readToken(rawHeader) {
    if (!rawHeader) {
        return null;
    }
    return rawHeader.startsWith("Bearer ") ? rawHeader.slice(7) : rawHeader;
}
function parseSocketUser(token) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return null;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret, {
            ignoreExpiration: false,
        });
        if (typeof decoded === "string" || typeof decoded.sub === "undefined") {
            return null;
        }
        return {
            sub: Number(decoded.sub),
            role: decoded.role,
        };
    }
    catch {
        return null;
    }
}
function initChatSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN ||
                (process.env.NODE_ENV === "development" ? "*" : undefined),
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const token = typeof socket.handshake.auth.token === "string"
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
        const user = socket.data.user;
        if (!user) {
            socket.disconnect();
            return;
        }
        socket.join(`user:${user.sub}`);
    });
    return io;
}
function emitChatEvent(userIds, event, payload) {
    if (!io) {
        return;
    }
    const uniqueUserIds = Array.from(new Set(userIds));
    uniqueUserIds.forEach((userId) => {
        io?.to(`user:${userId}`).emit(event, payload);
    });
}
//# sourceMappingURL=chatSocket.js.map