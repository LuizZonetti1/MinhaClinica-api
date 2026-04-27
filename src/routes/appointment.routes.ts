import { Router } from "express";
import { AppointmentController } from "../controller/appointmentController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { createAppointmentSchema } from "../schemas/appointmentSchema";
import { UserRole } from "../types/enums";

const router = Router();
const controller = new AppointmentController();

const receptionAccess = [authMiddleware, checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST)];

/**
 * GET /api/appointments/patients/search?q=
 * Busca pacientes da clínica por nome ou CPF
 * Etapa 1 do fluxo "Marcar Consulta"
 */
router.get("/patients/search", ...receptionAccess, (req, res) =>
  controller.searchPatients(req, res),
);

/**
 * GET /api/appointments/professionals
 * Lista profissionais ativos da clínica
 * Etapa 2 do fluxo "Marcar Consulta"
 */
router.get("/professionals", ...receptionAccess, (req, res) =>
  controller.listProfessionals(req, res),
);

/**
 * GET /api/appointments/professionals/:id/slots?date=YYYY-MM-DD
 * Retorna todos os slots do dia com flag de disponibilidade
 * Etapa 2 do fluxo "Marcar Consulta"
 */
router.get("/professionals/:id/slots", ...receptionAccess, (req, res) =>
  controller.getSlots(req, res),
);

/**
 * POST /api/appointments
 * Cria um agendamento
 * Etapa 3 do fluxo "Marcar Consulta"
 */
router.post("/", ...receptionAccess, validate(createAppointmentSchema), (req, res) =>
  controller.create(req, res),
);

/**
 * GET /api/appointments/calendar
 * Lista os agendamentos do profissional autenticado agrupados por dia (±6 meses)
 * Retorna: { rangeStart, rangeEnd, days: [{ date, appointments: [{ id, startTime, endTime, type, status, patientName, professionalName, professionalId }] }] }
 */
router.get("/calendar", authMiddleware, checkRole(UserRole.PROFESSIONAL), (req, res) =>
  controller.listByDay(req, res),
);

/**
 * GET /api/appointments/:id
 * Retorna consulta completa com patient, professional e clinic aninhados.
 * Usado pelo frontend para carregar o contexto da tela de documentos.
 */
router.get(
  "/:id",
  authMiddleware,
  checkRole(UserRole.PROFESSIONAL, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT),
  (req, res) => controller.getById(req, res),
);

/**
 * PATCH /api/appointments/:id/status
 * Transição de status pelo profissional (ex: WAITING → IN_PROGRESS).
 */
router.patch(
  "/:id/status",
  authMiddleware,
  checkRole(UserRole.PROFESSIONAL),
  (req, res) => controller.patchStatus(req, res),
);

export default router;
