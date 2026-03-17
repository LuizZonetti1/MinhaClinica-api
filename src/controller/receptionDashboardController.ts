import type { Request, Response } from "express";
import { ReceptionDashboardService } from "../services/reception/receptionDashboardService";

export class ReceptionDashboardController {
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const service = new ReceptionDashboardService();
      const data = await service.getSummary(clinicId);

      res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao carregar dados da recepção" });
      }
    }
  }
}
