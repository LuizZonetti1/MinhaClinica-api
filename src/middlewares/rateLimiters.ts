import rateLimit from "express-rate-limit";

// 10 tentativas por janela de 15 minutos
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
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
