import type { Request, Response } from "express";
import { ReportExportService, ReportExportValidationError } from "../services/reports/reportExportService";
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

  async exportPdf(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;

      if (!clinicId) {
        res.status(400).json({ error: "Clinica nao identificada no token" });
        return;
      }

      const startDateParam = req.query.startDate;
      const endDateParam = req.query.endDate;
      const startDateRaw = Array.isArray(startDateParam) ? startDateParam[0] : startDateParam;
      const endDateRaw = Array.isArray(endDateParam) ? endDateParam[0] : endDateParam;
      const startDate = typeof startDateRaw === "string" ? startDateRaw : "";
      const endDate = typeof endDateRaw === "string" ? endDateRaw : "";

      if (!startDate || !endDate) {
        res.status(400).json({ error: "Informe startDate e endDate no formato YYYY-MM-DD" });
        return;
      }

      const service = new ReportExportService();
      const { fileName, buffer } = await service.generatePdf(clinicId, startDate, endDate);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
      res.setHeader("Content-Length", String(buffer.byteLength));
      res.status(200).send(buffer);
    } catch (error) {
      if (error instanceof ReportExportValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao exportar relatorio em PDF" });
      }
    }
  }
}
