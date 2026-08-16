import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import { ClinicRepository } from "../../repository/clinicRepository";
import { NotificationRepository } from "../../repository/notificationRepository";
import { AppointmentStatus } from "../../types/enums";
import { PENDING_CHECKIN_STATUSES } from "../../utils/appointmentStatusRules";
import { createEmailProvider, EmailService } from "../email/emailService";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
// Espelham os @default do model ClinicSettings (prisma/schema.prisma) para
// clínicas sem linha de settings ainda criada (upsert só roda ao salvar a tela).
const DEFAULT_APPOINTMENT_TOLERANCE_MINUTES = 15;
const DEFAULT_MAX_CONSECUTIVE_NO_SHOWS = 3;

export class AutoNoShowService {
  private readonly clinicRepository = new ClinicRepository();

  async markOverdueByClinic(clinicId: string, now = dayjs().tz(DEFAULT_TIMEZONE)): Promise<number> {
    const settings = await this.clinicRepository.findSettingsByClinicId(clinicId);
    const toleranceMinutes =
      settings?.appointmentToleranceMinutes ?? DEFAULT_APPOINTMENT_TOLERANCE_MINUTES;
    const maxConsecutiveNoShows =
      settings?.maxConsecutiveNoShows ?? DEFAULT_MAX_CONSECUTIVE_NO_SHOWS;

    const pendingCheckinAppointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        status: { in: [...PENDING_CHECKIN_STATUSES] },
        appointmentDate: { lte: now.endOf("day").toDate() },
      },
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
      },
    });

    const overdueIds = pendingCheckinAppointments
      .filter((appointment) => {
        // @db.Date is stored at UTC midnight; utc() keeps calendar day stable.
        const datePart = dayjs.utc(appointment.appointmentDate).format("YYYY-MM-DD");
        const appointmentStart = dayjs.tz(
          `${datePart} ${appointment.startTime}`,
          "YYYY-MM-DD HH:mm",
          DEFAULT_TIMEZONE,
        );

        if (!appointmentStart.isValid()) return false;

        const noShowDeadline = appointmentStart.add(toleranceMinutes, "minute");
        return !noShowDeadline.isAfter(now);
      })
      .map((appointment) => appointment.id);

    if (overdueIds.length === 0) return 0;

    const result = await prisma.appointment.updateMany({
      where: {
        id: { in: overdueIds },
        status: { in: [...PENDING_CHECKIN_STATUSES] },
      },
      data: { status: AppointmentStatus.NO_SHOW },
    });

    // Notificar pacientes sobre no-show (fire-and-forget)
    prisma.appointment
      .findMany({
        where: { id: { in: overdueIds } },
        select: {
          id: true,
          clinicId: true,
          patientId: true,
          patient: {
            select: {
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
          clinic: { select: { tradeName: true } },
        },
      })
      .then(async (appts) => {
        const notifRepo = new NotificationRepository();
        const auditLogRepo = new AuditLogRepository();
        for (const appt of appts) {
          const user = appt.patient?.user;
          if (!user) continue;
          const n = await notifRepo.create({
            clinicId: appt.clinicId,
            recipientEmail: user.email,
            recipientPhone: user.phone ?? undefined,
            recipientName: user.name,
            recipientUserId: user.id,
            type: "NO_SHOW_WARNING",
            channel: "IN_APP",
            subject: "Falta registrada",
            message:
              "Registramos sua ausência na consulta agendada. Caso precise reagendar, entre em contato com a clínica.",
            appointmentId: appt.id,
          });
          await notifRepo.markAsSent(n.id);

          // Bloquear conta após maxConsecutiveNoShows faltas (configurável por clínica)
          const noShowCount = await notifRepo.countPatientNoShows(appt.patientId);
          if (noShowCount >= maxConsecutiveNoShows) {
            await prisma.user.updateMany({
              where: { id: user.id },
              data: { status: "BLOCKED" },
            });

            await auditLogRepo.create({
              clinicId: appt.clinicId,
              userId: null,
              userName: "Sistema (rotina automática de faltas)",
              action: "BLOCK_PATIENT_AUTO_NO_SHOW",
              entity: "User",
              entityId: user.id,
              oldData: { status: "ACTIVE" },
              newData: { status: "BLOCKED", noShowCount, maxConsecutiveNoShows },
            });

            const blocked = await notifRepo.create({
              clinicId: appt.clinicId,
              recipientEmail: user.email,
              recipientPhone: user.phone ?? undefined,
              recipientName: user.name,
              recipientUserId: user.id,
              type: "ACCOUNT_BLOCKED",
              channel: "IN_APP",
              subject: "Conta bloqueada",
              message:
                "Sua conta foi bloqueada por excesso de faltas nas consultas agendadas. Entre em contato com a clínica.",
              appointmentId: appt.id,
            });
            await notifRepo.markAsSent(blocked.id);

            // Único canal alcançável pelo paciente bloqueado (ver comentário em
            // sendAccountBlockedEmail) — falha aqui não deve derrubar o loop.
            try {
              const emailSvc = new EmailService(createEmailProvider());
              await emailSvc.sendAccountBlockedEmail(
                user.email,
                user.name,
                appt.clinic.tradeName,
                maxConsecutiveNoShows,
              );
            } catch (err) {
              console.error("[autoNoShowService] Falha ao enviar email de bloqueio:", err);
            }
          }
        }
      })
      .catch(() => {});

    return result.count;
  }
}
