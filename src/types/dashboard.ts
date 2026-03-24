export interface DashboardSummary {
  totalPatients: number;
  appointmentsToday: number;
  appointmentsThisMonth: number;
  totalProfessionals: number;
  monthlyBalance: number;
  referenceDate: string;
}

export interface ReceptionDashboardSummary {
  date: string;
  waitingCheckin: number;
  checkinsDone: number;
  pendingConfirmations: number;
}

export type ReceptionTodayAppointmentStatus =
  | "WAITING"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";

export interface ReceptionTodayAppointmentItem {
  id: string;
  time: string;
  patientName: string;
  doctorName: string;
  appointmentType: string;
  status: ReceptionTodayAppointmentStatus;
}

export interface ReceptionAppointmentsTodaySummary {
  consultationsToday: number;
  awaitingCheckin: number;
  checkinsDone: number;
  pendingConfirmations: number;
}

export interface ReceptionAppointmentsTodayResponse {
  summary: ReceptionAppointmentsTodaySummary;
  appointments: ReceptionTodayAppointmentItem[];
}

export interface MonthlyFinancials {
  income: number;
  expense: number;
  balance: number;
}

// Agenda dos Profissionais

export type AgendaFreeSlot = {
  time: string;
  libre: true;
};

export type AgendaAppointmentSlot = {
  time: string;
  libre: false;
  appointmentId: string;
  patientName: string;
  status: string;
};

export type AgendaSlot = AgendaFreeSlot | AgendaAppointmentSlot;

export interface ProfessionalAgenda {
  id: string;
  name: string;
  specialty: string | null;
  avatarUrl: string | null;
  slots: AgendaSlot[];
}

export interface AgendaResponse {
  date: string;
  professionals: ProfessionalAgenda[];
}

// Dashboard do Profissional

export interface ProfessionalDashboardSummary {
  date: string;
  consultasHoje: number;
  confirmadas: number;
  pacientesDoMes: number;
}

export interface ProfessionalAgendaItem {
  id: string;
  time: string; // startTime HH:MM
  endTime: string; // endTime HH:MM
  patientName: string;
  patientAvatarUrl: string | null;
  appointmentType: string;
  status: string;
  notes: string | null;
}

export interface ProfessionalAgendaResponse {
  date: string;
  appointments: ProfessionalAgendaItem[];
}
