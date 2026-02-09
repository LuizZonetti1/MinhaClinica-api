import * as yup from "yup";

/**
 * Schema para registro inicial de paciente (público)
 * Apenas nome e email
 */
export const registerPatientSchema = yup.object({
    clinicId: yup
        .string()
        .required("ID da clínica é obrigatório")
        .uuid("ID da clínica inválido"),

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
 * Schema para completar cadastro de paciente
 */
export const completePatientSchema = yup.object({
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

    dateOfBirth: yup
        .date()
        .required("Data de nascimento é obrigatória")
        .max(new Date(), "Data de nascimento não pode ser futura"),

    gender: yup
        .string()
        .required("Gênero é obrigatório")
        .oneOf(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"], "Gênero inválido"),

    // Opcionais
    rg: yup.string().nullable().max(20),
    zipCode: yup.string().nullable().matches(/^\d{8}$/, "CEP deve conter 8 dígitos"),
    street: yup.string().nullable().max(200),
    number: yup.string().nullable().max(10),
    complement: yup.string().nullable().max(100),
    neighborhood: yup.string().nullable().max(100),
    city: yup.string().nullable().max(100),
    state: yup.string().nullable().matches(/^[A-Z]{2}$/, "Estado deve ter 2 letras maiúsculas"),
    alternativePhone: yup.string().nullable().matches(/^\d{10,11}$/, "Telefone deve conter 10 ou 11 dígitos"),
    allergies: yup.string().nullable(),
    observations: yup.string().nullable(),
});
