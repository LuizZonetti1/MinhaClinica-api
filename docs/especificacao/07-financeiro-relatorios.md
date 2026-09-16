# Financeiro e relatórios — especificação de comportamento

> Parte da especificação da API (ver [README](README.md)). Legenda: prioridade P0/P1/P2 · camada U/I/C/E2E · status ✅ testado · ⬜ sem teste · ⚠ bug confirmado · ❓ decisão pendente.

## Escopo

Lançamentos financeiros manuais (`FinancialRecord`, `src/services/transactions/*`, `src/services/reports/createTransactionService.ts`), o relatório consolidado da clínica (`src/services/reports/reportService.ts`) e a exportação em PDF (`src/services/reports/reportExportService.ts`). Vários achados aqui são sobre DATAS EM FUSO HORÁRIO: `referenceDate`/`appointmentDate` são colunas `@db.Date` (armazenadas como meia-noite UTC), mas boa parte do código monta os limites de período em horário de Brasília (UTC-3) — a combinação derruba silenciosamente registros do dia 1º de cada período.

## Transações — criação e edição

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| FIN-001 | **DEVE:** restringir criar, listar e editar transações a `ADMIN`/`RECEPTIONIST` da clínica ativa — não existe rota de exclusão. | P0 | I | ⬜ | `src/routes/transaction.routes.ts:13-31` |
| FIN-002 | **NÃO PODE:** o título ter menos de 3 ou mais de 200 caracteres, nem conter HTML (sanitizado). | P2 | U | ⬜ | `src/schemas/transactionSchema.ts:17-21,63-67` |
| FIN-003 | **NÃO PODE:** o valor ser zero, negativo, ou maior que R$ 99.999.999,99. | P1 | U | ⬜ | `src/schemas/transactionSchema.ts:27-30` |
| FIN-004 | **DEVE:** `paymentStatus` nascer `PENDING` quando não informado. | P1 | I | ⬜ | `src/repository/transactionRepository.ts:6-17` |
| FIN-005 | **NÃO PODE:** um `RECEPTIONIST` editar uma transação criada por OUTRO usuário — só o próprio autor ou um `ADMIN`. | P0 | I | ⬜ | `src/services/transactions/updateTransactionService.ts:20-26` |
| FIN-006 | **NÃO PODE:** `referenceDate` (data de competência), quando não informada, ser calculada em UTC puro (`new Date().toISOString().slice(0,10)`) em vez do fuso da clínica — depois das 21h de Brasília, uma transação sem data explícita já cai gravada no dia seguinte. | P2 | I | ⚠ | `src/repository/transactionRepository.ts:6-7,18` |
| FIN-007 | **DEVE:** ao marcar uma transação como `PAID` (vinda de outro status), disparar notificação `PAYMENT_CONFIRMED` ao paciente vinculado, sem bloquear a resposta em caso de falha. | P1 | I | ⬜ | `src/services/transactions/updateTransactionService.ts:30-62` |
| FIN-008 | **NÃO PODE:** a notificação de FIN-007 nunca disparar porque `patientId` não é gravado em nenhum lugar da criação de transação — `FinancialRecord.patientId` existe no schema, mas `TransactionRepository.create` não o recebe nem grava; toda transação nasce com `patientId: null`, então `existing.patientId` em `UpdateTransactionService` nunca é verdadeiro. | P1 | I | ⚠ | `src/repository/transactionRepository.ts:6-24`, `prisma/schema.prisma:884-885` |

## Transações — listagem e totais

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| FIN-009 | **DEVE:** listar por período (`1m`, `3m`, `6m`, `12m`) a partir da data de referência, mais recentes primeiro. | P1 | I | ⬜ | `src/services/transactions/listTransactionsService.ts:23-43` |
| FIN-010 | **NÃO PODE:** o período `1m` (`now.startOf("month")`, calculado no fuso de Brasília) excluir transações datadas do dia 1º do mês — `startOf("month")` em UTC-3 vira `00:00 BRT = 03:00 UTC`, e uma `referenceDate` de "dia 1º" gravada como meia-noite UTC (`@db.Date`) fica ANTES desse corte (`referenceDate >= startDate` falha para ela). | P1 | I | ⚠ | `src/services/transactions/listTransactionsService.ts:28-36`, `src/repository/transactionRepository.ts:26-32` |
| FIN-011 | **DEVE:** resolver o nome de quem criou cada transação em lote (uma consulta para todos os `createdBy` distintos), sem N+1. | P2 | I | ⬜ | `src/services/transactions/listTransactionsService.ts:45-53` |
| FIN-012 | **NÃO PODE:** os totais (`totalIncome`/`totalExpense`/`net`) do período distinguir `paymentStatus` — hoje somam `PENDING`, `PAID`, `CANCELLED` e `REFUNDED` igualmente. | P1 | I | ❓ | `src/services/transactions/listTransactionsService.ts:72-88` |
| FIN-013 | **NÃO PODE:** transações de OUTRA clínica aparecerem na listagem — sempre filtradas por `clinicId` do token. | P0 | I | ⬜ | `src/repository/transactionRepository.ts:26-32` |

## Relatórios da clínica

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| FIN-014 | **DEVE:** restringir os relatórios da clínica a `ADMIN`. | P0 | I | ⬜ | `src/routes/report.routes.ts:13-17` |
| FIN-015 | **NÃO PODE:** consultas ou lançamentos de OUTRA clínica entrarem no relatório — sempre filtrados por `clinicId`. | P0 | I | ⬜ | `src/repository/reportRepository.ts:5-42` |
| FIN-016 | **NÃO PODE:** o relatório ter limite SUPERIOR de data — `getAppointmentsInPeriod`/`getFinancialRecordsInPeriod` só filtram `gte: startDate`, sem `lte`; uma consulta ou transação agendada para o FUTURO (semana/mês/ano que vem) entra no relatório de "últimos N meses" da mesma forma que uma do passado. | P1 | I | ⚠ | `src/repository/reportRepository.ts:5-19,31-41` |
| FIN-017 | **NÃO PODE:** o início do período (`now.subtract(months-1,"month").startOf("month")`, calculado no fuso de Brasília) excluir consultas/lançamentos do dia 1º do primeiro mês do período — mesma causa-raiz de FIN-010, aqui afetando TODOS os períodos do relatório (`1m`/`3m`/`6m`/`12m`), não só a lista de transações. | P1 | I | ⚠ | `src/services/reports/reportService.ts:53-56` |
| FIN-018 | **DEVE:** "Cancelamentos" contar só `CANCELLED`, nunca `NO_SHOW`/`RESCHEDULED`. | P1 | I | ⬜ | `src/services/reports/reportService.ts:72-80` |
| FIN-019 | **NÃO PODE:** `totalRevenue`/`totalExpense`/`estimatedProfit` distinguir `paymentStatus` — soma todos os lançamentos do tipo, pagos ou não. | P1 | I | ❓ | `src/services/reports/reportService.ts:82-90` |
| FIN-020 | **NÃO PODE:** o gráfico `statusDistribution` ("Realizadas"/"Canceladas"/"Não Compareceu") ser inconsistente com o total de consultas do período — "Realizadas" conta só `AppointmentStatus.COMPLETED`, deixando de fora `COMPLETED_WITH_ADDENDUM` (que `consultationsCount`, alguns parágrafos acima na MESMA função, trata como consulta válida); uma consulta com adendo soma no total mas desaparece das três fatias do gráfico. | P2 | I | ⚠ | `src/services/reports/reportService.ts:75-77,159-175` |
| FIN-021 | **NÃO PODE:** o ranking de profissionais/especialidades mais procurados (`topProfessionals`/`topSpecialties`) contar consultas `CANCELLED`, `NO_SHOW` ou `RESCHEDULED` — usa a lista bruta de consultas do período sem excluir esses status, então um profissional com muitos cancelamentos aparece artificialmente mais "procurado". | P2 | I | ⚠ | `src/services/reports/reportService.ts:177-215` |

## Exportação de relatórios (PDF)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| FIN-022 | **NÃO PODE:** a data final ser anterior à inicial, nem o período exceder 366 dias. | P1 | U | ⬜ | `src/services/reports/reportExportService.ts:692-699` |
| FIN-023 | **DEVE:** interpretar início e fim do período em horário de Brasília, começando às 00:00:00 e terminando às 23:59:59.999 do dia informado — diferente de FIN-010/FIN-017, aqui o cálculo já usa o fuso corretamente. | P1 | U | ⬜ | `src/services/reports/reportExportService.ts:686-687` |
| FIN-024 | **DEVE:** o PDF exportado incluir o nome do paciente de cada lançamento/consulta — dado necessário para a clínica conferir o relatório, não um vazamento (uso interno, só ADMIN). | P2 | I | ⬜ | `src/services/reports/reportExportService.ts:817,847` |

## Notas

- **FIN-008 (⚠ P1):** o mecanismo mais concreto desta área — o campo existe no banco (`FinancialRecord.patientId`) e é LIDO por `UpdateTransactionService`, mas nenhum schema (`createTransactionSchema`/`updateTransactionSchema`) nem `TransactionRepository.create` jamais o recebem ou gravam. Ou seja, o recurso "avisar o paciente quando o pagamento for confirmado" está morto desde a criação — nunca disparou em produção. Corrigir exige decidir de onde `patientId` viria (a transação tem uma tela de vínculo com paciente/consulta? Hoje não.) — ver [pergunta em aberto](99-perguntas-em-aberto.md) antes de implementar o teste.
- **FIN-010/FIN-017 (⚠ P1, mesma causa-raiz):** o padrão `dayjs().tz(DEFAULT_TIMEZONE).startOf(...)` seguido de comparação direta com uma coluna `@db.Date` (que o Postgres/Prisma trata como meia-noite UTC) aparece em pelo menos dois lugares desta área. Recomenda-se, ao corrigir, criar um helper único (`startOfDayAsUtcDate(date)`) que converta explicitamente "meia-noite no fuso da clínica" para "meia-noite UTC equivalente ao dia certo" — hoje cada arquivo faz essa conta à mão e erra da mesma forma.
- **FIN-012/FIN-019 (❓ P-FIN-01):** ver [pergunta em aberto](99-perguntas-em-aberto.md) — receita, lucro e totais do período devem contar só transações `PAID`, ou o regime é de competência (conta tudo que foi lançado, pago ou não)? Nenhum comentário no código declara a intenção; times financeiros costumam ter uma resposta forte para isso, então vale confirmar antes de travar o comportamento num teste.
- **FIN-020/FIN-021 (⚠, baixa prioridade mas fáceis de corrigir):** ambos usam a MESMA lista de consultas do período (`appointments`) que outras métricas da mesma função já filtram corretamente com `CONSULTATION_EXCLUDED_STATUSES`/`nonCountableStatuses` — a correção é reaproveitar esse filtro em vez de duplicar a lógica.
