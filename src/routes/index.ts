import { Router } from "express";
import clinicRoutes from "./clinic.routes";

const routes = Router();

routes.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Servidor esta funcionando corretamente",
  });
});

// Rotas de clínica
routes.use("/clinics", clinicRoutes);

export default routes;