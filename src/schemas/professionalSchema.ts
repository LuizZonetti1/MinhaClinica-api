import * as yup from "yup";

/**
 * Schema para convidar profissional (Admin apenas)
 * Campos de pre-cadastro: nome, email e especialidade
 */
export const inviteProfessionalSchema = yup.object({
  name: yup
    .string()
    .required("Nome é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),

  email: yup
    .string()
    .required("Email é obrigatório")
    .email("Email inválido")
    .max(100, "Email deve ter no máximo 100 caracteres"),

  specialty: yup
    .string()
    .required("Especialidade é obrigatória")
    .min(2, "Especialidade deve ter no mínimo 2 caracteres")
    .max(100, "Especialidade deve ter no máximo 100 caracteres"),
});

/**
 * Schema para completar cadastro de profissional
 */
export const completeProfessionalSchema = yup.object({
  cpf: yup
    .string()
    .required("CPF é obrigatório")
    .matches(/^\d{11}$/, "CPF deve conter exatamente 11 dígitos"),

  phone: yup
    .string()
    .required("Telefone é obrigatório")
    .matches(/^\d{10,11}$/, "Telefone deve conter 10 ou 11 dígitos"),

  password: yup
    .string()
    .required("Senha é obrigatória")
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(50, "Senha deve ter no máximo 50 caracteres"),

  professionalCouncil: yup
    .string()
    .required("Conselho profissional é obrigatório (ex: CRM, CRO)")
    .max(50),

  registrationNumber: yup.string().required("Número de registro é obrigatório").max(50),

  registrationState: yup
    .string()
    .required("Estado de registro é obrigatório")
    .matches(/^[A-Z]{2}$/, "Estado deve ter 2 letras maiúsculas"),

  defaultAppointmentDuration: yup
    .number()
    .nullable()
    .positive("Duração deve ser positiva")
    .integer("Duração deve ser um número inteiro")
    .default(30),

  formations: yup.string().optional(),
});

/**
 * Schema para atualizar profissional (Admin)
 * Todos os campos sao opcionais, mas ao menos um deve ser enviado
 */
export const updateProfessionalSchema = yup
  .object({
    name: yup
      .string()
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
