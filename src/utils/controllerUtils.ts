import type { Response } from "express";

/**
 * Erros "esperados" carregam statusCode atribuído na origem
 * (Object.assign(new Error("..."), { statusCode: 400 })).
 * A mensagem desses é escrita para o usuário e pode ser exibida.
 *
 * Erros sem statusCode são inesperados (Prisma, TypeError, etc.).
 * A mensagem deles pode conter caminho de arquivo, nome de modelo e
 * estrutura interna — nunca vai ao cliente.
 */
export const handleControllerError = (
  res: Response,
  error: unknown,
  fallbackMessage: string,
  defaultStatus = 400,
): void => {
  const hasIntentionalStatus =
    error instanceof Error &&
    "statusCode" in error &&
    typeof (error as Error & { statusCode: unknown }).statusCode === "number";

  if (hasIntentionalStatus) {
    const statusCode = (error as Error & { statusCode: number }).statusCode;

    if (statusCode < 500) {
      // Erros estruturados (ex: CPF/e-mail duplicado, conteúdo incompleto)
      // carregam code/action/errors além da mensagem, para o frontend oferecer
      // uma ação de saída ou listar os campos pendentes.
      const { code, action, errors } = error as Error & {
        code?: string;
        action?: string;
        errors?: unknown;
      };
      res.status(statusCode).json({
        error: error.message,
        ...(code && { code }),
        ...(action && { action }),
        ...(errors && { errors }),
      });
      return;
    }

    console.error("[ERRO INTERNO]", error);
    res.status(statusCode).json({ error: fallbackMessage });
    return;
  }

  // Erro inesperado: registra completo no servidor, devolve genérico ao cliente.
  console.error("[ERRO NÃO TRATADO]", error);
  res.status(defaultStatus >= 500 ? defaultStatus : 500).json({ error: fallbackMessage });
};
