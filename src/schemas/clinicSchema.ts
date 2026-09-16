import * as yup from "yup";
import { DayOfWeek } from "../types/enums";
import { stripHtmlTags } from "../utils/sanitizeText";
import { validateCep } from "../utils/validateCep";
import { validateCNPJ } from "../utils/validateCNPJ";
import { validateCPF } from "../utils/validateCPF";

// Regex para validações
const cnpjRegex = /^\d{14}$/;
const phoneRegex = /^\d{10,11}$/;
const cepRegex = /^\d{8}$/;
const ufRegex = /^[A-Z]{2}$/;
const subdomainRegex = /^[a-z0-9-]+$/;

/**
 * Schema para Etapa 1 — Início do cadastro de clínica (público)
 * POST /api/clinics/register/start
 * Recebe os dados da clínica + nome e email do dono
 */
export const clinicRegisterStartSchema = yup.object({
  // ── Dados da clínica ──────────────────────────────────────────
  legalName: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .required("Razão social é obrigatória")
    .min(3, "Razão social deve ter no mínimo 3 caracteres")
    .max(200, "Razão social deve ter no máximo 200 caracteres"),

  tradeName: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .required("Nome fantasia é obrigatório")
    .min(3, "Nome fantasia deve ter no mínimo 3 caracteres")
    .max(200, "Nome fantasia deve ter no máximo 200 caracteres"),

  cnpj: yup
    .string()
    .required("CNPJ é obrigatório")
    .matches(cnpjRegex, "CNPJ deve conter exatamente 14 dígitos")
    .length(14, "CNPJ deve ter 14 dígitos")
    .test("cnpj-valido", "CNPJ inválido: verifique os dígitos.", (value) =>
      value ? validateCNPJ(value) : true,
    )
    .transform((v) => v?.replace(/\D/g, "")),

  // E-mail de contato da clínica (pode ser diferente do e-mail do dono)
  clinicEmail: yup
    .string()
    .required("E-mail da clínica é obrigatório")
    .email("E-mail da clínica inválido")
    .max(100)
    .transform((v) => v?.toLowerCase().trim()),

  phone: yup
    .string()
    .required("Telefone é obrigatório")
    .matches(phoneRegex, "Telefone deve ter 10 ou 11 dígitos")
    .transform((v) => v?.replace(/\D/g, "")),

  website: yup.string().url("Website deve ser uma URL válida").optional(),

  // ── Endereço da clínica ────────────────────────────────────────
  zipCode: yup
    .string()
    .required("CEP é obrigatório")
    .matches(cepRegex, "CEP deve conter exatamente 8 dígitos")
    .length(8, "CEP deve ter 8 dígitos")
    .transform((v) => v?.replace(/\D/g, ""))
    .test("cep-exists", "CEP não encontrado", (v) => validateCep(v)),

  street: yup
    .string()
    .required("Logradouro é obrigatório")
    .min(3, "Logradouro deve ter no mínimo 3 caracteres")
    .max(200),

  number: yup.string().required("Número é obrigatório").max(10),

  complement: yup.string().max(100).optional(),

  neighborhood: yup
    .string()
    .required("Bairro é obrigatório")
    .min(3, "Bairro deve ter no mínimo 3 caracteres")
    .max(100),

  city: yup
    .string()
    .required("Cidade é obrigatória")
    .min(3, "Cidade deve ter no mínimo 3 caracteres")
    .max(100),

  state: yup
    .string()
    .required("Estado é obrigatório")
    .matches(ufRegex, "Estado deve ser uma UF válida (ex: SP, RJ)")
    .length(2)
    .uppercase(),

  subdomain: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .test(
      "subdomain-format",
      "Subdomain deve conter apenas letras minúsculas, números e hífens",
      (value) => (!value ? true : subdomainRegex.test(value)),
    )
    .test("subdomain-length", "Subdomain deve ter entre 3 e 50 caracteres", (value) =>
      !value ? true : value.length >= 3 && value.length <= 50,
    )
    .optional(),

  timezone: yup.string().default("America/Sao_Paulo").optional(),

  // ── Dados do dono (futuro usuário ADMIN) ──────────────────────
  ownerName: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .required("Nome do responsável é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100),

  ownerEmail: yup
    .string()
    .required("E-mail do responsável é obrigatório")
    .email("E-mail do responsável inválido")
    .max(100)
    .transform((v) => v?.toLowerCase().trim()),
});

/**
 * Schema para Etapa 3 — Completar dados do dono
 * POST /api/clinics/register/complete
 * Protegido por JWT temporário gerado após verificação de e-mail
 */
export const clinicRegisterCompleteSchema = yup.object({
  password: yup
    .string()
    .required("Senha é obrigatória")
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(100),

  cpf: yup
    .string()
    .required("CPF é obrigatório")
    .transform((v) => v?.replace(/\D/g, ""))
    .matches(/^\d{11}$/, "CPF deve conter exatamente 11 dígitos")
    .test("cpf-valid", "CPF inválido", (v) => (v ? validateCPF(v) : false)),

  phone: yup
    .string()
    .required("Telefone é obrigatório")
    .matches(phoneRegex, "Telefone deve ter 10 ou 11 dígitos")
    .transform((v) => v?.replace(/\D/g, "")),

  termsAccepted: yup
    .boolean()
    .oneOf([true], "É necessário aceitar os Termos de Uso e a Política de Privacidade")
    .required("É necessário aceitar os Termos de Uso e a Política de Privacidade"),
});

/**
 * Schema para confirmar a clínica cadastrada com o e-mail de uma conta existente
 * POST /api/clinics/register/existing/confirm (autenticado)
 * CPF e telefone só são exigidos se a conta ainda não os tiver.
 */
export const clinicRegisterConfirmExistingSchema = yup.object({
  token: yup.string().required("Token é obrigatório"),

  cpf: yup
    .string()
    .transform((v) => (typeof v === "string" ? v.replace(/\D/g, "") : v))
    .matches(/^\d{11}$/, { message: "CPF deve conter exatamente 11 dígitos", excludeEmptyString: true })
    .test("cpf-valid", "CPF inválido", (v) => (v ? validateCPF(v) : true))
    .optional(),

  phone: yup
    .string()
    .transform((v) => (typeof v === "string" ? v.replace(/\D/g, "") : v))
    .matches(/^\d{10,11}$/, { message: "Telefone deve ter 10 ou 11 dígitos", excludeEmptyString: true })
    .optional(),

  termsAccepted: yup
    .boolean()
    .oneOf([true], "É necessário aceitar os Termos de Uso e a Política de Privacidade")
    .required("É necessário aceitar os Termos de Uso e a Política de Privacidade"),
});

/**
 * Schema para atualização de clínica
 * PUT /api/clinics/:id
 */
export const clinicUpdateSchema = yup.object({
  legalName: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .min(3)
    .max(200)
    .optional(),
  tradeName: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .min(3)
    .max(200)
    .optional(),
  email: yup.string().email().lowercase().optional(),
  phone: yup.string().matches(phoneRegex).optional(),
  website: yup.string().url().optional(),
  logoUrl: yup.string().url().optional(),
  zipCode: yup
    .string()
    .matches(cepRegex)
    .length(8)
    .test("cep-exists", "CEP não encontrado", (v) => validateCep(v))
    .optional(),
  street: yup.string().min(3).max(200).optional(),
  number: yup.string().max(10).optional(),
  complement: yup.string().max(100).optional(),
  neighborhood: yup.string().min(3).max(100).optional(),
  city: yup.string().min(3).max(100).optional(),
  state: yup.string().matches(ufRegex).length(2).uppercase().optional(),
  subdomain: yup.string().matches(subdomainRegex).min(3).max(50).optional(),
  customDomain: yup.string().url().optional(),
  timezone: yup.string().optional(),
  isActive: yup.boolean().optional(),
});

// ── Schemas da página de Configurações ──────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:mm
const workingDaysPresets = ["WEEKDAYS", "MON_TO_SAT", "ALL_WEEK"] as const;

/**
 * Schema para atualização dos dados básicos (info) da clínica
 * PATCH /api/clinics/settings/info
 */
export const clinicInfoUpdateSchema = yup.object({
  tradeName: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .min(3)
    .max(200)
    .optional(),
  cnpj: yup
    .string()
    .matches(cnpjRegex, "CNPJ deve conter exatamente 14 dígitos")
    .length(14)
    .test("cnpj-valido", "CNPJ inválido: verifique os dígitos.", (value) =>
      value ? validateCNPJ(value) : true,
    )
    .transform((v) => v?.replace(/\D/g, ""))
    .optional(),
  phone: yup
    .string()
    .matches(phoneRegex, "Telefone deve ter 10 ou 11 dígitos")
    .transform((v) => v?.replace(/\D/g, ""))
    .optional(),
  email: yup.string().email("E-mail inválido").lowercase().max(100).optional(),
  website: yup.string().url("Website deve ser uma URL válida").optional().nullable(),
  zipCode: yup
    .string()
    .matches(cepRegex, "CEP deve conter 8 dígitos")
    .length(8)
    .transform((v) => v?.replace(/\D/g, ""))
    .test("cep-exists", "CEP não encontrado", (v) => validateCep(v))
    .optional(),
  street: yup.string().min(3).max(200).optional(),
  number: yup.string().max(10).optional(),
  complement: yup.string().max(100).optional().nullable(),
  neighborhood: yup.string().min(3).max(100).optional(),
  city: yup.string().min(3).max(100).optional(),
  state: yup
    .string()
    .matches(ufRegex, "Estado deve ser uma UF válida")
    .length(2)
    .uppercase()
    .optional(),
});

/**
 * Schema para atualização das configurações de horário/agenda
 * PATCH /api/clinics/settings/schedule
 */
export const clinicScheduleUpdateSchema = yup.object({
  openTime: yup
    .string()
    .matches(timeRegex, "Horário de abertura deve estar no formato HH:mm")
    .optional(),
  closeTime: yup
    .string()
    .matches(timeRegex, "Horário de fechamento deve estar no formato HH:mm")
    .optional(),
  minIntervalBetweenAppointments: yup
    .number()
    .integer()
    .min(5, "Intervalo mínimo é de 5 minutos")
    .max(120, "Intervalo máximo é de 120 minutos")
    .optional(),
  workingDaysPreset: yup
    .string()
    .oneOf(workingDaysPresets, "Preset de dias inválido. Use: WEEKDAYS, MON_TO_SAT ou ALL_WEEK")
    .optional(),
});

/**
 * Schema para atualização das configurações de notificações
 * PATCH /api/clinics/settings/notifications
 */
export const clinicNotificationsUpdateSchema = yup.object({
  sendAppointmentReminder: yup.boolean().optional(),
  sendCancellationAlert: yup.boolean().optional(),
  sendNewPatientAlert: yup.boolean().optional(),
  sendDailyReport: yup.boolean().optional(),
});

/**
 * Schema para atualização das configurações de segurança
 * PATCH /api/clinics/settings/security
 */
export const clinicSecurityUpdateSchema = yup.object({
  twoFactorEnabled: yup.boolean().optional(),
  accessLogEnabled: yup.boolean().optional(),
  sessionTimeoutMinutes: yup
    .number()
    .integer()
    .oneOf(
      [15, 30, 60, 120, 240],
      "Timeout de sessão inválido. Use: 15, 30, 60, 120 ou 240 minutos",
    )
    .optional(),
});

/**
 * Schema para atualização das regras de agendamento (política)
 * PATCH /api/clinics/settings/policy
 */
export const clinicPolicyUpdateSchema = yup.object({
  allowOnlineBooking: yup.boolean().optional(),
  minAdvanceBookingHours: yup
    .number()
    .integer()
    .min(0, "Antecedência mínima não pode ser negativa")
    .max(168, "Antecedência mínima máxima é de 168 horas (7 dias)")
    .optional(),
  maxAdvanceBookingDays: yup
    .number()
    .integer()
    .min(1, "Antecedência máxima mínima é de 1 dia")
    .max(365, "Antecedência máxima é de 365 dias")
    .optional(),
  maxCancellationHours: yup
    .number()
    .integer()
    .min(0, "Antecedência de cancelamento não pode ser negativa")
    .max(168, "Antecedência de cancelamento máxima é de 168 horas (7 dias)")
    .optional(),
  maxConsecutiveNoShows: yup
    .number()
    .integer()
    .min(1, "Limite de faltas mínimo é 1")
    .max(20, "Limite de faltas máximo é 20")
    .optional(),
  appointmentToleranceMinutes: yup
    .number()
    .integer()
    .min(0, "Tolerância não pode ser negativa")
    .max(120, "Tolerância máxima é de 120 minutos")
    .optional(),
});

/**
 * Schema para atualização do horário de funcionamento por dia da semana
 * PUT /api/clinics/settings/working-hours
 * Substitui os dias enviados; dias omitidos não são alterados.
 */
export const clinicWorkingHoursUpdateSchema = yup.object({
  days: yup
    .array()
    .of(
      yup.object({
        dayOfWeek: yup
          .string()
          .oneOf(Object.values(DayOfWeek), "Dia da semana inválido")
          .required("Dia da semana é obrigatório"),
        isOpen: yup.boolean().required("isOpen é obrigatório"),
        openTime: yup
          .string()
          .matches(timeRegex, "Horário de abertura deve estar no formato HH:mm")
          .required("Horário de abertura é obrigatório"),
        closeTime: yup
          .string()
          .matches(timeRegex, "Horário de fechamento deve estar no formato HH:mm")
          .required("Horário de fechamento é obrigatório")
          .test(
            "close-after-open",
            "Horário de fechamento deve ser depois do horário de abertura",
            function closeAfterOpen(value) {
              const { openTime, isOpen } = this.parent;
              // Dias fechados podem chegar com openTime/closeTime "zerados"
              // (ex: "00:00"/"00:00") — a validação só faz sentido quando o
              // dia está aberto.
              if (!isOpen || !value || !openTime) return true;
              return value > openTime;
            },
          ),
      }),
    )
    .min(1, "Envie ao menos um dia")
    .required("Lista de dias é obrigatória"),
});

/**
 * Schema para criação de feriado/dia sem atendimento
 * POST /api/clinics/settings/holidays
 */
export const createClinicHolidaySchema = yup.object({
  date: yup.date().typeError("Data inválida").required("Data é obrigatória"),
  description: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .min(2, "Descrição deve ter no mínimo 2 caracteres")
    .max(120, "Descrição deve ter no máximo 120 caracteres")
    .required("Descrição é obrigatória"),
  isRecurring: yup.boolean().optional().default(false),
});
