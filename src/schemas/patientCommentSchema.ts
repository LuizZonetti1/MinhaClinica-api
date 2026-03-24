import * as yup from "yup";

export const createPatientCommentSchema = yup.object({
  patientId: yup.string().required("Paciente é obrigatório"),
  content: yup
    .string()
    .required("Conteúdo é obrigatório")
    .min(3, "Comentário deve ter no mínimo 3 caracteres")
    .max(5000, "Comentário deve ter no máximo 5000 caracteres"),
});

export const updatePatientCommentSchema = yup.object({
  content: yup
    .string()
    .required("Conteúdo é obrigatório")
    .min(3, "Comentário deve ter no mínimo 3 caracteres")
    .max(5000, "Comentário deve ter no máximo 5000 caracteres"),
});
