import { prisma } from "../database/prisma";
import type { AppointmentType } from "../types/enums";

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
}
