import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "../types/enums";

// Payload do token JWT
export interface JwtPayload {
  userId: string;
  clinicId: string | null;
  role: UserRole;
  name: string;
}

// Payload do token temporário de cadastro
export interface TempRegistrationPayload {
  userId: string;
  clinicId: string | null;
  role: UserRole;
  type: "temp_registration";
  scope: "register_complete";
}

// Opções para geração do token
interface GenerateTokenOptions {
  expiresIn?: string | number; // Ex: "7d", "24h", "1h", 3600
}

/**
 * Gera um token JWT para autenticação do usuário
 * @param userId - ID do usuário
 * @param clinicId - ID da clínica do usuário
 * @param role - Papel do usuário (ADMIN, RECEPTIONIST, PROFESSIONAL, PATIENT)
 * @param options - Opções adicionais (tempo de expiração)
 * @returns Token JWT assinado
 */
export const generateAuthToken = (
  userId: string,
  clinicId: string | null | undefined,
  role: UserRole,
  name: string,
  options: GenerateTokenOptions = {},
): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não está configurado nas variáveis de ambiente");
  }

  const payload: JwtPayload = {
    userId,
    clinicId: clinicId ?? null,
    role,
    name,
  };

  // Token padrão expira em 7 dias
  const expiresIn = options.expiresIn !== undefined ? options.expiresIn : "7d";

  const signOptions: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
    subject: userId,
  };

  return jwt.sign(payload, secret, signOptions);
};

/**
 * Verifica e decodifica um token JWT
 * @param token - Token JWT a ser verificado
 * @returns Payload decodificado ou lança erro
 */
export const verifyAuthToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não está configurado nas variáveis de ambiente");
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expirado");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Token inválido");
    }
    throw error;
  }
};

/**
 * Gera um token de refresh (token de longa duração)
 * @param userId - ID do usuário
 * @param clinicId - ID da clínica
 * @returns Token de refresh
 */
export const generateRefreshToken = (userId: string, clinicId: string): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não está configurado nas variáveis de ambiente");
  }

  const payload = {
    userId,
    clinicId,
    type: "refresh",
  };

  // Refresh token expira em 30 dias
  return jwt.sign(payload, secret, {
    expiresIn: "30d",
    subject: userId,
  });
};

/**
 * Gera um token JWT temporário usado apenas para completar o cadastro (Etapa 3)
 * @param userId - ID do usuário com email verificado
 * @param clinicId - ID da clínica
 * @param role - Papel do usuário (ADMIN, PROFESSIONAL, RECEPTIONIST, PATIENT)
 * @returns Token JWT temporário com scope restrito (expira em 30 min)
 */
export const generateTempRegistrationToken = (
  userId: string,
  clinicId: string | null,
  role: UserRole,
): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não está configurado");

  const payload: TempRegistrationPayload = {
    userId,
    clinicId,
    role,
    type: "temp_registration",
    scope: "register_complete",
  };

  return jwt.sign(payload, secret, { expiresIn: "30m", subject: userId });
};

/**
 * Verifica e decodifica um token temporário de cadastro
 * @param token - Token temporário
 * @returns Payload decodificado ou lança erro
 */
export const verifyTempRegistrationToken = (token: string): TempRegistrationPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não está configurado");

  const decoded = jwt.verify(token, secret) as TempRegistrationPayload;

  if (decoded.scope !== "register_complete") {
    throw new Error("Token inválido para esta operação");
  }

  return decoded;
};

/**
 * Decodifica um token sem validar a assinatura (útil para depuração)
 * @param token - Token JWT
 * @returns Payload decodificado ou null
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};
