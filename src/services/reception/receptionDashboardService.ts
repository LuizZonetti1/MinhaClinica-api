import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ReceptionDashboardRepository } from "../../repository/receptionDashboardRepository";
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

const APPOINTMENT_TYPE_LABELS: Record<AppointmentTypeType, string> = {
  [AppointmentType.CONSULTATION]: "Consulta",
  [AppointmentType.RETURN]: "Retorno",
  [AppointmentType.EXAM]: "Exame",
  [AppointmentType.EMERGENCY]: "Emergência",
};

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const NO_SHOW_GRACE_MINUTES = 30;

export class ReceptionDashboardService {
  private repository = new ReceptionDashboardRepository();

  private resolveDay(date?: string) {
    if (!date) {
      return dayjs().tz(DEFAULT_TIMEZONE);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw Object.assign(new Error("Parâmetro 'date' deve estar no formato YYYY-MM-DD"), {
        statusCode: 400,
      });
    }

    const parsed = dayjs.tz(date, DEFAULT_TIMEZONE);

    if (!parsed.isValid()) {
      throw Object.assign(new Error("Data inválida. Use o formato YYYY-MM-DD"), {
        statusCode: 400,
      });
    }

    return parsed;
  }

  private mapAppointmentStatus(status: AppointmentStatusType): ReceptionTodayAppointmentStatus {
    if (status === AppointmentStatus.SCHEDULED || status === AppointmentStatus.CONFIRMED) {
      return "WAITING";
    }

    if (status === AppointmentStatus.WAITING) {
      return "CHECKED_IN";
    }

    if (status === AppointmentStatus.IN_PROGRESS) {
      return "IN_PROGRESS";
    }

    if (status === AppointmentStatus.COMPLETED) {
      return "DONE";
    }

    return "CANCELLED";
  }

  private async autoMarkPendingCheckinAsNoShow(clinicId: string, now: dayjs.Dayjs): Promise<void> {
    const pendingCheckinAppointments = await this.repository.listByStatusesUntilDate(
      clinicId,
      [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
      now.endOf("day").toDate(),
    );

    const overdueIds = pendingCheckinAppointments
      .filter((appointment) => {
        // Usa a data em UTC (YYYY-MM-DD) para evitar que a conversão de timezone
        // desloque o dia (ex: 2026-03-19T00:00Z vira 2026-03-18 em BRT)
        const datePart = dayjs.utc(appointment.appointmentDate).format("YYYY-MM-DD");
        const appointmentStart = dayjs.tz(
          `${datePart} ${appointment.startTime}`,
          "YYYY-MM-DD HH:mm",
          DEFAULT_TIMEZONE,
        );

        if (!appointmentStart.isValid()) {
          return false;
        }

        const noShowDeadline = appointmentStart.add(NO_SHOW_GRACE_MINUTES, "minute");
        return !noShowDeadline.isAfter(now);
      })
      .map((appointment) => appointment.id);

    await this.repository.updateStatusByIds(overdueIds, AppointmentStatus.NO_SHOW);
  }

  async getSummary(clinicId: string): Promise<ReceptionDashboardSummary> {
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const startOfDay = now.startOf("day").toDate();
    const endOfDay = now.endOf("day").toDate();

    await this.autoMarkPendingCheckinAsNoShow(clinicId, now);

    const [waitingCheckin, checkinsDone, pendingConfirmations] = await Promise.all([
      // Aguardando Check-in: agendamento confirmado ou não, mas paciente ainda não chegou
      this.repository.countTodayByStatuses(
        clinicId,
        [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        startOfDay,
        endOfDay,
      ),
      // Check-ins Realizados: paciente chegou e está aguardando atendimento
      this.repository.countTodayByStatuses(
        clinicId,
        [AppointmentStatus.WAITING],
        startOfDay,
        endOfDay,
      ),
      // Confirmações Pendentes: agendado mas ainda não confirmado pelo paciente
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
          [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW, AppointmentStatus.RESCHEDULED],
          startOfDay,
          endOfDay,
        ),
        this.repository.countTodayByStatuses(
          clinicId,
          [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
          startOfDay,
          endOfDay,
        ),
        this.repository.countTodayByStatuses(
          clinicId,
          [AppointmentStatus.WAITING],
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

// ── PATCH /api/reception/appointments/:id/status ─────────────────────────────

export class UpdateCheckinStatusService {
  private repository = new ReceptionDashboardRepository();

  async execute(clinicId: string, appointmentId: string, status: string) {
    const appointment = await this.repository.findAppointmentById(clinicId, appointmentId);

    if (!appointment) {
      throw Object.assign(new Error("Agendamento não encontrado"), { statusCode: 404 });
    }

    const updated = await this.repository.updateAppointmentStatus(appointmentId, status);

    return { id: updated.id, status: updated.status };
  }
}
