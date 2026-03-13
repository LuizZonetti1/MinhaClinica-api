import "dotenv/config";
import path from "node:path";
import cors from "cors";
import express from "express";
import routes from "./routes";
import { UPLOADS_DIR } from "./utils/uploadUtils";

const app = express();

app.use(cors());
app.use(express.json());

// Serve arquivos de upload (avatares, relatórios etc.) como estáticos
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api", routes);

app.use((err: Error, req: any, res: any, next: any) => {
  console.log(err);
  res.status(400).json({
    message: err.message || "Erro inesperado.",
  });
});

export default app;
