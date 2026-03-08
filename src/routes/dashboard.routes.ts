import { Router } from "express";
import { DashboardController } from "../controller/dashboardController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { UserRole } from "../types/enums";

const router = Router();
const dashboardController = new DashboardController();

router.get("/", authMiddleware, checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST), (req, res) =>
  dashboardController.getSummary(req, res),
);

export default router;
