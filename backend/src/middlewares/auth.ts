import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { UserRole } from "../models/auth/User";

export interface AuthPayload {
  sub: number;
  role: UserRole;
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
      .json({ message: "JWT_SECRET nao configurado no servidor" });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token nao informado" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      ignoreExpiration: false,
    }) as JwtPayload | string;

    if (typeof decoded === "string" || typeof decoded.sub === "undefined") {
      return res.status(401).json({ message: "Token invalido" });
    }

    req.user = {
      sub: Number(decoded.sub),
      role: (decoded as JwtPayload).role as UserRole,
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Token invalido ou expirado" });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Acesso somente para administradores" });
  }

  return next();
}

export async function attachCurrentUser(
  _req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  return next();
}
