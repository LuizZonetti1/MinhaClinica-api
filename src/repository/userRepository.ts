import { prisma } from "../database/prisma";
import { UserStatus } from "../types/enums";
import type { CreateUserInput, UpdateUserInput } from "../types/user";

export class UserRepository {
  async createUser(data: CreateUserInput) {
    return prisma.user.create({
      data: {
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

  /** Conta + a clínica ativa da sessão (com settings), quando houver. */
  async findWithClinic(userId: string, clinicId: string | null) {
    const [user, clinic] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      clinicId
        ? prisma.clinic.findUnique({ where: { id: clinicId }, include: { settings: true } })
        : null,
    ]);
    return user ? { ...user, clinic } : null;
  }

  // E-mail é único na plataforma inteira (uma conta por e-mail). A antiga
  // versão "escopada por clínica" deixava passar o e-mail de um paciente ou de
  // alguém de outra clínica e o create estourava na unicidade global.
  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
    });
  }

  // Busca por CPF globalmente — uma pessoa, uma conta
  async findByCpfGlobal(cpf: string) {
    return prisma.user.findFirst({ where: { cpf } });
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
        passwordChangedAt: new Date(),
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

}
