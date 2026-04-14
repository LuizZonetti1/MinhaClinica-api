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
  lastVisit: Date | null;
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
  clinicId: string;
  professionalId: string;
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

// ── Consultas de paciente (visão da Recepção) ────────────────────────────────

export interface ReceptionAppointmentItem {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  professionalName: string;
  professionalSpecialty: string | null;
  appointmentType: string;
  status: string;
  notes: string | null;
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

// ── Remarcação de agendamento (paciente) ─────────────────────────────────────

export interface PatientRescheduleInput {
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  clinicId: string;
  professionalId: string;
}

export interface PatientRescheduleResult {
  id: string;
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface PatientAuditAddress {
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}

export interface PatientAuditMedical {
  bloodType: string | null;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  observations: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export interface PatientAuditReportItem {
  id: string;
  appointmentId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  appointmentType: AppointmentType;
  appointmentStatus: string;
  appointmentNotes: string | null;
  professionalName: string;
  professionalSpecialty: string | null;
  chiefComplaint: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  observations: string | null;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientAuditDetails {
  patient: {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    status: UserStatus;
    isActive: boolean;
    cpf: string;
    rg: string | null;
    dateOfBirth: Date;
    gender: Gender;
    alternativePhone: string | null;
    noShowCount: number;
    totalAppointments: number;
    completedAppointments: number;
    lastVisit: Date | null;
    createdAt: Date;
    updatedAt: Date;
    address: PatientAuditAddress;
    medical: PatientAuditMedical;
  };
  reports: PatientAuditReportItem[];
}
