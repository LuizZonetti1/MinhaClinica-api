import * as yup from "yup";
import { AppointmentType } from "../types/enums";

export const createProcedureSchema = yup.object({
  name: yup
    .string()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(80, "Nome deve ter no máximo 80 caracteres")
    .required("Nome é obrigatório"),
  defaultDuration: yup
    .number()
    .integer("Duração deve ser um número inteiro de minutos")
    .min(5, "Duração mínima de 5 minutos")
    .max(480, "Duração máxima de 480 minutos")
    .required("Duração é obrigatória"),
  defaultType: yup
    .string()
    .oneOf(Object.values(AppointmentType), "Tipo de procedimento inválido")
    .optional(),
});

export const updateProcedureSchema = yup.object({
  name: yup
    .string()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(80, "Nome deve ter no máximo 80 caracteres")
    .optional(),
  defaultDuration: yup
    .number()
    .integer("Duração deve ser um número inteiro de minutos")
    .min(5, "Duração mínima de 5 minutos")
    .max(480, "Duração máxima de 480 minutos")
    .optional(),
  isActive: yup.boolean().optional(),
  defaultType: yup
    .string()
    .oneOf(Object.values(AppointmentType), "Tipo de procedimento inválido")
    .optional(),
});
