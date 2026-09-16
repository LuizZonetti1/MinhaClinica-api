# Agendamentos — especificação de comportamento

> Parte da especificação da API (ver [README](README.md)). Legenda: prioridade P0/P1/P2 · camada U/I/C/E2E · status ✅ testado · ⬜ sem teste · ⚠ bug confirmado · ❓ decisão pendente.

## Escopo

Criação, disponibilidade de horários, transições de status, cancelamento, remarcação, confirmação e no-show automático de consultas (`Appointment`). Cobre `src/services/appointments/*`, `src/services/patients/{cancel,reschedule,confirm,patientCreateAppointment}AppointmentService.ts`, `src/repository/appointmentRepository.ts`, `src/repository/patientDashboardRepository.ts`, `src/repository/receptionDashboardRepository.ts` e o acesso a uma consulta específica (`resolveAppointmentRole`, ver também [02-conta-unificada-vinculos.md](02-conta-unificada-vinculos.md)). Esta é a área com mais bugs confirmados da especificação — vários afetam segurança/LGPD ou dinheiro/operação da agenda.

## Criação — validação e recursos referenciados

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-001 | **DEVE:** validar `startTime` no formato `HH:mm`, dentro de 0–1439 minutos do dia, antes de qualquer outra regra. | P1 | I | ⬜ | `src/services/appointments/createAppointmentService.ts:40-44,123-129` |
| AGE-002 | **NÃO PODE:** agendar com um profissional inativo ou de outra clínica — 404. | P0 | I | ⬜ | `src/services/appointments/createAppointmentService.ts:47-65`, `src/services/patients/rescheduleAppointmentService.ts:72-81` |
| AGE-003 | **NÃO PODE:** agendar para um `patientId` inexistente — 404. | P0 | I | ⬜ | `src/services/appointments/createAppointmentService.ts:68-79` |
| AGE-004 | **NÃO PODE:** agendar numa `Clinic` inexistente — 404. | P1 | I | ⬜ | `src/services/appointments/createAppointmentService.ts:82-89` |
| AGE-005 | **DEVE:** notificar paciente, profissional, ADMIN e RECEPTIONIST ao criar uma consulta, sem que uma falha de notificação derrube a criação (bloco fire-and-forget). | P1 | I | ⬜ | `src/services/appointments/createAppointmentService.ts:204-326` |
| AGE-006 | **DEVE:** alertar a equipe sobre "novo paciente na clínica" só quando `ClinicSettings.sendNewPatientAlert` está ligado E é o primeiro agendamento do paciente NESTA clínica especificamente. | P2 | I | ⬜ | `src/services/appointments/createAppointmentService.ts:297-322` |

## Duração e procedimentos

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-007 | **DEVE:** resolver a duração da consulta por prioridade: `ProfessionalProcedure.customDuration` > `Procedure.defaultDuration` > `Professional.defaultAppointmentDuration`. | P1 | U | ⬜ | `src/utils/resolveAppointmentDuration.ts:12-20` |
| AGE-008 | **NÃO PODE:** aceitar um `procedureId` que não pertence à clínica, ou que não está vinculado ao profissional escolhido — 400. | P0 | I | ⬜ | `src/services/appointments/createAppointmentService.ts:95-113` |
| AGE-009 | **NÃO PODE:** um procedimento DESATIVADO (`Procedure.isActive:false`) continuar disponível para novos agendamentos ou remarcações. | P1 | I | ⚠ | `src/repository/procedureRepository.ts:62-74` |
| AGE-010 | **DEVE:** ao remarcar, preservar o procedimento e a duração da consulta original, inclusive recalculando `customDuration` para o profissional NOVO quando ele também atende esse procedimento. | P1 | I | ⬜ | `src/services/patients/rescheduleAppointmentService.ts:83-97` |

## Conflito de horário e concorrência

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-011 | **NÃO PODE:** criar uma consulta que sobreponha o horário de outra já existente do MESMO profissional — ignora consultas `CANCELLED`, `NO_SHOW` e `RESCHEDULED` (não contam como conflito). | P0 | I | ⬜ | `src/repository/appointmentRepository.ts:144-163`, `src/utils/appointmentStatusRules.ts` |
| AGE-012 | **DEVE:** checar o conflito e criar a consulta na MESMA transação `Serializable` — duas requisições concorrentes para o mesmo horário nunca resultam em dois agendamentos; a perdedora recebe 409. | P0 | I | ⬜ | `src/repository/appointmentRepository.ts:144-184`, `src/services/appointments/createAppointmentService.ts:160-185` |
| AGE-013 | **NÃO PODE:** o `bufferTime` (intervalo mínimo entre consultas) do profissional ser garantido fora da grade de `/slots` — a checagem de conflito real (`createIfNoConflict`) só compara sobreposição literal de horário, sem somar o buffer; uma consulta criada com horário exato "colado" na anterior passa. | P2 | I | ⚠ | `src/repository/appointmentRepository.ts:146-154` vs `src/services/appointments/getAvailableSlotsService.ts:191` |

## Antecedência, feriados e canal de agendamento

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-014 | **NÃO PODE:** a equipe (recepção/admin) agendar no passado — única regra de antecedência que vale para o staff. | P1 | I | ⬜ | `src/services/appointments/appointmentBookingRules.ts:157-159` |
| AGE-015 | **NÃO PODE:** o agendamento ONLINE (portal do paciente) ficar mais perto da consulta do que `ClinicSettings.minAdvanceBookingHours`. | P0 | I | ⬜ | `src/services/appointments/appointmentBookingRules.ts:144-156` |
| AGE-016 | **NÃO PODE:** um paciente escolher o `channel` do próprio agendamento para escapar da política de agendamento online (`allowOnlineBooking`) e da antecedência mínima (`minAdvanceBookingHours`) — o schema aceita `channel` no corpo da requisição do paciente, e informar `IN_PERSON` faz `isOnlineBooking` virar `false`, pulando as duas checagens acima por inteiro. | P0 | I | ⚠ | `src/schemas/patientBookingSchema.ts:20`, `src/services/patients/patientCreateAppointmentService.ts:29`, `src/services/appointments/createAppointmentService.ts:140,151` |
| AGE-017 | **NÃO PODE:** agendar (staff ou paciente) além de `ClinicSettings.maxAdvanceBookingDays` de antecedência. | P1 | I | ⬜ | `src/services/appointments/appointmentBookingRules.ts:46-61` |
| AGE-018 | **NÃO PODE:** agendar em data de feriado da clínica — fixo (data exata) ou recorrente (mesmo dia/mês, todo ano). | P1 | I | ⬜ | `src/services/appointments/appointmentBookingRules.ts:63-77` |
| AGE-019 | **DEVE:** aplicar EXATAMENTE as mesmas regras de feriado/antecedência em `/slots` (o que é oferecido) e na criação (o que é aceito) — usam a mesma função `findDateLevelBlock`/`getOnlineBookingPolicy`, para o paciente nunca clicar num horário "disponível" que o POST recusa. | P0 | I | ⬜ | `src/services/appointments/appointmentBookingRules.ts:36-45,82-97` |
| AGE-020 | **NÃO PODE:** `CreateAppointmentService` verificar `Patient.blockedAt`, `Patient.isActive` ou `Clinic.isActive` antes de criar a consulta — a recepção/admin conseguem marcar uma nova consulta para um paciente bloqueado por faltas (sem passar por "desbloquear") ou numa clínica desativada. | P1 | I | ❓ | `src/services/appointments/createAppointmentService.ts:67-89` |

## Horário de trabalho e bloqueios de agenda

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-021 | **NÃO PODE:** agendar num dia da semana em que o profissional não tem `ProfessionalWorkingHours` marcado como `isWorking`. | P1 | I | ⬜ | `src/services/appointments/appointmentBookingRules.ts:168-176` |
| AGE-022 | **NÃO PODE:** agendar fora do expediente (`startTime`/`endTime` do profissional) ou dentro do intervalo de almoço configurado. | P1 | I | ⬜ | `src/services/appointments/appointmentBookingRules.ts:177-188` |
| AGE-023 | **NÃO PODE:** agendar sobre um `ProfessionalScheduleBlock` (férias, folga) — bloqueio parcial compara o intervalo exato; bloqueio `isAllDay` derruba o dia inteiro. | P0 | I | ⬜ | `src/services/appointments/appointmentBookingRules.ts:190-211` |
| AGE-024 | **NÃO PODE:** um bloqueio de agenda `isAllDay` criado para o dia D (em horário de Brasília, meia-noite às 23:59:59) "vazar" e também bloquear o início do dia D+1 — a checagem busca bloqueios comparando `startDateTime`/`endDateTime` contra os limites do dia em UTC (`dayjs.utc(dateStr).startOf("day")`); como Brasília é UTC-3, um bloqueio de dia inteiro em horário local tem `endDateTime` real às 02:59:59 UTC do dia seguinte, que cai dentro da janela UTC consultada para o dia D+1, e o `isAllDay` então derruba o D+1 inteiro sem checar quanto do intervalo realmente se sobrepõe. | P1 | I | ⚠ | `src/services/appointments/appointmentBookingRules.ts:190-198`, `src/services/appointments/getAvailableSlotsService.ts:169-172,239-244` |
| AGE-025 | **DEVE:** exibir ao paciente o `reason` (motivo) de um bloqueio de agenda ao consultar `/slots`. | P2 | I | ⬜ | `src/services/appointments/getAvailableSlotsService.ts:256-260` |

## Slots disponíveis (`GET /appointments/slots`)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-026 | **DEVE:** marcar como indisponível todo horário já ocupado por outra consulta ativa do profissional (mesma exclusão de status de AGE-011). | P0 | I | ⬜ | `src/services/appointments/getAvailableSlotsService.ts:183-187,205-206` |
| AGE-027 | **DEVE:** empurrar o primeiro horário ofertável para a frente quando o pedido é do portal do paciente e cai dentro de `minAdvanceBookingHours`. | P1 | I | ⬜ | `src/services/appointments/getAvailableSlotsService.ts:84-86,211-218` |
| AGE-028 | **DEVE:** informar o motivo (`FULLY_BOOKED`, `DATE_BLOCKED`, `PAST_DATE`, `NO_WORKING_HOURS`, `DAY_OFF`, `ONLINE_BOOKING_DISABLED`) quando não há nenhum horário disponível no dia. | P2 | I | ⬜ | `src/services/appointments/getAvailableSlotsService.ts:246-260` |

## Transições de status

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-029 | **DEVE:** seguir uma matriz única de transições válidas (`SCHEDULED`→..., `IN_PROGRESS`→`COMPLETED`, `COMPLETED`→`COMPLETED_WITH_ADDENDUM`, os demais terminais). | P0 | U | ⬜ | `src/services/appointments/appointmentTransitions.ts:9-36` |
| AGE-030 | **NÃO PODE:** o profissional mudar o status de uma consulta além de `SCHEDULED`/`CONFIRMED`/`WAITING` → `IN_PROGRESS` — qualquer outra transição por essa rota é 400, mesmo que a matriz geral (AGE-029) permita mais para a recepção. | P0 | I | ⬜ | `src/services/appointments/patchAppointmentStatusService.ts:5-9,40-59` |
| AGE-031 | **NÃO PODE:** um profissional mudar o status de uma consulta que não é dele (`professional.userId !== userId`) — 403, mesmo sendo da clínica ativa. | P0 | I | ⬜ | `src/services/appointments/patchAppointmentStatusService.ts:33-38` |
| AGE-032 | **NÃO PODE:** mudar o status de uma consulta de OUTRA clínica — 403. | P0 | I | ⬜ | `src/services/appointments/patchAppointmentStatusService.ts:29-31` |
| AGE-033 | **NÃO PODE:** a recepção reabrir/alterar o status de uma consulta que já tem documento clínico gravado — 409 (evita divergência entre o status da consulta e o conteúdo já registrado). | P1 | I | ⬜ | `src/services/reception/receptionDashboardService.ts:195-222` |

## Cancelamento (pelo próprio paciente)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-034 | **NÃO PODE:** cancelar uma consulta que não é do paciente autenticado — 404 (não distingue "não existe" de "não é sua"). | P0 | I | ⬜ | `src/services/patients/cancelAppointmentService.ts:32-41,57-59` |
| AGE-035 | **NÃO PODE:** cancelar uma consulta fora de `SCHEDULED`/`CONFIRMED`/`WAITING`. | P1 | I | ⬜ | `src/services/patients/cancelAppointmentService.ts:61-72` |
| AGE-036 | **NÃO PODE:** cancelar com menos de `ClinicSettings.maxCancellationHours` de antecedência — regra que vale só para o paciente; recepção/admin cancelam por outro caminho, sem esse limite. | P1 | I | ⬜ | `src/services/patients/cancelAppointmentService.ts:74-96` |
| AGE-037 | **DEVE:** gravar `cancelledAt`, `cancelledBy` e `cancellationReason: PATIENT_REQUEST`, auditar, e avisar a equipe da clínica quando `sendCancellationAlert` não é `false` explicitamente. | P1 | I | ⬜ | `src/services/patients/cancelAppointmentService.ts:98-129,152-181` |

## Remarcação

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-038 | **NÃO PODE:** remarcar uma consulta de OUTRO paciente (modo paciente) — exige posse (`ownerUserId`) além do tenant. | P0 | I | ⬜ | `src/services/patients/rescheduleAppointmentService.ts:52-58` |
| AGE-039 | **NÃO PODE:** remarcar uma consulta fora de `SCHEDULED`/`CONFIRMED` (paciente) — a recepção pode receber uma lista de status diferente via `options.allowedStatuses`. | P1 | I | ⬜ | `src/services/patients/rescheduleAppointmentService.ts:28-31,64-69` |
| AGE-040 | **NÃO PODE:** remarcar uma consulta que está a poucos minutos de acontecer sem respeitar o mesmo aviso mínimo exigido para CANCELAR (`maxCancellationHours`) — `RescheduleAppointmentService` só valida a NOVA data/hora (feriado, expediente, bloqueio, antecedência mínima se for portal), nunca a proximidade da consulta ORIGINAL; um paciente pode contornar o limite de cancelamento "remarcando" para daqui a 1 minuto em vez de cancelar. | P1 | I | ⚠ | `src/services/patients/rescheduleAppointmentService.ts:44-112` (ausência da checagem que existe em `cancelAppointmentService.ts:74-96`) |
| AGE-041 | **DEVE:** ao remarcar, marcar a consulta ORIGINAL como `RESCHEDULED` (nunca excluída) e criar uma consulta nova ligada a ela — histórico preservado. | P1 | I | ⬜ | `src/repository/patientDashboardRepository.ts` (`rescheduleIfNoConflict`) |

## Confirmação (pelo próprio paciente)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-042 | **NÃO PODE:** confirmar uma consulta que não é do paciente autenticado. | P0 | I | ⬜ | `src/services/patients/confirmAppointmentService.ts:7-17` |
| AGE-043 | **NÃO PODE:** confirmar uma consulta que não está `SCHEDULED` — grava `confirmedAt`/`confirmedBy` só nessa transição. | P1 | I | ⬜ | `src/services/patients/confirmAppointmentService.ts:19-30` |

## No-show automático e bloqueio

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-044 | **DEVE:** marcar como `NO_SHOW` (via cron) consultas pendentes de check-in cujo horário + `ClinicSettings.appointmentToleranceMinutes` já passou. | P1 | I | ⬜ | `src/services/appointments/autoNoShowService.ts:24-69` |
| AGE-045 | **NÃO PODE:** o painel do paciente (`patientDashboardService`) usar uma tolerância de no-show DIFERENTE da configurada pela clínica — tem uma segunda marcação de `NO_SHOW`, independente do cron, com `NO_SHOW_GRACE_MINUTES` fixo em 30 minutos, ignorando `ClinicSettings.appointmentToleranceMinutes` (padrão 15, configurável 0–120). Uma clínica que configurou 60 min de tolerância pode ter uma consulta marcada como falta às 30 min só porque o paciente abriu o próprio painel. | P1 | I | ⚠ | `src/services/patients/patientDashboardService.ts:12,35-44,57-69` vs `src/services/appointments/autoNoShowService.ts:18,26-27` |
| AGE-046 | **DEVE:** bloquear o papel `PATIENT` (`Patient.blockedAt`) ao atingir `maxConsecutiveNoShows`, sem tentar bloquear de novo quem já está bloqueado. | P0 | I | ⬜ | `src/services/appointments/autoNoShowService.ts:109-118` |
| AGE-047 | **NÃO PODE:** a contagem de faltas para o bloqueio (`countPatientNoShows`) ser inconsistente entre o gatilho do cron e qualquer outro contador exibido nas telas — hoje soma `NO_SHOW` de TODAS as clínicas em que o paciente já foi atendido, não só a clínica cujo `maxConsecutiveNoShows` está sendo aplicado. | P1 | I | ❓ | `src/repository/notificationRepository.ts:162-166` |
| AGE-048 | **DEVE:** notificar o paciente separadamente da falta (`NO_SHOW_WARNING`) e do bloqueio (`ACCOUNT_BLOCKED`, com e-mail), sem que uma falha no envio do e-mail impeça o bloqueio de ser gravado. | P2 | I | ⬜ | `src/services/appointments/autoNoShowService.ts:94-107,131-158` |

## Acesso, isolamento e agenda da recepção

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-049 | **DEVE:** `GET /appointments/:id` negar acesso (403) quando `resolveAppointmentRole` devolve `null` — equipe de outra clínica, ou conta sem nenhuma relação com a consulta. | P0 | I | ✅ | `src/services/appointments/getAppointmentByIdService.ts:52-68`, `src/utils/appointmentAccess.ts` |
| AGE-050 | **NÃO PODE:** um PROFISSIONAL que não é o responsável pela consulta ver o CPF, data de nascimento, telefone e e-mail do paciente de um COLEGA da mesma clínica — `resolveAppointmentRole` devolve `PROFESSIONAL` também para esse caso "de propósito", justamente para "a tela aplicar a regra de posse" (comentário e teste da própria função dizem isso), mas `GetAppointmentByIdService` usa o papel só como `null`/`não-null` e devolve o registro completo do paciente para qualquer papel não nulo — a regra de posse nunca é aplicada. | P0 | I | ⚠ | `src/services/appointments/getAppointmentByIdService.ts:54-68,93-100`, `src/utils/appointmentAccess.ts:35-37`, `src/utils/appointmentAccess.test.ts` ("profissional da clínica recebe o papel para a tela aplicar a regra de posse") |
| AGE-051 | **NÃO PODE:** a agenda multi-profissional da recepção (`GET /reception/agenda`) marcar como ocupado (`libre:false`) o horário de uma consulta `CANCELLED`, `NO_SHOW` ou `RESCHEDULED` — a consulta some da checagem real de conflito (AGE-011) mas continua aparecendo como slot ocupado na grade visual, porque a query de agendamentos do dia não filtra por status. | P2 | I | ⚠ | `src/repository/receptionDashboardRepository.ts:142-151`, `src/services/reception/agendaService.ts:88-104` |
| AGE-052 | **NÃO PODE:** a busca de pacientes para agendar (Etapa 1 da recepção) filtrar por clínica — `searchPatients` recebe `_clinicId` e nunca o usa; a busca por nome/CPF é global entre todas as clínicas, devolvendo nome, CPF, telefone e avatar de um paciente que nunca teve consulta ali. | P0 | I | ❓ | `src/repository/appointmentRepository.ts:12-33` |
| AGE-053 | **DEVE:** excluir da busca de pacientes para agendar quem está bloqueado por faltas (`blockedAt`). | P1 | I | ⬜ | `src/repository/appointmentRepository.ts:19-20` |
| AGE-054 | **NÃO PODE:** `GET /appointments/calendar` (agenda por dia do profissional) ser acessada por quem não é `PROFESSIONAL` — só o próprio profissional vê a própria agenda por esta rota. | P1 | I | ⬜ | `src/routes/appointment.routes.ts:56-58` |

## Notas

- **AGE-016 (⚠ P0, já era conhecido antes desta especificação):** o teste mais valioso desta área. Um paciente mal-intencionado (ou só um app cliente customizado) que chame `POST /patients/appointments` com `channel: "IN_PERSON"` no corpo cria uma consulta como se tivesse sido a recepção que agendou, escapando de `allowOnlineBooking:false` e de `minAdvanceBookingHours`. Correção sugerida (fora do escopo desta etapa, só documentação): `PatientCreateAppointmentService` nunca deveria aceitar `channel` do cliente — sempre forçar `ONLINE_PORTAL`, ignorando qualquer valor enviado. O mesmo vale para `patientBookingSchema.ts:20`, que não deveria expor o campo `channel` no schema do paciente (ver [11-validacoes-utilitarios.md](11-validacoes-utilitarios.md)).
- **AGE-050 (⚠ P0, novo nesta rodada):** esta é uma descoberta desta especificação, não do catálogo anterior. É particularmente grave porque o próprio código documenta a intenção correta (o comentário e o teste de `resolveAppointmentRole` deixam explícito que devolver `PROFESSIONAL` para quem não é dono da consulta serve para "a tela aplicar a regra de posse") — mas o consumidor mais usado dessa função, `GetAppointmentByIdService` (tela de detalhe da consulta, usada pelo frontend para carregar o contexto da tela de documentos), nunca aplica essa regra. Recomenda-se o teste `AGE-050` verificar explicitamente que um `PROFESSIONAL` da clínica que NÃO é `appointment.professionalUserId` recebe 403 (ou uma versão sem dados de paciente) ao chamar `GET /appointments/:id`.
- **AGE-020 (❓ P-AGE-01):** ver [pergunta em aberto](99-perguntas-em-aberto.md) — a recepção/admin devem poder agendar diretamente para um paciente bloqueado (ignorando o bloqueio) ou isso deveria exigir desbloquear primeiro (passando por `UnblockPatientService`, que audita)?
- **AGE-047/AGE-052 (❓ P-AGE-02, P-AGE-03):** duas tensões diretas do desenho de "paciente global": (1) contar faltas de todas as clínicas para bloquear um papel que é, de fato, global; (2) precisar buscar pacientes sem filtro de clínica para achar um cadastro existente antes de criar um agendamento novo (evitando duplicar `Patient` pelo mesmo CPF). As duas podem ser exatamente o comportamento desejado — ficam como perguntas, não bugs.
- **Relação com outras áreas:** a numeração de documentos por consulta `COMPLETED`/`COMPLETED_WITH_ADDENDUM` e o acesso a documentos clínicos reaproveitam `resolveAppointmentRole` e têm suas próprias regras de posse em [06-documentos-clinicos.md](06-documentos-clinicos.md) — confirmar lá se o mesmo tipo de falha de AGE-050 também ocorre na listagem/visualização de documentos.
