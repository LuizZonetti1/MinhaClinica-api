import { Router } from "express";
import { StaffController } from "../controller/staffController";
import { authMiddleware, checkRole, tempRegistrationAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { completeStaffSchema, updateReceptionSchema } from "../schemas/staffSchema";
import { UserRole } from "../types/enums";

const router = Router();
const staffController = new StaffController();

/**
 * PROTEGIDO (ADMIN) — Listar recepcionistas
 * GET /api/reception
 */
router.get("/", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  staffController.getAllReceptionists(req, res),
);

/**
 * PROTEGIDO (tempToken) — Completar cadastro apos verificar email
 * POST /api/reception/complete
 * Requer: Authorization: Bearer <tempToken>
 */
router.post("/complete", tempRegistrationAuth, validate(completeStaffSchema), (req, res) =>
  staffController.complete(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Visualizar recepcionista por id
 * GET /api/reception/:id
 */
router.get("/:id", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  staffController.getReceptionById(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Editar recepcionista
 * PATCH /api/reception/:id
 */
router.patch(
  "/:id",
  authMiddleware,
  checkRole(UserRole.ADMIN),
  validate(updateReceptionSchema),
  (req, res) => staffController.updateReception(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Desativar recepcionista
 * DELETE /api/reception/:id
 */
router.delete("/:id", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  staffController.removeReception(req, res),
);

export default router;
