import type { UserStatus } from "./enums";

export interface ProfessionalListItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  isActive: boolean;
  professionalCouncil: string;
  registrationNumber: string;
  registrationState: string;
  specialties: string[];
  appointmentsThisMonth: number;
}

export interface ProfessionalDetails {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  registrationStatus: string;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  isActive: boolean;
  professionalCouncil: string;
  registrationNumber: string;
  registrationState: string;
  defaultAppointmentDuration: number;
  specialties: Array<{ id: string; name: string; isPrimary: boolean }>;
  appointmentsThisMonth: number;
  upcomingActiveAppointments: number;
  canDeactivate: boolean;
}
