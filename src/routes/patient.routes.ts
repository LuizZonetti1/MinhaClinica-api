import { Router } from "express";
import { PatientController } from "../controller/patientController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { UserRole } from "../types/enums";

const router = Router();
const patientController = new PatientController();

/**
 * PROTEGIDO (ADMIN/RECEPTIONIST) — Listar pacientes da clínica
 * GET /api/patients
 */
router.get("/", authMiddleware, checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST), (req, res) =>
  patientController.getAll(req, res),
);

/**
 * PROTEGIDO (ADMIN/RECEPTIONIST) — Resumo estatístico de pacientes
 * GET /api/patients/summary
 */
router.get(
  "/summary",
  authMiddleware,
  checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  (req, res) => patientController.getSummary(req, res),
);

// Cadastro de pacientes via /api/auth/register/*

export default router;
