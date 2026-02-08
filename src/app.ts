import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.use((err: Error, req: any, res: any, next: any) => {
	console.log(err);
	res.status(400).json({
		message: err.message || "Erro inesperado.",
	});
});

export default app;