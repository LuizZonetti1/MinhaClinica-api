import * as yup from "yup";
import { AppointmentChannel, AppointmentType } from "../types/enums";

export const createPatientBookingSchema = yup.object({
  clinicId: yup.string().required("Clínica é obrigatória"),
  professionalId: yup.string().required("Profissional é obrigatório"),
  appointmentDate: yup
    .string()
    .required("Data é obrigatória")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  startTime: yup
    .string()
    .required("Horário é obrigatório")
    .matches(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"),
  type: yup
    .string()
    .oneOf(Object.values(AppointmentType), "Tipo de consulta inválido")
    .required("Tipo de consulta é obrigatório"),
  notes: yup.string().optional(),
  channel: yup.string().oneOf(Object.values(AppointmentChannel), "Canal inválido").optional(),
});
