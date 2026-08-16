import { prisma } from "../database/prisma";

export class ClinicHolidayRepository {
  async findByClinic(clinicId: string) {
    return prisma.clinicHoliday.findMany({
      where: { clinicId },
      orderBy: { date: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.clinicHoliday.findUnique({ where: { id } });
  }

  async create(data: { clinicId: string; date: Date; description: string; isRecurring: boolean }) {
    return prisma.clinicHoliday.create({ data });
  }

  async delete(id: string) {
    await prisma.clinicHoliday.delete({ where: { id } });
  }
}
