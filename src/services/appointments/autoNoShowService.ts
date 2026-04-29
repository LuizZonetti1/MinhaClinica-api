import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { NotificationRepository } from "../../repository/notificationRepository";
import { AppointmentStatus } from "../../types/enums";
import { PENDING_CHECKIN_STATUSES } from "../../utils/appointmentStatusRules";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const NO_SHOW_GRACE_MINUTES = 30;

export class AutoNoShowService {
  async markOverdueByClinic(clinicId: string, now = dayjs().tz(DEFAULT_TIMEZONE)): Promise<number> {
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

        const noShowDeadline = appointmentStart.add(NO_SHOW_GRACE_MINUTES, "minute");
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
        },
      })
      .then(async (appts) => {
        const notifRepo = new NotificationRepository();
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

          // Bloquear conta após 3 faltas
          const noShowCount = await notifRepo.countPatientNoShows(appt.patientId);
          if (noShowCount >= 3) {
            await prisma.user.updateMany({
              where: { id: user.id },
              data: { status: "BLOCKED" },
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
          }
        }
      })
      .catch(() => { });

    return result.count;
  }
}

