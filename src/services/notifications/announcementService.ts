import { NotificationRepository } from "../../repository/notificationRepository";
import type { AnnouncementInput } from "../../types/notification";

const repo = new NotificationRepository();

export class AnnouncementService {
    /**
     * Envia um comunicado para todos os usuários ativos de uma clínica
     * (ou filtra por papéis específicos).
     */
    async send(input: AnnouncementInput): Promise<{ sent: number }> {
        const users = await repo.findActiveClinicUsers(
            input.clinicId,
            input.targetRoles,
        );

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
            sent++;
        }

        return { sent };
    }
}
