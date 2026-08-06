import * as yup from "yup";
import { stripHtmlTags } from "../utils/sanitizeText";

const phoneRegex = /^\d{10,11}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * CPF e e-mail são identidade, não "dados de perfil": CPF é a chave de
 * vínculo com prontuário/faturamento e não muda na vida real; e-mail é a
 * credencial de recuperação de senha, e trocá-lo sem reverificação é
 * escalonamento de conta disfarçado de edição de perfil. Nenhum dos dois é
 * um campo próprio destes schemas — isto rejeita explicitamente (400) quem
 * tentar enviá-los direto pela API, em vez de deixar o stripUnknown do
 * middleware de validação descartá-los em silêncio.
 */
export const rejectField = (label: string, orientation: string) =>
  yup
    .mixed()
    .test(
      "campo-nao-editavel",
      `${label} não pode ser alterado por aqui. ${orientation}`,
      (value) => value === undefined,
    );

const CONTACT_CLINIC = "Entre em contato com a clínica.";

/**
 * Schema para atualização do perfil do usuário autenticado
 * PATCH /api/users/me
 */
export const updateProfileSchema = yup.object({
  name: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),

  phone: yup
    .string()
    .matches(phoneRegex, "Telefone deve ter 10 ou 11 dígitos")
    .transform((v) => v?.replace(/\D/g, ""))
    .optional(),

  avatarUrl: yup.string().url("URL do avatar inválida").optional().nullable(),

  cpf: rejectField("CPF", CONTACT_CLINIC),
  email: rejectField("E-mail", CONTACT_CLINIC),
});

const WEEKDAY_LABELS_PT: Record<string, string> = {
  MONDAY: "Segunda-feira",
  TUESDAY: "Terça-feira",
  WEDNESDAY: "Quarta-feira",
  THURSDAY: "Quinta-feira",
  FRIDAY: "Sexta-feira",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

const timeToMinutes = (time?: string | null): number | null => {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const workingHourSchema = yup
  .object({
    dayOfWeek: yup
      .string()
      .oneOf(
        ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
        "Dia da semana inválido",
      )
      .required("Dia da semana é obrigatório"),
    isWorking: yup.boolean().required("isWorking é obrigatório"),
    startTime: yup
      .string()
      .matches(timeRegex, "Horário deve estar no formato HH:MM")
      .when("isWorking", { is: true, then: (s) => s.required("Horário de início é obrigatório") }),
    endTime: yup
      .string()
      .matches(timeRegex, "Horário deve estar no formato HH:MM")
      .when("isWorking", { is: true, then: (s) => s.required("Horário de fim é obrigatório") }),
    lunchBreakStart: yup
      .string()
      .matches(timeRegex, "Horário deve estar no formato HH:MM")
      .optional()
      .nullable(),
    lunchBreakEnd: yup
      .string()
      .matches(timeRegex, "Horário deve estar no formato HH:MM")
      .optional()
      .nullable(),
  })
  .test("intervalos-validos", "Horário inválido", function (value) {
    if (!value || !value.isWorking) return true;

    const dayLabel = WEEKDAY_LABELS_PT[value.dayOfWeek as string] ?? value.dayOfWeek;
    const start = timeToMinutes(value.startTime);
    const end = timeToMinutes(value.endTime);
    const breakStart = timeToMinutes(value.lunchBreakStart);
    const breakEnd = timeToMinutes(value.lunchBreakEnd);

    if (start !== null && end !== null && start >= end) {
      return this.createError({
        path: `${this.path}.endTime`,
        message: `${dayLabel}: horário de término deve ser depois do horário de início.`,
      });
    }

    if ((breakStart === null) !== (breakEnd === null)) {
      return this.createError({
        path: `${this.path}.${breakStart === null ? "lunchBreakStart" : "lunchBreakEnd"}`,
        message: `${dayLabel}: informe início e fim do intervalo, ou deixe os dois em branco.`,
      });
    }

    if (breakStart !== null && breakEnd !== null && breakStart >= breakEnd) {
      return this.createError({
        path: `${this.path}.lunchBreakEnd`,
        message: `${dayLabel}: fim do intervalo deve ser depois do início do intervalo.`,
      });
    }

    if (
      breakStart !== null &&
      breakEnd !== null &&
      start !== null &&
      end !== null &&
      (breakStart < start || breakEnd > end)
    ) {
      return this.createError({
        path: `${this.path}.lunchBreakStart`,
        message: `${dayLabel}: intervalo deve estar dentro do turno de trabalho.`,
      });
    }

    return true;
  });

/**
 * Schema para atualização do perfil do profissional autenticado
 * PATCH /api/professionals/me/profile
 */
export const updateProfessionalProfileSchema = yup.object({
  name: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),

  phone: yup
    .string()
    .matches(phoneRegex, "Telefone deve ter 10 ou 11 dígitos")
    .transform((v) => v?.replace(/\D/g, ""))
    .optional()
    .nullable(),

  professionalCouncil: yup.string().max(50, "Conselho profissional muito longo").optional(),

  registrationNumber: yup.string().max(50, "Número de registro muito longo").optional(),

  registrationState: yup.string().length(2, "Estado deve ter 2 caracteres").uppercase().optional(),

  specialty: yup
    .string()
    .min(2, "Especialidade deve ter no mínimo 2 caracteres")
    .max(100, "Especialidade deve ter no máximo 100 caracteres")
    .optional(),

  defaultAppointmentDuration: yup
    .number()
    .integer("Duração deve ser um número inteiro de minutos")
    .min(5, "Duração mínima de 5 minutos")
    .max(480, "Duração máxima de 480 minutos")
    .optional(),

  bufferTime: yup
    .number()
    .integer("Intervalo deve ser um número inteiro de minutos")
    .min(0, "Intervalo mínimo de 0 minutos")
    .max(120, "Intervalo máximo de 120 minutos")
    .optional(),

  bio: yup.string().max(2000, "Biografia deve ter no máximo 2000 caracteres").optional().nullable(),

  formations: yup
    .string()
    .max(2000, "Formações devem ter no máximo 2000 caracteres")
    .optional()
    .nullable(),

  workingHours: yup.array(workingHourSchema).optional(),

  cpf: rejectField("CPF", CONTACT_CLINIC),
  email: rejectField("E-mail", CONTACT_CLINIC),
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
