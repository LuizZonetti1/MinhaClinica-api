import { Router } from "express";
import { AppointmentController } from "../controller/appointmentController";
import { PatientCommentController } from "../controller/patientCommentController";
import { ProfessionalController } from "../controller/professionalController";
import { ProfessionalDashboardController } from "../controller/professionalDashboardController";
import { ProfileController } from "../controller/profileController";
import { authMiddleware, checkRole, tempRegistrationAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  createPatientCommentSchema,
  updatePatientCommentSchema,
} from "../schemas/patientCommentSchema";
import {
  completeProfessionalSchema,
  inviteProfessionalSchema,
  updateProfessionalSchema,
} from "../schemas/professionalSchema";
import { UserRole } from "../types/enums";

const router = Router();
const professionalController = new ProfessionalController();
const professionalDashboardController = new ProfessionalDashboardController();
const patientCommentController = new PatientCommentController();
const appointmentController = new AppointmentController();
const profileController = new ProfileController();

const professionalAuth = [authMiddleware, checkRole(UserRole.PROFESSIONAL)];

/**
 * PROTEGIDO (PROFESSIONAL) — Perfil do profissional autenticado
 * GET   /api/professionals/me/profile           — Retorna perfil completo
 * PATCH /api/professionals/me/profile           — Atualiza dados do perfil (JSON)
 * PATCH /api/professionals/me/avatar            — Atualiza foto de perfil (multipart/form-data, campo: avatar)
 * PATCH /api/professionals/me/password          — Altera senha
 */
router.get("/me/profile", ...professionalAuth, (req, res) =>
  profileController.getProfessionalMe(req, res),
);
router.patch("/me/profile", ...professionalAuth, (req, res) =>
  profileController.patchProfessionalMe(req, res),
);
router.patch("/me/avatar", ...professionalAuth, (req, res) => profileController.updateMe(req, res));
router.patch("/me/password", ...professionalAuth, (req, res) =>
  profileController.changePassword(req, res),
);

/**
 * PROTEGIDO (PROFESSIONAL) — Résumé do dashboard do profissional autenticado
 * GET /api/professionals/me/dashboard
 */
router.get("/me/dashboard", ...professionalAuth, (req, res) =>
  professionalDashboardController.getDashboard(req, res),
);

/**
 * PROTEGIDO (PROFESSIONAL) — Agenda do profissional autenticado
 * GET /api/professionals/me/agenda?date=YYYY-MM-DD
 * Padrão: hoje. Intervalo: ±1 mês do dia atual.
 */
router.get("/me/agenda", ...professionalAuth, (req, res) =>
  professionalDashboardController.getAgenda(req, res),
);

/**
 * PROTEGIDO (PROFESSIONAL) — Pacientes com consulta concluída
 * GET /api/professionals/me/patients/completed
 * Retorna lista de pacientes distintos com pelo menos 1 COMPLETED, ordenados pela mais recente.
 * Usado pelo front para popular o seletor ao criar comentários.
 */
router.get("/me/patients/completed", ...professionalAuth, (req, res) =>
  appointmentController.listCompletedPatients(req, res),
);

/**
 * PROTEGIDO (PROFESSIONAL) — Comentários de pacientes
 * GET    /api/professionals/me/comments          — Lista todos os comentários do profissional
 * POST   /api/professionals/me/comments          — Cria um novo comentário
 * PATCH  /api/professionals/me/comments/:id      — Edita um comentário
 * DELETE /api/professionals/me/comments/:id      — Remove um comentário
 */
router.get("/me/comments", ...professionalAuth, (req, res) =>
  patientCommentController.list(req, res),
);
router.post("/me/comments", ...professionalAuth, validate(createPatientCommentSchema), (req, res) =>
  patientCommentController.create(req, res),
);
router.patch(
  "/me/comments/:id",
  ...professionalAuth,
  validate(updatePatientCommentSchema),
  (req, res) => patientCommentController.update(req, res),
);
router.delete("/me/comments/:id", ...professionalAuth, (req, res) =>
  patientCommentController.delete(req, res),
);

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
router.get(
  "/professionals",
  authMiddleware,
  checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  (req, res) => professionalController.getAll(req, res),
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
