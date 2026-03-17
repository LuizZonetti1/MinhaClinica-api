import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ReceptionDashboardRepository } from "../../repository/receptionDashboardRepository";
import type { ReceptionDashboardSummary } from "../../types/dashboard";
import { AppointmentStatus } from "../../types/enums";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export class ReceptionDashboardService {
  private repository = new ReceptionDashboardRepository();

  async getSummary(clinicId: string): Promise<ReceptionDashboardSummary> {
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const startOfDay = now.startOf("day").toDate();
    const endOfDay = now.endOf("day").toDate();

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
}
