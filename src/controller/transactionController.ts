import type { Request, Response } from "express";
import { createTransactionSchema } from "../schemas/transactionSchema";
import { CreateTransactionService } from "../services/reports/createTransactionService";
import { ListTransactionsService } from "../services/transactions/listTransactionsService";
import type { CreateTransactionInput, TransactionPeriod } from "../types/transaction";

const VALID_PERIODS: TransactionPeriod[] = ["1m", "3m", "6m", "12m"];

export class TransactionController {
  async create(req: Request, res: Response): Promise<void> {
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

      const input: CreateTransactionInput = {
        clinicId,
        userId,
        type: validated.type as CreateTransactionInput["type"],
        title: validated.title,
        description: validated.description,
        amount: validated.amount,
        category: validated.category,
        paymentMethod: validated.paymentMethod as CreateTransactionInput["paymentMethod"],
        paymentStatus: validated.paymentStatus as CreateTransactionInput["paymentStatus"],
        referenceDate: validated.referenceDate,
        dueDate: validated.dueDate,
        notes: validated.notes,
      };

      const service = new CreateTransactionService();
      const record = await service.execute(input);

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

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const period = (req.query.period as string) ?? "1m";

      if (!VALID_PERIODS.includes(period as TransactionPeriod)) {
        res.status(400).json({ error: "Período inválido. Use: 1m, 3m, 6m ou 12m" });
        return;
      }

      const service = new ListTransactionsService();
      const data = await service.execute(clinicId, period as TransactionPeriod);

      res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar transações" });
      }
    }
  }
}
