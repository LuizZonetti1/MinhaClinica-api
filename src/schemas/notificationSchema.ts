import * as yup from "yup";

export const announcementSchema = yup.object({
    subject: yup
        .string()
        .required("Assunto é obrigatório")
        .max(200, "Assunto deve ter no máximo 200 caracteres"),
    message: yup
        .string()
        .required("Mensagem é obrigatória")
        .max(2000, "Mensagem deve ter no máximo 2000 caracteres"),
    targetRoles: yup
        .array()
        .of(yup.string().required())
        .optional(),
});

export const sendDirectSchema = yup.object({
    recipientUserId: yup.string().required("Destinatário é obrigatório"),
    subject: yup
        .string()
        .required("Assunto é obrigatório")
        .max(200, "Assunto deve ter no máximo 200 caracteres"),
    message: yup
        .string()
        .required("Mensagem é obrigatória")
        .max(2000, "Mensagem deve ter no máximo 2000 caracteres"),
});
