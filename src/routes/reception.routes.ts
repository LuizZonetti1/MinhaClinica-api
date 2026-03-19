import { Router } from "express";
import { ProfileController } from "../controller/profileController";
import { ReceptionDashboardController } from "../controller/receptionDashboardController";
import { StaffController } from "../controller/staffController";
import { authMiddleware, checkRole, tempRegistrationAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { updateAppointmentStatusSchema } from "../schemas/appointmentSchema";
import { completeStaffSchema, updateReceptionSchema } from "../schemas/staffSchema";
import { UserRole } from "../types/enums";

const router = Router();
const staffController = new StaffController();
const receptionDashboardController = new ReceptionDashboardController();
const profileController = new ProfileController();

/**
 * PROTEGIDO (RECEPTIONIST) — Visualizar perfil da recepcionista autenticada
 * GET /api/reception/me
 */
router.get("/me", authMiddleware, checkRole(UserRole.RECEPTIONIST), (req, res) =>
  profileController.getReceptionMe(req, res),
);

/**
 * PROTEGIDO (RECEPTIONIST) — Atualizar nome, telefone e/ou foto da recepcionista
 * PATCH /api/reception/me
 */
router.patch("/me", authMiddleware, checkRole(UserRole.RECEPTIONIST), (req, res) =>
  profileController.updateMe(req, res),
);

/**
 * PROTEGIDO (RECEPTIONIST) — Alterar senha da recepcionista
 * PATCH /api/reception/me/password
 */
router.patch("/me/password", authMiddleware, checkRole(UserRole.RECEPTIONIST), (req, res) =>
  profileController.changePassword(req, res),
);

/**
 * PROTEGIDO (ADMIN | RECEPTIONIST) — Resumo do dia para a recepção
 * GET /api/reception/dashboard
 */
router.get(
  "/dashboard",
  authMiddleware,
  checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  (req, res) => receptionDashboardController.getSummary(req, res),
);

/**
 * PROTEGIDO (ADMIN | RECEPTIONIST) — Consultas do dia para a recepção
 * GET /api/reception/appointments/today?date=YYYY-MM-DD
 */
router.get(
  "/appointments/today",
  authMiddleware,
  checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  (req, res) => receptionDashboardController.getAppointmentsToday(req, res),
);

/**
 * PROTEGIDO (ADMIN | RECEPTIONIST) — Atualizar status de um agendamento (check-in)
 * PATCH /api/reception/appointments/:id/status
 * Body: { status: AppointmentStatus }
 */
router.patch(
  "/appointments/:id/status",
  authMiddleware,
  checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  validate(updateAppointmentStatusSchema),
  (req, res) => receptionDashboardController.patchAppointmentStatus(req, res),
);

/**
 * PROTEGIDO (ADMIN | RECEPTIONIST) — Agenda dos profissionais por data
 * GET /api/reception/agendas?date=YYYY-MM-DD
 * Padrão: hoje. Intervalo: ±1 mês do dia atual.
 */
router.get(
  "/agendas",
  authMiddleware,
  checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST),
  (req, res) => receptionDashboardController.getAgenda(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Listar recepcionistas
 * GET /api/reception
 */
router.get("/", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  staffController.getAllReceptionists(req, res),
);

/**
 * PROTEGIDO (tempToken) — Completar cadastro apos verificar email
 * POST /api/reception/complete
 * Requer: Authorization: Bearer <tempToken>
 */
router.post("/complete", tempRegistrationAuth, validate(completeStaffSchema), (req, res) =>
  staffController.complete(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Visualizar recepcionista por id
 * GET /api/reception/:id
 */
router.get("/:id", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  staffController.getReceptionById(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Editar recepcionista
 * PATCH /api/reception/:id
 */
router.patch(
  "/:id",
  authMiddleware,
  checkRole(UserRole.ADMIN),
  validate(updateReceptionSchema),
  (req, res) => staffController.updateReception(req, res),
);

/**
 * PROTEGIDO (ADMIN) — Desativar recepcionista
 * DELETE /api/reception/:id
 */
router.delete("/:id", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  staffController.removeReception(req, res),
);

export default router;
