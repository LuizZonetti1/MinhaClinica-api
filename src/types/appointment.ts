import type { AppointmentChannel, AppointmentType } from "./enums";

// ── Busca de pacientes (Etapa 1) ──────────────────────────────────────────────

export interface PatientSearchItem {
  patientId: string;
  userId: string;
  name: string;
  cpf: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
}

// ── Listagem de profissionais (Etapa 2) ───────────────────────────────────────

export interface ProfessionalListItem {
  id: string;
  userId: string;
  name: string;
  specialty: string | null;
  defaultAppointmentDuration: number;
  bufferTime: number;
  calendarColor: string;
  avatarUrl: string | null;
  /** Dias da semana com atendimento configurado (ex: ["MONDAY", "TUESDAY"]). */
  workingDays: string[];
}

// ── Slots disponíveis (Etapa 2) ───────────────────────────────────────────────

export interface TimeSlot {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  available: boolean; // false = já tem agendamento nesse horário
}

export type SlotsUnavailableReason =
  | "NO_WORKING_HOURS" // profissional nunca configurou horários
  | "DAY_OFF" // não atende neste dia da semana
  | "DATE_BLOCKED" // bloqueio de agenda cobrindo o dia
  | "FULLY_BOOKED" // todos os slots ocupados
  | "PAST_DATE" // data já passou
  | "HOLIDAY" // feriado cadastrado pela clínica (ClinicHoliday)
  | "OUTSIDE_BOOKING_WINDOW" // além de maxAdvanceBookingDays
  | "ONLINE_BOOKING_DISABLED"; // clínica desligou allowOnlineBooking (só portal)

export interface AvailableSlotsResult {
  date: string; // "YYYY-MM-DD"
  professionalId: string;
  duration: number; // minutos por consulta
  bufferTime: number; // minutos de intervalo
  slots: TimeSlot[];
  reason?: SlotsUnavailableReason;
}

// ── Criação do agendamento (Etapa 3) ──────────────────────────────────────────

export interface CreateAppointmentInput {
  patientId: string;
  professionalId: string;
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  // Opcional quando procedureId é enviado: nesse caso o tipo vem de
  // Procedure.defaultType. Sem procedureId, cai em CONSULTATION se omitido.
  type?: AppointmentType;
  channel?: AppointmentChannel;
  notes?: string;
  procedureId?: string;
}

export interface AppointmentCreatedResult {
  id: string;
  patientName: string;
  patientCpf: string;
  professionalName: string;
  professionalSpecialty: string | null;
  clinicName: string;
  clinicAddress: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  notes: string | null;
}

// ── Listagem de consultas por dia (calendário) ────────────────────────────────

export interface AppointmentCalendarItem {
  id: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  status: string;
  patientId: string;
  patientName: string;
  patientAvatarUrl: string | null;
  professionalName: string;
  professionalId: string;
}

// ── Pacientes com consulta concluída (para comentários) ───────────────────────

export interface CompletedPatientItem {
  patientId: string;
  name: string;
  avatarUrl: string | null;
  lastCompletedAt: string; // ISO date do appointmentDate mais recente
}

export interface AppointmentCalendarDay {
  date: string; // "YYYY-MM-DD"
  appointments: AppointmentCalendarItem[];
}

export interface AppointmentCalendarResult {
  rangeStart: string; // "YYYY-MM-DD"
  rangeEnd: string; // "YYYY-MM-DD"
  days: AppointmentCalendarDay[];
}
