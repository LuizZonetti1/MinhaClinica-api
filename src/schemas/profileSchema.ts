import * as yup from "yup";

const phoneRegex = /^\d{10,11}$/;

/**
 * Schema para atualização do perfil do usuário autenticado
 * PATCH /api/users/me
 */
export const updateProfileSchema = yup.object({
  name: yup
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),

  phone: yup
    .string()
    .matches(phoneRegex, "Telefone deve ter 10 ou 11 dígitos")
    .transform((v) => v?.replace(/\D/g, ""))
    .optional(),

  avatarUrl: yup.string().url("URL do avatar inválida").optional().nullable(),
});

/**
 * Schema para troca de senha
 * PATCH /api/staff/me/password
 */
export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required("Informe a senha atual"),

  newPassword: yup
    .string()
    .min(8, "A nova senha deve ter no mínimo 8 caracteres")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "A senha deve conter letras maiúsculas, minúsculas e números",
    )
    .required("Informe a nova senha"),

  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "As senhas não coincidem")
    .required("Confirme a nova senha"),
});
