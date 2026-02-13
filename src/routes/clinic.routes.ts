import { Router } from "express";
import { ClinicController } from "../controller/clinicController";

const clinicRoutes = Router();
const clinicController = new ClinicController();

// Rota para criar uma nova clínica
clinicRoutes.post("/create", (req, res) => clinicController.createClinic(req, res));

// Rota para listar todas as clínicas
clinicRoutes.get("/list", (req, res) => clinicController.listClinics(req, res));

// Rota para buscar clínica por ID
clinicRoutes.get("/:id", (req, res) => clinicController.getClinicById(req, res));

// Rota para atualizar uma clínica
clinicRoutes.put("/:id", (req, res) => clinicController.updateClinic(req, res));

// Rota para deletar uma clínica
clinicRoutes.delete("/:id", (req, res) => clinicController.deleteClinic(req, res));

export default clinicRoutes;
