import * as yup from "yup";
import { stripHtmlTags } from "../utils/sanitizeText";
import { validateCPF } from "../utils/validateCPF";

/**
 * Dados profissionais pedidos ao aceitar um convite de PROFISSIONAL. Ficam
 * opcionais no schema porque o mesmo corpo serve a convites de recepção/admin;
 * o serviço exige conselho, número e UF quando o convite é de profissional.
 */
const professionalFields = {
  professionalCouncil: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v).trim() : v))
    .max(50, "Conselho deve ter no máximo 50 caracteres")
    .optional(),

  registrationNumber: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v).trim() : v))
    .max(50, "Número de registro deve ter no máximo 50 caracteres")
    .optional(),

  registrationState: yup
    .string()
    .transform((v) => (typeof v === "string" ? v.trim().toUpperCase() : v))
    .matches(/^[A-Z]{2}$/, { message: "Estado deve ter 2 letras", excludeEmptyString: true })
    .optional(),

  defaultAppointmentDuration: yup
    .number()
    .nullable()
    .positive("Duração deve ser positiva")
    .integer("Duração deve ser um número inteiro")
    .optional(),

  // null é aceito: o pré-preenchimento (dados de outra clínica) devolve null
  // quando o profissional não tinha formações cadastradas.
  formations: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .max(2000)
    .nullable()
    .optional(),
};

const cpfField = yup
  .string()
  .transform((v) => (typeof v === "string" ? v.replace(/\D/g, "") : v))
  .matches(/^\d{11}$/, "CPF deve conter exatamente 11 dígitos")
  .test("cpf-valid", "CPF inválido", (v) => (v ? validateCPF(v) : true));

const phoneField = yup
  .string()
  .transform((v) => (typeof v === "string" ? v.replace(/\D/g, "") : v))
  .matches(/^\d{10,11}$/, "Telefone deve conter 10 ou 11 dígitos");

const termsAccepted = yup
  .boolean()
  .oneOf([true], "É necessário aceitar os Termos de Uso e a Política de Privacidade")
  .required("É necessário aceitar os Termos de Uso e a Política de Privacidade");

/**
 * POST /api/invites/:token/accept — conta existente (logada).
 * CPF e telefone só são exigidos se a conta ainda não os tiver.
 */
export const acceptInviteSchema = yup.object({
  ...professionalFields,
  cpf: cpfField.optional(),
  phone: phoneField.optional(),
  termsAccepted,
});

/**
 * POST /api/invites/:token/register — quem ainda não tem conta.
 */
export const registerFromInviteSchema = yup.object({
  ...professionalFields,
  name: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v).trim() : v))
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),
  cpf: cpfField.required("CPF é obrigatório"),
  phone: phoneField.required("Telefone é obrigatório"),
  password: yup
    .string()
    .required("Senha é obrigatória")
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(50, "Senha deve ter no máximo 50 caracteres"),
  termsAccepted,
});

export type AcceptInviteInput = yup.InferType<typeof acceptInviteSchema>;
export type RegisterFromInviteInput = yup.InferType<typeof registerFromInviteSchema>;
