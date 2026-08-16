import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import { ClinicRepository } from "../../repository/clinicRepository";
import { NotificationRepository } from "../../repository/notificationRepository";
import { PatientDashboardRepository } from "../../repository/patientDashboardRepository";
import {
  AppointmentStatus,
  CancellationReason,
  NotificationChannel,
  NotificationType,
  UserRole,
} from "../../types/enums";
import { createEmailProvider, EmailService } from "../email/emailService";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
// Espelha o @default de ClinicSettings.maxCancellationHours (prisma/schema.prisma).
const DEFAULT_MAX_CANCELLATION_HOURS = 24;

export class CancelAppointmentService {
  private repository = new PatientDashboardRepository();
  private clinicRepository = new ClinicRepository();
  private auditLogRepository = new AuditLogRepository();
  private notificationRepository = new NotificationRepository();

  async execute(appointmentId: string, userId: string) {
    const patient = await this.repository.findPatientByUserId(userId);
    if (!patient) {
      throw Object.assign(new Error("Paciente não encontrado"), { statusCode: 404 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId: patient.id,
      },
      select: {
        id: true,
        status: true,
        clinicId: true,
        appointmentDate: true,
        startTime: true,
        professional: {
          select: {
            user: { select: { name: true } },
          },
        },
        clinic: { select: { tradeName: true } },
      },
    });

    if (!appointment) {
      throw Object.assign(new Error("Agendamento não encontrado"), { statusCode: 404 });
    }

    const allowedStatuses: string[] = [
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.WAITING,
    ];

    if (!allowedStatuses.includes(appointment.status)) {
      throw Object.assign(
        new Error("Só é possível cancelar agendamentos com status SCHEDULED, CONFIRMED ou WAITING"),
        { statusCode: 400 },
      );
    }

    // maxCancellationHours — cancelamento pelo próprio paciente é bloqueado
    // muito perto do horário da consulta. Recepção/admin não passam por aqui
    // (cancelamento deles usa outro caminho, sem essa restrição).
    const settings = await this.clinicRepository.findSettingsByClinicId(appointment.clinicId);
    const maxCancellationHours = settings?.maxCancellationHours ?? DEFAULT_MAX_CANCELLATION_HOURS;
    const datePart = dayjs.utc(appointment.appointmentDate).format("YYYY-MM-DD");
    const appointmentStart = dayjs.tz(
      `${datePart} ${appointment.startTime}`,
      "YYYY-MM-DD HH:mm",
      DEFAULT_TIMEZONE,
    );
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    if (
      appointmentStart.isAfter(now) &&
      appointmentStart.diff(now, "hour", true) < maxCancellationHours
    ) {
      throw Object.assign(
        new Error(
          `Cancelamentos só são permitidos com pelo menos ${maxCancellationHours} hora(s) de antecedência. Entre em contato com a clínica.`,
        ),
        { statusCode: 400 },
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason: CancellationReason.PATIENT_REQUEST,
      },
      select: {
        id: true,
        status: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    await this.auditLogRepository.create({
      clinicId: appointment.clinicId,
      userId,
      userName: user?.name ?? "Paciente",
      action: "CANCEL_APPOINTMENT",
      entity: "Appointment",
      entityId: appointment.id,
      oldData: { status: appointment.status },
      newData: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: CancellationReason.PATIENT_REQUEST,
      },
    });

    // Envia email de confirmação do cancelamento (fire-and-forget)
    try {
      if (user) {
        const emailSvc = new EmailService(createEmailProvider());
        const appointmentDate = appointment.appointmentDate.toLocaleDateString("pt-BR");
        const startTime = appointment.startTime.slice(0, 5); // "HH:MM"
        const professionalName = appointment.professional.user.name;
        const clinicName = appointment.clinic.tradeName;
        await emailSvc.sendAppointmentCancellationEmail(
          user.email,
          user.name,
          appointmentDate,
          startTime,
          professionalName,
          clinicName,
        );
      }
    } catch (err) {
      console.error("[cancelAppointmentService] Falha ao enviar email de cancelamento:", err);
    }

    // Alerta a equipe da clínica (ADMIN/RECEPTIONIST) sobre o cancelamento —
    // gate real de ClinicSettings.sendCancellationAlert (default true), que
    // antes existia só no JSON de configurações sem nenhum efeito.
    if (settings?.sendCancellationAlert !== false) {
      try {
        const staffUsers = await this.notificationRepository.findActiveClinicUsers(
          appointment.clinicId,
          [UserRole.ADMIN, UserRole.RECEPTIONIST],
        );
        const appointmentDate = appointment.appointmentDate.toLocaleDateString("pt-BR");
        const startTime = appointment.startTime.slice(0, 5);
        for (const staff of staffUsers) {
          const notification = await this.notificationRepository.create({
            clinicId: appointment.clinicId,
            recipientEmail: staff.email,
            recipientPhone: staff.phone ?? undefined,
            recipientName: staff.name,
            recipientUserId: staff.id,
            type: NotificationType.APPOINTMENT_CANCELLATION,
            channel: NotificationChannel.IN_APP,
            subject: "Consulta cancelada pelo paciente",
            message: `${user?.name ?? "Um paciente"} cancelou a consulta de ${appointmentDate} às ${startTime} com ${appointment.professional.user.name}.`,
            appointmentId: appointment.id,
          });
          await this.notificationRepository.markAsSent(notification.id);
        }
      } catch (err) {
        console.error("[cancelAppointmentService] Falha ao alertar a equipe:", err);
      }
    }

    return updated;
  }
}
