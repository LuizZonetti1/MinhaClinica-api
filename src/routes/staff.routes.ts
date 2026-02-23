import { Router } from "express";
import { StaffController } from "../controller/staffController";
import { authMiddleware, checkRole, tempRegistrationAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { completeStaffSchema, inviteStaffSchema } from "../schemas/staffSchema";

const router = Router();
const staffController = new StaffController();

/**
 * PROTEGIDO (ADMIN) — Convidar staff
 * POST /api/staff/invite
 */
router.post(
  "/invite",
  authMiddleware,
  checkRole("ADMIN"),
  validate(inviteStaffSchema),
  (req, res) => staffController.invite(req, res),
);

/**
 * PROTEGIDO (tempToken) — Completar cadastro após verificar email
 * POST /api/staff/complete
 * Requer: Authorization: Bearer <tempToken>
 */
router.post("/complete", tempRegistrationAuth, validate(completeStaffSchema), (req, res) =>
  staffController.complete(req, res),
);

export default router;
