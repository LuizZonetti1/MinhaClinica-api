/**
 * Remove todos os caracteres não numéricos do CNPJ.
 */
export const stripCNPJ = (cnpj: string): string => cnpj.replace(/\D/g, "");

const FIRST_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const SECOND_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

const checkDigit = (digits: string, weights: number[]): number => {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += Number(digits[i]) * weights[i];
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
};

/**
 * Valida CNPJ pelo algoritmo dos dígitos verificadores.
 * Aceita CNPJ com ou sem máscara.
 * Retorna false para CNPJs com todos os dígitos iguais (ex: 11.111.111/1111-11).
 *
 * Espelha validateCPF: até a rodada 6 o CNPJ só era checado por tamanho e
 * unicidade, então um número inventado como 11.222.333/0001-99 entrava na base.
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const digits = stripCNPJ(cnpj);

  if (digits.length !== 14) return false;

  // Rejeita sequências inválidas conhecidas
  if (/^(\d)\1{13}$/.test(digits)) return false;

  if (checkDigit(digits, FIRST_WEIGHTS) !== Number(digits[12])) return false;
  if (checkDigit(digits, SECOND_WEIGHTS) !== Number(digits[13])) return false;

  return true;
};
