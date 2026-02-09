import * as yup from "yup";

/**
 * Schema para convidar profissional (Admin apenas)
 * Apenas nome e email
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
        .min(6, "Senha deve ter no mínimo 6 caracteres")
        .max(50, "Senha deve ter no máximo 50 caracteres"),

    professionalCouncil: yup
        .string()
        .required("Conselho profissional é obrigatório (ex: CRM, CRO)")
        .max(50),

    registrationNumber: yup
        .string()
        .required("Número de registro é obrigatório")
        .max(50),

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
});
