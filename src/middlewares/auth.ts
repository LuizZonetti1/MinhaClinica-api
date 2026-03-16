import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "../types/enums";
import { type JwtPayload, verifyTempRegistrationToken } from "../utils/jwtUtils";

// Estende a interface Request do Express para incluir dados do usuário
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      clinicId?: string | null;
      userRole?: UserRole;
      userName?: string;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extrai o token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "Token não fornecido" });
      return;
    }

    // Verifica o formato: "Bearer TOKEN"
    const parts = authHeader.split(" ");

    if (parts.length !== 2) {
      res.status(401).json({ error: "Formato de token inválido" });
      return;
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      res.status(401).json({ error: "Formato de token mal formatado" });
      return;
    }

    // Verifica se o JWT_SECRET está definido
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET não está configurado");
    }

    // Verifica e decodifica o token
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Adiciona as informações do usuário ao request
    req.userId = decoded.userId;
    req.clinicId = decoded.clinicId;
    req.userRole = decoded.role;
    req.userName = decoded.name;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expirado" });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    res.status(500).json({ error: "Erro ao validar token" });
    return;
  }
};

// Middleware opcional para verificar roles específicos
export const checkRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    next();
  };
};

/**
 * Middleware para o token temporário de registro (Etapa 3)
 * Aceita apenas tokens com scope "register_complete"
 */
export const tempRegistrationAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "Token de registro não fornecido" });
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
      res.status(401).json({ error: "Formato de token inválido" });
      return;
    }

    const decoded = verifyTempRegistrationToken(parts[1]);

    req.userId = decoded.userId;
    req.clinicId = decoded.clinicId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token de registro expirado. Reinicie o cadastro." });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError || error instanceof Error) {
      res.status(401).json({ error: "Token de registro inválido" });
      return;
    }
    res.status(500).json({ error: "Erro ao validar token de registro" });
  }
};
