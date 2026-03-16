import type { Request, Response } from "express";
import { ReportService } from "../services/reports/reportService";
import type { ReportPeriod } from "../types/report";

const VALID_PERIODS: ReportPeriod[] = ["1m", "3m", "6m", "12m"];

export class ReportController {
  async getReport(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const period = (req.query.period as string) ?? "6m";

      if (!VALID_PERIODS.includes(period as ReportPeriod)) {
        res.status(400).json({ error: "Período inválido. Use: 1m, 3m, 6m ou 12m" });
        return;
      }

      const service = new ReportService();
      const data = await service.getReportData(clinicId, period as ReportPeriod);

      res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao gerar relatório" });
      }
    }
  }
}
