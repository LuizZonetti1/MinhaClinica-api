import { Router } from "express";
import { ClinicController } from "../controller/clinicController";

const clinicRoutes = Router();
const clinicController = new ClinicController();

// Rota para criar uma nova clínica
clinicRoutes.post("/create", (req, res) => clinicController.createClinic(req, res));

// Rota para atualizar uma clínica
clinicRoutes.put("/:id", (req, res) => clinicController.updateClinic(req, res));

export default clinicRoutes;