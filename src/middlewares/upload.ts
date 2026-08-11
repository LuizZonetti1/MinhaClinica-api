import type { NextFunction, Request, Response } from "express";
import multer from "multer";

// Reexporta os storages do Cloudinary para manter compatibilidade com importações existentes
export { uploadDocument as uploadDocumentAttachment } from "../config/multer";

const MULTER_ERROR_MESSAGES: Record<string, string> = {
  LIMIT_UNEXPECTED_FILE: "Campo de arquivo inesperado.",
  LIMIT_FILE_COUNT: "Quantidade de arquivos acima do permitido.",
};

/**
 * Traduz um MulterError (limite de tamanho, campo ou quantidade) para uma
 * mensagem em português. Retorna null se `err` não for um MulterError —
 * quem chama deve repassar o erro adiante (next/handleControllerError) nesse caso.
 */
export function translateMulterError(err: unknown, fileSizeLimitLabel: string): string | null {
  if (!(err instanceof multer.MulterError)) return null;
  if (err.code === "LIMIT_FILE_SIZE") {
    return `Arquivo maior que o limite permitido (${fileSizeLimitLabel}).`;
  }
  return MULTER_ERROR_MESSAGES[err.code] ?? "Falha no envio do arquivo.";
}

/**
 * Middleware de erro (4 args) para montar logo após um multer mountado
 * direto na rota (ex.: router.post(path, uploadX, handleMulterError("5 MB"), handler)).
 * Não serve para uploadProfile, que é invocado manualmente no controller —
 * lá, chame translateMulterError() direto.
 */
export function handleMulterError(fileSizeLimitLabel: string) {
  return (err: unknown, _req: Request, res: Response, next: NextFunction): void => {
    const message = translateMulterError(err, fileSizeLimitLabel);
    if (message) {
      res.status(400).json({ error: message });
      return;
    }
    next(err);
  };
}
