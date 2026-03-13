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

// ── Entrada de atualização ───────────────────────────────────────────────────

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
