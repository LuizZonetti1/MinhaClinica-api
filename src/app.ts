import "dotenv/config";
import path from "node:path";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import routes from "./routes";
import { UPLOADS_DIR } from "./utils/uploadUtils";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Serve apenas avatares e imagens de relatório publicamente.
// Documentos clínicos são acessados exclusivamente via rota autenticada:
// GET /api/appointments/:id/documents/:docId/attachments/:attachmentId/file
app.use("/uploads/clinics", express.static(path.join(UPLOADS_DIR, "clinics")));

app.use("/api", routes);

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const status = err.statusCode ?? 500;
  if (status >= 500) {
    console.error("[ERRO INTERNO]", err.message, err.stack);
  }
  res.status(status).json({
    message: status >= 500 ? "Erro interno do servidor." : err.message,
  });
});

export default app;
