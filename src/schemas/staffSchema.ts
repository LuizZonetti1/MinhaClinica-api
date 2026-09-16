import * as yup from "yup";
import { UserRole } from "../types/enums";
import { stripHtmlTags } from "../utils/sanitizeText";

const STAFF_ROLES = [UserRole.RECEPTIONIST, UserRole.ADMIN];

/**
 * Schema para convidar recepcionista/admin (Admin apenas)
 * Campos de pre-cadastro: nome e email
 */
export const inviteStaffSchema = yup.object({
  name: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .required("Nome é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),

  email: yup
    .string()
    .required("Email é obrigatório")
    .email("Email inválido")
    .max(100, "Email deve ter no máximo 100 caracteres")
    .transform((v) => v?.toLowerCase().trim()),

  role: yup
    .string()
    .required("Papel é obrigatório")
    .oneOf(STAFF_ROLES, "Papel deve ser RECEPTIONIST ou ADMIN"),
});

/**
 * Schema para atualizar recepcionista (Admin)
 * Todos os campos sao opcionais, mas ao menos um deve ser enviado
 */
export const updateReceptionSchema = yup
  .object({
    name: yup
      .string()
      .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
      .optional()
      .min(3, "Nome deve ter no mínimo 3 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres"),

    email: yup
      .string()
      .optional()
      .email("Email inválido")
      .max(100, "Email deve ter no máximo 100 caracteres"),

    isActive: yup.boolean().optional(),
  })
  .test(
    "at-least-one-field",
    "Informe ao menos um campo para atualizar",
    (value) => !!value && Object.values(value).some((item) => item !== undefined),
  );
