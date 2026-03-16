import type { Request, Response } from "express";
import { createTransactionSchema } from "../schemas/transactionSchema";
import { CreateTransactionService } from "../services/reports/createTransactionService";
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

  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      const userId = req.userId;

      if (!clinicId || !userId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const validated = await createTransactionSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const service = new CreateTransactionService();
      const record = await service.execute({
        clinicId,
        userId,
        type: validated.type,
        title: validated.title,
        description: validated.description,
        amount: validated.amount,
        category: validated.category,
        paymentMethod: validated.paymentMethod,
        paymentStatus: validated.paymentStatus,
        referenceDate: validated.referenceDate,
        dueDate: validated.dueDate,
        notes: validated.notes,
      });

      res.status(201).json({ message: "Transação criada com sucesso", data: record });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: error.errors });
        return;
      }
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao criar transação" });
      }
    }
  }
}
