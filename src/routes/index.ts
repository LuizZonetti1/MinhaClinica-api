import { Router } from "express";

const routes = Router();

routes.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Servidor esta funcionando corretamente",
  }
  );
});

export default routes;