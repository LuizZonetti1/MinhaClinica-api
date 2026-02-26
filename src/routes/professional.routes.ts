import { Router } from "express";
import { ProfessionalController } from "../controller/professionalController";
import { authMiddleware, checkRole, tempRegistrationAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  completeProfessionalSchema,
  inviteProfessionalSchema,
} from "../schemas/professionalSchema";
import { UserRole } from "../types/enums";

const router = Router();
const professionalController = new ProfessionalController();

/**
 * PROTEGIDO (ADMIN) — Convidar profissional
 * POST /api/professionals/invite
 */
router.post(
  "/invite",
  authMiddleware,
  checkRole(UserRole.ADMIN),
  validate(inviteProfessionalSchema),
  (req, res) => professionalController.invite(req, res),
);

/**
 * PROTEGIDO (tempToken) — Completar cadastro após verificar email
 * POST /api/professionals/complete
 * Requer: Authorization: Bearer <tempToken>
 */
router.post("/complete", tempRegistrationAuth, validate(completeProfessionalSchema), (req, res) =>
  professionalController.complete(req, res),
);

export default router;
