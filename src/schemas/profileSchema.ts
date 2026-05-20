import * as yup from "yup";

const phoneRegex = /^\d{10,11}$/;
const timeRegex = /^\d{2}:\d{2}$/;

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

const workingHourSchema = yup.object({
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
});

/**
 * Schema para atualização do perfil do profissional autenticado
 * PATCH /api/professionals/me/profile
 */
export const updateProfessionalProfileSchema = yup.object({
  name: yup
    .string()
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

  bio: yup.string().max(2000, "Biografia deve ter no máximo 2000 caracteres").optional().nullable(),

  formations: yup
    .string()
    .max(2000, "Formações devem ter no máximo 2000 caracteres")
    .optional()
    .nullable(),

  workingHours: yup.array(workingHourSchema).optional(),
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
