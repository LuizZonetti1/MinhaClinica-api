import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { AppointmentStatus } from "../../types/enums";
import type { PatientListItem, PatientSummary } from "../../types/patient";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export type { PatientListItem, PatientSummary };

export class GetPatientsService {
  async execute(clinicId: string): Promise<PatientListItem[]> {
    const startOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();
    const startOfNextMonth = dayjs().tz(DEFAULT_TIMEZONE).add(1, "month").startOf("month").toDate();

    const [appointmentsByPatient, completedByPatient, completedThisMonthByPatient] = await Promise.all([
      prisma.appointment.groupBy({
        by: ["patientId"],
        where: {
          clinicId,
        },
        _max: {
          appointmentDate: true,
        },
      }),
      prisma.appointment.groupBy({
        by: ["patientId"],
        where: {
          clinicId,
          status: AppointmentStatus.COMPLETED,
        },
        _count: {
          _all: true,
        },
        _max: {
          appointmentDate: true,
        },
      }),
      prisma.appointment.groupBy({
        by: ["patientId"],
        where: {
          clinicId,
          status: AppointmentStatus.COMPLETED,
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

    if (appointmentsByPatient.length === 0) return [];

    const patientIds = appointmentsByPatient.map((entry) => entry.patientId);

    const patients = await prisma.patient.findMany({
      where: { id: { in: patientIds } },
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
      },
    });

    const patientById = new Map(patients.map((patient) => [patient.id, patient]));
    const appointmentsByPatientId = new Map(
      appointmentsByPatient.map((entry) => [entry.patientId, entry]),
    );
    const completedByPatientId = new Map(completedByPatient.map((entry) => [entry.patientId, entry]));
    const completedThisMonthCountByPatientId = new Map(
      completedThisMonthByPatient.map((entry) => [entry.patientId, entry._count._all]),
    );

    const items: PatientListItem[] = [];

    for (const entry of appointmentsByPatient) {
      const patient = patientById.get(entry.patientId);
      if (!patient) continue;
      const completed = completedByPatientId.get(patient.id);

      items.push({
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
        totalAppointments: completed?._count._all ?? 0,
        appointmentsThisMonth: completedThisMonthCountByPatientId.get(patient.id) ?? 0,
        lastVisit: completed?._max.appointmentDate ?? null,
        createdAt: patient.user.createdAt,
      });
    }

    items.sort((a, b) => {
      const aLatestAppointment = appointmentsByPatientId.get(a.id)?._max.appointmentDate;
      const bLatestAppointment = appointmentsByPatientId.get(b.id)?._max.appointmentDate;
      const aTime = aLatestAppointment ? new Date(aLatestAppointment).getTime() : 0;
      const bTime = bLatestAppointment ? new Date(bLatestAppointment).getTime() : 0;
      return bTime - aTime;
    });

    return items;
  }
}

export class GetPatientsSummaryService {
  async execute(clinicId: string): Promise<PatientSummary> {
    const startOfMonth = dayjs().tz(DEFAULT_TIMEZONE).startOf("month").toDate();
    const startOfNextMonth = dayjs().tz(DEFAULT_TIMEZONE).add(1, "month").startOf("month").toDate();

    const patientsByFirstAppointment = await prisma.appointment.groupBy({
      by: ["patientId"],
      where: {
        clinicId,
      },
      _min: {
        appointmentDate: true,
      },
    });

    if (patientsByFirstAppointment.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        newThisMonth: 0,
      };
    }

    const patientIds = patientsByFirstAppointment.map((row) => row.patientId);
    const patients = await prisma.patient.findMany({
      where: { id: { in: patientIds } },
      select: {
        isActive: true,
        createdAt: true,
      },
    });

    const total = patients.length;
    const active = patients.filter((patient) => patient.isActive).length;
    const newThisMonth = patientsByFirstAppointment.filter((entry) => {
      const firstAppointment = entry._min.appointmentDate;
      if (!firstAppointment) return false;
      return firstAppointment >= startOfMonth && firstAppointment < startOfNextMonth;
    }).length;

    return {
      total,
      active,
      inactive: total - active,
      newThisMonth,
    };
  }
}
