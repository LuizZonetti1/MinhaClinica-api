import { Router } from "express";
import { PatientBookingController } from "../controller/patientBookingController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { createPatientBookingSchema } from "../schemas/patientBookingSchema";
import { UserRole } from "../types/enums";

const router = Router();
const controller = new PatientBookingController();

const patientAccess = [authMiddleware, checkRole(UserRole.PATIENT)];

/**
 * GET /api/patient-booking/clinics?q=
 * Etapa 1 — Buscar clínica por nome ou cidade
 */
router.get("/clinics", ...patientAccess, (req, res) => controller.searchClinics(req, res));

/**
 * GET /api/patient-booking/clinics/:clinicId/professionals
 * Etapa 2a — Listar profissionais da clínica escolhida
 */
router.get("/clinics/:clinicId/professionals", ...patientAccess, (req, res) =>
  controller.listProfessionals(req, res),
);

/**
 * GET /api/patient-booking/clinics/:clinicId/professionals/:professionalId/slots?date=YYYY-MM-DD
 * Etapa 2b — Horários disponíveis do profissional no dia escolhido
 */
router.get("/clinics/:clinicId/professionals/:professionalId/slots", ...patientAccess, (req, res) =>
  controller.getSlots(req, res),
);

/**
 * POST /api/patient-booking/appointments
 * Etapa 3 — Criar o agendamento
 */
router.post("/appointments", ...patientAccess, validate(createPatientBookingSchema), (req, res) =>
  controller.createAppointment(req, res),
);

export default router;
