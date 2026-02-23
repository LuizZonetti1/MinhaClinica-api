import * as yup from "yup";

/**
 * Schema para login
 * Apenas email e senha (email já está vinculado à clínica)
 */
export const loginSchema = yup.object({
  email: yup.string().required("Email é obrigatório").email("Email inválido"),

  password: yup
    .string()
    .required("Senha é obrigatória")
    .min(6, "Senha deve ter no mínimo 6 caracteres"),
});

/**
 * Schema para Etapa 1 — Inicio do cadastro de paciente
 * POST /auth/register/start
 */
export const registerStartSchema = yup.object({
  name: yup
    .string()
    .required("Nome é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: yup
    .string()
    .required("Email é obrigatório")
    .email("Email inválido")
    .max(100, "Email deve ter no máximo 100 caracteres")
    .transform((v) => v?.toLowerCase().trim()),
});

/**
 * Schema para Etapa 2 — Verificação de email
 * POST /auth/register/verify
 */
export const verifyEmailSchema = yup.object({
  token: yup.string().required("Token de verificação é obrigatório"),
});

/**
 * Schema para reenvio de verificação
 * POST /auth/register/resend-verification
 */
export const resendVerificationSchema = yup.object({
  email: yup
    .string()
    .required("Email é obrigatório")
    .email("Email inválido")
    .transform((v) => v?.toLowerCase().trim()),
});
