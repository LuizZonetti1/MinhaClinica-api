import type { Request, Response } from "express";
import { createTransactionSchema } from "../schemas/transactionSchema";
import { CreateTransactionService } from "../services/reports/createTransactionService";
import type { CreateTransactionInput } from "../types/transaction";

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
}
