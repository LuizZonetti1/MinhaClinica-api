import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { DEFAULT_TIMEZONE } from "../../config/timezone";
import { prisma } from "../../database/prisma";
import { InviteStatus, UserRole, UserStatus } from "../../types/enums";
import type { ProfessionalListItem } from "../../types/professional";
import { toRegistrationStatus } from "./professionalManagementService";

dayjs.extend(utc);
dayjs.extend(timezone);

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
      // Convites ainda não aceitos — o Professional só nasce no aceite.
      prisma.clinicInvite.findMany({
        where: { clinicId, role: UserRole.PROFESSIONAL, status: InviteStatus.PENDING },
      }),
    ]);

    const activeItems: ProfessionalListItem[] = professionals.map((professional) => ({
      id: professional.id,
      userId: professional.userId,
      name: professional.user.name,
      email: professional.user.email,
      phone: professional.user.phone,
      // Desativar é por clínica (Professional.isActive), não na conta.
      status: professional.isActive ? professional.user.status : UserStatus.INACTIVE,
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

    // id = id do convite (não há Professional nem, talvez, conta ainda);
    // registrationStatus "INVITE_SENT"/"INVITE_EXPIRED" é o sinal para o front
    // tratar a linha como não navegável e oferecer reenviar/cancelar.
    const inviteItems: ProfessionalListItem[] = pendingInvites.map((invite) => ({
      id: invite.id,
      userId: "",
      name: invite.name,
      email: invite.email,
      phone: null,
      status: UserStatus.PENDING_ACTIVATION,
      registrationStatus: invite.expiresAt < new Date() ? "INVITE_EXPIRED" : "INVITE_SENT",
      avatarUrl: null,
      lastLoginAt: null,
      createdAt: invite.createdAt,
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
