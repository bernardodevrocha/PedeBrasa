import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { User } from "../models/auth/User";

export interface AuthPayload {
  sub: number;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

const JWT_SECRET = process.env.JWT_SECRET;

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!JWT_SECRET) {
    return res
      .status(500)
      .json({ message: "JWT_SECRET não configurado no servidor" });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token não informado" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      ignoreExpiration: false,
    }) as JwtPayload | string;
    if (typeof decoded === "string" || typeof decoded.sub === "undefined") {
      return res.status(401).json({ message: "Token inválido" });
    }
    req.user = {
      sub: Number(decoded.sub),
      role: (decoded as JwtPayload).role as string,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Acesso somente para administradores" });
  }

  return next();
}

export async function attachCurrentUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user) return next();

  const user = await User.findByPk(req.user.sub);
  if (!user) {
    return next();
  }

  return next();
}
