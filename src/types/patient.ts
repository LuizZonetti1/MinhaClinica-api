import type { AppointmentChannel, AppointmentType, Gender, UserStatus } from "./enums";

export interface ReceptionRegisterPatientInput {
  // Obrigatórios
  name: string;
  email: string;
  cpf: string;
  phone: string;
  dateOfBirth: Date;
  gender: Gender;

  // Opcionais — documentos
  rg?: string;

  // Opcionais — endereço
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;

  // Opcionais — contato/saúde
  alternativePhone?: string;
  bloodType?: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
  observations?: string;

  // Opcionais — emergência
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface PatientListItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string;
  dateOfBirth: Date;
  gender: Gender;
  status: UserStatus;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  isActive: boolean;
  noShowCount: number;
  totalAppointments: number;
  appointmentsThisMonth: number;
  createdAt: Date;
}

export interface PatientSummary {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

// ── Dashboard do Paciente ────────────────────────────────────────────────────

export interface PatientNextAppointment {
  id: string;
  status: string;
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  type: AppointmentType;
  channel: AppointmentChannel;
  professionalName: string;
  professionalAvatarUrl: string | null;
  primarySpecialty: string | null;
  clinicName: string;
}

export interface PatientDashboardStats {
  upcomingCount: number; // SCHEDULED + CONFIRMED com data >= hoje
  completedCount: number; // COMPLETED
  lastAppointmentDate: string | null; // data ISO da consulta mais recente COMPLETED
  unreadNotifications: number; // placeholder — sempre 0 por enquanto
}

export interface PatientDashboardSummary {
  stats: PatientDashboardStats;
  upcomingAppointments: PatientNextAppointment[];
}

// ── Lista de Consultas do Paciente ───────────────────────────────────────────

export interface PatientAppointmentListItem {
  id: string;
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  type: AppointmentType;
  status: string;
  channel: AppointmentChannel;
  notes: string | null;
  professionalName: string;
  professionalAvatarUrl: string | null;
  primarySpecialty: string | null;
  clinicName: string;
}

export interface PatientAppointmentListResult {
  total: number;
  appointments: PatientAppointmentListItem[];
}

// ── Auto-agendamento do Paciente ─────────────────────────────────────────────

export interface ClinicSearchItem {
  id: string;
  tradeName: string;
  logoUrl: string | null;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface PatientBookingProfessionalItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  specialty: string | null;
  defaultAppointmentDuration: number;
}

export interface PatientBookingInput {
  clinicId: string;
  professionalId: string;
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  type: AppointmentType;
  notes?: string;
  channel?: AppointmentChannel;
}
