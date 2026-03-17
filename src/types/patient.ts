import type { Gender, UserStatus } from "./enums";

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
