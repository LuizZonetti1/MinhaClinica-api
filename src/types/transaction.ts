import type { PaymentMethod, PaymentStatus, TransactionType } from "./enums";

export interface CreateTransactionInput {
  clinicId: string;
  userId: string;
  type: TransactionType;
  title: string;
  description?: string;
  amount: number;
  category?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  referenceDate?: string; // YYYY-MM-DD
  dueDate?: string | null; // YYYY-MM-DD
  notes?: string | null;
}

export interface TransactionRecord {
  id: string;
  clinicId: string;
  type: TransactionType;
  description: string;
  category: string | null;
  amount: number;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  referenceDate: Date;
  dueDate: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
