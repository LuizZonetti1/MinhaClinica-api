import { prisma } from "../database/prisma";
import type { CreateNotificationInput, NotificationItem } from "../types/notification";
import type { NotificationChannel, NotificationStatus, NotificationType } from "../../generated/prisma";

export class NotificationRepository {
    async create(data: CreateNotificationInput) {
        return prisma.notification.create({
            data: {
                clinicId: data.clinicId,
                recipientEmail: data.recipientEmail,
                recipientPhone: data.recipientPhone,
                recipientName: data.recipientName,
                recipientUserId: data.recipientUserId,
                senderId: data.senderId,
                type: data.type,
                channel: data.channel,
                subject: data.subject,
                message: data.message,
                appointmentId: data.appointmentId,
                metadata: data.metadata as object | undefined,
            },
        });
    }

    async listForUser(userId: string, clinicId: string): Promise<NotificationItem[]> {
        const rows = await prisma.notification.findMany({
            where: {
                clinicId,
                recipientUserId: userId,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
                id: true,
                type: true,
                channel: true,
                status: true,
                subject: true,
                message: true,
                readAt: true,
                sentAt: true,
                createdAt: true,
                metadata: true,
                appointmentId: true,
            },
        });

        return rows.map((n) => ({
            id: n.id,
            type: n.type,
            channel: n.channel,
            status: n.status,
            subject: n.subject ?? null,
            message: n.message,
            readAt: n.readAt ? n.readAt.toISOString() : null,
            sentAt: n.sentAt ? n.sentAt.toISOString() : null,
            createdAt: n.createdAt.toISOString(),
            metadata: n.metadata ? (n.metadata as Record<string, unknown>) : null,
            appointmentId: n.appointmentId ?? null,
        }));
    }

    async countUnread(userId: string, clinicId: string): Promise<number> {
        return prisma.notification.count({
            where: {
                clinicId,
                recipientUserId: userId,
                readAt: null,
                status: { not: "FAILED" },
            },
        });
    }

    async markAsRead(id: string, userId: string) {
        return prisma.notification.updateMany({
            where: { id, recipientUserId: userId },
            data: { readAt: new Date(), status: "READ" },
        });
    }

    async markAllRead(userId: string, clinicId: string) {
        return prisma.notification.updateMany({
            where: {
                clinicId,
                recipientUserId: userId,
                readAt: null,
            },
            data: { readAt: new Date(), status: "READ" },
        });
    }

    /** Retorna todos os usuários ativos de uma clínica para envio de comunicados */
    async findActiveClinicUsers(clinicId: string, roleFilter?: string[]) {
        return prisma.user.findMany({
            where: {
                clinicId,
                status: "ACTIVE",
                ...(roleFilter && roleFilter.length > 0
                    ? { role: { in: roleFilter as never[] } }
                    : {}),
            },
            select: {
                id: true,
                email: true,
                phone: true,
                name: true,
            },
        });
    }

    /** Busca agendamentos confirmados com consulta amanhã (para lembretes) */
    async findAppointmentsForReminders(clinicId: string, targetDate: Date) {
        const start = new Date(targetDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(targetDate);
        end.setHours(23, 59, 59, 999);

        return prisma.appointment.findMany({
            where: {
                clinicId,
                status: { in: ["SCHEDULED", "CONFIRMED"] },
                appointmentDate: { gte: start, lte: end },
            },
            select: {
                id: true,
                appointmentDate: true,
                startTime: true,
                patient: {
                    select: {
                        userId: true,
                        user: { select: { id: true, name: true, email: true, phone: true } },
                    },
                },
                professional: {
                    select: {
                        user: { select: { name: true } },
                    },
                },
            },
        });
    }

    async markAsSent(id: string) {
        return prisma.notification.update({
            where: { id },
            data: { status: "SENT", sentAt: new Date() },
        });
    }

    async markAsFailed(id: string, errorMessage: string) {
        return prisma.notification.update({
            where: { id },
            data: { status: "FAILED", errorMessage },
        });
    }

    async countPatientNoShows(patientId: string): Promise<number> {
        return prisma.appointment.count({
            where: { patientId, status: "NO_SHOW" },
        });
    }

    async findPatientsByBirthday(month: number, day: number) {
        const all = await prisma.patient.findMany({
            where: { user: { status: "ACTIVE" } },
            select: {
                clinicId: true,
                dateOfBirth: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
            },
        });
        return all.filter((p) => {
            const d = new Date(p.dateOfBirth);
            return d.getUTCMonth() + 1 === month && d.getUTCDate() === day;
        });
    }

    async hasReminderBeenSent(appointmentId: string, window: "1h" | "30m"): Promise<boolean> {
        const count = await prisma.notification.count({
            where: {
                appointmentId,
                type: "APPOINTMENT_REMINDER",
                metadata: { path: ["window"], equals: window },
            },
        });
        return count > 0;
    }

    async searchClinicUsers(clinicId: string, q: string) {
        return prisma.user.findMany({
            where: {
                clinicId,
                status: "ACTIVE",
                name: { contains: q, mode: "insensitive" },
            },
            select: { id: true, name: true, email: true, phone: true, role: true },
            take: 10,
        });
    }

    async deleteById(id: string, userId: string) {
        return prisma.notification.deleteMany({
            where: { id, recipientUserId: userId },
        });
    }

    async deleteOldRead(days: number) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return prisma.notification.deleteMany({
            where: { readAt: { not: null, lt: cutoff } },
        });
    }
}
