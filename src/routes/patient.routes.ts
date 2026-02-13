import { Router } from "express";
import { PatientController } from "../controller/patientController";
import { validate } from "../middlewares/validation";
import { completePatientSchema, registerPatientSchema } from "../schemas/patientSchema";

const router = Router();
const patientController = new PatientController();

/**
 * PÚBLICO - Registro inicial
 */
router.post("/register", validate(registerPatientSchema), (req, res) =>
  patientController.register(req, res),
);

/**
 * SEMI-PÚBLICO - Completar cadastro
 * Requer userId no req (vindo de token temporário após verificar email)
 */
router.post("/complete", validate(completePatientSchema), (req, res) =>
  patientController.complete(req, res),
);

export default router;
