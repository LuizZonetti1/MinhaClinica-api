import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../database/prisma";
import { AppointmentRepository } from "../../repository/appointmentRepository";
import { ClinicRepository } from "../../repository/clinicRepository";
import { NotificationRepository } from "../../repository/notificationRepository";
import { ProcedureRepository } from "../../repository/procedureRepository";
import type { AppointmentCreatedResult, CreateAppointmentInput } from "../../types/appointment";
import { AppointmentChannel, AppointmentType } from "../../types/enums";
import { resolveAppointmentDuration } from "../../utils/resolveAppointmentDuration";
import { createEmailProvider, EmailService } from "../email/emailService";
import { assertSlotIsBookable } from "./appointmentBookingRules";

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
  private procedureRepository = new ProcedureRepository();

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

    // Resolver duração e tipo a partir do procedimento (se informado)
    let duration = professional.defaultAppointmentDuration;
    let type: AppointmentType = input.type ?? AppointmentType.CONSULTATION;

    if (input.procedureId) {
      const procedureData = await this.procedureRepository.findDurationInputs(
        input.procedureId,
        input.professionalId,
        clinicId,
      );

      if (!procedureData) {
        throw Object.assign(new Error("Procedimento não encontrado nesta clínica"), {
          statusCode: 400,
        });
      }

      if (procedureData.professionals.length === 0) {
        throw Object.assign(
          new Error("Este procedimento não está vinculado ao profissional selecionado"),
          { statusCode: 400 },
        );
      }

      duration = resolveAppointmentDuration({
        professionalDefaultDuration: professional.defaultAppointmentDuration,
        procedureDefaultDuration: procedureData.defaultDuration,
        customDuration: procedureData.professionals[0]?.customDuration,
      });
      type = procedureData.defaultType;
    }

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

    const channel = input.channel ?? AppointmentChannel.IN_PERSON;

    // Feriado, horário de trabalho, ProfessionalScheduleBlock, antecedência
    // mínima/máxima e allowOnlineBooking — inclui a checagem de "não pode ser
    // no passado" (minAdvanceBookingHours=0 equivale a ela).
    await assertSlotIsBookable({
      clinicId,
      professionalId: input.professionalId,
      dateStr: input.appointmentDate,
      startTime: input.startTime,
      endTime,
      isOnlineBooking: channel === AppointmentChannel.ONLINE_PORTAL,
    });

    // Converter appointmentDate para Date (meia-noite local)
    const appointmentDate = dayjsDate.startOf("day").toDate();

    // Checagem de conflito + create em transação Serializable (createIfNoConflict):
    // duas requisições concorrentes para o mesmo slot não resultam mais em dois
    // agendamentos — uma delas recebe erro de conflito de escrita do Postgres.
    let created: Awaited<ReturnType<AppointmentRepository["createIfNoConflict"]>>;
    try {
      created = await this.repository.createIfNoConflict({
        clinicId,
        patientId: input.patientId,
        professionalId: input.professionalId,
        procedureId: input.procedureId,
        appointmentDate,
        startTime: input.startTime,
        endTime,
        duration,
        type,
        channel,
        notes: input.notes,
        createdBy,
        startOfDay,
        endOfDay,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        throw Object.assign(new Error("Este horário já está ocupado. Por favor, escolha outro."), {
          statusCode: 409,
        });
      }
      throw error;
    }

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

        // Formata a data local sem conversão UTC (evita desvio de fuso horário)
        const [apptYear, apptMonth, apptDay] = input.appointmentDate.split("-");
        const apptDateLabel = `${apptDay}/${apptMonth}/${apptYear}`;

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
          message: `Seu agendamento foi confirmado para ${apptDateLabel} às ${input.startTime} com ${professional.user.name}.`,
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
          message: `Sua consulta foi marcada para ${apptDateLabel} às ${input.startTime} com ${professional.user.name}.`,
          appointmentId: created.id,
        });
        await notifRepo.markAsSent(pNewBookingNotif.id);

        // Email de confirmação para o paciente (fire-and-forget)
        try {
          const pDateStr = apptDateLabel;
          const emailSvc = new EmailService(createEmailProvider());
          await emailSvc.sendAppointmentConfirmationEmail(
            patient.user.email,
            patient.user.name,
            pDateStr,
            input.startTime,
            professional.user.name,
            clinic.tradeName,
          );
        } catch {}

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
        const staffUsers = await notifRepo.findActiveClinicUsers(clinicId, [
          "ADMIN",
          "RECEPTIONIST",
        ]);
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

        // sendNewPatientAlert (default false) — alerta a equipe quando este é
        // o primeiro agendamento do paciente NESTA clínica. Antes tinha tela
        // real (GET+PATCH) mas nenhum fluxo de cadastro/agendamento o lia.
        const settings = await new ClinicRepository().findSettingsByClinicId(clinicId);
        if (settings?.sendNewPatientAlert) {
          const priorAppointments = await prisma.appointment.count({
            where: { patientId: input.patientId, clinicId, id: { not: created.id } },
          });
          if (priorAppointments === 0) {
            for (const staff of staffUsers) {
              const newPatientNotif = await notifRepo.create({
                clinicId,
                recipientEmail: staff.email,
                recipientPhone: staff.phone ?? undefined,
                recipientName: staff.name,
                recipientUserId: staff.id,
                type: "SYSTEM_ALERT",
                channel: "IN_APP",
                subject: "Novo paciente na clínica",
                message: `${patient.user.name} agendou pela primeira vez nesta clínica.`,
                appointmentId: created.id,
              });
              await notifRepo.markAsSent(newPatientNotif.id);
            }
          }
        }
      } catch {
        // fire-and-forget: não propaga erro
      }
    })();

    return result;
  }
}
