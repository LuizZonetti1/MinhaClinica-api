import { Router } from "express";
import { StaffController } from "../controller/staffController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { inviteStaffSchema, completeStaffSchema } from "../schemas/staffSchema";

const router = Router();
const staffController = new StaffController();

/**
 * PROTEGIDO (ADMIN) - Convidar staff
 */
router.post(
    "/invite",
    authMiddleware,
    checkRole("ADMIN"),
    validate(inviteStaffSchema),
    (req, res) => staffController.invite(req, res)
);

/**
 * SEMI-PÚBLICO - Completar cadastro
 * Requer userId no req (vindo de token temporário após verificar email)
 */
router.post(
    "/complete",
    validate(completeStaffSchema),
    (req, res) => staffController.complete(req, res)
);

export default router;
