import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { AppointmentRepository } from "../../repository/appointmentRepository";
import type { AppointmentCalendarDay, AppointmentCalendarResult } from "../../types/appointment";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const MONTHS_RANGE = 6;

export class ListAppointmentsByDayService {
  private repository = new AppointmentRepository();

  async execute(userId: string, clinicId: string): Promise<AppointmentCalendarResult> {
    const professional = await prisma.professional.findFirst({
      where: { userId, clinicId },
      select: { id: true },
    });

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }

    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const rangeStart = now.subtract(MONTHS_RANGE, "month").startOf("day");
    const rangeEnd = now.add(MONTHS_RANGE, "month").endOf("day");

    const rows = await this.repository.listByDateRange(
      clinicId,
      professional.id,
      rangeStart.toDate(),
      rangeEnd.toDate(),
    );

    // Agrupa por data "YYYY-MM-DD"
    const dayMap = new Map<string, AppointmentCalendarDay>();

    for (const row of rows) {
      const dateKey = dayjs(row.appointmentDate).tz(DEFAULT_TIMEZONE).format("YYYY-MM-DD");

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { date: dateKey, appointments: [] });
      }

      const day = dayMap.get(dateKey);
      if (!day) continue;

      day.appointments.push({
        id: row.id,
        startTime: row.startTime,
        endTime: row.endTime,
        type: row.type,
        status: row.status,
        patientId: row.patientId,
        patientName: row.patient.user.name,
        patientAvatarUrl: row.patient.user.avatarUrl,
        professionalName: row.professional.user.name,
        professionalId: row.professional.id,
      });
    }

    // Ordena o mapa pelas chaves (datas)
    const days = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      rangeStart: rangeStart.format("YYYY-MM-DD"),
      rangeEnd: rangeEnd.format("YYYY-MM-DD"),
      days,
    };
  }
}
