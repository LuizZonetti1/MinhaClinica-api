/**
 * Limitação conhecida: todos os limiters abaixo usam o MemoryStore padrão do
 * express-rate-limit — o contador vive no processo Node. Com múltiplas
 * instâncias (scale-out) ou em cold start (ex.: Render free tier), o contador
 * zera. Decisão tomada: sem Redis por ora, sem produção nem cliente real
 * ainda. A correção que importa aqui é a CHAVE (conta em vez de IP), que
 * independe do store. Caminho de migração, quando necessário: trocar `store`
 * por um `RedisStore` de `rate-limit-redis` — a API de cada limiter não muda.
 */
import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { verifyTwoFactorPendingToken } from "../utils/jwtUtils";

const normalizeEmail = (value: unknown): string => String(value ?? "").trim().toLowerCase();

/** Fallback de IP seguro para IPv6 — nunca usar req.ip cru dentro de um keyGenerator custom. */
const ipFallback = (req: Request): string => ipKeyGenerator(req.ip ?? "unknown");

// Teto por IP, alto o bastante para uma clinica inteira operar atras do mesmo
// IP publico. Continua existindo como anti-DoS; quem trava por conta e o
// loginLimiter, abaixo.
export const ipFloodLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Muitas tentativas deste endereço. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5 tentativas por CONTA (email), nao por IP — uma recepcionista errando a
// propria senha nao pode derrubar o login de outras contas na mesma clinica.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => normalizeEmail(req.body?.email) || ipFallback(req),
  message: { message: "Muitas tentativas para esta conta. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Instancia propria — nao compartilha store com loginLimiter/passwordResetLimiter,
// para que tentativas de login nao consumam o teto de cadastro nem o contrario.
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// /reset-password recebe { token, password, confirmPassword } — sem email no
// body. A chave e o proprio token de redefinicao (estavel entre as tentativas
// de uma mesma sessao de "esqueci minha senha"), com fallback por IP.
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => String(req.body?.token ?? "").trim() || ipFallback(req),
  message: { message: "Muitas tentativas. Tente novamente em 1 hora." },
  standardHeaders: true,
  legacyHeaders: false,
});

// /2fa/validate nao tinha limite algum: um OTP de 6 digitos (1 milhao de
// combinacoes) sobrevivia ate 10 minutos ate alguem acertar por forca bruta.
// A chave e o userId decodificado do tempToken — assim o limite e por conta
// que esta tentando logar, nao por IP. Token invalido cai no fallback de IP.
export const twoFactorValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    try {
      const { userId } = verifyTwoFactorPendingToken(String(req.body?.tempToken ?? ""));
      return userId;
    } catch {
      return ipFallback(req);
    }
  },
  message: { message: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5 envios por janela de 1 hora
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Limite de envios atingido. Tente novamente em 1 hora." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rotas que recebem token na requisição (verificação/ativação).
// Protege contra varredura de tokens e contra enumeração.
export const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Muitas tentativas. Tente novamente em alguns minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});
