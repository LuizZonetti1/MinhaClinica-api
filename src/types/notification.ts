import type {
    NotificationType,
    NotificationChannel,
    NotificationStatus,
} from "../../generated/prisma";

export type { NotificationType, NotificationChannel, NotificationStatus };

export interface NotificationItem {
    id: string;
    type: NotificationType;
    channel: NotificationChannel;
    status: NotificationStatus;
    subject: string | null;
    message: string;
    readAt: string | null;
    sentAt: string | null;
    createdAt: string;
    metadata: Record<string, unknown> | null;
    appointmentId: string | null;
}

export interface NotificationListResult {
    notifications: NotificationItem[];
    unreadCount: number;
}

export interface CreateNotificationInput {
    clinicId: string;
    recipientEmail: string;
    recipientPhone?: string;
    recipientName: string;
    recipientUserId?: string;
    senderId?: string;
    type: NotificationType;
    channel: NotificationChannel;
    subject?: string;
    message: string;
    appointmentId?: string;
    metadata?: Record<string, unknown>;
}

export interface AnnouncementInput {
    clinicId: string;
    senderId: string;
    subject: string;
    message: string;
    targetRoles?: string[]; // se vazio, envia para todos os usuários ativos
}
