"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
async function register(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'name, email e password são obrigatórios' });
    }
    const existing = await User_1.User.findOne({ where: { email } });
    if (existing) {
        return res.status(409).json({ message: 'Email já cadastrado' });
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const user = await User_1.User.create({
        name,
        email,
        passwordHash,
    });
    const payload = { sub: user.id, role: user.role };
    const options = { expiresIn: JWT_EXPIRES_IN };
    const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
    return res.status(201).json({ token, user });
}
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'email e password são obrigatórios' });
    }
    const user = await User_1.User.findOne({ where: { email } });
    if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    const payload = { sub: user.id, role: user.role };
    const options = { expiresIn: JWT_EXPIRES_IN };
    const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
    return res.json({ token, user });
}
//# sourceMappingURL=authController.js.map