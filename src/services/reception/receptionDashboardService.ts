import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ReceptionDashboardRepository } from "../../repository/receptionDashboardRepository";
import { AutoNoShowService } from "../appointments/autoNoShowService";
import type {
  ReceptionAppointmentsTodayResponse,
  ReceptionDashboardSummary,
  ReceptionTodayAppointmentStatus,
} from "../../types/dashboard";
import {
  AppointmentStatus,
  type AppointmentStatus as AppointmentStatusType,
  AppointmentType,
  type AppointmentType as AppointmentTypeType,
} from "../../types/enums";
import {
  CHECKIN_DONE_STATUSES,
  CONSULTATION_EXCLUDED_STATUSES,
  PENDING_CHECKIN_STATUSES,
} from "../../utils/appointmentStatusRules";

const APPOINTMENT_TYPE_LABELS: Record<AppointmentTypeType, string> = {
  [AppointmentType.CONSULTATION]: "Consulta",
  [AppointmentType.RETURN]: "Retorno",
  [AppointmentType.EXAM]: "Exame",
  [AppointmentType.EMERGENCY]: "Emergencia",
};

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export class ReceptionDashboardService {
  private repository = new ReceptionDashboardRepository();

  private autoNoShowService = new AutoNoShowService();

  private resolveDay(date?: string) {
    if (!date) return dayjs().tz(DEFAULT_TIMEZONE);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw Object.assign(new Error("Parametro 'date' deve estar no formato YYYY-MM-DD"), {
        statusCode: 400,
      });
    }

    const parsed = dayjs.tz(date, DEFAULT_TIMEZONE);
    if (!parsed.isValid()) {
      throw Object.assign(new Error("Data invalida. Use o formato YYYY-MM-DD"), { statusCode: 400 });
    }

    return parsed;
  }

  private mapAppointmentStatus(status: AppointmentStatusType): ReceptionTodayAppointmentStatus {
    if (PENDING_CHECKIN_STATUSES.includes(status)) return "WAITING";
    if (status === AppointmentStatus.WAITING) return "CHECKED_IN";
    if (status === AppointmentStatus.IN_PROGRESS) return "IN_PROGRESS";
    if (status === AppointmentStatus.COMPLETED) return "DONE";
    return "CANCELLED";
  }

  private async autoMarkPendingCheckinAsNoShow(clinicId: string, now: dayjs.Dayjs): Promise<void> {
    await this.autoNoShowService.markOverdueByClinic(clinicId, now);
  }

  async getSummary(clinicId: string): Promise<ReceptionDashboardSummary> {
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const todayStr = now.format("YYYY-MM-DD");
    // appointmentDate é @db.Date → armazenado como UTC midnight.
    // Usar UTC puro evita o shift de fuso (SP = UTC-3).
    const startOfDay = dayjs.utc(todayStr).startOf("day").toDate();
    const endOfDay = dayjs.utc(todayStr).endOf("day").toDate();

    await this.autoMarkPendingCheckinAsNoShow(clinicId, now);

    const [waitingCheckin, checkinsDone, pendingConfirmations] = await Promise.all([
      this.repository.countTodayByStatuses(
        clinicId,
        [...PENDING_CHECKIN_STATUSES],
        startOfDay,
        endOfDay,
      ),
      this.repository.countTodayByStatuses(clinicId, [...CHECKIN_DONE_STATUSES], startOfDay, endOfDay),
      this.repository.countTodayByStatuses(
        clinicId,
        [AppointmentStatus.SCHEDULED],
        startOfDay,
        endOfDay,
      ),
    ]);

    return {
      date: now.format("YYYY-MM-DD"),
      waitingCheckin,
      checkinsDone,
      pendingConfirmations,
    };
  }

  async getAppointmentsToday(
    clinicId: string,
    date?: string,
  ): Promise<ReceptionAppointmentsTodayResponse> {
    const day = this.resolveDay(date);
    const dateFormatted = day.format("YYYY-MM-DD");
    // appointmentDate é @db.Date → armazenado como UTC midnight.
    // Usar UTC puro evita o shift de fuso (SP = UTC-3).
    const startOfDay = dayjs.utc(dateFormatted).startOf("day").toDate();
    const endOfDay = dayjs.utc(dateFormatted).endOf("day").toDate();
    const now = dayjs().tz(DEFAULT_TIMEZONE);

    await this.autoMarkPendingCheckinAsNoShow(clinicId, now);

    const [consultationsToday, awaitingCheckin, checkinsDone, pendingConfirmations, appointments] =
      await Promise.all([
        this.repository.countByDateExcludingStatuses(
          clinicId,
          [...CONSULTATION_EXCLUDED_STATUSES],
          startOfDay,
          endOfDay,
        ),
        this.repository.countTodayByStatuses(
          clinicId,
          [...PENDING_CHECKIN_STATUSES],
          startOfDay,
          endOfDay,
        ),
        this.repository.countTodayByStatuses(
          clinicId,
          [...CHECKIN_DONE_STATUSES],
          startOfDay,
          endOfDay,
        ),
        this.repository.countTodayByStatuses(
          clinicId,
          [AppointmentStatus.SCHEDULED],
          startOfDay,
          endOfDay,
        ),
        this.repository.listAppointmentsByDate(clinicId, startOfDay, endOfDay),
      ]);

    return {
      summary: {
        consultationsToday,
        awaitingCheckin,
        checkinsDone,
        pendingConfirmations,
      },
      appointments: appointments.map((appointment) => ({
        id: appointment.id,
        time: appointment.startTime,
        patientName: appointment.patient.user.name,
        doctorName: appointment.professional.user.name,
        appointmentType:
          APPOINTMENT_TYPE_LABELS[appointment.type as AppointmentTypeType] ?? appointment.type,
        status: this.mapAppointmentStatus(appointment.status as AppointmentStatusType),
      })),
    };
  }
}

export class UpdateCheckinStatusService {
  private repository = new ReceptionDashboardRepository();

  async execute(clinicId: string, appointmentId: string, status: string) {
    const appointment = await this.repository.findAppointmentById(clinicId, appointmentId);

    if (!appointment) {
      throw Object.assign(new Error("Agendamento nao encontrado"), { statusCode: 404 });
    }

    const updated = await this.repository.updateAppointmentStatus(appointmentId, status);

    // Notificações de check-in e conclusão (fire-and-forget)
    if (status === "WAITING" || status === "COMPLETED") {
      import("../../repository/notificationRepository")
        .then(async ({ NotificationRepository }) => {
          const { prisma } = await import("../../database/prisma");
          const appt = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: {
              id: true,
              startTime: true,
              patient: {
                select: {
                  user: { select: { id: true, name: true, email: true, phone: true } },
                },
              },
              professional: {
                select: {
                  user: { select: { id: true, name: true, email: true, phone: true } },
                },
              },
            },
          });
          if (!appt?.patient?.user) return;
          const patientUser = appt.patient.user;
          const profUser = appt.professional?.user;
          const notifRepo = new NotificationRepository();
          const isCheckin = status === "WAITING";
          const notifType = isCheckin ? "CHECKIN_DONE" : "APPOINTMENT_COMPLETED";
          const subject = isCheckin ? "Check-in confirmado" : "Consulta concluída";

          // → paciente
          const pn = await notifRepo.create({
            clinicId,
            recipientEmail: patientUser.email,
            recipientPhone: patientUser.phone ?? undefined,
            recipientName: patientUser.name,
            recipientUserId: patientUser.id,
            type: notifType,
            channel: "IN_APP",
            subject,
            message: isCheckin
              ? "Seu check-in foi confirmado! Aguarde ser chamado."
              : "Sua consulta foi concluída. Obrigado pela sua visita!",
            appointmentId,
          });
          await notifRepo.markAsSent(pn.id);

          // → profissional (PATIENT_WAITING ou APPOINTMENT_COMPLETED)
          if (profUser) {
            const profType = isCheckin ? "PATIENT_WAITING" : "APPOINTMENT_COMPLETED";
            const profSubject = isCheckin ? "Paciente aguardando" : "Consulta concluída";
            const profMsg = isCheckin
              ? `O paciente ${patientUser.name} realizou o check-in e está aguardando.`
              : `A consulta com ${patientUser.name} foi registrada como concluída.`;
            const prf = await notifRepo.create({
              clinicId,
              recipientEmail: profUser.email,
              recipientPhone: profUser.phone ?? undefined,
              recipientName: profUser.name,
              recipientUserId: profUser.id,
              type: profType,
              channel: "IN_APP",
              subject: profSubject,
              message: profMsg,
              appointmentId,
            });
            await notifRepo.markAsSent(prf.id);
          }

          // → todos recepcionistas (PATIENT_WAITING ou APPOINTMENT_COMPLETED)
          const staffUsers = await notifRepo.findActiveClinicUsers(clinicId, ["RECEPTIONIST"]);
          const staffType = isCheckin ? "PATIENT_WAITING" : "APPOINTMENT_COMPLETED";
          const staffSubject = isCheckin ? "Paciente aguardando" : "Consulta concluída";
          const staffMsg = isCheckin
            ? `Check-in de ${patientUser.name} confirmado. Paciente aguardando atendimento.`
            : `Consulta de ${patientUser.name} concluída.`;
          for (const staff of staffUsers) {
            const sn = await notifRepo.create({
              clinicId,
              recipientEmail: staff.email,
              recipientPhone: staff.phone ?? undefined,
              recipientName: staff.name,
              recipientUserId: staff.id,
              type: staffType,
              channel: "IN_APP",
              subject: staffSubject,
              message: staffMsg,
              appointmentId,
            });
            await notifRepo.markAsSent(sn.id);
          }
        })
        .catch(() => { });
    }

    return { id: updated.id, status: updated.status };
  }
}
