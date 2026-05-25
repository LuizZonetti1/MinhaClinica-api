import axios from "axios";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Valida se um CEP existe consultando a API ViaCEP.
 * Em desenvolvimento (NODE_ENV !== "production"), aceita qualquer CEP com 8 dígitos.
 * Em caso de falha da API externa, não bloqueia o cadastro.
 */
export const validateCep = async (cep: string | undefined | null): Promise<boolean> => {
    if (!cep) return true;
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return false;
    if (!IS_PRODUCTION) return true;
    try {
        const { data } = await axios.get<{ erro?: boolean | string }>(
            `https://viacep.com.br/ws/${digits}/json/`,
            { timeout: 5000 },
        );
        return !data.erro;
    } catch {
        // Se a API externa falhar, não bloqueamos o cadastro
        return true;
    }
};
