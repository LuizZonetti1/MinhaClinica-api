import { prisma } from "../../database/prisma";
import { PatientDashboardRepository } from "../../repository/patientDashboardRepository";
import { AppointmentStatus, CancellationReason } from "../../types/enums";
import { EmailService, createEmailProvider } from "../email/emailService";

export class CancelAppointmentService {
  private repository = new PatientDashboardRepository();

  async execute(appointmentId: string, userId: string) {
    const patient = await this.repository.findPatientByUserId(userId);
    if (!patient) {
      throw Object.assign(new Error("Paciente não encontrado"), { statusCode: 404 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId: patient.id,
      },
      select: {
        id: true,
        status: true,
        appointmentDate: true,
        startTime: true,
        professional: {
          select: {
            user: { select: { name: true } },
          },
        },
        clinic: { select: { tradeName: true } },
      },
    });

    if (!appointment) {
      throw Object.assign(new Error("Agendamento não encontrado"), { statusCode: 404 });
    }

    const allowedStatuses: string[] = [
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.WAITING,
    ];

    if (!allowedStatuses.includes(appointment.status)) {
      throw Object.assign(
        new Error("Só é possível cancelar agendamentos com status SCHEDULED, CONFIRMED ou WAITING"),
        { statusCode: 400 },
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason: CancellationReason.PATIENT_REQUEST,
      },
      select: {
        id: true,
        status: true,
      },
    });

    // Envia email de confirmação do cancelamento (fire-and-forget)
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (user) {
        const emailSvc = new EmailService(createEmailProvider());
        const appointmentDate = appointment.appointmentDate.toLocaleDateString("pt-BR");
        const startTime = appointment.startTime.slice(0, 5); // "HH:MM"
        const professionalName = appointment.professional.user.name;
        const clinicName = appointment.clinic.tradeName;
        await emailSvc.sendAppointmentCancellationEmail(
          user.email,
          user.name,
          appointmentDate,
          startTime,
          professionalName,
          clinicName,
        );
      }
    } catch (err) {
      console.error("[cancelAppointmentService] Falha ao enviar email de cancelamento:", err);
    }

    return updated;
  }
}
