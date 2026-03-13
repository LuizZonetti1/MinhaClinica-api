import { Router } from "express";
import { ProfileController } from "../controller/profileController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { UserRole } from "../types/enums";

const router = Router();
const profileController = new ProfileController();

/**
 * PROTEGIDO (ADMIN) — Retorna o perfil completo do admin autenticado
 * GET /api/users/me
 */
router.get("/me", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  profileController.getMe(req, res),
);

export default router;
