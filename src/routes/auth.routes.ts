import { Router } from "express";
import { AuthController } from "../controller/authController";

const router = Router();
const authController = new AuthController();

/**
 * PÚBLICO - Verificar email
 */
router.get(
    "/verify-email/:token",
    (req, res) => authController.verifyEmail(req, res)
);

export default router;
