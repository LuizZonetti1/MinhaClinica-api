import * as yup from "yup";
import { AppointmentType } from "../types/enums";
import { stripHtmlTags } from "../utils/sanitizeText";

export const createProcedureSchema = yup.object({
  name: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(80, "Nome deve ter no máximo 80 caracteres")
    .required("Nome é obrigatório"),
  defaultDuration: yup
    .number()
    .integer("Duração deve ser um número inteiro de minutos")
    .min(5, "Duração mínima de 5 minutos")
    .max(480, "Duração máxima de 480 minutos")
    .required("Duração é obrigatória"),
  defaultPrice: yup
    .number()
    .typeError("Preço deve ser um número")
    .min(0, "Preço não pode ser negativo")
    .max(99999999.99, "Preço máximo excedido")
    .optional()
    .nullable(),
  defaultType: yup
    .string()
    .oneOf(Object.values(AppointmentType), "Tipo de procedimento inválido")
    .optional(),
});

export const setMyProceduresSchema = yup.object({
  procedureIds: yup
    .array()
    .of(yup.string().required())
    .required("Lista de procedimentos é obrigatória"),
});

export const updateProcedureSchema = yup.object({
  name: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(80, "Nome deve ter no máximo 80 caracteres")
    .optional(),
  defaultDuration: yup
    .number()
    .integer("Duração deve ser um número inteiro de minutos")
    .min(5, "Duração mínima de 5 minutos")
    .max(480, "Duração máxima de 480 minutos")
    .optional(),
  defaultPrice: yup
    .number()
    .typeError("Preço deve ser um número")
    .min(0, "Preço não pode ser negativo")
    .max(99999999.99, "Preço máximo excedido")
    .optional()
    .nullable(),
  isActive: yup.boolean().optional(),
  defaultType: yup
    .string()
    .oneOf(Object.values(AppointmentType), "Tipo de procedimento inválido")
    .optional(),
});
