import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import routes from "./routes";

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
