# Clínica, configurações e procedimentos — especificação de comportamento

> Parte da especificação da API (ver [README](README.md)). Legenda: prioridade P0/P1/P2 · camada U/I/C/E2E · status ✅ testado · ⬜ sem teste · ⚠ bug confirmado · ❓ decisão pendente.

## Escopo

Configurações da clínica (`ClinicSettings`, horário por dia via `ClinicWorkingHours`, feriados via `ClinicHoliday`), dados cadastrais da clínica (`Clinic`), procedimentos (`Procedure`, `ProfessionalProcedure`) e bloqueio de agenda do profissional (`ProfessionalScheduleBlock`). Cobre `src/services/clinics/clinicSettingsService.ts`, `updateClinicService.ts`, `src/services/procedures/*` e `src/services/professionals/scheduleBlockService.ts`.

## Configurações — permissão e limites

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CFG-001 | **DEVE:** restringir toda leitura/alteração de `/clinics/settings/*` (informações, horário, notificações, segurança, política, horário semanal, feriados) a `ADMIN` da clínica ativa. | P0 | I | ⬜ | `src/routes/clinic.routes.ts:116-190` |
| CFG-002 | **DEVE:** cada alteração de configuração gerar seu próprio `AuditLog` (`UPDATE_CLINIC_INFO`/`_SCHEDULE`/`_NOTIFICATIONS`/`_SECURITY`/`_POLICY`, `CREATE_CLINIC_HOLIDAY`, `DELETE_CLINIC_HOLIDAY`, `UPDATE_CLINIC_WORKING_HOURS`). | P1 | I | ⬜ | `src/services/clinics/clinicSettingsService.ts:118-130,180-190,218-228,255-265,295-305,333-343,371-381,396-406` |
| CFG-003 | **DEVE:** quando a clínica ainda não tem uma linha de `ClinicSettings` salva, `GET /clinics/settings` devolver os valores padrão do schema (`allowOnlineBooking: true`, `minAdvanceBookingHours: 2`, `maxAdvanceBookingDays: 60`, `maxCancellationHours: 24`, `maxConsecutiveNoShows: 3`, `appointmentToleranceMinutes: 15`, etc.) — os MESMOS defaults usados como *fallback* pelo motor de agendamento quando não há settings. | P1 | I | ⬜ | `src/services/clinics/clinicSettingsService.ts:39-69` |
| CFG-004 | **NÃO PODE:** um `PATCH` parcial de horário (`/settings/schedule`) validar `openTime < closeTime` só contra os campos enviados — usa o valor já salvo para o campo que não veio no corpo, então enviar só `openTime` mais tarde do que o `closeTime` já salvo também é recusado. | P1 | I | ⬜ | `src/services/clinics/clinicSettingsService.ts:161-172` |

## Horário de funcionamento — o que é enforçado de verdade

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CFG-005 | **NÃO PODE:** o intervalo mínimo entre consultas (`minIntervalBetweenAppointments`) sair de 5–120 minutos. | P2 | U | ⬜ | `src/schemas/clinicSchema.ts:294-299` |
| CFG-006 | **DEVE:** salvar o horário por dia da semana (`ClinicWorkingHours`) numa transação que faz *upsert* de cada dia enviado por `(clinicId, dayOfWeek)`, sem apagar os dias que não vieram no corpo. | P1 | I | ⬜ | `src/repository/clinicWorkingHoursRepository.ts:12-30` |
| CFG-007 | **NÃO PODE:** um dia de `ClinicWorkingHours` marcado como aberto (`isOpen: true`) ter `closeTime` menor ou igual a `openTime`; dias fechados podem chegar com horários zerados sem serem recusados. | P1 | U | ⬜ | `src/schemas/clinicSchema.ts:395-406` |
| CFG-008 | **NÃO PODE:** `ClinicWorkingHours` (horário da clínica por dia da semana) ou `ClinicSettings.openTime`/`closeTime`/`minIntervalBetweenAppointments` (o par único "horário de funcionamento") terem QUALQUER efeito sobre o que pode ser agendado — o motor de agendamento (`assertSlotIsBookable`/`GetAvailableSlotsService`) só lê `ProfessionalWorkingHours` (o expediente de CADA profissional), nunca essas duas fontes no nível da clínica. Uma clínica pode se declarar "fechada aos domingos" e mesmo assim ter consultas de um profissional cujo expediente pessoal inclui domingo. | P1 | I | ⚠ | `src/services/clinics/clinicSettingsService.ts:310-321` (comentário confirma: "antes vestigial: nenhum código de produção lia ou escrevia essa tabela"), `src/services/appointments/appointmentBookingRules.ts:168-176` (só lê `professionalWorkingHours`) |
| CFG-009 | **DEVE:** feriados (`ClinicHoliday`), ao contrário de CFG-008, SEREM lidos de verdade pelo motor de agendamento — `findDateLevelBlock` consulta a tabela a cada tentativa de agendar (ver AGE-018). | P1 | I | ⬜ | `src/services/appointments/appointmentBookingRules.ts:63-77` |
| CFG-010 | **NÃO PODE:** a descrição de um feriado ter menos de 2 ou mais de 120 caracteres, nem conter HTML. | P2 | U | ⬜ | `src/schemas/clinicSchema.ts:419-424` |
| CFG-011 | **NÃO PODE:** excluir um feriado de OUTRA clínica — 404. | P0 | I | ⬜ | `src/services/clinics/clinicSettingsService.ts:390-394` |

## Política de agendamento e segurança (limites do schema)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CFG-012 | **NÃO PODE:** `minAdvanceBookingHours`/`maxCancellationHours` saírem de 0–168 (7 dias). | P2 | U | ⬜ | `src/schemas/clinicSchema.ts:340-345,352-357` |
| CFG-013 | **NÃO PODE:** `maxAdvanceBookingDays` sair de 1–365. | P2 | U | ⬜ | `src/schemas/clinicSchema.ts:346-351` |
| CFG-014 | **NÃO PODE:** `maxConsecutiveNoShows` sair de 1–20. | P2 | U | ⬜ | `src/schemas/clinicSchema.ts:358-363` |
| CFG-015 | **NÃO PODE:** `appointmentToleranceMinutes` sair de 0–120. | P2 | U | ⬜ | `src/schemas/clinicSchema.ts:364-369` |
| CFG-016 | **NÃO PODE:** `sessionTimeoutMinutes` assumir qualquer valor fora de `{15, 30, 60, 120, 240}`. | P2 | U | ⬜ | `src/schemas/clinicSchema.ts:324-331` |

## Dados cadastrais da clínica (`Clinic`)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CFG-017 | **NÃO PODE:** atualizar a clínica (`PUT /clinics/:id` ou `PATCH /clinics/settings/info`) com um CNPJ, e-mail ou *subdomain* que já pertence a OUTRA clínica. | P0 | I | ⬜ | `src/services/clinics/updateClinicService.ts:39-56`, `src/services/clinics/clinicSettingsService.ts:132-139` |
| CFG-018 | **NÃO PODE:** o conflito de CFG-017 (nem "clínica não encontrada") chegar ao cliente com uma mensagem específica — os dois serviços lançam `new Error(...)` SEM `statusCode`; o handler genérico (`handleControllerError`) trata qualquer erro sem `statusCode` como 500 e descarta a mensagem original, devolvendo só o texto genérico do controller ("Erro ao atualizar clínica"). Mensagens como "CNPJ já está cadastrado" ou "E-mail já está cadastrado" nunca chegam ao frontend, embora o código claramente pretendesse comunicá-las. | P1 | I | ⚠ | `src/services/clinics/updateClinicService.ts:33-59`, `src/services/clinics/clinicSettingsService.ts:114-141`, `src/utils/controllerUtils.ts:30-65` |
| CFG-019 | **DEVE:** `PUT /clinics/:id` restringir a `ADMIN` da PRÓPRIA clínica (`checkSameClinic`), inclusive para alternar `isActive`. | P0 | I | ⬜ | `src/routes/clinic.routes.ts:206-212` |
| CFG-020 | **NÃO PODE:** alternar `Clinic.isActive` por `PUT /clinics/:id` gerar auditoria — diferente de quase toda outra alteração de configuração desta área. | P2 | I | ❓ | `src/services/clinics/updateClinicService.ts:31-45` |

## Procedimentos

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CFG-021 | **DEVE:** restringir criar, editar, listar e excluir procedimentos a `ADMIN`. | P0 | I | ⬜ | `src/routes/procedure.routes.ts:11,17-40` |
| CFG-022 | **NÃO PODE:** dois procedimentos da MESMA clínica terem o mesmo nome — 409. | P1 | I | ⬜ | `src/services/procedures/createProcedureService.ts:22-51`, `updateProcedureService.ts:24-51` |
| CFG-023 | **NÃO PODE:** a duração padrão sair de 5–480 minutos, nem o preço ser negativo ou exceder R$ 99.999.999,99. | P2 | U | ⬜ | `src/schemas/procedureSchema.ts:12-23` |
| CFG-024 | **NÃO PODE:** editar ou excluir um procedimento de OUTRA clínica — 404. | P0 | I | ⬜ | `src/services/procedures/updateProcedureService.ts:19-22`, `deleteProcedureService.ts:9-12` |
| CFG-025 | **NÃO PODE:** apagar fisicamente um procedimento com consultas associadas — `Appointment.procedureId` é `onDelete: Restrict`; em vez de deixar o erro de FK vazar como 500, o serviço detecta antes e DESATIVA (`isActive: false`) em vez de excluir. | P1 | I | ⬜ | `src/services/procedures/deleteProcedureService.ts:15-33` |
| CFG-026 | **NÃO PODE:** um procedimento DESATIVADO continuar disponível para novos agendamentos — ver AGE-009 (`findDurationInputs` não filtra `isActive`; é o mesmo procedimento tratado sob a ótica de agendamentos). | P1 | I | ⚠ | `src/repository/procedureRepository.ts:62-74` |

## Meus procedimentos (profissional escolhe o que atende)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CFG-027 | **NÃO PODE:** um profissional vincular a si um procedimento que não é da própria clínica — 400, com a lista dos ids inválidos. | P0 | I | ⬜ | `src/services/procedures/setMyProceduresService.ts:14-24` |
| CFG-028 | **NÃO PODE:** desvincular um procedimento que tem agendamento `SCHEDULED`/`CONFIRMED` (ou outro status ativo) do profissional — 409, com a lista dos procedimentos bloqueados para a tela explicar o motivo. | P1 | I | ⬜ | `src/services/procedures/setMyProceduresService.ts:32-53` |
| CFG-029 | **NÃO PODE:** a checagem de CFG-028 se limitar de fato a agendamentos FUTUROS como a mensagem promete ("agendamentos futuros (agendados ou confirmados)") — `findBlockedProcedureIds` filtra só por STATUS, sem nenhum filtro de `appointmentDate`; um agendamento com status ativo mas data no passado (cenário residual, ex.: falha pontual do cron de no-show) bloquearia a remoção do mesmo jeito. | P2 | I | ⚠ | `src/repository/procedureRepository.ts:96-112` |
| CFG-030 | **NÃO PODE:** salvar a nova lista de procedimentos do profissional (`replaceProfessionalProcedures`) preservar `customDuration`/`customPrice` dos vínculos que continuam na lista — a operação apaga TODOS os vínculos (`ProfessionalProcedure`) do profissional e recria do zero só com `{professionalId, procedureId}`; qualquer duração ou preço personalizados que o profissional tinha configurado para um procedimento são perdidos mesmo quando esse procedimento nem foi tocado na tela (o profissional só queria adicionar OUTRO procedimento à lista). | P1 | I | ⚠ | `src/repository/procedureRepository.ts:114-128` |

## Bloqueio de agenda do profissional

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CFG-031 | **DEVE:** permitir que o próprio profissional (`/me`) ou `ADMIN`/`RECEPTIONIST` (`/:id`, checando que o profissional é da clínica) criem/listem/excluam bloqueios de agenda. | P1 | I | ⬜ | `src/services/professionals/scheduleBlockService.ts:20-92` |
| CFG-032 | **NÃO PODE:** o fim do bloqueio ser igual ou anterior ao início. | P1 | U | ⬜ | `src/services/professionals/scheduleBlockService.ts:63-66` |
| CFG-033 | **NÃO PODE:** excluir um bloqueio de OUTRO profissional. | P0 | I | ⬜ | `src/services/professionals/scheduleBlockService.ts:86-92` |
| CFG-034 | **NÃO PODE:** criar um bloqueio de agenda sem verificar se já existem consultas marcadas no período — hoje é possível bloquear um horário que já tem paciente agendado, sem aviso nem cancelamento automático. | P2 | I | ❓ | `src/services/professionals/scheduleBlockService.ts:63-74` |

## Notas

- **CFG-008 (⚠ P1, achado novo desta especificação):** o comentário que documenta este serviço já avisa que `ClinicWorkingHours` "antes" era vestigial — mas a leitura direta de `appointmentBookingRules.ts` confirma que, MESMO agora que existe uma tela real para configurá-lo, o motor de agendamento continua ignorando tanto essa tabela quanto o par simples `ClinicSettings.openTime`/`closeTime`. Isso é o mesmo padrão de "configuração sem efeito" encontrado em [09-notificacoes-crons.md](09-notificacoes-crons.md) (`NOT-009`, `NOT-016`) — a diferença é que aqui existem DUAS fontes de horário no nível da clínica (`ClinicWorkingHours` por dia, e o par único em `ClinicSettings`) e NENHUMA das duas é usada, só o expediente individual de cada profissional. Antes de corrigir, vale decidir: o horário da clínica deveria ser um TETO que nenhum profissional pode exceder, ou é só informativo (site público) e o expediente de cada profissional manda sozinho? Ver [pergunta em aberto](99-perguntas-em-aberto.md).
- **CFG-018 (⚠ P1):** mesmo mecanismo em DOIS serviços diferentes (`UpdateClinicService` para `PUT /clinics/:id`, `UpdateClinicInfoService` para `PATCH /clinics/settings/info`) — ambos escrevem `throw new Error("...")` sem o padrão `Object.assign(new Error(...), {statusCode: 409})` usado consistentemente no resto da base (ex.: `clinicRegistrationService.ts` usa `httpError(409, ...)` para o mesmo tipo de conflito). Correção mecânica e de baixo risco: adicionar `statusCode: 409` (e opcionalmente `code`) aos quatro `throw` de cada serviço.
- **CFG-030 (⚠ P1):** o teste mais valioso desta área de procedimentos — fácil de reproduzir (profissional com um procedimento tendo `customDuration`, ativa outro procedimento na tela "Meus procedimentos", confere que o primeiro perdeu o `customDuration`) e fácil de corrigir (upsert em vez de delete+recreate, ou preservar os campos customizados dos ids que permanecem).
- **Relação com outras áreas:** CFG-026/CFG-029 são as mesmas regras vistas por [05-agendamentos.md](05-agendamentos.md) (`AGE-009`) e usam o mesmo `procedureRepository.ts` — não são bugs duplicados, é a mesma causa aparecendo em dois pontos de uso (agendar vs. gerenciar procedimentos).
