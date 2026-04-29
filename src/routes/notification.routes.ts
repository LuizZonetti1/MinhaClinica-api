import { Router } from "express";
import { NotificationController } from "../controller/notificationController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { UserRole } from "../types/enums";

const router = Router();
const controller = new NotificationController();

const authenticated = [authMiddleware];
const adminOrReceptionist = [
    authMiddleware,
    checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
];
const canSendDirect = [
    authMiddleware,
    checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PROFESSIONAL),
];

/**
 * GET /api/notifications
 * Lista notificações do usuário logado
 */
router.get("/", ...authenticated, (req, res) => controller.list(req, res));

/**
 * GET /api/notifications/search-users?q=...
 * Busca usuários ativos da clínica por nome (para envio de mensagem direta)
 */
router.get("/search-users", ...authenticated, (req, res) => controller.searchUsers(req, res));

/**
 * PATCH /api/notifications/read-all
 * Marca todas como lidas (deve vir antes de /:id/read para não capturar "read-all" como :id)
 */
router.patch("/read-all", ...authenticated, (req, res) => controller.markAllRead(req, res));

/**
 * PATCH /api/notifications/:id/read
 * Marca uma notificação como lida
 */
router.patch("/:id/read", ...authenticated, (req, res) => controller.markRead(req, res));

/**
 * DELETE /api/notifications/:id
 * Remove uma notificação do usuário logado
 */
router.delete("/:id", ...authenticated, (req, res) => controller.delete(req, res));

/**
 * POST /api/notifications/announcements
 * Envia comunicado para todos os usuários da clínica (admin/recepcionista)
 */
router.post("/announcements", ...adminOrReceptionist, (req, res) =>
    controller.sendAnnouncement(req, res),
);

/**
 * POST /api/notifications/direct
 * Envia mensagem direta para um usuário específico (admin/recepcionista/profissional)
 */
router.post("/direct", ...canSendDirect, (req, res) => controller.sendDirect(req, res));

export default router;
