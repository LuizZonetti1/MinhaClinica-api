import { Router } from "express";
import { ProfileController } from "../controller/profileController";
import { StaffController } from "../controller/staffController";
import { authMiddleware, checkRole, tempRegistrationAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  completeStaffSchema,
  inviteStaffSchema,
  updateReceptionSchema,
} from "../schemas/staffSchema";
import { UserRole } from "../types/enums";

const router = Router();
const staffController = new StaffController();
const profileController = new ProfileController();

/**
 * PROTEGIDO (ADMIN) — Visualizar todos os dados do admin autenticado
 * GET /api/staff/me
 */
router.get("/me", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  profileController.getMe(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Atualizar nome e telefone do admin
 * PATCH /api/staff/me
 */
router.patch("/me", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  profileController.updateMe(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Alterar senha do admin
 * PATCH /api/staff/me/password
 */
router.patch("/me/password", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  profileController.changePassword(req, res),
);

/**
 * PROTEGIDO — Atualizar papéis cumulativos do usuário autenticado
 * PATCH /api/staff/me/roles
 */
router.patch("/me/roles", authMiddleware, (req, res) =>
  profileController.updateRoles(req, res),
);

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
