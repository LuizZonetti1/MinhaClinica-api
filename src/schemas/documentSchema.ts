import * as yup from "yup";
import { DocumentType } from "../types/enums";

const documentTypeValues = Object.values(DocumentType);

export const createDocumentSchema = yup.object({
  type: yup
    .string()
    .required("Tipo do documento é obrigatório")
    .oneOf(documentTypeValues, "Tipo de documento inválido"),
  content: yup.mixed().required("Conteúdo do documento é obrigatório"),
  internalNotes: yup.string().nullable().optional(),
});

export const updateDocumentSchema = yup.object({
  content: yup.mixed().required("Conteúdo do documento é obrigatório"),
  internalNotes: yup.string().nullable().optional(),
});

export const createAddendumSchema = yup.object({
  type: yup
    .string()
    .required("Tipo do documento é obrigatório")
    .oneOf(documentTypeValues, "Tipo de documento inválido"),
  content: yup.mixed().required("Conteúdo do documento é obrigatório"),
  originalDocumentId: yup
    .string()
    .uuid("ID do documento original deve ser um UUID válido")
    .nullable()
    .optional(),
  internalNotes: yup.string().nullable().optional(),
});
