import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { User } from "../../models/auth/User";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN: StringValue | number =
  (process.env.JWT_EXPIRES_IN as StringValue) || "7d";

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "name, email e password são obrigatórios" });
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Email já cadastrado" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  const payload = { sub: user.id, role: user.role };
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  const token = jwt.sign(payload, JWT_SECRET, options);

  return res.status(201).json({ token, user });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "email e password são obrigatórios" });
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  const payload = { sub: user.id, role: user.role };
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  const token = jwt.sign(payload, JWT_SECRET, options);

  return res.json({ token, user });
}
