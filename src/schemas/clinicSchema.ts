import * as yup from "yup";

// Regex para validações
const cnpjRegex = /^\d{14}$/;
const phoneRegex = /^\d{10,11}$/;
const cepRegex = /^\d{8}$/;
const ufRegex = /^[A-Z]{2}$/;
const subdomainRegex = /^[a-z0-9-]+$/;

/**
 * Schema para Etapa 1 — Início do cadastro de clínica (público)
 * POST /api/clinics/register/start
 * Recebe os dados da clínica + nome e email do dono
 */
export const clinicRegisterStartSchema = yup.object({
  // ── Dados da clínica ──────────────────────────────────────────
  legalName: yup
    .string()
    .required("Razão social é obrigatória")
    .min(3, "Razão social deve ter no mínimo 3 caracteres")
    .max(200, "Razão social deve ter no máximo 200 caracteres"),

  tradeName: yup
    .string()
    .required("Nome fantasia é obrigatório")
    .min(3, "Nome fantasia deve ter no mínimo 3 caracteres")
    .max(200, "Nome fantasia deve ter no máximo 200 caracteres"),

  cnpj: yup
    .string()
    .required("CNPJ é obrigatório")
    .matches(cnpjRegex, "CNPJ deve conter exatamente 14 dígitos")
    .length(14, "CNPJ deve ter 14 dígitos")
    .transform((v) => v?.replace(/\D/g, "")),

  // E-mail de contato da clínica (pode ser diferente do e-mail do dono)
  clinicEmail: yup
    .string()
    .required("E-mail da clínica é obrigatório")
    .email("E-mail da clínica inválido")
    .max(100)
    .transform((v) => v?.toLowerCase().trim()),

  phone: yup
    .string()
    .required("Telefone é obrigatório")
    .matches(phoneRegex, "Telefone deve ter 10 ou 11 dígitos")
    .transform((v) => v?.replace(/\D/g, "")),

  website: yup.string().url("Website deve ser uma URL válida").optional(),

  // ── Endereço da clínica ────────────────────────────────────────
  zipCode: yup
    .string()
    .required("CEP é obrigatório")
    .matches(cepRegex, "CEP deve conter exatamente 8 dígitos")
    .length(8, "CEP deve ter 8 dígitos")
    .transform((v) => v?.replace(/\D/g, "")),

  street: yup
    .string()
    .required("Logradouro é obrigatório")
    .min(3, "Logradouro deve ter no mínimo 3 caracteres")
    .max(200),

  number: yup.string().required("Número é obrigatório").max(10),

  complement: yup.string().max(100).optional(),

  neighborhood: yup
    .string()
    .required("Bairro é obrigatório")
    .min(3, "Bairro deve ter no mínimo 3 caracteres")
    .max(100),

  city: yup
    .string()
    .required("Cidade é obrigatória")
    .min(3, "Cidade deve ter no mínimo 3 caracteres")
    .max(100),

  state: yup
    .string()
    .required("Estado é obrigatório")
    .matches(ufRegex, "Estado deve ser uma UF válida (ex: SP, RJ)")
    .length(2)
    .uppercase(),

  subdomain: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .test(
      "subdomain-format",
      "Subdomain deve conter apenas letras minúsculas, números e hífens",
      (value) => (!value ? true : subdomainRegex.test(value)),
    )
    .test("subdomain-length", "Subdomain deve ter entre 3 e 50 caracteres", (value) =>
      !value ? true : value.length >= 3 && value.length <= 50,
    )
    .optional(),

  timezone: yup.string().default("America/Sao_Paulo").optional(),

  // ── Dados do dono (futuro usuário ADMIN) ──────────────────────
  ownerName: yup
    .string()
    .required("Nome do responsável é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100),

  ownerEmail: yup
    .string()
    .required("E-mail do responsável é obrigatório")
    .email("E-mail do responsável inválido")
    .max(100)
    .transform((v) => v?.toLowerCase().trim()),
});

/**
 * Schema para Etapa 3 — Completar dados do dono
 * POST /api/clinics/register/complete
 * Protegido por JWT temporário gerado após verificação de e-mail
 */
export const clinicRegisterCompleteSchema = yup.object({
  password: yup
    .string()
    .required("Senha é obrigatória")
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(100),

  cpf: yup
    .string()
    .required("CPF é obrigatório")
    .matches(/^\d{11}$/, "CPF deve conter exatamente 11 dígitos")
    .transform((v) => v?.replace(/\D/g, "")),

  phone: yup
    .string()
    .required("Telefone é obrigatório")
    .matches(phoneRegex, "Telefone deve ter 10 ou 11 dígitos")
    .transform((v) => v?.replace(/\D/g, "")),
});

/**
 * Schema para atualização de clínica
 * PUT /api/clinics/:id
 */
export const clinicUpdateSchema = yup.object({
  legalName: yup.string().min(3).max(200).optional(),
  tradeName: yup.string().min(3).max(200).optional(),
  email: yup.string().email().lowercase().optional(),
  phone: yup.string().matches(phoneRegex).optional(),
  website: yup.string().url().optional(),
  logoUrl: yup.string().url().optional(),
  zipCode: yup.string().matches(cepRegex).length(8).optional(),
  street: yup.string().min(3).max(200).optional(),
  number: yup.string().max(10).optional(),
  complement: yup.string().max(100).optional(),
  neighborhood: yup.string().min(3).max(100).optional(),
  city: yup.string().min(3).max(100).optional(),
  state: yup.string().matches(ufRegex).length(2).uppercase().optional(),
  subdomain: yup.string().matches(subdomainRegex).min(3).max(50).optional(),
  customDomain: yup.string().url().optional(),
  timezone: yup.string().optional(),
  isActive: yup.boolean().optional(),
});
