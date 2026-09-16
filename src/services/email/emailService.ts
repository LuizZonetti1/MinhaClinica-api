// ─── Re-exports para retrocompatibilidade ────────────────────────────────────
export * from "./authEmailService";
// Todos os 12 arquivos que importam de "../email/emailService" continuam funcionando
// sem nenhuma alteração. A separação em arquivos foi feita de forma transparente.
export * from "./emailProvider";
export * from "./notificationEmailService";

// ─── EmailService (backward-compatible) ──────────────────────────────────────
// Combina AuthEmailService + NotificationEmailService em uma única classe.
// Mantido para não quebrar nenhum import existente.
import { AuthEmailService } from "./authEmailService";
import type { EmailProvider } from "./emailProvider";
import { NotificationEmailService } from "./notificationEmailService";

export class EmailService {
  private auth: AuthEmailService;
  private notif: NotificationEmailService;

  constructor(provider: EmailProvider) {
    this.auth = new AuthEmailService(provider);
    this.notif = new NotificationEmailService(provider);
  }

  // ─── Auth ────────────────────────────────────────────────────────────────
  sendPatientVerificationEmail = (
    ...args: Parameters<AuthEmailService["sendPatientVerificationEmail"]>
  ) => this.auth.sendPatientVerificationEmail(...args);

  sendClinicOwnerVerificationEmail = (
    ...args: Parameters<AuthEmailService["sendClinicOwnerVerificationEmail"]>
  ) => this.auth.sendClinicOwnerVerificationEmail(...args);

  sendProfessionalInviteEmail = (
    ...args: Parameters<AuthEmailService["sendProfessionalInviteEmail"]>
  ) => this.auth.sendProfessionalInviteEmail(...args);

  sendStaffInviteEmail = (...args: Parameters<AuthEmailService["sendStaffInviteEmail"]>) =>
    this.auth.sendStaffInviteEmail(...args);

  sendClinicExistingAccountEmail = (
    ...args: Parameters<AuthEmailService["sendClinicExistingAccountEmail"]>
  ) => this.auth.sendClinicExistingAccountEmail(...args);

  sendClinicRegistrationAccountInactiveEmail = (
    ...args: Parameters<AuthEmailService["sendClinicRegistrationAccountInactiveEmail"]>
  ) => this.auth.sendClinicRegistrationAccountInactiveEmail(...args);

  sendReceptionWelcomeEmail = (
    ...args: Parameters<AuthEmailService["sendReceptionWelcomeEmail"]>
  ) => this.auth.sendReceptionWelcomeEmail(...args);

  sendEmailChangeConfirmationEmail = (
    ...args: Parameters<AuthEmailService["sendEmailChangeConfirmationEmail"]>
  ) => this.auth.sendEmailChangeConfirmationEmail(...args);

  // ─── Notificações ────────────────────────────────────────────────────────
  sendAppointmentConfirmationEmail = (
    ...args: Parameters<NotificationEmailService["sendAppointmentConfirmationEmail"]>
  ) => this.notif.sendAppointmentConfirmationEmail(...args);

  sendAppointmentReminderEmail = (
    ...args: Parameters<NotificationEmailService["sendAppointmentReminderEmail"]>
  ) => this.notif.sendAppointmentReminderEmail(...args);

  sendAppointmentCancellationEmail = (
    ...args: Parameters<NotificationEmailService["sendAppointmentCancellationEmail"]>
  ) => this.notif.sendAppointmentCancellationEmail(...args);

  sendAppointmentRescheduledEmail = (
    ...args: Parameters<NotificationEmailService["sendAppointmentRescheduledEmail"]>
  ) => this.notif.sendAppointmentRescheduledEmail(...args);

  sendAnnouncementEmail = (
    ...args: Parameters<NotificationEmailService["sendAnnouncementEmail"]>
  ) => this.notif.sendAnnouncementEmail(...args);

  sendDirectMessageEmail = (
    ...args: Parameters<NotificationEmailService["sendDirectMessageEmail"]>
  ) => this.notif.sendDirectMessageEmail(...args);

  sendAccountBlockedEmail = (
    ...args: Parameters<NotificationEmailService["sendAccountBlockedEmail"]>
  ) => this.notif.sendAccountBlockedEmail(...args);

  sendDailyReportEmail = (...args: Parameters<NotificationEmailService["sendDailyReportEmail"]>) =>
    this.notif.sendDailyReportEmail(...args);
}
