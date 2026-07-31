import type { Prisma } from "../../generated/prisma";
import { prisma } from "../database/prisma";
import { AppointmentStatus, type AppointmentType } from "../types/enums";

// Status que caracterizam um agendamento futuro/ativo para fins de bloqueio de desvínculo.
const ACTIVE_APPOINTMENT_STATUSES = [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED];

export class ProcedureRepository {
  async findByClinic(clinicId: string, includeInactive: boolean) {
    return prisma.procedure.findMany({
      where: { clinicId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string, clinicId: string) {
    return prisma.procedure.findFirst({ where: { id, clinicId } });
  }

  async create(data: {
    clinicId: string;
    name: string;
    defaultDuration: number;
    defaultPrice: number;
    defaultType: AppointmentType;
  }) {
    return prisma.procedure.create({
      data: { ...data, isActive: true },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      defaultDuration?: number;
      isActive?: boolean;
      defaultType?: AppointmentType;
    },
  ) {
    return prisma.procedure.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.procedure.delete({ where: { id } });
  }

  async countAppointments(id: string) {
    return prisma.appointment.count({ where: { procedureId: id } });
  }

  async findByIds(ids: string[], clinicId: string) {
    return prisma.procedure.findMany({ where: { id: { in: ids }, clinicId } });
  }

  /**
   * Dados para resolveAppointmentDuration(): duração e tipo padrão do procedimento
   * (escopado à clínica) e o customDuration do vínculo com este profissional, se houver.
   * Retorna null se o procedimento não existe nesta clínica.
   */
  async findDurationInputs(procedureId: string, professionalId: string, clinicId: string) {
    return prisma.procedure.findFirst({
      where: { id: procedureId, clinicId },
      select: {
        defaultDuration: true,
        defaultType: true,
        professionals: {
          where: { professionalId },
          select: { customDuration: true },
        },
      },
    });
  }

  async findActiveForProfessional(professionalId: string, clinicId: string) {
    return prisma.procedure.findMany({
      where: {
        clinicId,
        isActive: true,
        professionals: { some: { professionalId } },
      },
      orderBy: { name: "asc" },
    });
  }

  async findProcedureIdsByProfessional(professionalId: string): Promise<string[]> {
    const links = await prisma.professionalProcedure.findMany({
      where: { professionalId },
      select: { procedureId: true },
    });
    return links.map((link) => link.procedureId);
  }

  /** Procedimentos, dentre os informados, com agendamento SCHEDULED/CONFIRMED para o profissional. */
  async findBlockedProcedureIds(professionalId: string, procedureIds: string[]): Promise<string[]> {
    if (procedureIds.length === 0) return [];

    const blocked = await prisma.appointment.findMany({
      where: {
        professionalId,
        procedureId: { in: procedureIds },
        status: { in: ACTIVE_APPOINTMENT_STATUSES },
      },
      select: { procedureId: true },
      distinct: ["procedureId"],
    });

    return blocked
      .map((appointment) => appointment.procedureId)
      .filter((id): id is string => id !== null);
  }

  /** Substitui, numa transação, o conjunto inteiro de procedimentos vinculados ao profissional. */
  async replaceProfessionalProcedures(
    professionalId: string,
    procedureIds: string[],
  ): Promise<void> {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.professionalProcedure.deleteMany({ where: { professionalId } });

      if (procedureIds.length > 0) {
        await tx.professionalProcedure.createMany({
          data: procedureIds.map((procedureId) => ({ professionalId, procedureId })),
        });
      }
    });
  }
}
