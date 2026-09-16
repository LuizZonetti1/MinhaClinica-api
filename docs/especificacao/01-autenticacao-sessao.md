# Autenticação e sessão — especificação de comportamento

> Parte da especificação da API (ver [README](README.md)). Legenda: prioridade P0/P1/P2 · camada U/I/C/E2E · status ✅ testado · ⬜ sem teste · ⚠ bug confirmado · ❓ decisão pendente.

## Escopo

Login, 2FA por e-mail, emissão e leitura de sessão (`GET /auth/session`, `POST /auth/session/clinic`), o `authMiddleware` que revalida a conta a cada requisição, tokens JWT (sessão, cadastro temporário, 2FA pendente), redefinição de senha, troca de e-mail e os limitadores de taxa das rotas de autenticação. A conta é unificada por e-mail: o JWT carrega a clínica ATIVA da sessão (`clinicId`), e os papéis efetivos vêm sempre do banco, nunca só do token.

## Login e prevenção de enumeração de contas

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AUT-001 | **DEVE:** recusar o login com a mesma mensagem genérica ("Email ou senha incorretos") quando o e-mail não existe, a conta não está `ACTIVE`, ou a conta não tem nenhum papel usável na clínica preferida — checado antes de comparar a senha. | P0 | I | ⬜ | `src/services/auth/loginService.ts:29-45` |
| AUT-002 | **NÃO PODE:** diferenciar por mensagem, código ou status HTTP se a falha foi e-mail inexistente, senha errada ou conta sem papel usável (evita enumeração de contas). | P0 | I | ⬜ | `src/services/auth/loginService.ts:31,36,44,51` |
| AUT-003 | **DEVE:** abrir a sessão na clínica preferida da conta (`User.activeClinicId`) quando ainda houver vínculo ativo lá; senão a primeira clínica com vínculo ativo, na ordem de criação; senão sem clínica, para quem só é paciente. | P1 | U | ✅ | `src/services/auth/sessionContext.ts:54-60,166-172` |
| AUT-004 | **DEVE:** só comparar a senha com bcrypt depois de confirmar que a conta existe, está `ACTIVE` e tem ao menos um papel usável. | P1 | I | ⬜ | `src/services/auth/loginService.ts:29-48` |
| AUT-005 | **DEVE:** atualizar `lastLoginAt` em todo login bem-sucedido (sem 2FA pendente). | P2 | I | ⬜ | `src/services/auth/loginService.ts:100-104` |
| AUT-006 | **NÃO PODE:** deixar uma falha ao gravar o `AuditLog` de login impedir a autenticação — o registro é melhor esforço (try/catch isolado). | P1 | I | ⬜ | `src/services/auth/loginService.ts:110-127` |

## Autenticação em dois fatores (2FA)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AUT-007 | **DEVE:** exigir 2FA quando o próprio usuário ativou (`User.twoFactorEnabled`) OU qualquer clínica em que a conta tem vínculo ativo exige (`ClinicSettings.twoFactorEnabled`) — critério idêntico em login, envio, reenvio e validação de OTP. | P0 | U | ⬜ | `src/services/auth/twoFactorService.ts:33-35` |
| AUT-008 | **NÃO PODE:** pular o 2FA sem um `deviceToken` de dispositivo confiável ainda não expirado para aquele `userId` especificamente. | P0 | I | ⬜ | `src/services/auth/loginService.ts:60-71` |
| AUT-009 | **DEVE:** manter um dispositivo confiável válido por 7 dias após uma validação de OTP bem-sucedida. | P1 | I | ⬜ | `src/services/auth/twoFactorService.ts:9,161-163` |
| AUT-010 | **NÃO PODE:** validar um OTP depois de 5 tentativas erradas — a 5ª tentativa errada invalida o próprio código (limpa `twoFactorOtp`) e exige novo login, não só nova tentativa. | P0 | I | ⬜ | `src/services/auth/twoFactorService.ts:11,141-152` |
| AUT-011 | **DEVE:** expirar o OTP 10 minutos após o envio. | P1 | I | ⬜ | `src/services/auth/twoFactorService.ts:8,61,138-140` |
| AUT-012 | **NÃO PODE:** reenviar um novo OTP antes de 60s do envio anterior (cooldown por conta). | P2 | I | ⬜ | `src/services/auth/twoFactorService.ts:10,94-102` |
| AUT-013 | **NÃO PODE:** emitir sessão a partir de `ValidateOtpService` se o `status` da conta deixou de ser `ACTIVE` entre o login e a validação (janela de até 5 min do `tempToken`). | P0 | I | ⬜ | `src/services/auth/twoFactorService.ts:127-131` |
| AUT-014 | **NÃO PODE:** validar um código quando não há OTP pendente, quando ele já expirou, ou quando o 2FA deixou de ser exigido para a conta. | P0 | I | ⬜ | `src/services/auth/twoFactorService.ts:132-140` |
| AUT-015 | **DEVE:** ao validar o OTP, emitir a sessão pela mesma rotina do login (`IssueSessionService`), na clínica escolhida no momento do login, com os papéis recalculados na hora — nunca reaproveitar os papéis gravados no `tempToken`. | P0 | I | ⬜ | `src/services/auth/twoFactorService.ts:186-190` |
| AUT-016 | **DEVE:** ao desativar o 2FA, revogar todos os dispositivos confiáveis da conta (não deixar nenhum sobrevivendo). | P1 | I | ⬜ | `src/services/auth/twoFactorService.ts:252-262` |
| AUT-017 | **NÃO PODE:** ativar o 2FA se já está ativo, nem desativar se já está inativo (idempotência com erro, não *no-op* silencioso). | P2 | I | ⬜ | `src/services/auth/twoFactorService.ts:229-230,249-250` |

## Sessão e clínica ativa

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AUT-018 | **DEVE:** `GET /auth/session` manter exatamente a clínica do token atual (não troca de clínica sozinho), só atualizando papéis e lista de clínicas a partir do banco. | P0 | I | ⬜ | `src/services/auth/sessionService.ts:14-28` |
| AUT-019 | **NÃO PODE:** `POST /auth/session/clinic` abrir uma clínica sem vínculo ativo com papel usável — 403 `CLINIC_ACCESS_DENIED`. | P0 | I | ⬜ | `src/services/auth/sessionService.ts:35,46-54` |
| AUT-020 | **NÃO PODE:** `POST /auth/session/clinic` com `clinicId: null` abrir a área de paciente para conta sem papel `PATIENT` usável — 403. | P0 | I | ⬜ | `src/services/auth/sessionService.ts:80-88` |
| AUT-021 | **DEVE:** gravar `activeClinicId` sempre que a sessão é emitida numa clínica diferente da preferida atual (troca de clínica ou 2FA concluído em outra clínica), para o próximo login abrir no mesmo lugar. | P1 | I | ⬜ | `src/services/auth/issueSessionService.ts:47-56` |
| AUT-022 | **DEVE:** registrar `AuditLog` `SWITCH_CLINIC` na clínica de destino quando `accessLogEnabled` não é `false`. | P2 | I | ⬜ | `src/services/auth/sessionService.ts:60-75` |
| AUT-023 | **NÃO PODE:** `IssueSessionService` emitir token para conta inexistente, inativa, ou sem nenhum papel usável — 404/401/403 conforme o caso. | P0 | I | ⬜ | `src/services/auth/issueSessionService.ts:31-45` |
| AUT-024 | **NÃO PODE:** o corpo de `switchClinicSchema` aceitar `clinicId` ausente (`undefined`) — só um UUID válido ou `null` explícito são aceitos. | P1 | U | ⬜ | `src/schemas/authSchema.ts:110-112` |

## Middleware de autenticação e autorização

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AUT-025 | **DEVE:** recalcular status, vínculo ativo na clínica do token, `Professional` ativo e `Patient` a cada requisição autenticada, em vez de confiar nos papéis gravados no JWT de 8h. | P0 | I | ⬜ | `src/middlewares/auth.ts:71-75`, `src/services/auth/sessionContext.ts:230-268` |
| AUT-026 | **NÃO PODE:** aceitar um token cujo `clinicId` não corresponde mais a nenhum vínculo ativo da conta — 401 `CLINIC_ACCESS_REVOKED`, forçando novo login/troca de clínica. | P0 | I | ⬜ | `src/middlewares/auth.ts:92-98`, `src/services/auth/sessionContext.ts:262` |
| AUT-027 | **NÃO PODE:** aceitar um token emitido antes de `passwordChangedAt` — trocar a senha revoga implicitamente qualquer sessão antiga, mesmo sem *token blocklist*. | P0 | I | ⬜ | `src/middlewares/auth.ts:83-90` |
| AUT-028 | **NÃO PODE:** aceitar como sessão um token que carregue a claim `type` (tokens temporários de cadastro ou de 2FA) — fecha a brecha de `JWT_ACCESS_SECRET === JWT_TEMP_SECRET` permitir usar um token temporário como sessão completa. | P0 | I | ⬜ | `src/middlewares/auth.ts:58-69` |
| AUT-029 | **NÃO PODE:** deixar passar uma requisição cujos papéis recalculados deram vazio (ex.: paciente bloqueado que também perdeu todo vínculo de equipe) — 401. | P0 | I | ⬜ | `src/middlewares/auth.ts:100-103` |
| AUT-030 | **DEVE:** `checkRole` aceitar se QUALQUER papel de `req.userRoles` bate com os permitidos, não só o papel principal `req.userRole`. | P0 | U | ⬜ | `src/middlewares/auth.ts:130-146` |
| AUT-031 | **NÃO PODE:** `checkSameClinic` deixar passar quando não há `req.clinicId` (sessão de paciente) ou quando o `:id` da URL é diferente da clínica ativa do token — o id da URL nunca é fonte de verdade sobre o tenant. | P0 | U | ⬜ | `src/middlewares/auth.ts:160-174` |
| AUT-032 | **NÃO PODE:** `tempRegistrationAuth` aceitar um token que não seja assinado com escopo de cadastro (`verifyTempRegistrationToken` recusa `scope` diferente de `register_complete`). | P0 | U | ⬜ | `src/middlewares/auth.ts:180-200`, `src/utils/jwtUtils.ts:173-175` |

## Tokens JWT e segredos

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AUT-033 | **DEVE:** token de sessão expirar em 8h e ser assinado com `JWT_ACCESS_SECRET` (com *fallback* documentado a `JWT_SECRET`). | P1 | U | ⬜ | `src/utils/jwtUtils.ts:54,69` |
| AUT-034 | **DEVE:** token temporário de cadastro (`temp_registration`) expirar em 30 min e só ser aceito com `scope: "register_complete"`. | P0 | U | ⬜ | `src/utils/jwtUtils.ts:138-155,162-178` |
| AUT-035 | **DEVE:** token de 2FA pendente (`two_factor_pending`) expirar em 5 min e ser recusado se o `type` decodificado não bater. | P0 | U | ⬜ | `src/utils/jwtUtils.ts:184-204,209-228` |
| AUT-036 | **NÃO PODE:** subir em produção (`NODE_ENV=production`) com `JWT_ACCESS_SECRET` ausente, igual a `JWT_TEMP_SECRET`, ou menor que o tamanho mínimo exigido. | P0 | I | ⬜ | `src/config/env.ts:61-95` |

## Redefinição de senha e troca de e-mail

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AUT-037 | **NÃO PODE:** `ForgotPasswordService` revelar se um e-mail existe ou está ativo — sempre responde com sucesso genérico, mesmo sem enviar nada. | P0 | I | ⬜ | `src/services/auth/passwordResetService.ts:23-26` |
| AUT-038 | **DEVE:** token de redefinição de senha expirar em 15 min e nunca ser comparável em texto claro — só o hash bcrypt fica salvo, comparado um a um contra os candidatos com token não expirado. | P0 | I | ⬜ | `src/services/auth/passwordResetService.ts:29-35,62-88` |
| AUT-039 | **DEVE:** ao redefinir a senha, gravar `passwordChangedAt` (revoga sessões antigas via AUT-027) e apagar o token de reset — uso único. | P0 | I | ⬜ | `src/services/auth/passwordResetService.ts:96-107` |
| AUT-040 | **NÃO PODE:** alterar `User.email` no pedido de troca — o e-mail atual continua sendo o login válido até a confirmação, que só acontece a partir de um clique no e-mail NOVO. | P0 | I | ⬜ | `src/services/auth/emailChangeService.ts:20-22,68-75` |
| AUT-041 | **NÃO PODE:** confirmar a troca de e-mail para um endereço que outra conta tomou entre o pedido e a confirmação (checagem de corrida) — 409. | P0 | I | ⬜ | `src/services/auth/emailChangeService.ts:140-149` |
| AUT-042 | **NÃO PODE:** aceitar um token de confirmação de e-mail expirado ou sem `pendingEmail` associado. | P0 | I | ⬜ | `src/services/auth/emailChangeService.ts:130-138` |

## Limitação de taxa (rate limiting)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AUT-043 | **DEVE:** limitar login a 5 tentativas por CONTA (chave = e-mail normalizado, não IP) em 15 min, para uma senha errada não travar toda uma clínica atrás do mesmo IP público. | P0 | I | ⬜ | `src/middlewares/rateLimiters.ts:30-40` |
| AUT-044 | **DEVE:** limitar `/auth/2fa/validate` a 5 tentativas em 15 min por conta (chave = `userId` decodificado do `tempToken`) — sem isso, um OTP de 6 dígitos é forçável por *brute force* dentro da janela de 10 min de validade. | P0 | I | ⬜ | `src/middlewares/rateLimiters.ts:64-82` |
| AUT-045 | **DEVE:** limitar `/auth/reset-password` por token de redefinição (não por IP), para não bloquear pessoas diferentes atrás do mesmo IP. | P1 | I | ⬜ | `src/middlewares/rateLimiters.ts:52-62` |

## Notas

- **AUT-007 (risco de manutenção, não é bug confirmado):** `isTwoFactorRequired` (`twoFactorService.ts:33-35`) e `SessionContext.twoFactorRequired` (`sessionContext.ts:192-194`) implementam a MESMA regra em dois lugares, para o login decidir se manda OTP e para a sessão decidir se marca a conta como exigindo 2FA. Hoje os dois batem porque foram escritos juntos, mas nenhum teste garante que continuem batendo se um dos dois mudar sozinho no futuro — o `buildSessionContext` tem teste ("exige 2FA se qualquer clínica da conta exigir"), o `isTwoFactorRequired` não. Ao implementar os testes desta área, vale um teste que cubra `isTwoFactorRequired` diretamente, e idealmente unificar as duas em uma função só.
- **AUT-036 (❓ P-AUT-01):** `env.ts` só transforma "segredos JWT iguais" em erro fatal quando `NODE_ENV=production`; em desenvolvimento/teste vira aviso (`warnings.push`, não `errors.push` — `src/config/env.ts:74-81`). Isso é mitigado em runtime pelo `authMiddleware` recusar tokens com claim `type` (AUT-028), mas um ambiente de *staging* rodando sem `NODE_ENV=production` ficaria exposto sem aviso forte. Ver [pergunta P-AUT-01](99-perguntas-em-aberto.md).
- **Fora do escopo desta lista (não é bug, é decisão já registrada no código):** `sessionTimeoutMinutes` (política de "encerrar sessão por inatividade" da clínica) não é aplicada como *expiresIn* do JWT — o comentário em `loginService.ts:89-94` explica que o token sempre dura 8h e quem aplica o timeout de inatividade é o cliente (contador no frontend). Não há *refresh token* no projeto. Ver [pergunta P-AUT-02](99-perguntas-em-aberto.md) sobre reforçar isso no servidor.
- **Suspeita não incluída como regra (baixa severidade, a confirmar se vale a pena corrigir):** `ResendOtpService.execute` (`twoFactorService.ts:81-106`) seleciona o usuário sem o campo `status` e não checa `UserStatus.ACTIVE` antes de reenviar o OTP — só `ValidateOtpService` faz essa checagem (AUT-013). Na prática o pior caso é um e-mail de OTP reenviado para uma conta que foi desativada entre o login e o reenvio; a validação final ainda barra a sessão. Não afeta nenhuma regra de acesso listada acima.
- **`generateRefreshToken` (`jwtUtils.ts:111-129`)** existe mas não é chamado por nenhuma rota ou serviço no repositório atual (não há fluxo de *refresh token*) — código morto, não uma regra a testar.
