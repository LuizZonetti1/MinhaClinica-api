import type { Request, Response } from "express";
import { NotificationService } from "../services/notifications/notificationService";
import { AnnouncementService } from "../services/notifications/announcementService";
import { SendDirectService } from "../services/notifications/sendDirectService";
import { NotificationRepository } from "../repository/notificationRepository";
import { announcementSchema, sendDirectSchema } from "../schemas/notificationSchema";

export class NotificationController {
    /**
     * GET /api/notifications
     * Lista notificações do usuário logado + contagem de não lidas
     */
    async list(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const clinicId = req.clinicId ?? null;

            const service = new NotificationService();
            const data = await service.listForUser(userId, clinicId);

            res.status(200).json({ data });
        } catch (error: unknown) {
            const err = error as { message?: string };
            res.status(500).json({ message: err.message ?? "Erro ao buscar notificações" });
        }
    }

    /**
     * PATCH /api/notifications/:id/read
     * Marca uma notificação específica como lida
     */
    async markRead(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const { id } = req.params as { id: string };

            const service = new NotificationService();
            await service.markAsRead(id, userId);

            res.status(200).json({ message: "Notificação marcada como lida" });
        } catch (error: unknown) {
            const err = error as { message?: string; statusCode?: number };
            const status = err.statusCode ?? 500;
            res.status(status).json({ message: err.message ?? "Erro ao marcar notificação" });
        }
    }

    /**
     * PATCH /api/notifications/read-all
     * Marca todas as notificações do usuário logado como lidas
     */
    async markAllRead(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const clinicId = req.clinicId ?? null;

            const service = new NotificationService();
            await service.markAllRead(userId, clinicId);

            res.status(200).json({ message: "Todas as notificações marcadas como lidas" });
        } catch (error: unknown) {
            const err = error as { message?: string };
            res.status(500).json({ message: err.message ?? "Erro ao marcar notificações" });
        }
    }

    /**
     * POST /api/notifications/announcements
     * Envia um comunicado para todos os usuários ativos da clínica (admin/recepcionista)
     */
    async sendAnnouncement(req: Request, res: Response): Promise<void> {
        try {
            const senderId = req.userId!;
            const clinicId = req.clinicId!;

            const body = await announcementSchema.validate(req.body, { abortEarly: false });

            const service = new AnnouncementService();
            const result = await service.send({
                clinicId,
                senderId,
                subject: body.subject,
                message: body.message,
                targetRoles: body.targetRoles as string[] | undefined,
            });

            res.status(200).json({ message: `Comunicado enviado para ${result.sent} usuário(s)`, data: result });
        } catch (error: unknown) {
            const err = error as { message?: string; inner?: { message: string }[]; statusCode?: number };
            if (err.inner) {
                res.status(422).json({ message: "Dados inválidos", errors: err.inner.map((e) => e.message) });
                return;
            }
            const status = err.statusCode ?? 500;
            res.status(status).json({ message: err.message ?? "Erro ao enviar comunicado" });
        }
    }

    /**
     * GET /api/notifications/search-users?q=...
     * Busca usuários ativos da clínica por nome (para envio direto)
     */
    async searchUsers(req: Request, res: Response): Promise<void> {
        try {
            const clinicId = req.clinicId!;
            const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

            if (!q || q.length < 2) {
                res.status(200).json({ data: [] });
                return;
            }

            const notifRepo = new NotificationRepository();
            const users = await notifRepo.searchClinicUsers(clinicId, q);

            res.status(200).json({ data: users });
        } catch (error: unknown) {
            const err = error as { message?: string };
            res.status(500).json({ message: err.message ?? "Erro ao buscar usuários" });
        }
    }

    /**
     * POST /api/notifications/direct
     * Envia mensagem direta para um usuário específico da clínica
     */
    async sendDirect(req: Request, res: Response): Promise<void> {
        try {
            const senderId = req.userId!;
            const clinicId = req.clinicId!;

            const body = await sendDirectSchema.validate(req.body, { abortEarly: false });

            const service = new SendDirectService();
            const result = await service.execute({
                recipientUserId: body.recipientUserId,
                senderId,
                clinicId,
                subject: body.subject,
                message: body.message,
            });

            res.status(200).json({ message: "Mensagem enviada com sucesso", data: result });
        } catch (error: unknown) {
            const err = error as { message?: string; inner?: { message: string }[]; statusCode?: number };
            if (err.inner) {
                res.status(422).json({ message: "Dados inválidos", errors: err.inner.map((e) => e.message) });
                return;
            }
            const status = err.statusCode ?? 500;
            res.status(status).json({ message: err.message ?? "Erro ao enviar mensagem" });
        }
    }

    /**
     * DELETE /api/notifications/:id
     * Remove uma notificação do usuário logado
     */
    async delete(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const { id } = req.params as { id: string };

            const repo = new NotificationRepository();
            await repo.deleteById(id, userId);

            res.status(204).send();
        } catch (error: unknown) {
            const err = error as { message?: string };
            res.status(500).json({ message: err.message ?? "Erro ao remover notificação" });
        }
    }
}
