import type { Gender, UserRole, UserStatus } from "./enums";

export interface CreateUserInput {
  clinicId?: string | null;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
  avatarUrl?: string | null;
  mustChangePassword?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  status?: UserStatus;
}

export interface UserFiltersInput {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export interface RegisterPatientInput {
  name: string;
  email: string;
}

export interface CompletePatientInput {
  cpf: string;
  phone: string;
  password: string;
  dateOfBirth: Date;
  gender: Gender;
  rg?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  alternativePhone?: string;
  bloodType?: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
  observations?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface InviteStaffInput {
  name: string;
  email: string;
  role: Extract<UserRole, "RECEPTIONIST" | "ADMIN">;
}

export interface CompleteStaffInput {
  cpf: string;
  phone: string;
  password: string;
}

export interface InviteProfessionalInput {
  name: string;
  email: string;
}

export interface CompleteProfessionalInput {
  cpf: string;
  phone: string;
  password: string;
  professionalCouncil: string;
  registrationNumber: string;
  registrationState: string;
  defaultAppointmentDuration?: number;
}
