import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
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

    return result.count;
  }
}

