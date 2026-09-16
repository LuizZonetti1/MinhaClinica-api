# Conta unificada e vínculos com clínicas — especificação de comportamento

> Parte da especificação da API (ver [README](README.md)). Legenda: prioridade P0/P1/P2 · camada U/I/C/E2E · status ✅ testado · ⬜ sem teste · ⚠ bug confirmado · ❓ decisão pendente.

## Escopo

O modelo multi-tenant da conta unificada: uma conta (`User`, um e-mail) pode ser paciente global (`Patient`) e equipe em várias clínicas ao mesmo tempo, uma por `ClinicMembership`. Cobre o modelo de dados, a derivação de papéis por clínica, os papéis self-service, a gestão de equipe sem destruir a conta, e o isolamento entre clínicas em listagens, notificações e bloqueio de paciente. Convites (`ClinicInvite`) têm arquivo próprio ([03-convites.md](03-convites.md)); a resolução de acesso a uma consulta específica tem detalhe adicional em [05-agendamentos.md](05-agendamentos.md) e [06-documentos-clinicos.md](06-documentos-clinicos.md).

## Modelo de dados

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| VIN-001 | **DEVE:** limitar a conta a no máximo um vínculo (`ClinicMembership`) por clínica — todos os papéis de equipe naquela clínica somam no MESMO vínculo, nunca em vínculos duplicados. | P0 | U | ⬜ | `prisma/schema.prisma:439` |
| VIN-002 | **DEVE:** `ClinicMembership.roles` conter só papéis de equipe (`ADMIN`, `RECEPTIONIST`, `PROFESSIONAL`) — `PATIENT` nunca vem do vínculo, só do registro global `Patient`. | P0 | U | ✅ | `src/services/auth/sessionContext.ts:41` |
| VIN-003 | **DEVE:** `Patient` ser um registro único por conta e GLOBAL, sem `clinicId` — o único vínculo entre um paciente e uma clínica é através de `Appointment.clinicId`. | P0 | U | ⬜ | `prisma/schema.prisma:331-335,630` |
| VIN-004 | **DEVE:** `Professional` ter um registro por par (`userId`, `clinicId`) — a mesma conta pode ser profissional em várias clínicas ao mesmo tempo, cada uma com sua própria agenda, especialidades e `isActive`. | P0 | U | ⬜ | `prisma/schema.prisma:521-524,566` |
| VIN-005 | **NÃO PODE:** excluir uma clínica apagar a conta (`User`) do dono ou de quem trabalha nela — `User.activeClinicId` usa `onDelete: SetNull`; só `ClinicMembership`, `ClinicInvite`, `Professional` e todo o histórico clínico DAQUELA clínica são apagados em cascata. | P0 | I | ⬜ | `prisma/schema.prisma:339-341`, `src/routes/clinic.routes.ts:218-222` |
| VIN-006 | **DEVE:** manter `DELETE /clinics/:id` restrito a ADMIN da própria clínica (`checkSameClinic`) — hoje é uma operação administrativa manual, sem nenhum cliente (web/mobile) que a chame. | P1 | I | ⬜ | `src/routes/clinic.routes.ts:214-229` |

## Papéis efetivos por clínica (isolamento multi-tenant)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| VIN-007 | **DEVE:** o papel `PROFESSIONAL` só valer numa clínica com `Professional.isActive=true` NAQUELA clínica especificamente — inativo numa clínica não afeta o papel em outra. | P0 | U | ✅ | `src/services/auth/sessionContext.ts:34-47` |
| VIN-008 | **NÃO PODE:** os papéis de uma clínica vazarem para outra — cada entrada de `clinics[]` na sessão carrega só os papéis do próprio vínculo. | P0 | U | ✅ | `src/services/auth/sessionContext.ts:150-162` |
| VIN-009 | **NÃO PODE:** um ADMIN de uma clínica editar, desativar ou remover profissional/recepcionista de OUTRA clínica — toda operação usa a clínica ATIVA do token (`req.clinicId`), nunca um id vindo do corpo da requisição. | P0 | I | ⬜ | `src/services/professionals/professionalManagementService.ts:154-158`, `src/services/staff/receptionManagementService.ts:39-41` |
| VIN-010 | **NÃO PODE:** `resolveAppointmentRole` conceder papel de equipe quando `appointment.clinicId` é diferente da clínica ativa da sessão — equipe de uma clínica nunca acessa consulta de outra, mesmo tendo o mesmo papel lá. | P0 | U | ✅ | `src/utils/appointmentAccess.ts:21-29` |
| VIN-011 | **DEVE:** quem é paciente e também dono/equipe de uma clínica manter o papel `PATIENT` mesmo estando na própria clínica de trabalho — os papéis se acumulam, não se substituem. | P1 | U | ✅ | `src/services/auth/sessionContext.ts:176-179` |
| VIN-012 | **NÃO PODE:** um vínculo sem nenhum papel usável (ex.: só `PROFESSIONAL` com `Professional.isActive=false`) aparecer na lista de clínicas da conta nem contar como acesso àquela clínica. | P0 | U | ✅ | `src/services/auth/sessionContext.ts:160-162` |
| VIN-013 | **DEVE:** uma conta com vínculo ativo em várias clínicas simultaneamente acessar cada uma por troca de clínica, sem precisar de novo convite ou login — os vínculos são independentes: ativar, desativar ou remover papéis em um nunca altera o outro. | P0 | I | ⬜ | `src/repository/membershipRepository.ts:12-38` |

## Papéis self-service (`PATCH /staff/me/roles`)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| VIN-014 | **DEVE:** permitir que um ADMIN da clínica ativa ligue/desligue em si mesmo só `PROFESSIONAL`, `RECEPTIONIST` e `PATIENT` — nunca o próprio `ADMIN`, por esta rota. | P0 | I | ⬜ | `src/services/users/updateUserRolesService.ts:24-28,42-47` |
| VIN-015 | **NÃO PODE:** um membro da equipe sem `ADMIN` alternar qualquer papel de equipe em si mesmo — só `PATIENT` está liberado. | P0 | I | ⬜ | `src/services/users/updateUserRolesService.ts:46-47` |
| VIN-016 | **NÃO PODE:** uma conta sem clínica ativa (só paciente) ganhar papel de equipe por autoatribuição — a mensagem de erro orienta a aceitar um convite ou cadastrar uma clínica. | P0 | I | ⬜ | `src/services/users/updateUserRolesService.ts:43-44,56-57` |
| VIN-017 | **NÃO PODE:** a operação resultar em conta sem nenhum papel na clínica — `wanted.length === 0` é rejeitado com 400. | P0 | I | ⬜ | `src/services/users/updateUserRolesService.ts:62-66` |
| VIN-018 | **DEVE:** conceder/revogar papéis de equipe e reconciliar o registro `Professional` (criar, reativar ou desativar) na MESMA transação — um erro em qualquer etapa desfaz tudo, inclusive a mudança no vínculo. | P1 | I | ⬜ | `src/services/users/updateUserRolesService.ts:68-89` |
| VIN-019 | **NÃO PODE:** ativar `PATIENT` sem CPF preenchido no perfil da conta, nem quando o CPF já pertence a outro registro de `Patient`. | P0 | I | ⬜ | `src/services/users/updateUserRolesService.ts:185-198` |
| VIN-020 | **DEVE:** revogar um papel sem sobrar nenhum outro encerrar o vínculo inteiro (`INACTIVE` + `deletedAt`) — nunca deixar `roles: []` num vínculo "ativo". | P1 | I | ⬜ | `src/repository/membershipRepository.ts:88-100` |
| VIN-021 | **NÃO PODE:** reativar um vínculo encerrado (`deletedAt` preenchido) trazer de volta papéis anteriores ao desligamento — o vínculo reativado começa só com o papel concedido agora. | P2 | I | ⬜ | `src/repository/membershipRepository.ts:69-71` |

## Gestão de equipe sem destruir a conta

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| VIN-022 | **NÃO PODE:** desativar ou remover um profissional/recepcionista alterar `User.status` — afeta só o vínculo/`Professional` DESTA clínica; a conta pode seguir ativa como paciente ou em outra clínica. | P0 | I | ⬜ | `src/services/professionals/professionalManagementService.ts:258-261`, `src/services/staff/receptionManagementService.ts:174-181` |
| VIN-023 | **NÃO PODE:** anonimizar a conta (apagar nome, e-mail, telefone) ao remover alguém da equipe se ela ainda tem outro vínculo ativo em qualquer clínica ou é paciente — decidido por `hasOtherIdentity`. | P0 | I | ⬜ | `src/repository/membershipRepository.ts:108-116`, `professionalManagementService.ts:449-457`, `receptionManagementService.ts:292-301` |
| VIN-024 | **DEVE:** anonimizar a conta só quando a remoção encerra o ÚLTIMO vínculo restante e não há registro de paciente — preserva o histórico de consultas (FK `Appointment.professional` é `onDelete: Restrict`) mas apaga os dados pessoais de quem não usa mais o sistema. | P0 | I | ⬜ | `professionalManagementService.ts:459-470` |
| VIN-025 | **NÃO PODE:** trocar o e-mail de um profissional/recepcionista quando a conta tem outra identidade (outra clínica ou é paciente) — 403 `EMAIL_MANAGED_BY_OWNER`, porque o e-mail é o login da conta inteira, não só do papel nesta clínica. | P0 | I | ⬜ | `professionalManagementService.ts:203-215`, `receptionManagementService.ts:159-168` |
| VIN-026 | **DEVE:** mesmo quando permitida, a troca de e-mail de um membro da equipe passar pelo fluxo de confirmação (`RequestEmailChangeService`) — o e-mail atual continua válido até a pessoa confirmar pelo endereço novo. | P0 | I | ⬜ | `professionalManagementService.ts:349-364`, `receptionManagementService.ts:217-230` |
| VIN-027 | **NÃO PODE:** desativar ou remover profissional/recepcionista com consultas ativas futuras (`SCHEDULED`/`CONFIRMED`/`WAITING`/`IN_PROGRESS` a partir de hoje). | P1 | I | ⬜ | `professionalManagementService.ts:411-428`, `receptionManagementService.ts:263-280` |
| VIN-028 | **DEVE:** "ativo/inativo" de um recepcionista ser o status do VÍNCULO (`ClinicMembership.status`), não `User.status` — a mesma conta pode estar inativa numa clínica e ativa em outra. | P1 | I | ⬜ | `receptionManagementService.ts:174-200` |
| VIN-029 | **DEVE:** listagens de profissionais e de recepcionistas mostrar também os convites pendentes da clínica (linha sem conta ainda, id = id do convite), marcando `INVITE_EXPIRED` quando `expiresAt` já passou. | P2 | I | ⬜ | `src/services/professionals/getProfessionalsService.ts:56-59,82-92`, `src/services/staff/getProfessional.ts:40-43,76-88` |
| VIN-030 | **NÃO PODE:** a listagem de profissionais/recepcionistas de uma clínica trazer vínculo ou convite de OUTRA clínica — sempre filtrada por `clinicId` (Professional direto ou `memberOf(clinicId, ...)`). | P0 | I | ⬜ | `getProfessionalsService.ts:21-22`, `getProfessional.ts:23-24` |

## Isolamento entre clínicas em notificações e bloqueio de paciente

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| VIN-031 | **DEVE:** listar, contar e marcar como lidas as notificações pelo DONO da conta (`recipientUserId`) em TODAS as clínicas, não só a ativa — quem é paciente e também equipe não pode perder avisos de uma consulta em outra clínica. | P0 | I | ⬜ | `src/repository/notificationRepository.ts:28-38,70-95` |
| VIN-032 | **NÃO PODE:** a busca de destinatários de comunicado/mensagem direta devolver uma conta sem vínculo ATIVO na clínica do token — usa `activeMemberOf`, não qualquer vínculo histórico. | P0 | I | ⬜ | `src/repository/notificationRepository.ts:97-100`, `src/repository/membershipRepository.ts:12-24` |
| VIN-033 | **NÃO PODE:** `UnblockPatientService` aceitar como prova de acesso qualquer clínica em que o paciente tenha UMA consulta — hoje um ADMIN/RECEPTIONIST de QUALQUER clínica que o paciente já visitou consegue desbloquear um `Patient.blockedAt`, que é global (afeta a pessoa em todas as clínicas). | P0 | I | ❓ | `src/services/patients/unblockPatientService.ts:18-22,33-39` |
| VIN-034 | **DEVE:** o bloqueio automático por excesso de faltas (`Patient.blockedAt`) valer só para o papel `PATIENT` — quem também é equipe continua acessando a própria clínica normalmente enquanto bloqueado como paciente. | P0 | I | ⬜ | `src/services/appointments/autoNoShowService.ts:109-121` |
| VIN-035 | **DEVE:** `Patient.blockedAt` não ter expiração automática — desbloqueio é sempre uma ação manual de ADMIN/RECEPTIONIST (decisão de produto registrada no código, não bug). | P2 | I | ⬜ | `src/services/patients/unblockPatientService.ts:11-14` |

## Notas

- **VIN-033 (❓ P-VIN-01):** `UnblockPatientService.execute` localiza o paciente por `{ id: patientId, appointments: { some: { clinicId } } }` — ou seja, exige só que o paciente tenha alguma consulta na clínica de quem está desbloqueando, sem checar se foi aquela clínica que bloqueou nem se o paciente é "dela" de alguma forma mais forte. Como o bloqueio por faltas é uma propriedade GLOBAL da conta (`Patient.blockedAt`, sem `clinicId`), qualquer clínica em que o paciente já teve uma consulta — mesmo que a causa do bloqueio tenha sido faltas em OUTRA clínica — pode desfazê-lo. Ver [pergunta P-VIN-01](99-perguntas-em-aberto.md): isso é aceitável (o bloqueio protege a agenda de todas as clínicas, então qualquer uma pode reverter) ou o desbloqueio deveria exigir alguma relação mais forte (ex.: ser a clínica que causou o bloqueio, registrada em auditoria)?
- **VIN-005/VIN-006 (contexto, não é bug):** o comentário em `src/routes/clinic.routes.ts:218-222` já documenta que `DeleteClinicService` faz exclusão física da clínica e que o schema tem 14 relações `onDelete: Cascade` saindo de `Clinic` — isso apaga consultas, documentos clínicos, transações e auditoria daquela clínica junto, mas não as contas de usuário. É uma decisão de produto já registrada (rota sem cliente que a chame); os testes de VIN-005 devem confirmar que a CONTA sobrevive, não que o histórico clínico sobrevive (ele não deve).
- **Relação com outras áreas:** o acesso a uma consulta específica (VIN-010) tem regras adicionais de posse por profissional em [05-agendamentos.md](05-agendamentos.md); a mesma função `resolveAppointmentRole` é reaproveitada em documentos clínicos ([06-documentos-clinicos.md](06-documentos-clinicos.md)). A contagem de "faltas consecutivas" que alimenta `Patient.blockedAt` (se soma entre clínicas ou é por clínica) é tratada como pergunta em aberto no arquivo de agendamentos, não aqui.
