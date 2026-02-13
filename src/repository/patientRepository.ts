import { prisma } from "../database/prisma";

export class PatientRepository {
  /**
   * Cria um paciente (após criar o User)
   */
  async createPatient(data: {
    userId: string;
    clinicId: string;
    cpf: string;
    rg?: string;
    dateOfBirth: Date;
    gender: string; // "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY"
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    alternativePhone?: string;
    allergies?: string;
    observations?: string;
  }) {
    return prisma.patient.create({
      data: {
        userId: data.userId,
        clinicId: data.clinicId,
        cpf: data.cpf,
        rg: data.rg,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender as any,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        alternativePhone: data.alternativePhone,
        allergies: data.allergies,
        observations: data.observations,
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
   * Busca paciente por CPF
   */
  async findByCpf(clinicId: string, cpf: string) {
    return prisma.patient.findFirst({
      where: {
        clinicId,
        cpf,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Lista todos os pacientes da clínica
   */
  async findAllByClinic(
    clinicId: string,
    filters?: {
      isActive?: boolean;
      search?: string; // Busca por nome, cpf, email
    },
  ) {
    return prisma.patient.findMany({
      where: {
        clinicId,
        isActive: filters?.isActive,
        ...(filters?.search && {
          OR: [
            { user: { name: { contains: filters.search, mode: "insensitive" } } },
            { cpf: { contains: filters.search } },
            { user: { email: { contains: filters.search, mode: "insensitive" } } },
          ],
        }),
      },
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
      orderBy: {
        createdAt: "desc",
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
      gender: string;
      zipCode: string;
      street: string;
      number: string;
      complement: string;
      neighborhood: string;
      city: string;
      state: string;
      alternativePhone: string;
      allergies: string;
      observations: string;
      isActive: boolean;
    }>,
  ) {
    return prisma.patient.update({
      where: { id: patientId },
      data: data as any,
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
