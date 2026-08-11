import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { UserRole, UserStatus } from "../../types/enums";
import type { ProfessionalListItem } from "../../types/professional";
import { toRegistrationStatus } from "./professionalManagementService";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export type { ProfessionalListItem };

export class GetProfessionalsService {
  async execute(clinicId: string): Promise<ProfessionalListItem[]> {
    const startOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();
    const startOfNextMonth = dayjs().tz(DEFAULT_TIMEZONE).add(1, "month").startOf("month").toDate();

    const [professionals, pendingInvites] = await Promise.all([
      prisma.professional.findMany({
        where: { clinicId, deletedAt: null },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              status: true,
              avatarUrl: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          specialties: {
            include: {
              specialty: {
                select: { name: true },
              },
            },
          },
          _count: {
            select: {
              appointments: {
                where: {
                  appointmentDate: {
                    gte: startOfMonth,
                    lt: startOfNextMonth,
                  },
                },
              },
            },
          },
        },
      }),
      // Convites enviados (Etapa 1) que ainda não viraram Professional (Etapa 3).
      // O registro de Professional só nasce em CompleteProfessionalService — até
      // lá, o convidado existe apenas como User e não aparecia em lugar nenhum.
      prisma.user.findMany({
        where: {
          clinicId,
          role: UserRole.PROFESSIONAL,
          status: UserStatus.PENDING_ACTIVATION,
          professional: { is: null },
        },
      }),
    ]);

    const activeItems: ProfessionalListItem[] = professionals.map((professional) => ({
      id: professional.id,
      userId: professional.userId,
      name: professional.user.name,
      email: professional.user.email,
      phone: professional.user.phone,
      status: professional.user.status,
      registrationStatus: toRegistrationStatus(professional.user.status),
      avatarUrl: professional.user.avatarUrl,
      lastLoginAt: professional.user.lastLoginAt,
      createdAt: professional.user.createdAt,
      isActive: professional.isActive,
      professionalCouncil: professional.professionalCouncil,
      registrationNumber: professional.registrationNumber,
      registrationState: professional.registrationState,
      specialties: professional.specialties.map((ps) => ps.specialty.name),
      appointmentsThisMonth: professional._count.appointments,
    }));

    // cpf/phone/password do convite são placeholders ("00000000000"/"temp") até a
    // Etapa 3 — nunca expor. id reaproveita o userId (não há Professional ainda);
    // registrationStatus "INVITE_SENT" é o sinal para o front tratar a linha como
    // não navegável para a página de detalhes.
    const inviteItems: ProfessionalListItem[] = pendingInvites.map((user) => ({
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: null,
      status: user.status,
      registrationStatus: toRegistrationStatus(user.status),
      avatarUrl: null,
      lastLoginAt: null,
      createdAt: user.createdAt,
      isActive: false,
      professionalCouncil: "",
      registrationNumber: "",
      registrationState: "",
      specialties: [],
      appointmentsThisMonth: 0,
    }));

    return [...activeItems, ...inviteItems].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}
