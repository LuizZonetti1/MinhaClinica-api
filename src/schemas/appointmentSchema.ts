import * as yup from "yup";
import { AppointmentChannel, AppointmentType } from "../types/enums";

export const createAppointmentSchema = yup.object({
  patientId: yup.string().required("Paciente é obrigatório"),
  professionalId: yup.string().required("Profissional é obrigatório"),
  type: yup
    .string()
    .oneOf(Object.values(AppointmentType), "Tipo de consulta inválido")
    .required("Tipo de consulta é obrigatório"),
  appointmentDate: yup
    .string()
    .required("Data é obrigatória")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  startTime: yup
    .string()
    .required("Hora de início é obrigatória")
    .matches(/^\d{2}:\d{2}$/, "Hora deve estar no formato HH:MM"),
  notes: yup.string().optional(),
  channel: yup
    .string()
    .oneOf(Object.values(AppointmentChannel), "Canal inválido")
    .optional(),
  procedureId: yup.string().optional(),
});
