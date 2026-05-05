import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { prisma } from "../../database/prisma";
import { AppointmentRepository } from "../../repository/appointmentRepository";
import { NotificationRepository } from "../../repository/notificationRepository";
import type { AppointmentCreatedResult, CreateAppointmentInput } from "../../types/appointment";
import { AppointmentChannel } from "../../types/enums";
import { EmailService, createEmailProvider } from "../email/emailService";

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
    if (!/^\d{2}:\d{2}$/.test(input.startTime)) {
      throw Object.assign(new Error("Horario invalido. Use o formato HH:mm"), {
        statusCode: 400,
      });
    }

    // Buscar dados do profissional
    const professional = await prisma.professional.findFirst({
      where: { id: input.professionalId, clinicId, isActive: true },
      select: {
        id: true,
        defaultAppointmentDuration: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
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
        user: { select: { id: true, name: true, email: true, phone: true } },
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
    const startMinutes = timeToMinutes(input.startTime);

    if (Number.isNaN(startMinutes) || startMinutes < 0 || startMinutes >= 24 * 60) {
      throw Object.assign(new Error("Horario invalido. Use o formato HH:mm"), {
        statusCode: 400,
      });
    }

    const endTime = minutesToTime(startMinutes + duration);

    // Calcular intervalo do dia para verificação de conflito
    // appointmentDate é @db.Date → Prisma retorna UTC midnight.
    // Usar UTC para garantir que o range bata com o valor armazenado.
    const dayjsDate = dayjs.tz(input.appointmentDate, DEFAULT_TIMEZONE);
    const startOfDay = dayjs.utc(input.appointmentDate).startOf("day").toDate();
    const endOfDay = dayjs.utc(input.appointmentDate).endOf("day").toDate();
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const appointmentStart = dayjsDate
      .hour(Math.floor(startMinutes / 60))
      .minute(startMinutes % 60)
      .second(0)
      .millisecond(0);

    if (appointmentStart.isBefore(now)) {
      throw Object.assign(new Error("Nao e permitido agendar em horario ja passado"), {
        statusCode: 400,
      });
    }

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

    const result: AppointmentCreatedResult = {
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

    // Notificar todos os perfis sobre o agendamento (fire-and-forget)
    void (async () => {
      try {
        const notifRepo = new NotificationRepository();
        const isOnline = input.channel === AppointmentChannel.ONLINE_PORTAL;
        const channelLabel = isOnline
          ? `pelo paciente ${patient.user.name} pelo portal online`
          : "pela recepção";

        // APPOINTMENT_CONFIRMATION → paciente
        const pNotif = await notifRepo.create({
          clinicId,
          recipientEmail: patient.user.email,
          recipientPhone: patient.user.phone ?? undefined,
          recipientName: patient.user.name,
          recipientUserId: patient.user.id,
          type: "APPOINTMENT_CONFIRMATION",
          channel: "IN_APP",
          subject: "Agendamento confirmado",
          message: `Seu agendamento foi confirmado para ${new Date(input.appointmentDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} às ${input.startTime} com ${professional.user.name}.`,
          appointmentId: created.id,
        });
        await notifRepo.markAsSent(pNotif.id);

        // NEW_BOOKING → paciente (consulta marcada)
        const pNewBookingNotif = await notifRepo.create({
          clinicId,
          recipientEmail: patient.user.email,
          recipientPhone: patient.user.phone ?? undefined,
          recipientName: patient.user.name,
          recipientUserId: patient.user.id,
          type: "NEW_BOOKING",
          channel: "IN_APP",
          subject: "Consulta marcada",
          message: `Sua consulta foi marcada para ${new Date(input.appointmentDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} às ${input.startTime} com ${professional.user.name}.`,
          appointmentId: created.id,
        });
        await notifRepo.markAsSent(pNewBookingNotif.id);

        // Email de confirmação para o paciente (fire-and-forget)
        try {
          const pDateStr = new Date(input.appointmentDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
          const emailSvc = new EmailService(createEmailProvider());
          await emailSvc.sendAppointmentConfirmationEmail(
            patient.user.email,
            patient.user.name,
            pDateStr,
            input.startTime,
            professional.user.name,
            clinic.tradeName,
          );
        } catch { }

        // NEW_BOOKING → profissional
        const profNotif = await notifRepo.create({
          clinicId,
          recipientEmail: professional.user.email,
          recipientPhone: professional.user.phone ?? undefined,
          recipientName: professional.user.name,
          recipientUserId: professional.user.id,
          type: "NEW_BOOKING",
          channel: "IN_APP",
          subject: "Novo agendamento",
          message: `Novo agendamento registrado ${channelLabel} para ${input.appointmentDate} às ${input.startTime}.`,
          appointmentId: created.id,
        });
        await notifRepo.markAsSent(profNotif.id);

        // NEW_BOOKING → admin + recepcionistas
        const staffUsers = await notifRepo.findActiveClinicUsers(clinicId, ["ADMIN", "RECEPTIONIST"]);
        for (const staff of staffUsers) {
          const sNotif = await notifRepo.create({
            clinicId,
            recipientEmail: staff.email,
            recipientPhone: staff.phone ?? undefined,
            recipientName: staff.name,
            recipientUserId: staff.id,
            type: "NEW_BOOKING",
            channel: "IN_APP",
            subject: "Novo agendamento",
            message: `Novo agendamento registrado ${channelLabel} para ${patient.user.name} em ${input.appointmentDate} às ${input.startTime} com ${professional.user.name}.`,
            appointmentId: created.id,
          });
          await notifRepo.markAsSent(sNotif.id);
        }
      } catch {
        // fire-and-forget: não propaga erro
      }
    })();

    return result;
  }
}
