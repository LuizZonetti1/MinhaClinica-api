import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { UserRole } from "../../types/enums";
import type { ReceptionistListItem } from "../../types/receptionist";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export type { ReceptionistListItem };

export class GetReceptionistsService {
  async execute(clinicId: string): Promise<ReceptionistListItem[]> {
    const startOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();
    const startOfNextMonth = dayjs().tz(DEFAULT_TIMEZONE).add(1, "month").startOf("month").toDate();

    const [receptionists, appointmentsByCreator] = await Promise.all([
      prisma.user.findMany({
        where: {
          clinicId,
          OR: [
            { role: UserRole.RECEPTIONIST },
            { roles: { has: UserRole.RECEPTIONIST } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          role: true,
          avatarUrl: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
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

    return receptionists.map((receptionist) => ({
      ...receptionist,
      appointmentsThisMonth: appointmentsCountMap.get(receptionist.id) ?? 0,
    }));
  }
}
