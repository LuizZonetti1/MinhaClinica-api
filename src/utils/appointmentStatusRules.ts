import { AppointmentStatus, type AppointmentStatus as AppointmentStatusType } from "../types/enums";

export const CONSULTATION_EXCLUDED_STATUSES = [
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
  AppointmentStatus.RESCHEDULED,
] as ReadonlyArray<AppointmentStatusType>;

export const PENDING_CHECKIN_STATUSES = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
] as ReadonlyArray<AppointmentStatusType>;

export const CHECKIN_DONE_STATUSES = [
  AppointmentStatus.WAITING,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
] as ReadonlyArray<AppointmentStatusType>;

export const isConsultationCountableStatus = (status: AppointmentStatusType): boolean =>
  !CONSULTATION_EXCLUDED_STATUSES.includes(status);
