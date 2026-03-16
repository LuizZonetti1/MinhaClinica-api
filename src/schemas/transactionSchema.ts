import * as yup from "yup";

const transactionTypes = ["INCOME", "EXPENSE"] as const;
const paymentMethods = [
  "CASH",
  "DEBIT_CARD",
  "CREDIT_CARD",
  "PIX",
  "BANK_TRANSFER",
  "CHECK",
] as const;
const paymentStatuses = ["PENDING", "PAID", "CANCELLED", "REFUNDED"] as const;

export const updateTransactionSchema = yup.object({
  type: yup.string().oneOf(transactionTypes, "Tipo inválido. Use: INCOME ou EXPENSE").optional(),

  title: yup
    .string()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres")
    .optional(),

  description: yup.string().max(500).optional(),

  amount: yup
    .number()
    .typeError("Valor deve ser um número")
    .positive("Valor deve ser positivo")
    .optional(),

  category: yup.string().max(100).optional().nullable(),

  paymentMethod: yup.string().oneOf(paymentMethods, "Método de pagamento inválido").optional().nullable(),

  paymentStatus: yup.string().oneOf(paymentStatuses, "Status de pagamento inválido").optional(),

  referenceDate: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Data de referência deve estar no formato YYYY-MM-DD")
    .optional(),

  dueDate: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Data de vencimento deve estar no formato YYYY-MM-DD")
    .optional()
    .nullable(),

  notes: yup.string().max(1000).optional().nullable(),
});

export const createTransactionSchema = yup.object({
  type: yup
    .string()
    .oneOf(transactionTypes, "Tipo inválido. Use: INCOME ou EXPENSE")
    .required("Tipo é obrigatório"),

  title: yup
    .string()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres")
    .required("Título é obrigatório"),

  description: yup.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),

  amount: yup
    .number()
    .typeError("Valor deve ser um número")
    .positive("Valor deve ser positivo")
    .required("Valor é obrigatório"),

  category: yup.string().max(100).optional(),

  paymentMethod: yup.string().oneOf(paymentMethods, "Método de pagamento inválido").optional(),

  paymentStatus: yup.string().oneOf(paymentStatuses, "Status de pagamento inválido").optional(),

  referenceDate: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Data de referência deve estar no formato YYYY-MM-DD")
    .optional(),

  dueDate: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Data de vencimento deve estar no formato YYYY-MM-DD")
    .optional()
    .nullable(),

  notes: yup.string().max(1000).optional().nullable(),
});
