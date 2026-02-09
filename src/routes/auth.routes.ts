import { Router } from "express";
import { AuthController } from "../controller/authController";
import { validate } from "../middlewares/validation";
import { loginSchema } from "../schemas/authSchema";

const router = Router();
const authController = new AuthController();

/**
 * PÚBLICO - Login
 */
router.post(
    "/login",
    validate(loginSchema),
    (req, res) => authController.login(req, res)
);

/**
 * PÚBLICO - Verificar email
 */
router.get(
    "/verify-email/:token",
    (req, res) => authController.verifyEmail(req, res)
);

export default router;
