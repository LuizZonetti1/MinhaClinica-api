import { prisma } from "../../database/prisma";

export class GetAppointmentByIdService {
  async execute(
    appointmentId: string,
    clinicId: string,
    options?: { userId?: string; userRole?: string },
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        professional: {
          include: {
            user: {
              select: { name: true },
            },
            specialties: {
              include: {
                specialty: { select: { name: true } },
              },
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        clinic: {
          include: {
            settings: {
              select: { primaryColor: true },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw Object.assign(new Error("Consulta não encontrada"), { statusCode: 404 });
    }

    if (appointment.clinicId !== clinicId) {
      throw Object.assign(new Error("Acesso negado a esta consulta"), { statusCode: 403 });
    }

    if (options?.userRole === "PATIENT" && options.userId) {
      if (appointment.patient.userId !== options.userId) {
        throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
      }
    }

    const { patient, professional, clinic } = appointment;

    const primarySpecialty =
      professional.specialties.length > 0 ? professional.specialties[0].specialty.name : null;

    const addressParts = [
      clinic.street,
      clinic.number,
      clinic.neighborhood,
      clinic.city,
      clinic.state,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      id: appointment.id,
      clinicId: appointment.clinicId,
      scheduledAt: appointment.appointmentDate.toISOString(),
      startTime: appointment.startTime,
      status: appointment.status,
      completedAt: appointment.completedAt?.toISOString() ?? null,
      completedBy: appointment.completedBy ?? null,
      patient: {
        id: patient.id,
        name: patient.user.name,
        cpf: patient.cpf,
        dateOfBirth: patient.dateOfBirth.toISOString(),
        phone: patient.user.phone ?? patient.alternativePhone ?? "",
        email: patient.user.email,
      },
      professional: {
        id: professional.id,
        name: professional.user.name,
        councilType: professional.professionalCouncil,
        councilNumber: professional.registrationNumber,
        councilState: professional.registrationState,
        specialty: primarySpecialty,
      },
      clinic: {
        id: clinic.id,
        name: clinic.tradeName,
        slogan: null,
        cnpj: clinic.cnpj,
        address: addressParts,
        phone: clinic.phone,
        email: clinic.email,
        logoUrl: clinic.logoUrl ?? null,
        primaryColor: clinic.settings?.primaryColor ?? null,
      },
    };
  }
}
