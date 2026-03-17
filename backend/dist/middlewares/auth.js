"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireAdmin = requireAdmin;
exports.attachCurrentUser = attachCurrentUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET;
function authMiddleware(req, res, next) {
    if (!JWT_SECRET) {
        return res.status(500).json({ message: 'JWT_SECRET não configurado no servidor' });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token não informado' });
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            ignoreExpiration: false,
        });
        if (typeof decoded === 'string' || typeof decoded.sub === 'undefined') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        req.user = {
            sub: Number(decoded.sub),
            role: decoded.role,
        };
        return next();
    }
    catch {
        return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
}
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso somente para administradores' });
    }
    return next();
}
async function attachCurrentUser(req, _res, next) {
    if (!req.user)
        return next();
    const user = await User_1.User.findByPk(req.user.sub);
    if (!user) {
        return next();
    }
    return next();
}
//# sourceMappingURL=auth.js.map