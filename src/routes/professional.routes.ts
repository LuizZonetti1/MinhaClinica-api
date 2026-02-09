import { Router } from "express";
import { ProfessionalController } from "../controller/professionalController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { inviteProfessionalSchema, completeProfessionalSchema } from "../schemas/professionalSchema";

const router = Router();
const professionalController = new ProfessionalController();

/**
 * PROTEGIDO (ADMIN) - Convidar profissional
 */
router.post(
    "/invite",
    authMiddleware,
    checkRole("ADMIN"),
    validate(inviteProfessionalSchema),
    (req, res) => professionalController.invite(req, res)
);

/**
 * SEMI-PÚBLICO - Completar cadastro
 * Requer userId no req (vindo de token temporário após verificar email)
 */
router.post(
    "/complete",
    validate(completeProfessionalSchema),
    (req, res) => professionalController.complete(req, res)
);

export default router;
