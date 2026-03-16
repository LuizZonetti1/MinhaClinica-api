import { ReportRepository } from "../../repository/reportRepository";
import type { CreateTransactionInput } from "../../repository/reportRepository";

export class CreateTransactionService {
  private repository: ReportRepository;

  constructor() {
    this.repository = new ReportRepository();
  }

  async execute(input: CreateTransactionInput) {
    return this.repository.createTransaction(input);
  }
}
