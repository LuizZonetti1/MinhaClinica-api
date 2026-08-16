import * as yup from "yup";
import { stripHtmlTags } from "../utils/sanitizeText";

export const createScheduleBlockSchema = yup.object({
  startDateTime: yup
    .date()
    .typeError("Data/hora de início inválida")
    .required("Início é obrigatório"),
  endDateTime: yup
    .date()
    .typeError("Data/hora de término inválida")
    .required("Término é obrigatório")
    .when("startDateTime", ([startDateTime], schema) =>
      startDateTime ? schema.min(startDateTime, "Término deve ser depois do início") : schema,
    ),
  reason: yup
    .string()
    .transform((v) => (typeof v === "string" ? stripHtmlTags(v) : v))
    .min(2, "Motivo deve ter no mínimo 2 caracteres")
    .max(200, "Motivo deve ter no máximo 200 caracteres")
    .required("Motivo é obrigatório"),
  isAllDay: yup.boolean().optional().default(false),
});
