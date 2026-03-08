import type { Request, Response } from "express";
import { DashboardService } from "../services/dashboard/dashboardService";

export class DashboardController {
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const service = new DashboardService();
      const data = await service.getSummary(clinicId);

      res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao carregar dados do dashboard" });
      }
    }
  }
}
