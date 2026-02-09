import { Router } from "express";
import clinicRoutes from "./clinic.routes";
import patientRoutes from "./patient.routes";
import professionalRoutes from "./professional.routes";
import staffRoutes from "./staff.routes";
import authRoutes from "./auth.routes";

const routes = Router();

routes.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Servidor esta funcionando corretamente",
  });
});

// Rotas de clínica
routes.use("/clinics", clinicRoutes);

// Rotas de autenticação
routes.use("/auth", authRoutes);

// Rotas de registro de usuários
routes.use("/patients", patientRoutes);
routes.use("/professionals", professionalRoutes);
routes.use("/staff", staffRoutes);

export default routes;