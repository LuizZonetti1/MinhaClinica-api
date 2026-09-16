# Cadastro de paciente e de clínica — especificação de comportamento

> Parte da especificação da API (ver [README](README.md)). Legenda: prioridade P0/P1/P2 · camada U/I/C/E2E · status ✅ testado · ⬜ sem teste · ⚠ bug confirmado · ❓ decisão pendente.

## Escopo

Os dois cadastros públicos em 2-3 etapas (início → verificação de e-mail → completar dados): paciente (`src/services/patients/patientRegistrationService.ts`) e clínica (`src/services/clinics/clinicRegistrationService.ts`, com 4 casos conforme o e-mail do dono já tem conta ou não). Cobre também a verificação de e-mail compartilhada (`verifyEmailService.ts`, `resendVerificationService.ts`, `verifyRedirectUtils.ts`) e o `tempRegistrationAuth`. Convites de equipe (`ClinicInvite`) têm arquivo próprio em [03-convites.md](03-convites.md).

## Cadastro público de paciente

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CAD-001 | **DEVE:** checar o e-mail GLOBALMENTE (`User` é único por e-mail em toda a plataforma) antes de criar a conta de paciente. | P0 | I | ⬜ | `src/services/patients/patientRegistrationService.ts:29-30` |
| CAD-002 | **NÃO PODE:** regravar um cadastro pendente de OUTRO fluxo (ex.: dono de clínica em cadastro) com dados de paciente — só regrava quando `existingUser.role === PATIENT` e o status ainda está pendente; senão cai no erro de e-mail já cadastrado. | P0 | I | ⬜ | `src/services/patients/patientRegistrationService.ts:43-47,70-78` |
| CAD-003 | **DEVE:** reenviar o link de verificação (com token novo) quando o e-mail já tem um cadastro de PACIENTE pendente (`PENDING_ACTIVATION` ou `EMAIL_VERIFIED`), mantendo o mesmo fluxo em vez de pular direto para a Etapa 3 sem e-mail nenhum. | P1 | I | ⬜ | `src/services/patients/patientRegistrationService.ts:43-68` |
| CAD-004 | **NÃO PODE:** cadastrar um segundo paciente com um e-mail que já tem conta ATIVA (cadastro completo) — 409 `EMAIL_ALREADY_REGISTERED`. | P0 | I | ⬜ | `src/services/patients/patientRegistrationService.ts:70-78` |
| CAD-005 | **DEVE:** o token de verificação do cadastro de paciente expirar em 25 minutos. | P1 | I | ⬜ | `src/services/patients/patientRegistrationService.ts:48,82` |
| CAD-006 | **NÃO PODE:** `CompletePatientService` (Etapa 3) aceitar uma conta que não está `EMAIL_VERIFIED`, nem uma conta cujo `role` não é `PATIENT`. | P0 | I | ⬜ | `src/services/patients/patientRegistrationService.ts:129-135` |
| CAD-007 | **NÃO PODE:** completar o cadastro com um CPF que já pertence a OUTRA conta (busca global) — 409 `CPF_ALREADY_REGISTERED`. | P0 | I | ⬜ | `src/services/patients/patientRegistrationService.ts:144-154` |
| CAD-008 | **DEVE:** ao completar o cadastro, ativar a conta (`status: ACTIVE`), gravar `termsAcceptedAt`/`privacyAcceptedAt`, criar o registro `Patient` SEM clínica (o vínculo nasce só ao marcar uma consulta) e limpar o token de verificação. | P1 | I | ⬜ | `src/services/patients/patientRegistrationService.ts:164-207` |
| CAD-009 | **DEVE:** a Etapa 3 devolver uma sessão já aberta (mesmo formato do login) — sem isso a tela cairia de volta no login por falta de token. | P1 | I | ⬜ | `src/services/patients/patientRegistrationService.ts:209-219` |
| CAD-010 | **NÃO PODE:** a validação de CPF de `CompletePatientService` ser um *stub* que aceita qualquer valor. | P1 | U | ⚠ | `src/services/patients/patientRegistrationService.ts:11-18,138-141` |

## Verificação de e-mail e reenvio (compartilhada)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CAD-011 | **NÃO PODE:** `VerifyEmailService` aceitar um token cuja conta não está em `PENDING_ACTIVATION` — vale tanto para paciente quanto para dono de clínica em cadastro, que passam pelo mesmo serviço. | P0 | I | ⬜ | `src/services/auth/verifyEmailService.ts:16-25` |
| CAD-012 | **NÃO PODE:** aceitar um token de verificação de e-mail expirado. | P0 | I | ⬜ | `src/services/auth/verifyEmailService.ts:28-30` |
| CAD-013 | **DEVE:** ao verificar, mudar o status para `EMAIL_VERIFIED`, invalidar o token (uso único) e emitir um JWT temporário de 30 min com `scope: register_complete` para a Etapa 3. | P1 | I | ⬜ | `src/services/auth/verifyEmailService.ts:32-44` |
| CAD-014 | **NÃO PODE:** `ResendVerificationService` (de paciente) reenviar para um e-mail cuja conta não é `PATIENT` — convites de equipe e cadastro de clínica têm reenvio próprio; resposta genérica quando não há paciente pendente com aquele e-mail. | P0 | I | ⬜ | `src/services/auth/resendVerificationService.ts:15-34` |
| CAD-015 | **DEVE:** o reenvio de verificação de paciente sempre voltar o status para `PENDING_ACTIVATION` (mesmo partindo de `EMAIL_VERIFIED`) — é o único status que `VerifyEmailService` aceita. | P1 | I | ⬜ | `src/services/auth/resendVerificationService.ts:38-49` |
| CAD-016 | **NÃO PODE:** o link de verificação clicado por navegação direta (`GET /auth/verify-email/:token`) redirecionar para uma rota do frontend que não existe mais. | P2 | I | ⚠ | `src/utils/verifyRedirectUtils.ts:9-14` |

## Cadastro de clínica — início (`POST /clinics/register/start`)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CAD-017 | **DEVE:** responder com a MESMA mensagem (`START_RESPONSE_MESSAGE`) nos 4 casos possíveis (e-mail novo, dono pendente, conta ativa, conta inativa) — o formulário público nunca revela se aquele e-mail já tem conta. | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:30-32,133,189,235,305` |
| CAD-018 | **NÃO PODE:** aceitar CNPJ ou e-mail de clínica já usados por OUTRA clínica — 409, checado antes de criar ou regravar. | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:62-74` |
| CAD-019 | **DEVE** (caso a — e-mail sem conta): criar a conta do dono como `ADMIN` `PENDING_ACTIVATION` (senha placeholder, `mustChangePassword:false`), a clínica `isActive:false` e um vínculo `ADMIN` `PENDING`, tudo na MESMA transação. | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:137-190` |
| CAD-020 | **DEVE** (caso b — dono ainda pendente reenvia o formulário): regravar SÓ a clínica em cadastro (o mesmo registro, pelo id) e os dados do dono, sem criar uma segunda clínica. | P1 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:192-236` |
| CAD-021 | **NÃO PODE:** o formulário público de cadastro de clínica sobrescrever uma clínica já ATIVA — `findPendingOwnedClinic` só encontra vínculo `PENDING` de uma clínica com `isActive:false`, nunca uma clínica em operação. | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:76-92` |
| CAD-022 | **DEVE** (caso c — e-mail de conta ATIVA, ex.: paciente abrindo a própria clínica): criar a clínica inativa e o vínculo `ADMIN` `PENDING` SEM alterar nome, senha ou status da conta existente — só um link de confirmação de 24h. | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:238-306` |
| CAD-023 | **DEVE** (caso c, reenvio antes de confirmar): reaproveitar a MESMA clínica pendente (`reusable`) em vez de criar outra. | P1 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:249-274` |
| CAD-024 | **NÃO PODE** (caso d — conta existe mas não está ativa nem tem clínica pendente, ex.: bloqueada ou paciente com cadastro pela metade): criar clínica nem vínculo nenhum — só envia um e-mail avisando a situação para o dono do e-mail. | P1 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:126-133` |

## Cadastro de clínica — conclusão de conta nova (Etapa 3 do dono)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CAD-025 | **NÃO PODE:** `CompleteClinicOwnerService` aceitar conta que não está `EMAIL_VERIFIED`. | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:322-324` |
| CAD-026 | **NÃO PODE:** concluir com um CPF que já pertence a OUTRA conta — 409 `CPF_ALREADY_REGISTERED`. | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:332-341` |
| CAD-027 | **DEVE:** ativar a conta, o vínculo `ADMIN` e a clínica na MESMA transação, abrir `activeClinicId` para essa clínica e devolver sessão já autenticada. | P1 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:347-375` |

## Cadastro de clínica — confirmação por conta existente

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CAD-028 | **NÃO PODE:** `ConfirmExistingAccountClinicService` aceitar a confirmação de uma conta diferente da que está no vínculo pendente, mesmo com o token certo — 403 `CLINIC_REGISTRATION_ACCOUNT_MISMATCH`; é preciso estar logado como o dono do e-mail. | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:446-452` |
| CAD-029 | **NÃO PODE:** aceitar um token de confirmação de clínica expirado ou sem vínculo `ADMIN` `PENDING` correspondente — 404/410. | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:405-415` |
| CAD-030 | **NÃO PODE:** sobrescrever CPF/telefone já preenchidos na conta ao confirmar — só completa o que falta, igual ao aceite de convite (ver CNV-023). | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:460-470,494-500` |
| CAD-031 | **NÃO PODE:** confirmar com um CPF que já pertence a outra conta — 409 `CPF_ALREADY_REGISTERED`. | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:471-481` |
| CAD-032 | **DEVE:** ativar a clínica, o vínculo e definir `activeClinicId` na MESMA transação, limpar o token de verificação da clínica e abrir sessão. | P1 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:485-514` |

## Reenvio de verificação da clínica

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| CAD-033 | **NÃO PODE:** `ResendClinicVerificationService` revelar se um e-mail tem ou não cadastro de clínica pendente — resposta genérica em todos os casos (e-mail inexistente, sem clínica pendente, ou reenviado de fato). | P0 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:530-543` |
| CAD-034 | **DEVE:** escolher o e-mail certo conforme o estágio do cadastro — link de verificação do dono (conta `PENDING_ACTIVATION`) ou link de confirmação da clínica (conta `ACTIVE` com clínica aguardando `verificationToken`). | P1 | I | ⬜ | `src/services/clinics/clinicRegistrationService.ts:546-581` |

## Notas

- **CAD-010 (⚠ severidade baixa-média, mitigada hoje):** `isValidCPF` dentro de `patientRegistrationService.ts:11-18` tem um comentário explícito — *"BYPASS TEMPORÁRIO — aceita qualquer CPF durante os testes"* / *"TODO: remover bypass e reativar validação real quando os testes forem concluídos"* — e a função sempre devolve `true`, ignorando o parâmetro. Na prática, **hoje isso não deixa passar CPF inválido**: a rota `POST /auth/register/complete` passa por `validate(completePatientSchema)` (`src/routes/auth.routes.ts:129-135`), e o schema (`src/schemas/patientSchema.ts:191-194`) chama o validador de verdade (`validateCPF`, com dígito verificador) ANTES de o corpo chegar ao serviço. O risco é: (1) o `isValidCPF` do serviço é código morto que engana quem ler `CompletePatientService` achando que há uma segunda camada de validação; (2) qualquer teste unitário direto do serviço, ou qualquer chamada futura a `CompletePatientService.execute` que não passe pela validação HTTP (script interno, outra rota), aceita CPF com dígito verificador errado. Um teste unitário de `isValidCPF` isolado (`AGE`/`VAL`-style) travaria imediatamente nisso — é exatamente o tipo de lacuna que esta especificação existe para capturar. Recomenda-se ao implementar os testes já remover o bypass e chamar `validateCPF` de verdade (a função já existe e é usada em outros schemas).
- **CAD-016 (⚠ severidade baixa, inofensivo hoje):** `SUCCESS_ROUTES`/`ERROR_ROUTES` em `verifyRedirectUtils.ts:9-14,17-24` mapeiam os papéis `PROFESSIONAL` e `RECEPTIONIST` para `/profissional/completar-cadastro` e `/recepcao/completar-cadastro`. Essas páginas foram removidas do `MinhaClinica-Interface` quando o cadastro de equipe virou convite (confirmado: `grep` em `MinhaClinica-Interface/src/routes/index.tsx` não encontra mais essas rotas, só `/completar-cadastro` de paciente e `/clinica/completar-cadastro` de dono). Isso só teria efeito se existisse um `User` com `role` `PROFESSIONAL`/`RECEPTIONIST` e `status: PENDING_ACTIVATION` com token de verificação — e não existe mais nenhum fluxo que crie esse estado (convites vão direto para conta `ACTIVE`, sem essa etapa). Ou seja: mapeamento obsoleto e código mort — mas sem usuário real afetado hoje. Vale limpar ao mexer no arquivo, não é urgente corrigir isoladamente.
- **Relação com outras áreas:** o cadastro de EQUIPE (profissional/recepcionista/admin adicional) não usa mais este fluxo de verificação por e-mail — é sempre convite, ver [03-convites.md](03-convites.md). O cadastro de paciente PELA RECEPÇÃO (sem senha, ativado depois por token) é outro fluxo, coberto em [08-pacientes-recepcao.md](08-pacientes-recepcao.md).
