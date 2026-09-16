import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import { NotificationRepository } from "../../repository/notificationRepository";
import type { AuditContext } from "../../types/document";
import { NotificationChannel, NotificationType, UserStatus } from "../../types/enums";

const auditLogRepository = new AuditLogRepository();
const notificationRepository = new NotificationRepository();

/**
 * Reverte o bloqueio automático por excesso de faltas (ver AutoNoShowService).
 * Único caminho de desbloqueio hoje: sempre manual, disparado por ADMIN/RECEPTIONIST
 * — não há expiração automática (blockedUntil permanece sem uso). Ver decisão
 * registrada em V1 do PLANO_CORRECOES_RODADA5.md.
 */
export class UnblockPatientService {
  async execute(clinicId: string, patientId: string, context: AuditContext) {
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        appointments: { some: { clinicId } },
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, status: true } },
      },
    });

    if (!patient) {
      throw new Error("Paciente nao encontrado");
    }

    // O bloqueio por faltas vale só para o papel de paciente (Patient.blockedAt).
    if (!patient.blockedAt) {
      throw Object.assign(new Error("Paciente nao esta bloqueado"), { statusCode: 400 });
    }

    await prisma.patient.update({
      where: { id: patient.id },
      data: { blockedAt: null },
    });

    await auditLogRepository.create({
      clinicId,
      userId: context.userId,
      userName: context.userName,
      action: "UNBLOCK_PATIENT",
      entity: "Patient",
      entityId: patient.id,
      oldData: { blocked: true },
      newData: { blocked: false },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    // Fire-and-forget: falha ao notificar não deve reverter o desbloqueio.
    try {
      const notification = await notificationRepository.create({
        clinicId,
        recipientEmail: patient.user.email,
        recipientPhone: patient.user.phone ?? undefined,
        recipientName: patient.user.name,
        recipientUserId: patient.user.id,
        type: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.IN_APP,
        subject: "Conta desbloqueada",
        message:
          "Sua conta foi desbloqueada. Você já pode fazer login e agendar consultas normalmente.",
      });
      await notificationRepository.markAsSent(notification.id);
    } catch (err) {
      console.error("[UnblockPatientService] Falha ao notificar desbloqueio:", err);
    }

    return { patientId: patient.id, userId: patient.user.id, status: UserStatus.ACTIVE };
  }
}
