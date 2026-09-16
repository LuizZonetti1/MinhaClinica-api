import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { loadRequestAuth } from "../services/auth/sessionContext";
import { UserStatus, type UserRole } from "../types/enums";
import { type JwtPayload, verifyTempRegistrationToken } from "../utils/jwtUtils";

// Estende a interface Request do Express para incluir dados do usuário
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      clinicId?: string | null;
      userRole?: UserRole;
      userRoles?: UserRole[];
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

    // Verifica se o segredo do access token está definido
    const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_ACCESS_SECRET não está configurado");
    }

    // Verifica e decodifica o token
    const decoded = jwt.verify(token, secret) as JwtPayload & { type?: string };

    // Token de acesso não carrega `type`; os temporários (temp_registration,
    // two_factor_pending) carregam. Se JWT_ACCESS_SECRET e JWT_TEMP_SECRET
    // forem iguais — configuração que a validação de ambiente agora recusa em
    // produção — a assinatura de um token temporário confere aqui e ele
    // passaria como sessão completa. O token de cadastro é emitido logo após a
    // verificação de e-mail, antes de a conta existir, e traz `role`: seria
    // sessão de ADMIN sem senha. A checagem de escopo abaixo fecha isso
    // independentemente de como os segredos estejam configurados.
    if (decoded.type) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    // Estado atual da conta, lido do banco a cada requisição. O token só diz
    // QUEM é e em QUAL clínica a sessão está; os papéis vêm daqui, para que
    // desligar alguém de uma clínica, bloquear a conta ou remover um papel
    // valha na hora — antes, o token de 8h continuava com os papéis antigos.
    const auth = await loadRequestAuth(decoded.userId, decoded.clinicId ?? null);

    if (!auth || auth.status !== UserStatus.ACTIVE) {
      res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
      return;
    }

    // Revogação implícita: senha alterada após a emissão do token
    if (
      decoded.iat &&
      auth.passwordChangedAt &&
      decoded.iat < auth.passwordChangedAt.getTime() / 1000
    ) {
      res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
      return;
    }

    if (auth.clinicAccessRevoked) {
      res.status(401).json({
        error: "Seu acesso a esta clínica foi encerrado. Faça login novamente.",
        code: "CLINIC_ACCESS_REVOKED",
      });
      return;
    }

    if (auth.roles.length === 0) {
      res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
      return;
    }

    // Adiciona as informações do usuário ao request
    req.userId = decoded.userId;
    req.clinicId = decoded.clinicId ?? null;
    req.userRole = auth.roles[0];
    req.userRoles = auth.roles;
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

    const userRoles = req.userRoles ?? [req.userRole];
    const hasAccess = allowedRoles.some((r) => userRoles.includes(r));
    if (!hasAccess) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    next();
  };
};

/**
 * Garante que o recurso endereçado pela URL pertence à clínica do token.
 *
 * O `clinicId` do JWT é a única fonte de verdade sobre o tenant do usuário —
 * o id que vem no path é entrada do cliente e não pode ser confiado. Sem esta
 * checagem, qualquer usuário autenticado alcança a clínica de outro tenant só
 * trocando o UUID da URL.
 *
 * Usar sempre DEPOIS de `authMiddleware`. `clinicId` do token é a clínica
 * ATIVA da sessão; quem é só paciente não tem clínica ativa e nunca passa por
 * aqui — o acesso do paciente a dados de clínica é o `/api/clinic-directory`.
 */
export const checkSameClinic = (paramName = "id") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.clinicId) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    if (req.params[paramName] !== req.clinicId) {
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
