import { TransactionRepository } from "../../repository/transactionRepository";
import type { CreateTransactionInput } from "../../types/transaction";

export class CreateTransactionService {
  private repository: TransactionRepository;

  constructor() {
    this.repository = new TransactionRepository();
  }

  async execute(input: CreateTransactionInput) {
    return this.repository.create(input);
  }
}
