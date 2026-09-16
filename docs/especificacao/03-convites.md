# Convites de equipe — especificação de comportamento

> Parte da especificação da API (ver [README](README.md)). Legenda: prioridade P0/P1/P2 · camada U/I/C/E2E · status ✅ testado · ⬜ sem teste · ⚠ bug confirmado · ❓ decisão pendente.

## Escopo

O convite (`ClinicInvite`) para entrar na equipe de uma clínica como `ADMIN`, `RECEPTIONIST` ou `PROFESSIONAL`. Um convite NUNCA cria conta sozinho: quem já tem conta (inclusive só como paciente) aceita logado; quem não tem, cria a conta na própria página do convite. Cobre `src/services/invites/inviteService.ts`, `src/controller/inviteController.ts`, `src/routes/invite.routes.ts` e `src/schemas/inviteSchema.ts`. A criação do convite em si é feita por `POST /professionals/invite` e `POST /staff/invite`, que só delegam para `CreateInviteService` (ver `professionalRegistrationService.ts` e `staffRegistrationService.ts`).

## Criação do convite

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CNV-001 | **DEVE:** o convite nunca criar conta sozinho — só existe como registro pendente até ser aceito por login ou por cadastro. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:26-33` |
| CNV-002 | **DEVE:** normalizar o e-mail do convite (minúsculas, sem espaços) antes de gravar e de comparar com contas existentes. | P1 | I | ⬜ | `src/services/invites/inviteService.ts:36,214` |
| CNV-003 | **NÃO PODE:** convidar alguém que já tem o MESMO papel ativo NA MESMA clínica — 409 `ALREADY_MEMBER`, calculado com `deriveRoles` sobre o vínculo e o `Professional` ativo. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:224-248` |
| CNV-004 | **NÃO PODE:** criar um segundo convite pendente e ainda válido para o mesmo e-mail, papel e clínica — 409 `INVITE_ALREADY_PENDING` com `action: "RESEND_INVITE"`. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:250-258` |
| CNV-005 | **DEVE:** um convite pendente já EXPIRADO para o mesmo e-mail, papel e clínica ser renovado no MESMO registro (token e prazo novos), em vez de duplicado. | P1 | I | ⬜ | `src/services/invites/inviteService.ts:293-298` |
| CNV-006 | **DEVE:** avisar, sem bloquear a criação, quando já existe outro convite pendente da clínica com o MESMO NOME mas e-mail diferente (`duplicateNameWarning`) — possível pessoa duplicada. | P2 | I | ⬜ | `src/services/invites/inviteService.ts:260-270,320-322` |
| CNV-007 | **NÃO PODE:** a resposta da criação do convite revelar se aquele e-mail já tem conta na plataforma (ex.: já é paciente) — mensagem sempre neutra para quem convida. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:313-323` |
| CNV-008 | **DEVE:** gerar o token do convite como hash SHA-256 guardado em `tokenHash` (nunca o valor em claro), com validade de 48h. | P0 | U | ⬜ | `src/services/invites/inviteService.ts:9-11`, `prisma/schema.prisma:456-457` |
| CNV-009 | **NÃO PODE:** uma falha ao enviar o e-mail do convite impedir a criação — o convite já foi persistido antes do envio; o ADMIN recebe `emailWarning` e pode reenviar manualmente. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:73-78,311` |

## Reenvio e cancelamento

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CNV-010 | **DEVE:** `POST /invites/:id/resend` e `DELETE /invites/:id` exigirem ADMIN e restringir a busca do convite por `clinicId = req.clinicId` (a clínica ativa do token) — nunca alcançar um convite de outra clínica só pelo id. | P0 | I | ⬜ | `src/controller/inviteController.ts:89-105,110-126` |
| CNV-011 | **DEVE:** reenviar um convite trocar `tokenHash` e validade — o link antigo, já enviado, deixa de funcionar. | P1 | I | ⬜ | `src/services/invites/inviteService.ts:335-339` |
| CNV-012 | **NÃO PODE:** cancelar um convite apagar qualquer conta — só muda `status` para `CANCELLED`; se a pessoa já tinha conta por outro motivo, ela continua intacta. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:367-371` |

## Consulta pública e validade do token

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CNV-013 | **NÃO PODE:** `findUsableInvite` tratar como válido um convite de clínica INATIVA — 404 `INVITE_NOT_FOUND`, a mesma resposta de token inexistente (não distingue os dois casos ao cliente). | P0 | I | ⬜ | `src/services/invites/inviteService.ts:82-90` |
| CNV-014 | **NÃO PODE:** aceitar ou consultar como válido um convite já `ACCEPTED` — 410 `INVITE_ALREADY_ACCEPTED`. | P1 | I | ⬜ | `src/services/invites/inviteService.ts:91-93` |
| CNV-015 | **NÃO PODE:** aceitar ou consultar como válido um convite `CANCELLED` ou `DECLINED` — 410 `INVITE_CANCELLED`. | P1 | I | ⬜ | `src/services/invites/inviteService.ts:94-96` |
| CNV-016 | **NÃO PODE:** aceitar ou consultar como válido um convite com `expiresAt` no passado — 410 `INVITE_EXPIRED`. | P1 | I | ⬜ | `src/services/invites/inviteService.ts:97-101` |
| CNV-017 | **NÃO PODE:** `GET /invites/:token` (público) devolver o e-mail do convidado em claro — sempre mascarado (`maskEmail`). | P0 | I | ⬜ | `src/services/invites/inviteService.ts:38-43,407` |
| CNV-018 | **DEVE:** `GET /invites/:token` informar `accountStatus` (`NONE`/`ACTIVE`/`INACTIVE`) para a tela decidir entre "criar conta" e "entrar para aceitar", sem expor mais nada sobre a conta convidada. | P1 | I | ⬜ | `src/services/invites/inviteService.ts:394-412` |

## Pré-preenchimento para conta já logada

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CNV-019 | **NÃO PODE:** `GET /invites/:token/prefill` devolver qualquer dado prévio (CPF/telefone faltantes, dados profissionais de outra clínica) quando o e-mail da SESSÃO logada é diferente do e-mail do convite — só `emailMatches: false`. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:446-459` |
| CNV-020 | **DEVE:** só sugerir dados de um registro `Professional` anterior quando o convite é de papel `PROFESSIONAL` e existe `professionalCouncil` preenchido — registro vazio não conta como prefill válido. | P2 | I | ⬜ | `src/services/invites/inviteService.ts:455-458` |

## Aceite com conta existente

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CNV-021 | **NÃO PODE:** `AcceptInviteService` aceitar um convite com uma sessão cujo e-mail é diferente do e-mail convidado — 403 `INVITE_EMAIL_MISMATCH`, citando o e-mail mascarado do convite. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:473-479` |
| CNV-022 | **NÃO PODE:** aceitar convite de `PROFESSIONAL` sem conselho, número de registro e UF — 400 `PROFESSIONAL_DATA_REQUIRED`, com a lista dos campos faltantes. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:114-132,481` |
| CNV-023 | **NÃO PODE:** sobrescrever CPF ou telefone JÁ CADASTRADOS na conta ao aceitar um convite — só completa o que falta; se ambos já existem, nenhum dos dois é tocado. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:483-495,511-519` |
| CNV-024 | **NÃO PODE:** aceitar convite com um CPF que já pertence a OUTRA conta — 409 `CPF_ALREADY_REGISTERED`. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:496-506` |
| CNV-025 | **DEVE:** aceitar o convite numa ÚNICA transação: somar o papel ao vínculo da clínica, criar ou reativar o `Professional` (com especialidade primária quando informada) e marcar o convite `ACCEPTED` com `acceptedByUserId`/`acceptedAt`. | P1 | I | ⬜ | `src/services/invites/inviteService.ts:138-196,508-520` |
| CNV-026 | **DEVE:** ao aceitar, definir `activeClinicId` da conta para a clínica do convite e devolver uma sessão nova já aberta lá, no mesmo formato do login. | P1 | I | ⬜ | `src/services/invites/inviteService.ts:195,540-547` |
| CNV-027 | **NÃO PODE:** aceitar um convite de `PROFESSIONAL` cujo conselho + número de registro já pertence a outro profissional da clínica — 409 `PROFESSIONAL_REGISTRATION_CONFLICT`, desfazendo a transação inteira (papel concedido incluído). | P1 | I | ⬜ | `src/services/invites/inviteService.ts:521-528`, `prisma/schema.prisma` (`@@unique([clinicId, professionalCouncil, registrationNumber])`) |

## Cadastro a partir do convite (sem conta)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CNV-028 | **NÃO PODE:** `RegisterFromInviteService` criar conta quando já existe uma conta com aquele e-mail — 409 `ACCOUNT_EXISTS`, orientando a fazer login para aceitar. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:555-565` |
| CNV-029 | **NÃO PODE:** criar conta com um CPF que já pertence a outra conta — 409 `CPF_ALREADY_REGISTERED`. | P0 | I | ⬜ | `src/services/invites/inviteService.ts:567-574` |
| CNV-030 | **DEVE:** a conta criada a partir de um convite nascer com `status: ACTIVE` e `mustChangePassword: false` — a posse do token (link recebido por e-mail) já prova o e-mail, sem precisar de uma segunda verificação. | P1 | I | ⬜ | `src/services/invites/inviteService.ts:584-598` |
| CNV-031 | **DEVE:** exigir senha (mín. 8, máx. 50 caracteres), CPF e telefone no cadastro por convite — diferente do aceite com conta existente (CNV-023), aqui todos são obrigatórios porque a conta ainda não existe. | P1 | U | ⬜ | `src/schemas/inviteSchema.ts:76-92` |

## Recusar convite

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CNV-032 | **DEVE:** `POST /invites/:token/decline` ser público (não exige login) e só mudar o status para `DECLINED` — não apaga o convite nem cria ou altera conta nenhuma. | P1 | I | ⬜ | `src/services/invites/inviteService.ts:629-637`, `src/routes/invite.routes.ts:48-52` |

## Notas

- Nenhum bug foi confirmado nesta área durante a redação desta especificação — o fluxo de convites foi reescrito nesta mesma iteração (conta unificada) e já passou por 101 verificações de ponta a ponta contra um banco local (não commitadas como testes automatizados no repositório, por isso as regras acima estão ⬜, não ✅ — ver critério de status no [README](README.md)).
- **CNV-013 (comportamento intencional, não é bug):** convite de clínica inativa e token inexistente devolvem o mesmo 404 `INVITE_NOT_FOUND` — evita confirmar a um estranho com o link que a clínica existe mas está inativa.
- **Relação com outras áreas:** a criação do vínculo e do `Professional` ao aceitar (CNV-025) segue as mesmas regras de multi-tenant de [02-conta-unificada-vinculos.md](02-conta-unificada-vinculos.md); o cadastro de CLÍNICA (diferente de convite de equipe) tem arquivo próprio em [04-cadastro-paciente-clinica.md](04-cadastro-paciente-clinica.md).
