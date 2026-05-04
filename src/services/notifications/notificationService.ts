import { NotificationRepository } from "../../repository/notificationRepository";
import type { CreateNotificationInput, NotificationListResult } from "../../types/notification";

const repo = new NotificationRepository();

export class NotificationService {
    /** Cria uma notificação IN_APP para um usuário específico */
    async createInApp(data: CreateNotificationInput) {
        const notification = await repo.create({
            ...data,
            channel: "IN_APP",
            status: undefined,
        } as CreateNotificationInput);

        await repo.markAsSent(notification.id);
        return notification;
    }

    /** Lista notificações do usuário logado e conta não lidas */
    async listForUser(userId: string, clinicId: string | null): Promise<NotificationListResult> {
        const [notifications, unreadCount] = await Promise.all([
            repo.listForUser(userId, clinicId),
            repo.countUnread(userId, clinicId),
        ]);

        return { notifications, unreadCount };
    }

    /** Marca uma notificação como lida */
    async markAsRead(id: string, userId: string) {
        const result = await repo.markAsRead(id, userId);
        if (result.count === 0) {
            const err = new Error("Notificação não encontrada");
            (err as Error & { statusCode?: number }).statusCode = 404;
            throw err;
        }
    }

    /** Marca todas as notificações do usuário como lidas */
    async markAllRead(userId: string, clinicId: string | null) {
        await repo.markAllRead(userId, clinicId);
    }
}
