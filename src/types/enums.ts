export const UserRole = {
  ADMIN: "ADMIN",
  RECEPTIONIST: "RECEPTIONIST",
  PROFESSIONAL: "PROFESSIONAL",
  PATIENT: "PATIENT",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
  PENDING_ACTIVATION: "PENDING_ACTIVATION",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
  PREFER_NOT_TO_SAY: "PREFER_NOT_TO_SAY",
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const AppointmentType = {
  CONSULTATION: "CONSULTATION",
  RETURN: "RETURN",
  EXAM: "EXAM",
  EMERGENCY: "EMERGENCY",
} as const;

export type AppointmentType = (typeof AppointmentType)[keyof typeof AppointmentType];

export const AppointmentStatus = {
  SCHEDULED: "SCHEDULED",
  CONFIRMED: "CONFIRMED",
  WAITING: "WAITING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  COMPLETED_WITH_ADDENDUM: "COMPLETED_WITH_ADDENDUM",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
  RESCHEDULED: "RESCHEDULED",
} as const;

export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const DocumentType = {
  CLINICAL_REPORT: "CLINICAL_REPORT",
  EXAM_REQUEST: "EXAM_REQUEST",
  CERTIFICATE: "CERTIFICATE",
  ATTENDANCE_DECLARATION: "ATTENDANCE_DECLARATION",
  PRESCRIPTION: "PRESCRIPTION",
  CONTROLLED_PRESCRIPTION: "CONTROLLED_PRESCRIPTION",
  REFERRAL: "REFERRAL",
  MEDICAL_REPORT: "MEDICAL_REPORT",
  CONSENT_FORM: "CONSENT_FORM",
  TREATMENT_PLAN: "TREATMENT_PLAN",
  BUDGET: "BUDGET",
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const DocumentStatus = {
  DRAFT: "DRAFT",
  FINALIZED: "FINALIZED",
  SENT: "SENT",
  ADDENDUM: "ADDENDUM",
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const AppointmentChannel = {
  IN_PERSON: "IN_PERSON",
  PHONE: "PHONE",
  ONLINE_PORTAL: "ONLINE_PORTAL",
  WHATSAPP: "WHATSAPP",
} as const;

export type AppointmentChannel = (typeof AppointmentChannel)[keyof typeof AppointmentChannel];

export const CancellationReason = {
  PATIENT_REQUEST: "PATIENT_REQUEST",
  PROFESSIONAL_UNAVAILABLE: "PROFESSIONAL_UNAVAILABLE",
  CLINIC_CLOSURE: "CLINIC_CLOSURE",
  EMERGENCY: "EMERGENCY",
  RESCHEDULED: "RESCHEDULED",
  OTHER: "OTHER",
} as const;

export type CancellationReason = (typeof CancellationReason)[keyof typeof CancellationReason];

export const TransactionType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const PaymentMethod = {
  CASH: "CASH",
  DEBIT_CARD: "DEBIT_CARD",
  CREDIT_CARD: "CREDIT_CARD",
  PIX: "PIX",
  BANK_TRANSFER: "BANK_TRANSFER",
  CHECK: "CHECK",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const NotificationType = {
  APPOINTMENT_CONFIRMATION: "APPOINTMENT_CONFIRMATION",
  APPOINTMENT_REMINDER: "APPOINTMENT_REMINDER",
  APPOINTMENT_CANCELLATION: "APPOINTMENT_CANCELLATION",
  APPOINTMENT_RESCHEDULED: "APPOINTMENT_RESCHEDULED",
  PASSWORD_RESET: "PASSWORD_RESET",
  WELCOME: "WELCOME",
  BIRTHDAY: "BIRTHDAY",
  NO_SHOW_WARNING: "NO_SHOW_WARNING",
  SYSTEM_ALERT: "SYSTEM_ALERT",
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationChannel = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  WHATSAPP: "WHATSAPP",
  IN_APP: "IN_APP",
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NotificationStatus = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED",
  READ: "READ",
} as const;

export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

export const DayOfWeek = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const;

export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];
