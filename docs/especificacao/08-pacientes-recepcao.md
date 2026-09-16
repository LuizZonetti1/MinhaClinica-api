# Pacientes e recepção — especificação de comportamento

> Parte da especificação da API (ver [README](README.md)). Legenda: prioridade P0/P1/P2 · camada U/I/C/E2E · status ✅ testado · ⬜ sem teste · ⚠ bug confirmado · ❓ decisão pendente.

## Escopo

Cadastro de paciente pela recepção (sem senha, ativado por link), busca/listagem/detalhe de pacientes por uma clínica, bloqueio e desbloqueio por faltas, consultas do paciente pela ótica da recepção, e comentários clínicos do profissional sobre um paciente. O cadastro público (autoatendimento) do paciente está em [04-cadastro-paciente-clinica.md](04-cadastro-paciente-clinica.md); a busca de pacientes para AGENDAR está em [05-agendamentos.md](05-agendamentos.md) (`AGE-052`, mesma tensão de "paciente global").

## Cadastro de paciente pela recepção

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| PAC-001 | **DEVE:** restringir o cadastro de paciente pela recepção a `ADMIN`/`RECEPTIONIST`. | P0 | I | ⬜ | `src/routes/patient.routes.ts:124` (aprox.) |
| PAC-002 | **NÃO PODE:** cadastrar um e-mail que já tem conta aguardando ativação — mensagem própria orientando a checar a caixa de entrada, diferente do e-mail já ativo. | P1 | I | ⬜ | `src/services/patients/receptionPatientRegistrationService.ts:56-64` |
| PAC-003 | **NÃO PODE:** cadastrar um e-mail com conta já completa (`ACTIVE` ou qualquer status além de `PENDING_ACTIVATION`) — 409 `EMAIL_ALREADY_REGISTERED`, orienta a usar a busca de pacientes. | P0 | I | ⬜ | `src/services/patients/receptionPatientRegistrationService.ts:65-73` |
| PAC-004 | **NÃO PODE:** cadastrar um CPF já usado por qualquer outra conta (busca global) — 409 `CPF_ALREADY_REGISTERED`. | P0 | I | ⬜ | `src/services/patients/receptionPatientRegistrationService.ts:75-87` |
| PAC-005 | **DEVE:** criar a conta (`User`, global) e o registro `Patient` (sem clínica) com uma senha ALEATÓRIA e temporária, cujo hash é salvo mas o valor em claro nunca é enviado por e-mail — só o link de ativação. | P0 | I | ⬜ | `src/services/patients/receptionPatientRegistrationService.ts:89-91,145-153` |
| PAC-006 | **NÃO PODE:** a criação da conta (`User`) e do registro (`Patient`) rodar fora de uma transação — se a criação do `Patient` falhar depois do `User` já criado, fica uma conta `PENDING_ACTIVATION` sem paciente associado, presa (nunca mais alcançável pelo fluxo de ativação, que exige `user.patient` existir). | P2 | I | ⚠ | `src/services/patients/receptionPatientRegistrationService.ts:98-132` |
| PAC-007 | **DEVE:** o link de ativação expirar em 48 horas. | P1 | I | ⬜ | `src/services/patients/receptionPatientRegistrationService.ts:134-135` |
| PAC-008 | **NÃO PODE:** um paciente cadastrado pela recepção aparecer na lista de pacientes da clínica ANTES de ter uma consulta ali — a listagem (`GetPatientsService`) é construída a partir de `Appointment.groupBy`, então um cadastro sem consulta nenhuma fica invisível para a própria clínica que o cadastrou. | P2 | I | ❓ | `src/services/patients/getPatientsService.ts:20-34` |

## Ativação da conta

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| PAC-009 | **NÃO PODE:** ativar com um token inválido, já usado, ou de uma conta que não está `PENDING_ACTIVATION`. | P0 | I | ⬜ | `src/services/auth/activateReceptionPatientService.ts:21-35` |
| PAC-010 | **NÃO PODE:** ativar com um token expirado. | P0 | I | ⬜ | `src/services/auth/activateReceptionPatientService.ts:37-42` |
| PAC-011 | **NÃO PODE:** este fluxo (ativação sem verificação de e-mail — a conta já nasce com dados completos) ser usado por uma conta que não tem `Patient` associado — protege contra usar o endpoint errado para o cadastro público. | P1 | I | ⬜ | `src/services/auth/activateReceptionPatientService.ts:44-51` |
| PAC-012 | **DEVE:** ao ativar, gravar a senha ESCOLHIDA PELO PACIENTE (substituindo a temporária), marcar `ACTIVE`, invalidar o token (uso único) e registrar aceite de termos. | P1 | I | ⬜ | `src/services/auth/activateReceptionPatientService.ts:69-84` |

## Busca, listagem e resumo

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| PAC-013 | **DEVE:** listar só pacientes com AO MENOS uma consulta na clínica ativa (`GetPatientsService`/`GetPatientsSummaryService`), nunca de outra clínica. | P0 | I | ⬜ | `src/services/patients/getPatientsService.ts:20-34,142-150` |
| PAC-014 | **DEVE:** exibir o status `BLOCKED` a partir de `Patient.blockedAt`, não de `User.status` — reflete o bloqueio por faltas, que é do papel de paciente. | P0 | I | ⬜ | `src/services/patients/getPatientsService.ts:112-113,350-351` |
| PAC-015 | **NÃO PODE:** o contador `noShowCount` exibido na lista e no detalhe do paciente refletir a realidade — existe uma função pronta para incrementá-lo (`incrementNoShowCount`) mas ela nunca é chamada por nenhum fluxo (nem pelo cron de no-show automático, que usa uma contagem em tempo real separada, `countPatientNoShows`); o valor mostrado é sempre o que veio do cadastro/seed, congelado. | P1 | I | ⚠ | `src/repository/patientRepository.ts:132-145`, `src/services/patients/getPatientsService.ts:117,358` |
| PAC-016 | **DEVE:** contar "novo paciente do mês" pela data da PRIMEIRA consulta na clínica (`_min.appointmentDate`), não pela data de criação da conta (que pode ser antiga, de outra clínica). | P1 | I | ⬜ | `src/services/patients/getPatientsService.ts:142-176` |

## Detalhe do paciente (auditoria clínica)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| PAC-017 | **DEVE:** restringir `GET /patients/:id/details` a `ADMIN` (nem `RECEPTIONIST` acessa este nível de detalhe clínico). | P0 | I | ⬜ | `src/routes/patient.routes.ts:104` |
| PAC-018 | **NÃO PODE:** exibir detalhe de um paciente sem consulta na clínica ativa — mesma regra de tenant das listagens. | P0 | I | ⬜ | `src/services/patients/getPatientsService.ts:189-197` |
| PAC-019 | **NÃO PODE:** "paciente não encontrado" neste endpoint devolver 500 — o erro é lançado sem `statusCode`, e o handler genérico trata qualquer erro sem `statusCode` como 500 em vez do 404 esperado. | P1 | I | ⚠ | `src/services/patients/getPatientsService.ts:288-290` |
| PAC-020 | **NÃO PODE:** o acesso a este detalhe (que inclui diagnóstico, prescrição, alergias, medicações e contato de emergência de todos os prontuários do paciente na clínica) deixar de gerar auditoria — hoje nenhuma chamada a `AuditLog` existe neste serviço. | P1 | I | ❓ | `src/services/patients/getPatientsService.ts:187-386` |

## Bloqueio e desbloqueio por faltas

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| PAC-021 | **NÃO PODE:** desbloquear um paciente que não está bloqueado — 400. | P1 | I | ⬜ | `src/services/patients/unblockPatientService.ts:33-35` |
| PAC-022 | **DEVE:** restringir o desbloqueio a `ADMIN`/`RECEPTIONIST`, auditar (`UNBLOCK_PATIENT`) e notificar o paciente. | P1 | I | ⬜ | `src/services/patients/unblockPatientService.ts:42-72` |
| PAC-023 | **NÃO PODE:** o desbloqueio exigir mais do que "o paciente ter QUALQUER consulta nesta clínica" — ver [VIN-033 sobre o mesmo tema](02-conta-unificada-vinculos.md#isolamento-entre-clínicas-em-notificações-e-bloqueio-de-paciente): qualquer clínica que o paciente já visitou pode desbloquear um bloqueio causado em OUTRA clínica. | P0 | I | ❓ | `src/services/patients/unblockPatientService.ts:18-22` |
| PAC-024 | **NÃO PODE:** `Patient.blockedAt` expirar sozinho — sem rotina automática de desbloqueio; é sempre uma ação manual. | P2 | I | ⬜ | `src/services/patients/unblockPatientService.ts:11-14` |

## Consultas do paciente pela ótica da recepção

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| PAC-025 | **NÃO PODE:** listar consultas de um paciente sem NENHUMA consulta na clínica ativa — 404, mesmo que o paciente exista globalmente. | P0 | I | ⬜ | `src/services/reception/receptionPatientsService.ts:7-14` |
| PAC-026 | **DEVE:** devolver só as consultas DESSA clínica, nunca as de outra clínica do mesmo paciente. | P0 | I | ⬜ | `src/services/reception/receptionPatientsService.ts:16-39` |

## Paciente (autoatendimento)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| PAC-027 | **NÃO PODE:** um paciente ver detalhe de uma consulta que não é sua — 403. | P0 | I | ⬜ | `src/services/patients/getPatientAppointmentDetailService.ts:43-49` |
| PAC-028 | **DEVE:** buscar clínicas (para o paciente escolher onde agendar) só entre clínicas ATIVAS, por nome ou cidade. | P1 | I | ⬜ | `src/services/patients/searchClinicsService.ts:8-20` |

## Comentários clínicos do profissional sobre o paciente

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| PAC-029 | **NÃO PODE:** criar comentário sobre um paciente com quem o profissional NUNCA teve uma consulta `COMPLETED`/`COMPLETED_WITH_ADDENDUM` nesta clínica — 403. | P0 | I | ⬜ | `src/services/professionals/patientCommentService.ts:81-98` |
| PAC-030 | **NÃO PODE:** editar ou excluir um comentário que não é do próprio profissional (mesmo sendo `ADMIN`) — 403. | P0 | I | ⬜ | `src/services/professionals/patientCommentService.ts:127-137,154-163` |
| PAC-031 | **DEVE:** a listagem trazer só os comentários do PRÓPRIO profissional logado, nunca de colegas. | P1 | I | ⬜ | `src/repository/patientCommentRepository.ts` (`listByClinic(clinicId, professionalId)`) |
| PAC-032 | **NÃO PODE:** a exclusão de um comentário ser lógica com histórico — hoje é `DELETE` físico, sem auditoria própria (`AuditLog`) do que foi escrito/apagado. | P2 | I | ❓ | `src/services/professionals/patientCommentService.ts:144-166` |

## Notas

- **PAC-015 (⚠ P1):** achado sólido — `incrementNoShowCount` existe pronta em `patientRepository.ts` mas não tem NENHUM chamador em todo o repositório (confirmado por busca textual). O no-show automático conta faltas por uma consulta agregada em tempo real (`countPatientNoShows`, ver [05-agendamentos.md](05-agendamentos.md) `AGE-047`), então o CAMPO `noShowCount` do paciente é decorativo — só os valores do seed aparecem em produção. Corrigir é simples (chamar `incrementNoShowCount` no mesmo ponto em que `autoNoShowService` já conta as faltas), mas antes vale decidir se o campo deve mesmo existir separado da contagem em tempo real, ou se deveria ser removido/substituído por ela.
- **PAC-023 (❓, mesma pergunta de VIN-033):** repetido aqui de propósito porque é o outro lado do mesmo fluxo (bloquear x desbloquear) — a resposta a essa pergunta deve valer para os dois.
- **PAC-008/PAC-020/PAC-032 (❓):** três comportamentos que fazem sentido como estão, mas não têm uma justificativa escrita no código — cada um vira uma pergunta específica em [99-perguntas-em-aberto.md](99-perguntas-em-aberto.md) em vez de bug, seguindo o critério desta especificação.
