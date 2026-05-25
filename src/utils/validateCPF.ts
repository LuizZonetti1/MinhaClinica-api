/**
 * Valida CPF pelo algoritmo dos dígitos verificadores.
 * Aceita CPF com ou sem máscara.
 * Retorna false para CPFs com todos os dígitos iguais (ex: 111.111.111-11).
 */
export const validateCPF = (cpf: string): boolean => {
    const digits = cpf.replace(/\D/g, "");

    if (digits.length !== 11) return false;

    // Rejeita sequências inválidas conhecidas
    if (/^(\d)\1{10}$/.test(digits)) return false;

    // Valida primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += Number(digits[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== Number(digits[9])) return false;

    // Valida segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += Number(digits[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== Number(digits[10])) return false;

    return true;
};
