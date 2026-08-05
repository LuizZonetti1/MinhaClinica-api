import { NotificationRepository } from "../../repository/notificationRepository";
import type { AnnouncementInput } from "../../types/notification";
import { prisma } from "../../database/prisma";
import { EmailService, createEmailProvider } from "../email/emailService";

const repo = new NotificationRepository();

export class AnnouncementService {
    /**
     * Grava os registros do comunicado para todos os destinatários e responde
     * imediatamente. O envio de e-mail em si acontece em segundo plano (mesmo
     * padrão fire-and-forget dos crons de notificação — sem fila, o volume
     * atual não justifica) para não travar a requisição por ~1s por destinatário.
     */
    async send(input: AnnouncementInput): Promise<{ accepted: number }> {
        const users = await repo.findActiveClinicUsers(input.clinicId, input.targetRoles);

        const notifications = await Promise.all(
            users.map((user) =>
                repo.create({
                    clinicId: input.clinicId,
                    senderId: input.senderId,
                    recipientEmail: user.email,
                    recipientPhone: user.phone ?? undefined,
                    recipientName: user.name,
                    recipientUserId: user.id,
                    type: "ANNOUNCEMENT",
                    channel: "IN_APP",
                    subject: input.subject,
                    message: input.message,
                }),
            ),
        );

        this.deliverInBackground(input.clinicId, input.subject, input.message, notifications).catch(
            (err) => console.error("[AnnouncementService] Erro inesperado no envio em segundo plano:", err),
        );

        return { accepted: notifications.length };
    }

    private async deliverInBackground(
        clinicId: string,
        subject: string,
        message: string,
        notifications: Awaited<ReturnType<typeof repo.create>>[],
    ): Promise<void> {
        const clinic = await prisma.clinic.findUnique({
            where: { id: clinicId },
            select: { tradeName: true },
        });
        const clinicName = clinic?.tradeName ?? "Sua Clínica";
        const emailSvc = new EmailService(createEmailProvider());

        for (const notification of notifications) {
            try {
                await emailSvc.sendAnnouncementEmail(
                    notification.recipientEmail,
                    notification.recipientName,
                    subject,
                    message,
                    clinicName,
                );
                await repo.markAsSent(notification.id);
            } catch (err) {
                console.error(
                    `[AnnouncementService] Falha ao enviar comunicado para ${notification.recipientEmail}:`,
                    err,
                );
                await repo
                    .markAsFailed(notification.id, err instanceof Error ? err.message : "Erro desconhecido")
                    .catch((markErr) =>
                        console.error("[AnnouncementService] Falha ao registrar erro de envio:", markErr),
                    );
            }
        }
    }
}
