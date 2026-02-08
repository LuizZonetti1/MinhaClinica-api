import { Router } from "express";
import { ClinicController } from "../controller/clinicController";

const clinicRoutes = Router();
const clinicController = new ClinicController();

// Rota para criar uma nova clínica
clinicRoutes.post("/create", (req, res) => clinicController.createClinic(req, res));

export default clinicRoutes;