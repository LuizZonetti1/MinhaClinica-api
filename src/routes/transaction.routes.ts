import { Router } from "express";
import { TransactionController } from "../controller/transactionController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { UserRole } from "../types/enums";

const router = Router();
const transactionController = new TransactionController();

/**
 * GET /api/transactions?period=1m|3m|6m|12m
 * Lista transações financeiras da clínica filtradas por período
 */
router.get("/", authMiddleware, checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST), (req, res) =>
  transactionController.list(req, res),
);

/**
 * POST /api/transactions
 * Cria uma transação financeira manual (INCOME ou EXPENSE)
 */
router.post("/", authMiddleware, checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST), (req, res) =>
  transactionController.create(req, res),
);

/**
 * PUT /api/transactions/:id
 * Atualiza os dados de uma transação financeira
 */
router.put("/:id", authMiddleware, checkRole(UserRole.ADMIN, UserRole.RECEPTIONIST), (req, res) =>
  transactionController.update(req, res),
);

export default router;
