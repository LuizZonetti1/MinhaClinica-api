// ── Tipos de leitura ────────────────────────────────────────────────────────

export interface ClinicInfo {
  id: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string;
  website?: string | null;
  logoUrl?: string | null;
  zipCode: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicScheduleSettings {
  openTime: string;
  closeTime: string;
  minIntervalBetweenAppointments: number;
  workingDaysPreset: WorkingDaysPreset;
}

export interface ClinicNotificationSettings {
  sendAppointmentReminder: boolean;
  sendCancellationAlert: boolean;
  sendNewPatientAlert: boolean;
  sendDailyReport: boolean;
}

export interface ClinicSecuritySettings {
  twoFactorEnabled: boolean;
  accessLogEnabled: boolean;
  sessionTimeoutMinutes: number;
}

export interface ClinicSettingsResponse {
  info: ClinicInfo;
  schedule: ClinicScheduleSettings;
  notifications: ClinicNotificationSettings;
  security: ClinicSecuritySettings;
}

// ── Presets de dias de atendimento ──────────────────────────────────────────

export enum WorkingDaysPreset {
  WEEKDAYS = "WEEKDAYS", // Segunda a Sexta
  MON_TO_SAT = "MON_TO_SAT", // Segunda a Sábado
  ALL_WEEK = "ALL_WEEK", // Todos os dias
}

// ── Entradas de atualização ─────────────────────────────────────────────────

export interface UpdateClinicInfoInput {
  tradeName?: string;
  legalName?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  website?: string | null;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string | null;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface UpdateClinicScheduleInput {
  openTime?: string;
  closeTime?: string;
  minIntervalBetweenAppointments?: number;
  workingDaysPreset?: WorkingDaysPreset;
}

export interface UpdateClinicNotificationsInput {
  sendAppointmentReminder?: boolean;
  sendCancellationAlert?: boolean;
  sendNewPatientAlert?: boolean;
  sendDailyReport?: boolean;
}

export interface UpdateClinicSecurityInput {
  twoFactorEnabled?: boolean;
  accessLogEnabled?: boolean;
  sessionTimeoutMinutes?: number;
}
