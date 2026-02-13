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
