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
    const startOfDay = now.startOf("day").toDate();
    const endOfDay = now.endOf("day").toDate();

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
    const startOfDay = day.startOf("day").toDate();
    const endOfDay = day.endOf("day").toDate();
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

    return { id: updated.id, status: updated.status };
  }
}
