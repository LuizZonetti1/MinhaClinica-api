import { NotificationRepository } from "../../repository/notificationRepository";
import type { AnnouncementInput } from "../../types/notification";
import { prisma } from "../../database/prisma";
import { EmailService, createEmailProvider } from "../email/emailService";

const repo = new NotificationRepository();

export class AnnouncementService {
    /**
     * Envia um comunicado para todos os usuários ativos de uma clínica
     * (ou filtra por papéis específicos).
     */
    async send(input: AnnouncementInput): Promise<{ sent: number }> {
        const clinic = await prisma.clinic.findUnique({
            where: { id: input.clinicId },
            select: { tradeName: true },
        });
        const clinicName = clinic?.tradeName ?? "Sua Clínica";

        const users = await repo.findActiveClinicUsers(
            input.clinicId,
            input.targetRoles,
        );

        const emailSvc = new EmailService(createEmailProvider());
        let sent = 0;

        for (const user of users) {
            const notification = await repo.create({
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
            });

            await repo.markAsSent(notification.id);
            // Email de comunicado (fire-and-forget)
            try {
                await emailSvc.sendAnnouncementEmail(user.email, user.name, input.subject, input.message, clinicName);
            } catch {}
            sent++;
        }

        return { sent };
    }
}
