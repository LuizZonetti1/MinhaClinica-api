/**
 * Timezone único usado em todos os cálculos de agendamento/relatório.
 * Antes redefinido localmente em ~23 arquivos (risco de divergência
 * acidental caso um dia precise mudar). Clinic.timezone existe no schema
 * mas é dead code (só devolvido em GET, nunca lido por lógica de negócio) —
 * ver matriz V2 e V12 do PLANO_CORRECOES_RODADA5.md.
 */
export const DEFAULT_TIMEZONE = "America/Sao_Paulo";
