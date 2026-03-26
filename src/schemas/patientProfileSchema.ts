import * as yup from "yup";

export const updatePatientProfileSchema = yup.object({
  name: yup.string().min(2, "Nome deve ter ao menos 2 caracteres").optional(),
  phone: yup
    .string()
    .matches(/^\d{10,11}$/, "Telefone inválido. Use apenas dígitos (10 ou 11)")
    .optional(),
  dateOfBirth: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento deve estar no formato YYYY-MM-DD")
    .optional(),
  // Endereço
  street: yup.string().optional(),
  number: yup.string().optional(),
  complement: yup.string().optional().nullable(),
  neighborhood: yup.string().optional(),
  city: yup.string().optional(),
  state: yup
    .string()
    .length(2, "Estado deve ter 2 caracteres (UF)")
    .optional(),
  zipCode: yup
    .string()
    .matches(/^\d{8}$/, "CEP deve ter 8 dígitos (sem traço)")
    .optional(),
});
