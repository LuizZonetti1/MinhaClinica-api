import type { Request, Response } from "express";
import {
  ProfessionalAgendaService,
  ProfessionalDashboardService,
} from "../services/professionals/professionalDashboardService";

export class ProfessionalDashboardController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { userId, clinicId } = req;

      if (!userId || !clinicId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const service = new ProfessionalDashboardService();
      const data = await service.execute(userId, clinicId);

      res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 500;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao carregar dashboard do profissional" });
      }
    }
  }

  async getAgenda(req: Request, res: Response): Promise<void> {
    try {
      const { userId, clinicId } = req;

      if (!userId || !clinicId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const date = req.query.date ? String(req.query.date) : undefined;

      const service = new ProfessionalAgendaService();
      const data = await service.execute(userId, clinicId, date);

      res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 500;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao carregar agenda do profissional" });
      }
    }
  }
}
