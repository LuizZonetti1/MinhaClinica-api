import { prisma } from "../database/prisma";
import type { Gender } from "../types/enums";

export class PatientRepository {
  /**
   * Cria um paciente (após criar o User)
   */
  async createPatient(data: {
    userId: string;
    cpf: string;
    rg?: string;
    dateOfBirth: Date;
    gender: Gender;
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    alternativePhone?: string;
    bloodType?: string;
    allergies?: string;
    medications?: string;
    conditions?: string;
    observations?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }) {
    return prisma.patient.create({
      data: {
        userId: data.userId,
        cpf: data.cpf,
        rg: data.rg,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        alternativePhone: data.alternativePhone,
        bloodType: data.bloodType,
        allergies: data.allergies,
        medications: data.medications,
        conditions: data.conditions,
        observations: data.observations,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
      },
    });
  }

  /**
   * Busca paciente por ID
   */
  async findById(patientId: string) {
    return prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Busca paciente por userId
   */
  async findByUserId(userId: string) {
    return prisma.patient.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Atualiza dados do paciente
   */
  async updatePatient(
    patientId: string,
    data: Partial<{
      rg: string;
      dateOfBirth: Date;
      gender: Gender;
      zipCode: string;
      street: string;
      number: string;
      complement: string;
      neighborhood: string;
      city: string;
      state: string;
      alternativePhone: string;
      bloodType: string;
      allergies: string;
      medications: string;
      conditions: string;
      observations: string;
      emergencyContactName: string;
      emergencyContactPhone: string;
      isActive: boolean;
    }>,
  ) {
    return prisma.patient.update({
      where: { id: patientId },
      data,
    });
  }

  /**
   * Incrementa contador de faltas
   */
  async incrementNoShowCount(patientId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) return null;

    return prisma.patient.update({
      where: { id: patientId },
      data: {
        noShowCount: patient.noShowCount + 1,
      },
    });
  }

  /**
   * Incrementa total de consultas
   */
  async incrementTotalAppointments(patientId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) return null;

    return prisma.patient.update({
      where: { id: patientId },
      data: {
        totalAppointments: patient.totalAppointments + 1,
      },
    });
  }

  /**
   * Desativa paciente (soft delete)
   */
  async deactivate(patientId: string) {
    return prisma.patient.update({
      where: { id: patientId },
      data: { isActive: false },
    });
  }

  /**
   * Reativa paciente
   */
  async activate(patientId: string) {
    return prisma.patient.update({
      where: { id: patientId },
      data: { isActive: true },
    });
  }
}
