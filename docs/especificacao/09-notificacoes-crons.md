# Notificações e rotinas agendadas — especificação de comportamento

> Parte da especificação da API (ver [README](README.md)). Legenda: prioridade P0/P1/P2 · camada U/I/C/E2E · status ✅ testado · ⬜ sem teste · ⚠ bug confirmado · ❓ decisão pendente.

## Escopo

Notificações internas (`Notification`, canal `IN_APP` + e-mail em paralelo) e as cinco rotinas agendadas (`node-cron`): lembrete de consulta (véspera e intradía), aniversário, relatório diário, e limpeza de notificações lidas. Cobre `src/services/notifications/*`, `src/repository/notificationRepository.ts` e `src/routes/notification.routes.ts`. Um padrão se repete nesta área: telas de configuração (`ClinicSettings`) que existem há tempo mas cujo campo nunca é lido por nenhum código — o próprio repositório já tem esse histórico documentado em comentários (`accessLogEnabled`, `sendDailyReport`); esta especificação encontrou mais dois casos do mesmo padrão que NINGUÉM havia corrigido ainda.

## Criação de agendamento — notificações

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| NOT-001 | **DEVE:** notificar paciente, profissional, `ADMIN` e `RECEPTIONIST` ao criar uma consulta, em bloco fire-and-forget que nunca derruba a criação. | P1 | I | ⬜ | `src/services/appointments/createAppointmentService.ts:204-296` |
| NOT-002 | **DEVE:** enviar e-mail de confirmação ao paciente junto da notificação in-app, sem que a falha do e-mail afete a notificação nem a criação. | P2 | I | ⬜ | `src/services/appointments/createAppointmentService.ts:247-259` |
| NOT-003 | **DEVE:** alertar a equipe sobre "novo paciente" só quando `sendNewPatientAlert` está ligado e é o primeiro agendamento do paciente NESTA clínica (ver AGE-006). | P2 | I | ⬜ | `src/services/appointments/createAppointmentService.ts:297-322` |
| NOT-004 | **NÃO PODE:** o rótulo "pelo paciente ... pelo portal online" vs "pela recepção" enviado à equipe usar o `channel` bruto do cadastro em vez de `isOnlineBooking` já calculado — como o `channel` pode ser manipulado pelo paciente (ver AGE-016), o rótulo mostrado à equipe pode mentir sobre quem realmente agendou. | P2 | I | ❓ | `src/services/appointments/createAppointmentService.ts:208-211` |

## Lembretes de consulta (crons)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| NOT-005 | **DEVE:** enviar lembrete da véspera às 08:00 para consultas confirmadas/agendadas do dia seguinte, em todas as clínicas ativas. | P1 | I | ⬜ | `src/services/notifications/reminderCronService.ts:19-71,157-162` |
| NOT-006 | **NÃO PODE:** o lembrete da véspera duplicar se o cron rodar mais de uma vez no mesmo dia (reinício do servidor, novo deploy, disparo manual em teste) — diferente do lembrete intradía, este NÃO tem nenhuma checagem de "já enviado hoje" antes de criar a notificação. | P2 | I | ⚠ | `src/services/notifications/reminderCronService.ts:19-71` |
| NOT-007 | **DEVE:** o lembrete intradía (a cada 30 min) não duplicar — dedup por `metadata.window` (`1h`/`30m`) já enviado para a mesma consulta. | P1 | I | ⬜ | `src/services/notifications/reminderCronService.ts:98-105`, `src/repository/notificationRepository.ts:203-211` |
| NOT-008 | **NÃO PODE:** o texto do lembrete intradía prometer um tempo que não corresponde ao restante real — o rótulo ("1 hora"/"30 minutos") vem do NOME da janela em que a consulta caiu no momento do cron, não do `diff` exato; uma consulta às `:15`/`:45` (fora da grade de 30 min do cron) pode cair na janela "30m" quando na verdade faltam só 15 minutos (ou até 45, dependendo do alinhamento) — o paciente recebe "sua consulta começa em 30 minutos" com bem menos ou bem mais tempo de verdade. | P2 | I | ⚠ | `src/services/notifications/reminderCronService.ts:98-107,117` |
| NOT-009 | **NÃO PODE:** os dois lembretes (véspera e intradía) ignorarem `ClinicSettings.sendAppointmentReminder` (padrão ligado) — enviam para TODAS as clínicas ativas, mesmo as que desligaram o lembrete nas configurações; o campo existe na tela e no banco, mas nenhum dos dois serviços o lê. | P1 | I | ⚠ | `src/services/notifications/reminderCronService.ts:23-26,82-85`, `prisma/schema.prisma:269` |
| NOT-010 | **NÃO PODE:** o lembrete ignorar `ClinicSettings.reminderHoursBefore` (quantas horas antes a clínica quer avisar, padrão 24) — o horário é sempre fixo (véspera às 08:00 + janelas de 1h/30min), a configuração não tem nenhum efeito sobre quando o lembrete sai. | P2 | I | ⚠ | `src/services/notifications/reminderCronService.ts:19-30`, `prisma/schema.prisma:270` |
| NOT-011 | **DEVE:** remover notificações já lidas há mais de 3 dias, todo dia às 03:00. | P2 | I | ⬜ | `src/services/notifications/reminderCronService.ts:148-150,171-176` |
| NOT-012 | **NÃO PODE:** os `cron.schedule(...)` desta área confiar no fuso horário do PROCESSO sem fixá-lo explicitamente — nenhuma das 5 chamadas (`0 8 * * *`, `0,30 * * * *`, `0 3 * * *`, `0 9 * * *`, `0 20 * * *`) passa a opção `timezone` do `node-cron`; um comentário chega a afirmar "horário de São Paulo, via schedule do cron do processo" como se isso fosse garantido, mas sem `TZ=America/Sao_Paulo` no ambiente (não verificado por `checkEnv`) o servidor executa esses crons no fuso padrão do sistema operacional/contêiner — em muitos provedores de nuvem, UTC. | P1 | I | ⚠ | `src/services/notifications/reminderCronService.ts:158,165,172`, `src/services/notifications/birthdayCronService.ts:52`, `src/services/notifications/dailyReportCronService.ts:81-82` |

## Aniversário (cron)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| NOT-013 | **DEVE:** enviar parabéns às 09:00 para pacientes cujo dia/mês de nascimento é hoje (UTC) e que tiveram ao menos uma consulta na clínica nos últimos 12 meses — um por par (clínica, paciente). | P1 | I | ⬜ | `src/services/notifications/birthdayCronService.ts:6-45`, `src/repository/notificationRepository.ts:178-198` |
| NOT-014 | **DEVE:** uma falha isolada (um destinatário com dado inconsistente, erro transitório) não pode interromper o restante do lote — cada envio tem seu próprio `try/catch`. | P1 | I | ⬜ | `src/services/notifications/birthdayCronService.ts:17-43` |
| NOT-015 | **NÃO PODE:** o aniversário duplicar se o cron rodar mais de uma vez no mesmo dia — diferente do lembrete intradía, não há nenhuma checagem de "já parabenizado hoje" antes de criar a notificação. | P2 | I | ⚠ | `src/services/notifications/birthdayCronService.ts:6-45` |
| NOT-016 | **NÃO PODE:** ignorar `ClinicSettings.sendBirthdayMessage` (padrão ligado) — todo paciente aniversariante de toda clínica ativa recebe a mensagem, mesmo que a clínica tenha desligado esse envio nas configurações; mesmo padrão de NOT-009. | P1 | I | ⚠ | `src/services/notifications/birthdayCronService.ts:6-11`, `src/repository/notificationRepository.ts:178-198`, `prisma/schema.prisma:271` |

## Relatório diário (cron)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| NOT-017 | **DEVE:** enviar o relatório diário às 20:00 só para clínicas ativas com `ClinicSettings.sendDailyReport` ligado — aqui o toggle É respeitado. | P1 | I | ⬜ | `src/services/notifications/dailyReportCronService.ts:22-31` |
| NOT-018 | **NÃO PODE:** enviar o relatório quando não houve nenhum movimento no dia (`total === 0`) — evita poluir a caixa de entrada do `ADMIN` sem necessidade. | P2 | I | ⬜ | `src/services/notifications/dailyReportCronService.ts:46` |
| NOT-019 | **DEVE:** enviar só para `ADMIN` da clínica, nunca para `RECEPTIONIST`/`PROFESSIONAL`. | P1 | I | ⬜ | `src/services/notifications/dailyReportCronService.ts:48-50` |

## Comunicados e mensagem direta

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| NOT-020 | **DEVE:** restringir o envio de comunicado (`POST /notifications/announcements`) a `ADMIN`/`RECEPTIONIST`. | P0 | I | ⬜ | `src/routes/notification.routes.ts:10-13,54-56` |
| NOT-021 | **NÃO PODE:** um comunicado alcançar quem não tem vínculo ATIVO na clínica do token — usa `findActiveClinicUsers`/`activeMemberOf`, nunca todos os usuários já vinculados um dia. | P0 | I | ⬜ | `src/services/notifications/announcementService.ts:16`, `src/repository/membershipRepository.ts:12-24` |
| NOT-022 | **NÃO PODE:** um comunicado da equipe chegar a PACIENTES — `targetRoles` só aceita papéis de equipe; a busca de destinatários é sempre por vínculo de equipe, nunca por `Patient`. | P0 | I | ⬜ | `src/services/notifications/announcementService.ts:16` |
| NOT-023 | **DEVE:** responder 202 (aceito) imediatamente e enviar os e-mails em segundo plano, registrando `SENT`/`FAILED` por destinatário. | P2 | I | ⬜ | `src/services/notifications/announcementService.ts:15-40,42-77` |
| NOT-024 | **DEVE:** restringir mensagem direta (`POST /notifications/direct`) a `ADMIN`/`RECEPTIONIST`/`PROFESSIONAL` — paciente não envia. | P0 | I | ⬜ | `src/routes/notification.routes.ts:14-17,62` |
| NOT-025 | **NÃO PODE:** enviar mensagem direta para um destinatário inativo ou sem vínculo ativo na clínica do token — 404. | P0 | I | ⬜ | `src/services/notifications/sendDirectService.ts:16-29` |
| NOT-026 | **DEVE:** `GET /notifications/search-users` (para escolher o destinatário) restringir a equipe (`ADMIN`/`RECEPTIONIST`/`PROFESSIONAL`) da própria clínica — paciente não lista usuários. | P0 | I | ⬜ | `src/routes/notification.routes.ts:14-17,30` |

## Leitura, exclusão e limpeza

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| NOT-027 | **DEVE:** listar, contar não-lidas e marcar como lidas pelo DONO da conta (`recipientUserId`) em TODAS as clínicas — ver VIN-031. | P0 | I | ⬜ | `src/repository/notificationRepository.ts:33-53,70-95` |
| NOT-028 | **NÃO PODE:** contar como "não lida" uma notificação com status `FAILED` (falha no envio de e-mail, por exemplo) — não é isso que o usuário precisa resolver. | P2 | I | ⬜ | `src/repository/notificationRepository.ts:70-77` |
| NOT-029 | **NÃO PODE:** excluir ou marcar como lida uma notificação de OUTRO usuário — todo `update`/`delete` é feito com `recipientUserId` na cláusula `where`. | P0 | I | ⬜ | `src/repository/notificationRepository.ts:80-85,244-248` |
| NOT-030 | **DEVE:** limitar a listagem às 50 notificações mais recentes do usuário. | P2 | I | ⬜ | `src/repository/notificationRepository.ts:33-39` |

## Notas

- **NOT-009/NOT-016 (⚠ P1, achados novos desta especificação):** o padrão "campo de configuração sem nenhum código que o leia" já tinha sido corrigido duas vezes antes nesta base (comentários em `accessLogEnabled` e `sendDailyReport` documentam essas correções anteriores). Esta especificação encontrou que o MESMO padrão continua valendo para `sendAppointmentReminder`, `reminderHoursBefore` e `sendBirthdayMessage` — ninguém tinha verificado esses três especificamente. Recomenda-se, ao corrigir, um teste de INTEGRAÇÃO por configuração (liga → cron não notifica; desliga → cron não notifica) em vez de só testar a função pura, porque o bug está exatamente na ausência de uma leitura que deveria existir.
- **NOT-012 (⚠ P1):** vale testar isso rodando os crons com `TZ` do processo forçado para um fuso diferente de `America/Sao_Paulo` (ex.: `TZ=UTC`) e conferindo se o horário de disparo (não só o CONTEÚDO calculado com `dayjs().tz(...)`) muda — hoje muito provavelmente muda, porque `node-cron` não usa `dayjs`/`DEFAULT_TIMEZONE` para decidir QUANDO disparar, só o código DENTRO do job usa. Corrigir é simples: passar `{ timezone: DEFAULT_TIMEZONE }` como segundo argumento de cada `cron.schedule`.
- **NOT-006/NOT-015 (⚠ P2, mesma classe):** ambos os crons sem dedup (véspera e aniversário) têm baixo risco em operação normal (rodam uma vez por dia, agendados), mas ficam perigosos justamente nos cenários em que valeria a pena rodar os testes de integração desta especificação — re-execução manual, ambiente de teste, redeploy no meio da janela do cron. Um índice único (`appointmentId` + tipo + dia, ou `patientId` + clínica + ano) resolveria os dois.
- **Relação com outras áreas:** a notificação de pagamento confirmado (`PAYMENT_CONFIRMED`) está morta por outro motivo (não é desta área) — ver [07-financeiro-relatorios.md](07-financeiro-relatorios.md) `FIN-008`. O bloqueio automático por faltas e suas notificações (`NO_SHOW_WARNING`, `ACCOUNT_BLOCKED`) estão em [05-agendamentos.md](05-agendamentos.md) `AGE-044`–`AGE-048`.
