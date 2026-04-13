import { Router } from "express";
import { ReportController } from "../controller/reportController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { UserRole } from "../types/enums";

const router = Router();
const reportController = new ReportController();

/**
 * GET /api/reports?period=1m|3m|6m|12m
 * Retorna dados consolidados de relatório para a clínica do admin autenticado
 */
router.get("/export/pdf", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  reportController.exportPdf(req, res),
);

router.get("/", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  reportController.getReport(req, res),
);

export default router;
