import type { UserRole, UserStatus } from "./enums";

export interface ReceptionistListItem {
  /** userId — ou o id do convite, quando registrationStatus = "INVITE_SENT". */
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  /** "INVITE_SENT" | "INVITE_EXPIRED" | "COMPLETED" */
  registrationStatus: string;
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
