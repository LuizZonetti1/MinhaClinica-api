import * as yup from "yup";

/**
 * Schema para convidar recepcionista (Admin apenas)
 * Apenas nome e email
 */
export const inviteStaffSchema = yup.object({
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

    role: yup
        .string()
        .required("Papel é obrigatório")
        .oneOf(["RECEPTIONIST", "ADMIN"], "Papel deve ser RECEPTIONIST ou ADMIN"),
});

/**
 * Schema para completar cadastro de staff (recepcionista/admin)
 */
export const completeStaffSchema = yup.object({
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
});
