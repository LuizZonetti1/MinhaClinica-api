import { prisma } from "../database/prisma";
import type { DayOfWeek } from "../types/enums";

export class ClinicWorkingHoursRepository {
  async findByClinic(clinicId: string) {
    return prisma.clinicWorkingHours.findMany({
      where: { clinicId },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  async upsertMany(
    clinicId: string,
    days: { dayOfWeek: DayOfWeek; isOpen: boolean; openTime: string; closeTime: string }[],
  ) {
    await prisma.$transaction(
      days.map((day) =>
        prisma.clinicWorkingHours.upsert({
          where: { clinicId_dayOfWeek: { clinicId, dayOfWeek: day.dayOfWeek } },
          update: { isOpen: day.isOpen, openTime: day.openTime, closeTime: day.closeTime },
          create: {
            clinicId,
            dayOfWeek: day.dayOfWeek,
            isOpen: day.isOpen,
            openTime: day.openTime,
            closeTime: day.closeTime,
          },
        }),
      ),
    );
    return this.findByClinic(clinicId);
  }
}
