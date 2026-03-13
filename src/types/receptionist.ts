import type { UserRole, UserStatus } from "./enums";

export interface ReceptionistListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  role: UserRole;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  appointmentsThisMonth: number;
}

export interface ReceptionDetails {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  registrationStatus: string;
  role: UserRole;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  appointmentsThisMonth: number;
  upcomingActiveAppointments: number;
  canDeactivate: boolean;
}
