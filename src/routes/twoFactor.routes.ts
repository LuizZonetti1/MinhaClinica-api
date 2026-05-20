import { Router } from "express";
import { TwoFactorController } from "../controller/twoFactorController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const twoFactorController = new TwoFactorController();

/**
 * PÚBLICO — Validar OTP de email durante o login
 * POST /api/auth/2fa/validate
 * Body: { tempToken, code }
 */
router.post("/validate", (req, res) => twoFactorController.validate(req, res));

/**
 * PÚBLICO — Reenviar OTP de email durante o login
 * POST /api/auth/2fa/resend
 * Body: { tempToken }
 */
router.post("/resend", (req, res) => twoFactorController.resend(req, res));

/**
 * PROTEGIDO — Consultar status do 2FA
 * GET /api/auth/2fa/status
 */
router.get("/status", authMiddleware, (req, res) => twoFactorController.status(req, res));

/**
 * PROTEGIDO — Ativar o 2FA por email
 * POST /api/auth/2fa/enable
 */
router.post("/enable", authMiddleware, (req, res) => twoFactorController.enable(req, res));

/**
 * PROTEGIDO — Desativar o 2FA e revogar dispositivos confiáveis
 * DELETE /api/auth/2fa
 */
router.delete("/", authMiddleware, (req, res) => twoFactorController.disable(req, res));

export default router;
