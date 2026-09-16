import { prisma } from "../database/prisma";
import { ROLE_PRIORITY } from "../utils/roles";
import type { UserRole } from "../types/enums";
import type { CreateNotificationInput, NotificationItem } from "../types/notification";
import { activeMemberOf } from "./membershipRepository";
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

    /**
     * Notificações endereçadas à conta, de TODAS as clínicas. Filtrar pela
     * clínica ativa escondia de quem é paciente e equipe os lembretes e avisos
     * das consultas em outras clínicas — recipientUserId já garante a posse.
     */
    async listForUser(userId: string): Promise<NotificationItem[]> {
        const rows = await prisma.notification.findMany({
            where: {
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

    async countUnread(userId: string): Promise<number> {
        return prisma.notification.count({
            where: {
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

    async markAllRead(userId: string) {
        return prisma.notification.updateMany({
            where: {
                recipientUserId: userId,
                readAt: null,
            },
            data: { readAt: new Date(), status: "READ" },
        });
    }

    /**
     * Equipe ativa de uma clínica (vínculo ativo), opcionalmente filtrada por
     * papel — vale para quem acumula papéis, não só pelo papel de origem.
     */
    async findActiveClinicUsers(clinicId: string, roleFilter?: string[]) {
        return prisma.user.findMany({
            where: {
                status: "ACTIVE",
                ...activeMemberOf(clinicId, roleFilter as UserRole[] | undefined),
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

    /**
     * Paciente é identidade global, sem clinicId — o vínculo com clínica é só
     * via Appointment. Retorna um par (paciente, clínica) por clínica onde o
     * paciente tenha ao menos uma consulta nos últimos 12 meses; um paciente
     * com consultas em N clínicas aparece N vezes, uma por clínica.
     * distinct evita duplicar quando há várias consultas na mesma clínica.
     *
     * TODO: mover o filtro de mês/dia para SQL (via $queryRaw) quando a base
     * crescer — hoje filtra em JS porque o Prisma não expõe EXTRACT(MONTH/DAY).
     */
    async findBirthdayRecipients(month: number, day: number) {
        const since = new Date();
        since.setFullYear(since.getFullYear() - 1);

        const appointments = await prisma.appointment.findMany({
            where: {
                appointmentDate: { gte: since },
                patient: { user: { status: "ACTIVE" } },
            },
            select: {
                clinicId: true,
                clinic: { select: { id: true, tradeName: true, legalName: true } },
                patient: {
                    select: {
                        dateOfBirth: true,
                        user: { select: { id: true, name: true, email: true, phone: true } },
                    },
                },
            },
            distinct: ["clinicId", "patientId"],
        });

        return appointments.filter(({ patient }) => {
            const d = new Date(patient.dateOfBirth);
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
        const users = await prisma.user.findMany({
            where: {
                status: "ACTIVE",
                name: { contains: q, mode: "insensitive" },
                ...activeMemberOf(clinicId),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                memberships: { where: { clinicId }, select: { roles: true } },
            },
            take: 10,
        });

        // `role` = papel de maior prioridade NESTA clínica.
        return users.map(({ memberships, ...u }) => ({
            ...u,
            role:
                ROLE_PRIORITY.find((r) => memberships[0]?.roles.includes(r)) ??
                memberships[0]?.roles[0] ??
                null,
        }));
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
