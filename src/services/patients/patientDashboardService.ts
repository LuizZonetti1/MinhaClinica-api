import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { PatientDashboardRepository } from "../../repository/patientDashboardRepository";
import { AppointmentStatus } from "../../types/enums";
import type { PatientDashboardSummary } from "../../types/patient";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const NO_SHOW_GRACE_MINUTES = 30;

export class PatientDashboardService {
  private repository: PatientDashboardRepository;

  constructor() {
    this.repository = new PatientDashboardRepository();
  }

  private collectOverdueNoShowIds(
    appointments: Awaited<ReturnType<PatientDashboardRepository["findUpcomingAppointments"]>>,
    now: dayjs.Dayjs,
  ): string[] {
    return appointments
      .filter((appointment) => {
        if (
          appointment.status !== AppointmentStatus.SCHEDULED &&
          appointment.status !== AppointmentStatus.CONFIRMED
        ) {
          return false;
        }

        // appointmentDate is @db.Date; use UTC to keep day without timezone shift.
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
  }

  async execute(userId: string): Promise<PatientDashboardSummary> {
    const patient = await this.repository.findPatientByUserId(userId);

    if (!patient) {
      throw new Error("Paciente não encontrado");
    }

    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const today = now.startOf("day").toDate();

    const [completedCount, lastCompleted, upcomingAppointmentsRaw] = await Promise.all([
      this.repository.countCompleted(patient.id),
      this.repository.findLastCompletedDate(patient.id),
      this.repository.findUpcomingAppointments(patient.id, today),
    ]);

    const overdueNoShowIds = this.collectOverdueNoShowIds(upcomingAppointmentsRaw, now);
    if (overdueNoShowIds.length > 0) {
      await this.repository.updateStatusByIds(overdueNoShowIds, AppointmentStatus.NO_SHOW);
    }

    const overdueNoShowIdsSet = new Set(overdueNoShowIds);
    const upcomingAppointments = upcomingAppointmentsRaw.filter(
      (appointment) => !overdueNoShowIdsSet.has(appointment.id),
    );

    return {
      stats: {
        upcomingCount: upcomingAppointments.length,
        completedCount,
        // Campo appointmentDate e @db.Date; usa UTC para manter o dia correto.
        lastAppointmentDate: lastCompleted
          ? dayjs.utc(lastCompleted.appointmentDate).format("YYYY-MM-DD")
          : null,
        unreadNotifications: 0,
      },
      upcomingAppointments: upcomingAppointments.map((a) => ({
        id: a.id,
        status: a.status,
        // Usa UTC para preservar o dia do campo @db.Date sem deslocar timezone.
        appointmentDate: dayjs.utc(a.appointmentDate).format("YYYY-MM-DD"),
        startTime: a.startTime,
        endTime: a.endTime,
        type: a.type,
        channel: a.channel,
        professionalName: a.professional.user.name,
        professionalAvatarUrl: a.professional.user.avatarUrl ?? null,
        primarySpecialty: a.professional.specialties[0]?.specialty.name ?? null,
        clinicName: a.clinic.tradeName,
      })),
    };
  }
}
