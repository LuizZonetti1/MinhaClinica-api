import { Router } from "express";
import { ProcedureController } from "../controller/procedureController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { createProcedureSchema, updateProcedureSchema } from "../schemas/procedureSchema";
import { UserRole } from "../types/enums";

const router = Router();
const controller = new ProcedureController();

const adminAccess = [authMiddleware, checkRole(UserRole.ADMIN)];

/**
 * GET /api/procedures?includeInactive=true
 * Lista os procedimentos do catálogo da clínica (apenas ADMIN)
 */
router.get("/", ...adminAccess, (req, res) => controller.list(req, res));

/**
 * POST /api/procedures
 * Cria um procedimento no catálogo da clínica (apenas ADMIN)
 */
router.post("/", ...adminAccess, validate(createProcedureSchema), (req, res) =>
  controller.create(req, res),
);

/**
 * PATCH /api/procedures/:id
 * Atualiza um procedimento da clínica (apenas ADMIN)
 */
router.patch("/:id", ...adminAccess, validate(updateProcedureSchema), (req, res) =>
  controller.update(req, res),
);

/**
 * DELETE /api/procedures/:id
 * Remove um procedimento; se houver agendamentos vinculados, desativa em vez de
 * excluir e retorna { deactivated: true } (apenas ADMIN)
 */
router.delete("/:id", ...adminAccess, (req, res) => controller.remove(req, res));

export default router;
