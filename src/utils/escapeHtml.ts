/**
 * Escapa caracteres especiais de HTML antes de interpolar em um template de
 * e-mail (ou qualquer outra saída HTML fora do React, que já escapa
 * automaticamente). Nunca usar para sanitizar dado que será exibido pelo
 * React — só para saídas não-React (e-mail, PDF em HTML, etc.).
 */
export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
