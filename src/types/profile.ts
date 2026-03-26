import type { UserRole } from "./enums";

// ── Resposta do perfil ───────────────────────────────────────────────────────

export interface ProfilePersonalInfo {
  name: string;
  email: string;
  phone: string | null;
  address: string | null; // endereço formatado da clínica: "Rua X, 123 - Cidade/UF"
  avatarUrl: string | null;
}

export interface ProfileClinicInfo {
  tradeName: string;
  role: string; // ex: "Administrador"
  foundedAt: string; // ISO date string
  professionalsCount: number;
}

export interface ProfileAccessInfo {
  role: UserRole;
  lastLoginAt: string | null;
  twoFactorEnabled: boolean;
  sessionActive: boolean;
}

export interface ProfileStats {
  totalPatients: number;
  activeProfessionals: number;
  appointmentsThisMonth: number;
  monthlyRevenue: number;
}

export interface UserProfileResponse {
  personal: ProfilePersonalInfo;
  clinic: ProfileClinicInfo;
  access: ProfileAccessInfo;
  stats: ProfileStats;
}

// ── Perfil da Recepção ───────────────────────────────────────────────────────

export interface ReceptionProfessionalInfo {
  role: string; // ex: "Recepcionista"
  ramal: string | null; // ramal telefônico (não existe no DB ainda)
  admittedAt: string; // ISO date string — data de cadastro na clínica
  shift: string | null; // turno de trabalho (não existe no DB ainda)
}

export interface ReceptionAccessInfo {
  role: UserRole;
  lastLoginAt: string | null;
  sessionActive: boolean;
}

export interface ReceptionProfileResponse {
  personal: ProfilePersonalInfo;
  professional: ReceptionProfessionalInfo;
  access: ReceptionAccessInfo;
}

// ── Perfil do Profissional ───────────────────────────────────────────────────

export interface ProfessionalWorkingHourItem {
  dayOfWeek: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  lunchBreakStart: string | null;
  lunchBreakEnd: string | null;
}

export interface ProfessionalSpecialtyItem {
  specialtyId: string;
  name: string;
  isPrimary: boolean;
}

export interface ProfessionalProfilePersonalInfo {
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
}

export interface ProfessionalProfileInfo {
  professionalCouncil: string;
  registrationNumber: string;
  registrationState: string;
  bio: string | null;
  formations: string | null;
  defaultAppointmentDuration: number;
  bufferTime: number;
  calendarColor: string;
  isActive: boolean;
  joinedAt: string; // ISO date — data em que o profissional foi cadastrado
}

export interface ProfessionalProfileStats {
  totalPatientsAttended: number;
  yearsAtClinic: number;
  avgRating: number; // placeholder — ainda não implementado
  punctualityPercent: number; // placeholder — ainda não implementado
}

export interface ProfessionalProfileResponse {
  personal: ProfessionalProfilePersonalInfo;
  professional: ProfessionalProfileInfo;
  stats: ProfessionalProfileStats;
  specialties: ProfessionalSpecialtyItem[];
  workingHours: ProfessionalWorkingHourItem[];
}

// ── Entrada de atualização ───────────────────────────────────────────────────

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatarUrl?: string | null;
}

export interface UpdateProfessionalProfileInput {
  name?: string;
  phone?: string | null;
  registrationNumber?: string;
  registrationState?: string;
  defaultAppointmentDuration?: number;
  bio?: string | null;
  formations?: string | null;
  workingHours?: Array<{
    dayOfWeek: string;
    isWorking: boolean;
    startTime?: string;
    endTime?: string;
    lunchBreakStart?: string | null;
    lunchBreakEnd?: string | null;
  }>;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// ── Perfil do Paciente ───────────────────────────────────────────────────────

export interface PatientProfilePersonalInfo {
  name: string;
  email: string;
  phone: string | null;
  cpf: string;
  dateOfBirth: string; // "YYYY-MM-DD"
  avatarUrl: string | null;
  // Endereço
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  addressFormatted: string | null; // "Rua X, 123 — São Paulo, SP"
}

export interface PatientProfileMedicalInfo {
  bloodType: string | null;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  observations: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export interface PatientProfileResponse {
  personal: PatientProfilePersonalInfo;
  medical: PatientProfileMedicalInfo;
}

export interface UpdatePatientProfileInput {
  name?: string;
  phone?: string;
  dateOfBirth?: string; // "YYYY-MM-DD"
  // Endereço
  street?: string;
  number?: string;
  complement?: string | null;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}
