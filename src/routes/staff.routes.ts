import { Router } from "express";
import { StaffController } from "../controller/staffController";
import { authMiddleware, checkRole, tempRegistrationAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { completeStaffSchema, inviteStaffSchema, updateReceptionSchema } from "../schemas/staffSchema";
import { UserRole } from "../types/enums";

const router = Router();
const staffController = new StaffController();

/**
 * PROTEGIDO (ADMIN) — Convidar staff
 * POST /api/staff/invite
 */
router.post(
  "/invite",
  authMiddleware,
  checkRole(UserRole.ADMIN),
  validate(inviteStaffSchema),
  (req, res) => staffController.invite(req, res),
);

/**
 * PROTEGIDO (tempToken) — Completar cadastro apos verificar email
 * POST /api/staff/complete
 * Requer: Authorization: Bearer <tempToken>
 */
router.post("/complete", tempRegistrationAuth, validate(completeStaffSchema), (req, res) =>
  staffController.complete(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Listar recepcionistas
 * GET /api/staff/receptionists
 */
router.get("/receptionists", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  staffController.getAllReceptionists(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Visualizar recepcionista por id
 * GET /api/staff/receptionists/:id
 */
router.get("/receptionists/:id", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  staffController.getReceptionById(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Editar recepcionista
 * PATCH /api/staff/receptionists/:id
 */
router.patch(
  "/receptionists/:id",
  authMiddleware,
  checkRole(UserRole.ADMIN),
  validate(updateReceptionSchema),
  (req, res) => staffController.updateReception(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Desativar recepcionista
 * DELETE /api/staff/receptionists/:id
 */
router.delete("/receptionists/:id", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  staffController.removeReception(req, res),
);

export default router;
