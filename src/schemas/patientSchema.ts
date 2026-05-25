import * as yup from "yup";
import { Gender } from "../types/enums";
import { validateCPF } from "../utils/validateCPF";
import { validateCep } from "../utils/validateCep";

const VALID_UF = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

// Mapeamento de gênero PT → enum (para compat. com o frontend)
const GENDER_MAP: Record<string, Gender> = {
  masculino: "MALE",
  feminino: "FEMALE",
  outro: "OTHER",
  prefiro_nao_informar: "PREFER_NOT_TO_SAY",
  nao_informar: "PREFER_NOT_TO_SAY",
  // já no formato correto — pass-through
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
  PREFER_NOT_TO_SAY: "PREFER_NOT_TO_SAY",
};

const GENDER_VALUES = Object.values(Gender);

/**
 * Schema para cadastro de paciente pela recepção
 * Todos os dados em uma única etapa; senha gerada automaticamente
 */
export const receptionRegisterPatientSchema = yup.object({
  name: yup
    .string()
    .required("Nome é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),

  email: yup
    .string()
    .required("Email é obrigatório")
    .email("Email inválido")
    .max(100, "Email deve ter no máximo 100 caracteres")
    .transform((v) => v?.toLowerCase().trim()),

  cpf: yup
    .string()
    .required("CPF é obrigatório")
    .test("cpf-valid", "CPF inválido", (v) => (v ? validateCPF(v) : false)),

  phone: yup
    .string()
    .required("Telefone é obrigatório")
    .test("phone-format", "Telefone inválido", (v) => {
      if (!v) return false;
      const digits = v.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 11;
    }),

  dateOfBirth: yup
    .date()
    .required("Data de nascimento é obrigatória")
    .transform((value, originalValue) => {
      if (originalValue instanceof Date) return originalValue;
      if (typeof originalValue === "string") {
        const brFormat = originalValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (brFormat) return new Date(`${brFormat[3]}-${brFormat[2]}-${brFormat[1]}`);
      }
      return value;
    })
    .max(new Date(), "Data de nascimento não pode ser futura")
    .typeError("Data de nascimento inválida"),

  gender: yup
    .string()
    .required("Gênero é obrigatório")
    .transform((v) => GENDER_MAP[v] ?? v)
    .oneOf(GENDER_VALUES, "Gênero inválido"),

  // Opcionais — mesmos do completePatientSchema
  rg: yup.string().nullable().max(20),

  zipCode: yup
    .string()
    .nullable()
    .test("cep-valid", "CEP inválido", async (v) => {
      if (!v) return true;
      const digits = v.replace(/\D/g, "");
      if (digits.length !== 8) return false;
      return validateCep(digits);
    }),

  street: yup.string().nullable().max(200),
  number: yup.string().nullable().max(10),
  complement: yup.string().nullable().max(100),
  neighborhood: yup.string().nullable().max(100),
  city: yup.string().nullable().max(100),

  state: yup
    .string()
    .nullable()
    .transform((v) => v?.toUpperCase())
    .oneOf([...VALID_UF, null, undefined, ""], "Estado (UF) inválido"),

  alternativePhone: yup
    .string()
    .nullable()
    .test("alt-phone-format", "Telefone alternativo inválido", (v) => {
      if (!v) return true;
      const digits = v.replace(/\D/g, "");
      return digits.length >= 8 && digits.length <= 11;
    }),

  bloodType: yup
    .string()
    .nullable()
    .oneOf(
      ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null, undefined, ""],
      "Tipo sanguíneo inválido",
    ),
  allergies: yup.string().nullable().max(1000),
  medications: yup.string().nullable().max(1000),
  conditions: yup.string().nullable().max(1000),
  observations: yup.string().nullable().max(1000),

  emergencyContactName: yup.string().nullable().max(100),
  emergencyContactPhone: yup
    .string()
    .nullable()
    .test("emergency-phone-format", "Telefone de emergência inválido", (v) => {
      if (!v) return true;
      const digits = v.replace(/\D/g, "");
      return digits.length >= 8 && digits.length <= 11;
    }),
});

/**
 * Schema para registro inicial de paciente (público)
 * Apenas nome e email
 */
export const registerPatientSchema = yup.object({
  name: yup
    .string()
    .required("Nome é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),

  email: yup
    .string()
    .required("Email é obrigatório")
    .email("Email inválido")
    .max(100, "Email deve ter no máximo 100 caracteres")
    .transform((v) => v?.toLowerCase().trim()),
});

/**
 * Schema para completar cadastro de paciente (Etapa 3)
 * Aceita CPF/CEP/telefone formatados (com máscara do frontend)
 */
export const completePatientSchema = yup.object({
  cpf: yup
    .string()
    .required("CPF é obrigatório")
    .test("cpf-valid", "CPF inválido", (v) => (v ? validateCPF(v) : false)),

  phone: yup
    .string()
    .required("Telefone é obrigatório")
    // Aceita (00) 00000-0000, (00) 0000-0000 ou só dígitos
    .test("phone-format", "Telefone inválido", (v) => {
      if (!v) return false;
      const digits = v.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 11;
    }),

  password: yup
    .string()
    .required("Senha é obrigatória")
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(50, "Senha deve ter no máximo 50 caracteres"),

  dateOfBirth: yup
    .date()
    .required("Data de nascimento é obrigatória")
    .transform((value, originalValue) => {
      // Aceita ISO, date object ou string DD/MM/YYYY
      if (originalValue instanceof Date) return originalValue;
      if (typeof originalValue === "string") {
        // Tenta DD/MM/YYYY
        const brFormat = originalValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (brFormat) return new Date(`${brFormat[3]}-${brFormat[2]}-${brFormat[1]}`);
      }
      return value;
    })
    .max(new Date(), "Data de nascimento não pode ser futura")
    .typeError("Data de nascimento inválida"),

  gender: yup
    .string()
    .required("Gênero é obrigatório")
    .transform((v) => GENDER_MAP[v] ?? v)
    .oneOf(GENDER_VALUES, "Gênero inválido"),

  // Opcionais
  rg: yup.string().nullable().max(20),

  zipCode: yup
    .string()
    .nullable()
    // Aceita 00000-000 ou 00000000; em produção verifica existência via ViaCEP
    .test("cep-valid", "CEP inválido", async (v) => {
      if (!v) return true;
      const digits = v.replace(/\D/g, "");
      if (digits.length !== 8) return false;
      return validateCep(digits);
    }),

  street: yup.string().nullable().max(200),
  number: yup.string().nullable().max(10),
  complement: yup.string().nullable().max(100),
  neighborhood: yup.string().nullable().max(100),
  city: yup.string().nullable().max(100),

  state: yup
    .string()
    .nullable()
    .transform((v) => v?.toUpperCase())
    .oneOf([...VALID_UF, null, undefined, ""], "Estado (UF) inválido"),

  alternativePhone: yup
    .string()
    .nullable()
    .test("alt-phone-format", "Telefone alternativo inválido", (v) => {
      if (!v) return true;
      const digits = v.replace(/\D/g, "");
      return digits.length >= 8 && digits.length <= 11;
    }),

  // Dados médicos
  bloodType: yup
    .string()
    .nullable()
    .oneOf(
      ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null, undefined, ""],
      "Tipo sanguíneo inválido",
    ),
  allergies: yup.string().nullable().max(1000),
  medications: yup.string().nullable().max(1000),
  conditions: yup.string().nullable().max(1000),
  observations: yup.string().nullable().max(1000),

  // Contato de emergência
  emergencyContactName: yup.string().nullable().max(100),
  emergencyContactPhone: yup
    .string()
    .nullable()
    .test("emergency-phone-format", "Telefone de emergência inválido", (v) => {
      if (!v) return true;
      const digits = v.replace(/\D/g, "");
      return digits.length >= 8 && digits.length <= 11;
    }),
});
