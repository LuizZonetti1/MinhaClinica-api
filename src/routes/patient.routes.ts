import { Router } from "express";
import { PatientController } from "../controller/patientController";
import { PatientDashboardController } from "../controller/patientDashboardController";
import { ProfileController } from "../controller/profileController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { receptionRegisterPatientSchema } from "../schemas/patientSchema";
import { UserRole } from "../types/enums";

const router = Router();
const patientController = new PatientController();
const patientDashboardController = new PatientDashboardController();
const profileController = new ProfileController();

/**
 * PROTEGIDO (PATIENT) — Perfil do paciente autenticado
 * GET   /api/patients/me/profile    — Ver perfil
 * PATCH /api/patients/me/profile    — Editar dados pessoais e endereço
 * PATCH /api/patients/me/avatar     — Atualizar foto de perfil (multipart/form-data, campo: avatar)
 * PATCH /api/patients/me/password   — Alterar senha
 */
router.get("/me/profile", authMiddleware, checkRole(UserRole.PATIENT), (req, res) =>
  profileController.getPatientMe(req, res),
);
router.patch("/me/profile", authMiddleware, checkRole(UserRole.PATIENT), (req, res) =>
  profileController.patchPatientMe(req, res),
);
router.patch("/me/avatar", authMiddleware, checkRole(UserRole.PATIENT), (req, res) =>
  profileController.updateMe(req, res),
);
router.patch("/me/password", authMiddleware, checkRole(UserRole.PATIENT), (req, res) =>
  profileController.changePassword(req, res),
);

/**
 * PROTEGIDO (PATIENT) — Dashboard do paciente autenticado
 * GET   /api/patients/me/dashboard                        — Resumo do dashboard
 * GET   /api/patients/me/appointments                     — Histórico de consultas (?status=)
 * PATCH /api/patients/me/appointments/:id/confirm         — Confirmar presença (check-in)
 */
router.get("/me/dashboard", authMiddleware, checkRole(UserRole.PATIENT), (req, res) =>
  patientDashboardController.getDashboard(req, res),
);
router.get("/me/appointments", authMiddleware, checkRole(UserRole.PATIENT), (req, res) =>
  patientDashboardController.listAppointments(req, res),
);
router.patch(
  "/me/appointments/:id/confirm",
  authMiddleware,
  checkRole(UserRole.PATIENT),
  (req, res) => patientDashboardController.confirmAppointment(req, res),
);

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

/**
 * PROTEGIDO (ADMIN) — Detalhes completos do paciente (somente leitura)
 * GET /api/patients/:id/details
 */
router.get(
  "/:id/details",
  authMiddleware,
  checkRole(UserRole.ADMIN),
  (req, res) => patientController.getDetails(req, res),
);

/**
 * PROTEGIDO (ADMIN/RECEPTIONIST) — Cadastro de paciente pela recepção
 * POST /api/patients/register-by-reception
 */
router.post(
  "/register-by-reception",
  authMiddleware,
  checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  validate(receptionRegisterPatientSchema),
  (req, res) => patientController.registerByReception(req, res),
);

// Cadastro de pacientes via /api/auth/register/*

export default router;
