import type { Request, Response } from "express";
import { createTransactionSchema, updateTransactionSchema } from "../schemas/transactionSchema";
import { CreateTransactionService } from "../services/reports/createTransactionService";
import { ListTransactionsService } from "../services/transactions/listTransactionsService";
import { UpdateTransactionService } from "../services/transactions/updateTransactionService";
import type {
  CreateTransactionInput,
  TransactionPeriod,
  UpdateTransactionInput,
} from "../types/transaction";
import { handleControllerError } from "../utils/controllerUtils";

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
      handleControllerError(res, error, "Erro ao criar transação");
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
      const data = await service.execute(clinicId, period as TransactionPeriod, {
        userId: req.userId!,
        userName: req.userName ?? "Desconhecido",
      });

      res.status(200).json(data);
    } catch (error) {
      handleControllerError(res, error, "Erro ao listar transações");
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;
      const id = req.params.id as string;

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const validated = await updateTransactionSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const input: UpdateTransactionInput = {
        type: validated.type as UpdateTransactionInput["type"],
        title: validated.title,
        description: validated.description,
        amount: validated.amount,
        category: validated.category,
        paymentMethod: validated.paymentMethod as UpdateTransactionInput["paymentMethod"],
        paymentStatus: validated.paymentStatus as UpdateTransactionInput["paymentStatus"],
        referenceDate: validated.referenceDate,
        dueDate: validated.dueDate,
        notes: validated.notes,
      };

      const service = new UpdateTransactionService();
      const record = await service.execute(id, clinicId, input, {
        userId: req.userId!,
        userRoles: req.userRoles ?? (req.userRole ? [req.userRole] : []),
      });

      res.status(200).json({ message: "Transação atualizada com sucesso", data: record });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: error.errors });
        return;
      }
      // UpdateTransactionService lança Error puro (sem statusCode) para estas duas
      // regras de negócio conhecidas — preserva o status já esperado pelo frontend.
      if (error instanceof Error && error.message === "Transação não encontrada") {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof Error && error.message.startsWith("Acesso negado")) {
        res.status(403).json({ error: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar transação");
    }
  }
}
