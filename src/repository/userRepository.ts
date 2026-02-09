import { prisma } from "../database/prisma";

export class UserRepository {

    async createUser(data: {
        clinicId: string;
        name: string;
        cpf: string;
        email: string;
        phone: string;
        password: string; // Já deve vir hasheado
        role: string; // "ADMIN" | "RECEPTIONIST" | "PROFESSIONAL" | "PATIENT"
        status?: string; // Opcional, default: "ACTIVE"
        avatarUrl?: string;
        mustChangePassword?: boolean; // Opcional, default: true
    }) {
        return prisma.user.create({
            data: {
                clinicId: data.clinicId,
                name: data.name,
                cpf: data.cpf,
                email: data.email,
                phone: data.phone,
                password: data.password,
                role: data.role as any,
                status: (data.status as any) || "ACTIVE",
                avatarUrl: data.avatarUrl,
                mustChangePassword: data.mustChangePassword ?? true,
            }
        });
    }

    async findById(userId: string) {
        return prisma.user.findUnique({
            where: { id: userId }
        });
    }

    async findByEmail(clinicId: string, email: string) {
        return prisma.user.findFirst({
            where: {
                clinicId,
                email
            }
        });
    }

    async findByCpf(clinicId: string, cpf: string) {
        return prisma.user.findFirst({
            where: {
                clinicId,
                cpf
            }
        });
    }

    async updateUser(userId: string, data: Partial<{
        name: string;
        email: string;
        phone: string;
        avatarUrl: string;
        status: string;
    }>) {
        return prisma.user.update({
            where: { id: userId },
            data: data as any
        });
    }

    async updatePassword(userId: string, hashedPassword: string) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                mustChangePassword: false
            }
        });
    }

    async updateLastLogin(userId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                lastLoginAt: new Date(),
                loginAttempts: 0
            }
        });
    }

    async incrementLoginAttempts(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) return null;

        return prisma.user.update({
            where: { id: userId },
            data: {
                loginAttempts: user.loginAttempts + 1
            }
        });
    }

    async blockUser(userId: string, blockedUntil: Date) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                status: "BLOCKED" as any,
                blockedUntil
            }
        });
    }

    async findPendingUsers(clinicId: string) {
        return prisma.user.findMany({
            where: {
                clinicId,
                status: "PENDING_ACTIVATION"
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    }

    async findAllByClinic(clinicId: string, filters?: {
        role?: string;
        status?: string;
        search?: string;
    }) {
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
                    ]
                })
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
                createdAt: "desc"
            }
        });
    }

}

/*
id       String @id @default(uuid())
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  // Dados pessoais
  name  String
  cpf   String @db.VarChar(11)
  email String
  phone String @db.VarChar(15)

  // Autenticação
  password String // Hash bcrypt
  role     UserRole
  status   UserStatus @default(ACTIVE)

  // Controle de acesso
  mustChangePassword Boolean   @default(true)
  lastLoginAt        DateTime?
  loginAttempts      Int       @default(0)
  blockedUntil       DateTime?

  // Avatar
  avatarUrl String?

  // Consentimento LGPD
  termsAcceptedAt   DateTime?
  privacyAcceptedAt DateTime?

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
*/