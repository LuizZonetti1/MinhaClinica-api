import { Router } from "express";
import { ProfessionalController } from "../controller/professionalController";
import { authMiddleware, checkRole, tempRegistrationAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  completeProfessionalSchema,
  inviteProfessionalSchema,
  updateProfessionalSchema,
} from "../schemas/professionalSchema";
import { UserRole } from "../types/enums";

const router = Router();
const professionalController = new ProfessionalController();

/**
 * PROTEGIDO (ADMIN/RECEPTIONIST) — Listar profissionais
 * GET /api/professionals
 */
router.get("/", authMiddleware, checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST), (req, res) =>
  professionalController.getAll(req, res),
);

/**
 * Alias legado para lista
 * GET /api/professionals/professionals
 */
router.get("/professionals", authMiddleware, checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST), (req, res) =>
  professionalController.getAll(req, res),
);

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
 * PROTEGIDO (tempToken) — Completar cadastro apos verificar email
 * POST /api/professionals/complete
 * Requer: Authorization: Bearer <tempToken>
 */
router.post("/complete", tempRegistrationAuth, validate(completeProfessionalSchema), (req, res) =>
  professionalController.complete(req, res),
);

/**
 * PROTEGIDO (ADMIN/RECEPTIONIST) — Visualizar profissional por id
 * GET /api/professionals/:id
 */
router.get("/:id", authMiddleware, checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST), (req, res) =>
  professionalController.getById(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Editar profissional
 * PATCH /api/professionals/:id
 */
router.patch(
  "/:id",
  authMiddleware,
  checkRole(UserRole.ADMIN),
  validate(updateProfessionalSchema),
  (req, res) => professionalController.update(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Desativar profissional
 * DELETE /api/professionals/:id
 */
router.delete("/:id", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  professionalController.remove(req, res),
);

export default router;
