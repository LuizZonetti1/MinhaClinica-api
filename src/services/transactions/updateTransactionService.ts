import { TransactionRepository } from "../../repository/transactionRepository";
import type { UpdateTransactionInput } from "../../types/transaction";

export class UpdateTransactionService {
  private repository = new TransactionRepository();

  async execute(id: string, clinicId: string, input: UpdateTransactionInput) {
    const existing = await this.repository.findByIdAndClinic(id, clinicId);

    if (!existing) {
      throw new Error("Transação não encontrada");
    }

    return this.repository.update(id, input);
  }
}
