import * as yup from "yup";

// Regex para validações
const cnpjRegex = /^\d{14}$/;
const phoneRegex = /^\d{10,11}$/;
const cepRegex = /^\d{8}$/;
const ufRegex = /^[A-Z]{2}$/;
const subdomainRegex = /^[a-z0-9-]+$/;

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class ClinicSchema {
  // Schema para criação de clínica
  static create = yup.object({
    // Dados cadastrais
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
      .length(14, "CNPJ deve ter 14 dígitos"),

    email: yup
      .string()
      .required("E-mail é obrigatório")
      .email("E-mail inválido")
      .lowercase("E-mail deve estar em minúsculas"),

    phone: yup
      .string()
      .required("Telefone é obrigatório")
      .matches(phoneRegex, "Telefone deve ter 10 ou 11 dígitos"),

    website: yup.string().url("Website deve ser uma URL válida").optional(),

    logoUrl: yup.string().url("Logo URL deve ser uma URL válida").optional(),

    // Endereço
    zipCode: yup
      .string()
      .required("CEP é obrigatório")
      .matches(cepRegex, "CEP deve conter exatamente 8 dígitos")
      .length(8, "CEP deve ter 8 dígitos"),

    street: yup
      .string()
      .required("Logradouro é obrigatório")
      .min(3, "Logradouro deve ter no mínimo 3 caracteres")
      .max(200, "Logradouro deve ter no máximo 200 caracteres"),

    number: yup
      .string()
      .required("Número é obrigatório")
      .max(10, "Número deve ter no máximo 10 caracteres"),

    complement: yup.string().max(100, "Complemento deve ter no máximo 100 caracteres").optional(),

    neighborhood: yup
      .string()
      .required("Bairro é obrigatório")
      .min(3, "Bairro deve ter no mínimo 3 caracteres")
      .max(100, "Bairro deve ter no máximo 100 caracteres"),

    city: yup
      .string()
      .required("Cidade é obrigatória")
      .min(3, "Cidade deve ter no mínimo 3 caracteres")
      .max(100, "Cidade deve ter no máximo 100 caracteres"),

    state: yup
      .string()
      .required("Estado é obrigatório")
      .matches(ufRegex, "Estado deve ser uma UF válida (ex: SP, RJ)")
      .length(2, "Estado deve ter 2 caracteres")
      .uppercase("Estado deve estar em maiúsculas"),

    // Configurações (opcionais agora)
    subdomain: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .test(
        "subdomain-format",
        "Subdomain deve conter apenas letras minúsculas, números e hífens",
        (value) => {
          if (!value) return true;
          return subdomainRegex.test(value);
        },
      )
      .test("subdomain-length", "Subdomain deve ter entre 3 e 50 caracteres", (value) => {
        if (!value) return true;
        return value.length >= 3 && value.length <= 50;
      })
      .optional(),

    customDomain: yup
      .string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .test("custom-domain-url", "Domínio personalizado deve ser uma URL válida", (value) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      })
      .optional(),

    timezone: yup.string().default("America/Sao_Paulo").optional(),

    isActive: yup.boolean().default(true).optional(),
  });

  // Schema para atualização de clínica (todos os campos opcionais)
  static update = yup.object({
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

  // Schema para busca por localização
  static searchByLocation = yup.object({
    city: yup.string().optional(),
    state: yup.string().matches(ufRegex).length(2).uppercase().optional(),
    neighborhood: yup.string().optional(),
  });
}
