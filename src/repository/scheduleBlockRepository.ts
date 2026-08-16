import { prisma } from "../database/prisma";

export class ScheduleBlockRepository {
  /** Confirma que o profissional existe nesta clínica antes de listar/criar/excluir bloqueios. */
  async findProfessionalInClinic(professionalId: string, clinicId: string) {
    return prisma.professional.findFirst({
      where: { id: professionalId, clinicId },
      select: { id: true, userId: true },
    });
  }

  async findByProfessional(professionalId: string) {
    return prisma.professionalScheduleBlock.findMany({
      where: { professionalId },
      orderBy: { startDateTime: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.professionalScheduleBlock.findUnique({
      where: { id },
    });
  }

  async create(data: {
    professionalId: string;
    startDateTime: Date;
    endDateTime: Date;
    reason: string;
    isAllDay: boolean;
  }) {
    return prisma.professionalScheduleBlock.create({ data });
  }

  async delete(id: string) {
    await prisma.professionalScheduleBlock.delete({ where: { id } });
  }
}
