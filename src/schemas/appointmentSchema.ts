import * as yup from "yup";
import { AppointmentChannel, AppointmentStatus, AppointmentType } from "../types/enums";

// Status permitidos para check-in via recepção
const CHECKIN_ALLOWED_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.WAITING,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.NO_SHOW,
  AppointmentStatus.CANCELLED,
] as const;

export const updateAppointmentStatusSchema = yup.object({
  status: yup
    .string()
    .required("Status é obrigatório")
    .oneOf(CHECKIN_ALLOWED_STATUSES, "Status inválido"),
});

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
  channel: yup.string().oneOf(Object.values(AppointmentChannel), "Canal inválido").optional(),
  procedureId: yup.string().optional(),
});

export const rescheduleAppointmentSchema = yup.object({
  appointmentDate: yup
    .string()
    .required("Data é obrigatória")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  startTime: yup
    .string()
    .required("Horário é obrigatório")
    .matches(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"),
  clinicId: yup.string().required("Clínica é obrigatória"),
  professionalId: yup.string().required("Profissional é obrigatório"),
});
