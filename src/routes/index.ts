import { Router } from "express";
import authRoutes from "./auth.routes";
import clinicRoutes from "./clinic.routes";
import dashboardRoutes from "./dashboard.routes";
import patientRoutes from "./patient.routes";
import professionalRoutes from "./professional.routes";
import receptionRoutes from "./reception.routes";
import staffRoutes from "./staff.routes";

const routes = Router();

routes.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Servidor funcionando corretamente" });
});

routes.use("/auth", authRoutes);
routes.use("/clinics", clinicRoutes);
routes.use("/professionals", professionalRoutes);
routes.use("/staff", staffRoutes);
routes.use("/reception", receptionRoutes);
routes.use("/patients", patientRoutes);
routes.use("/dashboard", dashboardRoutes);

// Auxiliar de testes — REMOVER antes de produção

export default routes;
