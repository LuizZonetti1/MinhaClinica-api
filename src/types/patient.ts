import type { Gender, UserStatus } from "./enums";

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
