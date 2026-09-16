import * as yup from "yup";
import { stripHtmlTags } from "../utils/sanitizeText";

/**
 * Schema para convidar profissional (Admin apenas)
 * Campos de pre-cadastro: nome, email e especialidade
 */
export const inviteProfessionalSchema = yup.object({
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

  specialty: yup
    .string()
    .required("Especialidade é obrigatória")
    .min(2, "Especialidade deve ter no mínimo 2 caracteres")
    .max(100, "Especialidade deve ter no máximo 100 caracteres"),
});

/**
 * Schema para atualizar profissional (Admin)
 * Todos os campos sao opcionais, mas ao menos um deve ser enviado
 */
export const updateProfessionalSchema = yup
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

    specialty: yup
      .string()
      .optional()
      .min(2, "Especialidade deve ter no mínimo 2 caracteres")
      .max(100, "Especialidade deve ter no máximo 100 caracteres"),

    professionalCouncil: yup
      .string()
      .optional()
      .max(50, "Conselho profissional deve ter no máximo 50 caracteres"),

    registrationNumber: yup
      .string()
      .optional()
      .max(50, "Número de registro deve ter no máximo 50 caracteres"),

    registrationState: yup
      .string()
      .optional()
      .matches(/^[A-Za-z]{2}$/, "Estado deve ter 2 letras"),

    defaultAppointmentDuration: yup
      .number()
      .optional()
      .positive("Duração deve ser positiva")
      .integer("Duração deve ser um número inteiro"),

    isActive: yup.boolean().optional(),

    formations: yup.string().optional().max(1000, "Formações deve ter no máximo 1000 caracteres"),
  })
  .test(
    "at-least-one-field",
    "Informe ao menos um campo para atualizar",
    (value) => !!value && Object.values(value).some((item) => item !== undefined),
  );
