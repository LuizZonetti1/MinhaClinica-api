import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { AppointmentStatus } from "../../types/enums";
import type {
  PatientAuditDetails,
  PatientAuditReportItem,
  PatientListItem,
  PatientSummary,
} from "../../types/patient";

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

export class GetPatientDetailsService {
  async execute(clinicId: string, patientId: string): Promise<PatientAuditDetails> {
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        appointments: {
          some: {
            clinicId,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        appointments: {
          where: { clinicId },
          select: {
            id: true,
            appointmentDate: true,
            status: true,
          },
        },
        medicalRecords: {
          where: {
            appointment: {
              clinicId,
            },
          },
          include: {
            appointment: {
              select: {
                id: true,
                appointmentDate: true,
                startTime: true,
                endTime: true,
                status: true,
                type: true,
                notes: true,
                professional: {
                  select: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                    specialties: {
                      where: {
                        isPrimary: true,
                      },
                      take: 1,
                      select: {
                        specialty: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            professional: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
                specialties: {
                  where: {
                    isPrimary: true,
                  },
                  take: 1,
                  select: {
                    specialty: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!patient) {
      throw new Error("Paciente nao encontrado");
    }

    const completedAppointments = patient.appointments.filter(
      (appointment) => appointment.status === AppointmentStatus.COMPLETED,
    );

    const lastVisit = completedAppointments.reduce<Date | null>((latest, appointment) => {
      if (!latest) return appointment.appointmentDate;
      return appointment.appointmentDate > latest ? appointment.appointmentDate : latest;
    }, null);

    const reports: PatientAuditReportItem[] = patient.medicalRecords.map((record) => {
      const appointmentProfessional = record.appointment.professional;
      const fallbackProfessional = record.professional;

      const professionalName =
        appointmentProfessional?.user.name ?? fallbackProfessional.user.name ?? "-";

      const professionalSpecialty =
        appointmentProfessional?.specialties[0]?.specialty.name ??
        fallbackProfessional.specialties[0]?.specialty.name ??
        null;

      return {
        id: record.id,
        appointmentId: record.appointmentId,
        appointmentDate: record.appointment.appointmentDate,
        startTime: record.appointment.startTime,
        endTime: record.appointment.endTime,
        appointmentType: record.appointment.type,
        appointmentStatus: record.appointment.status,
        appointmentNotes: record.appointment.notes,
        professionalName,
        professionalSpecialty,
        chiefComplaint: record.chiefComplaint,
        symptoms: record.symptoms,
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        prescription: record.prescription,
        observations: record.observations,
        attachments: record.attachments,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    });

    reports.sort((a, b) => {
      const byDate = b.appointmentDate.getTime() - a.appointmentDate.getTime();
      if (byDate !== 0) return byDate;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return {
      patient: {
        id: patient.id,
        userId: patient.userId,
        name: patient.user.name,
        email: patient.user.email,
        phone: patient.user.phone,
        avatarUrl: patient.user.avatarUrl,
        status: patient.user.status,
        isActive: patient.isActive,
        cpf: patient.cpf,
        rg: patient.rg,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        alternativePhone: patient.alternativePhone,
        noShowCount: patient.noShowCount,
        totalAppointments: patient.appointments.length,
        completedAppointments: completedAppointments.length,
        lastVisit,
        createdAt: patient.user.createdAt,
        updatedAt: patient.updatedAt,
        address: {
          zipCode: patient.zipCode,
          street: patient.street,
          number: patient.number,
          complement: patient.complement,
          neighborhood: patient.neighborhood,
          city: patient.city,
          state: patient.state,
        },
        medical: {
          bloodType: patient.bloodType,
          allergies: patient.allergies,
          medications: patient.medications,
          conditions: patient.conditions,
          observations: patient.observations,
          emergencyContactName: patient.emergencyContactName,
          emergencyContactPhone: patient.emergencyContactPhone,
        },
      },
      reports,
    };
  }
}
