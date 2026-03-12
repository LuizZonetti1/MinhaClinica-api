import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export interface ProfessionalListItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  isActive: boolean;
  professionalCouncil: string;
  registrationNumber: string;
  registrationState: string;
  specialties: string[];
  appointmentsThisMonth: number;
}

export class GetProfessionalsService {
  async execute(clinicId: string): Promise<ProfessionalListItem[]> {
    const startOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();
    const startOfNextMonth = dayjs().tz(DEFAULT_TIMEZONE).add(1, "month").startOf("month").toDate();

    const professionals = await prisma.professional.findMany({
      where: { clinicId },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return professionals.map((professional) => ({
      id: professional.id,
      userId: professional.userId,
      name: professional.user.name,
      email: professional.user.email,
      phone: professional.user.phone,
      status: professional.user.status,
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
  }
}
