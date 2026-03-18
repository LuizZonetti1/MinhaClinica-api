import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { AppointmentRepository } from "../../repository/appointmentRepository";
import type { AppointmentCreatedResult, CreateAppointmentInput } from "../../types/appointment";
import { AppointmentChannel } from "../../types/enums";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export class CreateAppointmentService {
  private repository = new AppointmentRepository();

  async execute(
    input: CreateAppointmentInput,
    clinicId: string,
    createdBy: string,
  ): Promise<AppointmentCreatedResult> {
    // Buscar dados do profissional
    const professional = await prisma.professional.findFirst({
      where: { id: input.professionalId, clinicId, isActive: true },
      select: {
        id: true,
        defaultAppointmentDuration: true,
        user: { select: { name: true } },
        specialties: {
          where: { isPrimary: true },
          select: { specialty: { select: { name: true } } },
          take: 1,
        },
      },
    });

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado ou inativo"), {
        statusCode: 404,
      });
    }

    // Buscar dados do paciente
    const patient = await prisma.patient.findFirst({
      where: { id: input.patientId },
      select: {
        id: true,
        cpf: true,
        user: { select: { name: true } },
      },
    });

    if (!patient) {
      throw Object.assign(new Error("Paciente não encontrado"), { statusCode: 404 });
    }

    // Buscar dados da clínica
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { tradeName: true, street: true, number: true, city: true, state: true },
    });

    if (!clinic) {
      throw Object.assign(new Error("Clínica não encontrada"), { statusCode: 404 });
    }

    const duration = professional.defaultAppointmentDuration;
    const endTime = minutesToTime(timeToMinutes(input.startTime) + duration);

    // Calcular intervalo do dia para verificação de conflito
    const dayjsDate = dayjs.tz(input.appointmentDate, DEFAULT_TIMEZONE);
    const startOfDay = dayjsDate.startOf("day").toDate();
    const endOfDay = dayjsDate.endOf("day").toDate();

    // Verificar conflito de horário
    const conflict = await this.repository.hasConflict(
      input.professionalId,
      clinicId,
      startOfDay,
      endOfDay,
      input.startTime,
      endTime,
    );

    if (conflict) {
      throw Object.assign(new Error("Este horário já está ocupado. Por favor, escolha outro."), {
        statusCode: 409,
      });
    }

    // Converter appointmentDate para Date (meia-noite local)
    const appointmentDate = dayjsDate.startOf("day").toDate();

    const created = await this.repository.create({
      clinicId,
      patientId: input.patientId,
      professionalId: input.professionalId,
      procedureId: input.procedureId,
      appointmentDate,
      startTime: input.startTime,
      endTime,
      duration,
      type: input.type,
      channel: input.channel ?? AppointmentChannel.IN_PERSON,
      notes: input.notes,
      createdBy,
    });

    return {
      id: created.id,
      patientName: patient.user.name,
      patientCpf: patient.cpf,
      professionalName: professional.user.name,
      professionalSpecialty: professional.specialties[0]?.specialty.name ?? null,
      clinicName: clinic.tradeName,
      clinicAddress: clinic.street
        ? `${clinic.street}, ${clinic.number} — ${clinic.city}/${clinic.state}`
        : null,
      appointmentDate: input.appointmentDate,
      startTime: input.startTime,
      endTime,
      type: created.type,
      notes: created.notes,
    };
  }
}
