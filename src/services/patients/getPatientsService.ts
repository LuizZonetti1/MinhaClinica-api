import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import type { PatientListItem, PatientSummary } from "../../types/patient";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export type { PatientListItem, PatientSummary };

export class GetPatientsService {
  async execute(clinicId: string): Promise<PatientListItem[]> {
    const startOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();
    const startOfNextMonth = dayjs().tz(DEFAULT_TIMEZONE).add(1, "month").startOf("month").toDate();

    const patients = await prisma.patient.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return patients.map((patient) => ({
      id: patient.id,
      userId: patient.userId,
      name: patient.user.name,
      email: patient.user.email,
      phone: patient.user.phone,
      cpf: patient.cpf,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      status: patient.user.status,
      avatarUrl: patient.user.avatarUrl,
      lastLoginAt: patient.user.lastLoginAt,
      isActive: patient.isActive,
      noShowCount: patient.noShowCount,
      totalAppointments: patient.totalAppointments,
      appointmentsThisMonth: patient._count.appointments,
      createdAt: patient.user.createdAt,
    }));
  }
}

export class GetPatientsSummaryService {
  async execute(clinicId: string): Promise<PatientSummary> {
    const startOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();

    const [total, active, newThisMonth] = await Promise.all([
      prisma.patient.count({ where: { clinicId } }),
      prisma.patient.count({ where: { clinicId, isActive: true } }),
      prisma.patient.count({
        where: {
          clinicId,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      newThisMonth,
    };
  }
}
