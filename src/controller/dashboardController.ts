import type { Request, Response } from "express";
import { DashboardService } from "../services/dashboard/dashboardService";
import { handleControllerError } from "../utils/controllerUtils";

export class DashboardController {
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;

      if (!clinicId) {
        res.status(400).json({ error: "Clinica nao identificada no token" });
        return;
      }

      const service = new DashboardService();
      const data = await service.getSummary(clinicId);

      res.status(200).json(data);
    } catch (error) {
      handleControllerError(res, error, "Erro ao carregar dados do dashboard");
    }
  }

  async getHistorical(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;

      if (!clinicId) {
        res.status(400).json({ error: "Clinica nao identificada no token" });
        return;
      }

      const monthsRaw = typeof req.query.months === "string" ? Number(req.query.months) : 6;
      const months = Number.isFinite(monthsRaw) ? monthsRaw : 6;

      const service = new DashboardService();
      const data = await service.getHistorical(clinicId, months);

      res.status(200).json(data);
    } catch (error) {
      handleControllerError(res, error, "Erro ao carregar evolucao historica do dashboard");
    }
  }
}
