import crypto from "node:crypto";

/**
 * Gera um token seguro para verificação de email
 * @param length - Tamanho do token em bytes (padrão: 32)
 * @returns Token hexadecimal
 */
export const generateVerificationToken = (length = 32): string => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Gera um token curto numérico (útil para códigos SMS)
 * @param length - Quantidade de dígitos (padrão: 6)
 * @returns Código numérico como string
 */
export const generateNumericCode = (length = 6): string => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

/**
 * Calcula a data de expiração do token
 * @param hours - Quantidade de horas até expirar (padrão: 24)
 * @returns Data de expiração
 */
export const getTokenExpiration = (hours = 24): Date => {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + hours);
  return expiration;
};

/**
 * Calcula a data de expiração em minutos
 * @param minutes - Quantidade de minutos até expirar
 * @returns Data de expiração
 */
export const getTokenExpirationMinutes = (minutes: number): Date => {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + minutes);
  return expiration;
};

/**
 * Verifica se um token expirou
 * @param expirationDate - Data de expiração do token
 * @returns true se expirou, false caso contrário
 */
export const isTokenExpired = (expirationDate: Date): boolean => {
  return new Date() > new Date(expirationDate);
};

/**
 * Gera hash do token para armazenar no banco de dados
 * (por segurança, não armazenar o token em texto plano)
 * @param token - Token a ser hasheado
 * @returns Hash SHA-256 do token
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Compara um token com seu hash
 * @param token - Token em texto plano
 * @param hashedToken - Token hasheado
 * @returns true se correspondem, false caso contrário
 */
export const verifyTokenHash = (token: string, hashedToken: string): boolean => {
  const hash = hashToken(token);
  return hash === hashedToken;
};

/**
 * Gera dados completos para um token de verificação
 * @param expirationMinutes - Minutos até expiração (padrão: 25)
 * @returns Objeto com token, hash e data de expiração
 */
export const createVerificationData = (expirationMinutes = 25) => {
  const token = generateVerificationToken();

  return {
    token, // Enviar por email
    hashedToken: hashToken(token), // Salvar no banco
    expiresAt: getTokenExpirationMinutes(expirationMinutes),
  };
};
