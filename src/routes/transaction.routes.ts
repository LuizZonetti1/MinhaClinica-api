import { Router } from "express";
import { TransactionController } from "../controller/transactionController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { UserRole } from "../types/enums";

const router = Router();
const transactionController = new TransactionController();

/**
 * POST /api/transactions
 * Cria uma transação financeira manual (INCOME ou EXPENSE)
 */
router.post("/", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  transactionController.create(req, res),
);

export default router;
