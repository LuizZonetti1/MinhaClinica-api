import { prisma } from "../database/prisma";
import { UserStatus } from "../types/enums";
import type { CreateUserInput, UpdateUserInput, UserFiltersInput } from "../types/user";

export class UserRepository {
  async createUser(data: CreateUserInput) {
    return prisma.user.create({
      data: {
        clinicId: data.clinicId ?? null,
        name: data.name,
        cpf: data.cpf ?? null,
        email: data.email,
        phone: data.phone ?? null,
        password: data.password ?? "pending",
        role: data.role,
        status: data.status ?? UserStatus.ACTIVE,
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

  async findWithClinic(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        clinic: {
          include: { settings: true },
        },
      },
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

  async updateUser(userId: string, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id: userId },
      data,
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
        status: UserStatus.BLOCKED,
        blockedUntil,
      },
    });
  }

  async findPendingUsers(clinicId: string) {
    return prisma.user.findMany({
      where: {
        clinicId,
        status: UserStatus.PENDING_ACTIVATION,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findAllByClinic(clinicId: string, filters?: UserFiltersInput) {
    return prisma.user.findMany({
      where: {
        clinicId,
        role: filters?.role,
        status: filters?.status,
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
