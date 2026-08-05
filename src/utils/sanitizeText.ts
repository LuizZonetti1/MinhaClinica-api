/**
 * Remove tags HTML de campos que nunca deveriam conter markup — nome,
 * título, CPF, telefone, e-mail. NÃO usar em conteúdo clínico (observações,
 * queixa principal, prescrição, comentários): lá a proteção correta é
 * escapar na saída (ver escapeHtml.ts), não mutilar o texto do profissional.
 */
export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}
