import { Router } from "express";
import { AuditController } from "../controller/auditController";
import { ProfileController } from "../controller/profileController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { UserRole } from "../types/enums";

const router = Router();
const profileController = new ProfileController();
const auditController = new AuditController();

// ── Perfil do admin ──────────────────────────────────────────────────────────

/**
 * PROTEGIDO (ADMIN) — Retorna o perfil completo do admin autenticado
 * GET /api/admin/me
 */
router.get("/me", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  profileController.getMe(req, res),
);

// ── Auditoria ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/audit
 * Lista logs de auditoria (apenas ADMIN)
 * Query params: entity, action, userId, startDate, endDate, page, limit
 */
router.get("/audit", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  auditController.listAuditLogs(req, res),
);

/**
 * GET /api/admin/documents/:docId/verify
 * Verifica integridade do documento pelo hash SHA-256 (apenas ADMIN)
 */
router.get("/documents/:docId/verify", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  auditController.verifyDocumentIntegrity(req, res),
);

export default router;
