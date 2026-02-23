import { prisma } from "../database/prisma";

export class UserRepository {
  async createUser(data: {
    clinicId?: string; // Opcional: null para pacientes, preenchido para staff/admin
    name: string;
    cpf: string;
    email: string;
    phone: string;
    password: string;
    role: string;
    status?: string;
    avatarUrl?: string;
    mustChangePassword?: boolean;
  }) {
    return prisma.user.create({
      data: {
        clinicId: data.clinicId ?? null,
        name: data.name,
        cpf: data.cpf,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role as any,
        status: (data.status as any) || "ACTIVE",
        avatarUrl: data.avatarUrl,
        mustChangePassword: data.mustChangePassword ?? true,
      },
    });
  }

  async findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  // Busca por email globalmente (pacientes) ou dentro de uma clínica (staff)
  async findByEmail(emailOrClinicId: string, emailOrUndefined?: string) {
    const isClinicScoped = emailOrUndefined !== undefined;
    return prisma.user.findFirst({
      where: isClinicScoped
        ? { clinicId: emailOrClinicId, email: emailOrUndefined }
        : { email: emailOrClinicId },
    });
  }

  // Busca por CPF globalmente (pacientes) ou dentro de uma clínica (staff)
  async findByCpf(cpfOrClinicId: string, cpfOrUndefined?: string) {
    const isClinicScoped = cpfOrUndefined !== undefined;
    return prisma.user.findFirst({
      where: isClinicScoped
        ? { clinicId: cpfOrClinicId, cpf: cpfOrUndefined }
        : { cpf: cpfOrClinicId },
    });
  }

  async updateUser(
    userId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      avatarUrl: string;
      status: string;
    }>,
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: data as any,
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });
  }

  async updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        loginAttempts: 0,
      },
    });
  }

  async incrementLoginAttempts(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    return prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: user.loginAttempts + 1,
      },
    });
  }

  async blockUser(userId: string, blockedUntil: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        status: "BLOCKED" as any,
        blockedUntil,
      },
    });
  }

  async findPendingUsers(clinicId: string) {
    return prisma.user.findMany({
      where: {
        clinicId,
        status: "PENDING_ACTIVATION",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findAllByClinic(
    clinicId: string,
    filters?: {
      role?: string;
      status?: string;
      search?: string;
    },
  ) {
    return prisma.user.findMany({
      where: {
        clinicId,
        role: filters?.role as any,
        status: filters?.status as any,
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
            { cpf: { contains: filters.search } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
