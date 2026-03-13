import { prisma } from "../database/prisma";

export class ClinicRepository {
  async findById(id: string) {
    return prisma.clinic.findUnique({
      where: { id },
    });
  }

  async findWithSettings(id: string) {
    return prisma.clinic.findUnique({
      where: { id },
      include: { settings: true },
    });
  }

  async findSettingsByClinicId(clinicId: string) {
    return prisma.clinicSettings.findUnique({
      where: { clinicId },
    });
  }

  async upsertSettings(
    clinicId: string,
    data: {
      openTime?: string;
      closeTime?: string;
      minIntervalBetweenAppointments?: number;
      workingDaysPreset?: string;
      sendAppointmentReminder?: boolean;
      sendCancellationAlert?: boolean;
      sendNewPatientAlert?: boolean;
      sendDailyReport?: boolean;
      twoFactorEnabled?: boolean;
      accessLogEnabled?: boolean;
      sessionTimeoutMinutes?: number;
    },
  ) {
    return prisma.clinicSettings.upsert({
      where: { clinicId },
      update: data,
      create: { clinicId, ...data },
    });
  }

  async findAll() {
    return prisma.clinic.findMany({
      orderBy: {
        createdAt: "desc", // Mais recentes primeiro
      },
    });
  }

  //update
  async updateClinic(
    id: string,
    data: {
      legalName?: string;
      tradeName?: string;
      cnpj?: string;
      email?: string;
      phone?: string;
      zipCode?: string;
      street?: string;
      number?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      timezone?: string;
      isActive?: boolean;
      complement?: string | null;
      logoUrl?: string;
      website?: string | null;
      subdomain?: string;
      customDomain?: string;
    },
  ) {
    return prisma.clinic.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.clinic.delete({
      where: { id },
    });
  }
}
