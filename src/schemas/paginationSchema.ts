import * as yup from "yup";

/**
 * Schema padrão para endpoints listáveis que aceitam page/limit por query
 * string. Valor fora da faixa responde 400 — nunca ignorado silenciosamente
 * (limit=999999 num banco com volume real seria um DoS acidental).
 */
export const paginationSchema = yup.object({
  page: yup
    .number()
    .integer("page deve ser um número inteiro")
    .min(1, "page deve ser no mínimo 1")
    .default(1),
  limit: yup
    .number()
    .integer("limit deve ser um número inteiro")
    .min(1, "limit deve ser no mínimo 1")
    .max(100, "limit deve ser no máximo 100")
    .default(20),
});
