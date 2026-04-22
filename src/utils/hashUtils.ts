import crypto from "node:crypto";

/**
 * Gera um hash SHA-256 do conteúdo JSON serializado de um documento.
 * Usado para verificar integridade pós-envio.
 */
export function generateIntegrityHash(content: unknown): string {
  const serialized = JSON.stringify(content);
  return crypto.createHash("sha256").update(serialized, "utf-8").digest("hex");
}
