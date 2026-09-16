import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { DEFAULT_TIMEZONE } from "../../config/timezone";
import { prisma } from "../../database/prisma";
import { memberOf } from "../../repository/membershipRepository";
import { InviteStatus, MembershipStatus, UserRole, UserStatus } from "../../types/enums";
import type { ReceptionistListItem } from "../../types/receptionist";

dayjs.extend(utc);
dayjs.extend(timezone);

export type { ReceptionistListItem };

export class GetReceptionistsService {
  async execute(clinicId: string): Promise<ReceptionistListItem[]> {
    const startOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();
    const startOfNextMonth = dayjs().tz(DEFAULT_TIMEZONE).add(1, "month").startOf("month").toDate();

    const [receptionists, pendingInvites, appointmentsByCreator] = await Promise.all([
      // Vínculos com RECEPTIONIST nesta clínica (ativos e desativados; os
      // desligados têm deletedAt no vínculo e ficam de fora).
      prisma.user.findMany({
        where: memberOf(clinicId, [UserRole.RECEPTIONIST]),
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          avatarUrl: true,
          lastLoginAt: true,
          createdAt: true,
          memberships: { where: { clinicId }, select: { status: true } },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.clinicInvite.findMany({
        where: { clinicId, role: UserRole.RECEPTIONIST, status: InviteStatus.PENDING },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointment.groupBy({
        by: ["createdBy"],
        where: {
          clinicId,
          appointmentDate: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const appointmentsCountMap = new Map<string, number>(
      appointmentsByCreator.map((entry) => [entry.createdBy, entry._count._all]),
    );

    const members: ReceptionistListItem[] = receptionists.map(({ memberships, ...receptionist }) => ({
      ...receptionist,
      // Desativar é por clínica (vínculo), não na conta — a mesma pessoa pode
      // seguir ativa como paciente ou em outra clínica.
      status:
        memberships[0]?.status === MembershipStatus.INACTIVE
          ? UserStatus.INACTIVE
          : receptionist.status,
      registrationStatus: "COMPLETED",
      role: UserRole.RECEPTIONIST,
      appointmentsThisMonth: appointmentsCountMap.get(receptionist.id) ?? 0,
    }));

    const invites: ReceptionistListItem[] = pendingInvites.map((invite) => ({
      id: invite.id,
      name: invite.name,
      email: invite.email,
      phone: null,
      status: UserStatus.PENDING_ACTIVATION,
      registrationStatus: invite.expiresAt < new Date() ? "INVITE_EXPIRED" : "INVITE_SENT",
      role: UserRole.RECEPTIONIST,
      avatarUrl: null,
      lastLoginAt: null,
      createdAt: invite.createdAt,
      appointmentsThisMonth: 0,
    }));

    return [...members, ...invites].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
