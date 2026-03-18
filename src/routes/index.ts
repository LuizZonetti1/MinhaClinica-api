import { Router } from "express";
import appointmentRoutes from "./appointment.routes";
import authRoutes from "./auth.routes";
import clinicRoutes from "./clinic.routes";
import dashboardRoutes from "./dashboard.routes";
import patientRoutes from "./patient.routes";
import professionalRoutes from "./professional.routes";
import receptionRoutes from "./reception.routes";
import reportRoutes from "./report.routes";
import staffRoutes from "./staff.routes";
import transactionRoutes from "./transaction.routes";

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
routes.use("/appointments", appointmentRoutes);
routes.use("/dashboard", dashboardRoutes);
routes.use("/reports", reportRoutes);
routes.use("/transactions", transactionRoutes);

// Auxiliar de testes — REMOVER antes de produção

export default routes;
