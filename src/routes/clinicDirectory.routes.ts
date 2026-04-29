import { Router } from "express";
import { ClinicDirectoryController } from "../controller/clinicDirectoryController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { UserRole } from "../types/enums";

const router = Router();
const controller = new ClinicDirectoryController();

const patientAccess = [authMiddleware, checkRole(UserRole.PATIENT)];

/**
 * GET /api/clinic-directory?q=
 * Lista clínicas ativas, filtrando opcionalmente por nome ou cidade
 */
router.get("/", ...patientAccess, (req, res) => controller.listClinics(req, res));

/**
 * GET /api/clinic-directory/:clinicId/professionals
 * Lista profissionais ativos da clínica com dados completos de perfil
 */
router.get("/:clinicId/professionals", ...patientAccess, (req, res) =>
    controller.listProfessionals(req, res),
);

export default router;
