import { Router } from "express";
import { InviteController } from "../controller/inviteController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { registerLimiter, tokenLimiter } from "../middlewares/rateLimiters";
import { validate } from "../middlewares/validation";
import { acceptInviteSchema, registerFromInviteSchema } from "../schemas/inviteSchema";
import { UserRole } from "../types/enums";

/**
 * Convites de equipe (ClinicInvite). O convite em si é criado por
 * POST /api/professionals/invite e POST /api/staff/invite.
 */
const router = Router();
const controller = new InviteController();

/**
 * PÚBLICO — Dados do convite para a página /convite
 * GET /api/invites/:token
 */
router.get("/:token", tokenLimiter, (req, res) => controller.getByToken(req, res));

/**
 * PROTEGIDO — Confere se a sessão é da conta convidada e pré-preenche dados
 * GET /api/invites/:token/prefill
 */
router.get("/:token/prefill", authMiddleware, (req, res) => controller.prefill(req, res));

/**
 * PROTEGIDO — Aceitar convite com a conta logada (conta já existente)
 * POST /api/invites/:token/accept
 * Devolve uma sessão nova já na clínica do convite.
 */
router.post("/:token/accept", authMiddleware, validate(acceptInviteSchema), (req, res) =>
  controller.accept(req, res),
);

/**
 * PÚBLICO — Aceitar convite criando a conta (e-mail sem conta)
 * POST /api/invites/:token/register
 */
router.post(
  "/:token/register",
  registerLimiter,
  validate(registerFromInviteSchema),
  (req, res) => controller.register(req, res),
);

/**
 * PÚBLICO — Recusar convite
 * POST /api/invites/:token/decline
 */
router.post("/:token/decline", tokenLimiter, (req, res) => controller.decline(req, res));

/**
 * PROTEGIDO (ADMIN) — Reenviar convite pendente
 * POST /api/invites/:id/resend
 */
router.post("/:id/resend", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  controller.resend(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Cancelar convite pendente (nunca apaga conta)
 * DELETE /api/invites/:id
 */
router.delete("/:id", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  controller.cancel(req, res),
);

export default router;
