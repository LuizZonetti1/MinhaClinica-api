# Validações e utilitários — especificação de comportamento

> Parte da especificação da API (ver [README](README.md)). Legenda: prioridade P0/P1/P2 · camada U/I/C/E2E · status ✅ testado · ⬜ sem teste · ⚠ bug confirmado · ❓ decisão pendente.

## Escopo

Funções puras (`src/utils/*`), os middlewares transversais (`validate`, `checkRole`, `checkSameClinic`, `handleControllerError`) e as famílias de schemas Yup que protegem as rotas. A maior parte desta área é testável sem banco (camada U) — é onde o retorno por linha de teste é mais alto. Regras já detalhadas em outros arquivos (transições de status, duração de consulta, `checkRole`/`checkSameClinic`, `env.ts`) não são repetidas aqui — só referenciadas.

## Documentos de identidade (CPF, CNPJ, CEP)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| VAL-001 | **DEVE:** `validateCPF` calcular os dois dígitos verificadores pelo algoritmo oficial, aceitando o valor com ou sem máscara. | P1 | U | ⬜ | `src/utils/validateCPF.ts:6-33` |
| VAL-002 | **NÃO PODE:** `validateCPF` aceitar uma sequência de 11 dígitos iguais (ex.: `111.111.111-11`) — matematicamente passaria no dígito verificador. | P1 | U | ⬜ | `src/utils/validateCPF.ts:12` |
| VAL-003 | **DEVE:** `validateCNPJ` calcular os dois dígitos verificadores pelo algoritmo oficial (pesos diferentes para cada dígito), aceitando com ou sem máscara. | P1 | U | ⬜ | `src/utils/validateCNPJ.ts:9-38` |
| VAL-004 | **NÃO PODE:** `validateCNPJ` aceitar uma sequência de 14 dígitos iguais. | P1 | U | ⬜ | `src/utils/validateCNPJ.ts:32` |
| VAL-005 | **NÃO PODE:** `validateCep` aceitar um valor com menos ou mais de 8 dígitos. | P1 | U | ⬜ | `src/utils/validateCep.ts:12-13` |
| VAL-006 | **DEVE:** `validateCep` aceitar QUALQUER CEP de 8 dígitos fora de produção (`NODE_ENV !== "production"`), sem consultar a API externa (ViaCEP) — essencial para os testes de integração rodarem sem rede. | P1 | U | ⬜ | `src/utils/validateCep.ts:3,14` |
| VAL-007 | **NÃO PODE:** uma falha da API externa (ViaCEP) bloquear um cadastro em produção — em caso de erro/timeout, `validateCep` aceita o CEP mesmo sem confirmar que existe. | P2 | U | ⬜ | `src/utils/validateCep.ts:21-24` |
| VAL-008 | **DEVE:** `validateCep` aceitar valor vazio/nulo como válido — o campo é opcional em vários formulários; quem exige o CEP faz isso no schema do formulário, não aqui. | P2 | U | ⬜ | `src/utils/validateCep.ts:11` |

## Sanitização e escape de HTML

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| VAL-009 | **DEVE:** `stripHtmlTags` remover qualquer sequência `<...>` e aparar espaços — usado em campos que NUNCA deveriam ter markup (nome, título, motivo de bloqueio, feriado). | P1 | U | ⬜ | `src/utils/sanitizeText.ts:7-9` |
| VAL-010 | **NÃO PODE:** `stripHtmlTags` ser usado em conteúdo clínico (observações, prescrição, comentários) — mutilaria texto médico legítimo que contenha `<`/`>` (ex.: "PA < 120x80"); a proteção correta nesses campos é escapar na SAÍDA. | P1 | U | ⬜ | `src/utils/sanitizeText.ts:1-6` (comentário) |
| VAL-011 | **DEVE:** `escapeHtml` converter `&`, `<`, `>`, `"` e `'` para as entidades correspondentes, e converter `null`/`undefined` para string vazia (nunca para `"null"`/`"undefined"` literal). | P1 | U | ⬜ | `src/utils/escapeHtml.ts:7-15` |
| VAL-012 | **NÃO PODE:** `escapeHtml` ser usado para sanitizar dado exibido pelo React (o React já escapa) — é só para saídas fora do React: e-mails, PDF em HTML. | P2 | U | ⬜ | `src/utils/escapeHtml.ts:1-6` (comentário) |
| VAL-013 | **DEVE:** todo template de e-mail que interpola dado do usuário (nome, mensagem de comunicado, motivo) usar `escapeHtml` — o e-mail é HTML renderizado pelo cliente de e-mail do destinatário, fora da proteção do React. | P0 | I | ❓ | `src/services/email/authEmailService.ts`, `src/services/email/emailService.ts` |

## Tokens, hashes e segredos

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| VAL-014 | **DEVE:** todo token enviado por e-mail (verificação, redefinição de senha, convite, ativação) ser aleatório (`crypto.randomBytes`) e guardado no banco só como hash SHA-256 — nunca em texto claro. | P0 | U | ⬜ | `src/utils/verificationTokenUtils.ts:8-10,60-62` |
| VAL-015 | **DEVE:** `isTokenExpired` comparar contra o relógio no momento da chamada, sem tolerância — um token expira no segundo exato da sua validade. | P1 | U | ⬜ | `src/utils/verificationTokenUtils.ts:50-52` |
| VAL-016 | **DEVE:** convites de equipe e ativação de paciente pela recepção expirarem em exatamente 48 horas — existe uma constante dedicada (`INVITE_EXPIRATION_MINUTES`) por causa de um bug histórico já corrigido (quatro chamadas passavam `48` como se fosse minutos, e o link morria em 48 minutos em vez de 48 horas). | P1 | U | ⬜ | `src/utils/verificationTokenUtils.ts:80-87` |
| VAL-017 | **NÃO PODE:** `checkEnv` deixar o processo subir em produção sem `DATABASE_URL`, `JWT_ACCESS_SECRET` ou `JWT_TEMP_SECRET` — ver AUT-036 para o caso específico dos dois segredos JWT iguais. | P0 | U | ⬜ | `src/config/env.ts:33-67` |
| VAL-018 | **NÃO PODE:** `checkEnv` deixar o processo subir sem `NODE_ENV` definido — sem ele `app.ts` assume modo desenvolvimento e libera CORS para qualquer origem com `credentials: true` (comentário do próprio arquivo descreve o incidente que motivou esta checagem). | P0 | U | ⬜ | `src/config/env.ts:8-12,40-50` |
| VAL-019 | **NÃO PODE:** `checkEnv` exigir `FRONTEND_URL` fora de produção — só é obrigatória quando `NODE_ENV=production` (é a única origem liberada pelo CORS e a base dos links de e-mail). | P1 | U | ⬜ | `src/config/env.ts:97-99` |
| VAL-020 | **DEVE:** `maskEmail` (usado em convites e confirmação de clínica) preservar só os 2 primeiros caracteres do usuário do e-mail e o domínio inteiro, substituindo o resto por asteriscos. | P2 | U | ⬜ | `src/services/invites/inviteService.ts:38-43` |

## Middlewares transversais

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| VAL-021 | **DEVE:** `validate(schema)` remover campos desconhecidos do corpo (`stripUnknown`) em vez de rejeitar a requisição — um cliente antigo mandando um campo removido não quebra. | P1 | U | ⬜ | `src/middlewares/validation.ts` |
| VAL-022 | **NÃO PODE:** `validate(schema)` deixar passar um corpo inválido — 400 com `details[]` listando cada campo e mensagem. | P0 | U | ⬜ | `src/middlewares/validation.ts` |
| VAL-023 | **NÃO PODE:** `checkRole`/`checkSameClinic` terem comportamento coberto aqui de novo — ver AUT-030/AUT-031. | — | — | — | `src/middlewares/auth.ts` |
| VAL-024 | **NÃO PODE:** `handleControllerError` expor a mensagem de um erro sem `statusCode` (ou com `statusCode >= 500`) ao cliente — sempre usa a mensagem GENÉRICA passada pelo controller (`fallbackMessage`), nunca `error.message`, porque erros sem `statusCode` são tratados como inesperados (Prisma, `TypeError`) e podem conter caminho de arquivo ou nome de tabela. | P0 | U | ⬜ | `src/utils/controllerUtils.ts:21-29,61-65,81-84` |
| VAL-025 | **DEVE:** `handleControllerError` expor `error.message` (e `code`/`action`/`errors`, se houver) quando o erro tem `statusCode < 500` — é o contrato que TODO service usa para devolver uma mensagem amigável ao cliente (`Object.assign(new Error("..."), { statusCode: ... })`). | P0 | U | ⬜ | `src/utils/controllerUtils.ts:36-59` |
| VAL-026 | **NÃO PODE:** um service que ESQUECE de anexar `statusCode` a um erro "amigável" comunicar essa mensagem ao cliente — ela é descartada silenciosamente e vira 500 genérico. Ver casos JÁ CONFIRMADOS: CFG-018 (`updateClinicService`/`clinicSettingsService`, CNPJ/e-mail duplicado) e PAC-019 (`getPatientsService`, "paciente não encontrado"). | P1 | I | ⚠ | `src/utils/controllerUtils.ts:30-40` |
| VAL-027 | **NÃO PODE:** um erro do SDK do Cloudinary (que carrega `http_code`, não `statusCode`) ser tratado como "inesperado" quando na verdade a causa é o próprio usuário (ex.: arquivo inválido) — `getCloudinaryHttpCode` traduz esse formato para decidir entre 400 (erro do usuário) e 500 (erro interno), sem vazar o motivo interno do Cloudinary. | P2 | U | ⬜ | `src/utils/controllerUtils.ts:9-19,67-79` |

## Regras puras de domínio (papéis e prioridade)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| VAL-028 | **DEVE:** `ROLE_PRIORITY` ordenar sempre `ADMIN > RECEPTIONIST > PROFESSIONAL > PATIENT`, usado para escolher o papel "principal" e ordenar `roles[]` em toda a base (sessão, menu, redirecionamento). | P0 | U | ⬜ | `src/utils/roles.ts:11-16` |
| VAL-029 | **DEVE:** `sortRoles` remover duplicatas e ordenar pela prioridade acima, sem depender da ordem de entrada. | P1 | U | ⬜ | `src/utils/roles.ts:20-21` |
| VAL-030 | **DEVE:** `isStaffRole`/`hasStaffRole` considerarem só `ADMIN`, `RECEPTIONIST` e `PROFESSIONAL` como papéis de equipe — `PATIENT` nunca é "staff", mesmo sendo um papel válido de sessão. | P0 | U | ✅ | `src/utils/roles.ts:4-8,18,24-25` (coberto indiretamente por `deriveRoles`, ver `sessionContext.test.ts`) |
| VAL-031 | **NÃO PODE:** as regras de transição de status de consulta serem redefinidas fora da matriz única (`ALLOWED_APPOINTMENT_TRANSITIONS`) — ver AGE-029; citada aqui só para lembrar que é candidata natural a teste unitário puro, sem banco. | — | U | — | `src/services/appointments/appointmentTransitions.ts` |
| VAL-032 | **NÃO PODE:** a resolução de duração de consulta (`resolveAppointmentDuration`) ser recalculada de outra forma em algum ponto do código — ver AGE-007; mesma observação de VAL-031. | — | U | — | `src/utils/resolveAppointmentDuration.ts` |
| VAL-033 | **DEVE:** `toRegistrationStatus` (usado nas listagens de profissional/recepção) mapear cada `UserStatus` para exatamente um rótulo de tela (`INVITE_SENT`, `EMAIL_VERIFIED`, `COMPLETED`, `INACTIVE`, `BLOCKED`, `UNKNOWN` como fallback nunca deveria ocorrer em dado real). | P2 | U | ⬜ | `src/services/professionals/professionalManagementService.ts:24-31` |
| VAL-034 | **DEVE:** `isApiRequest` (decide se o link de verificação clicado responde JSON ou faz *redirect* de navegador) reconhecer `Accept: application/json`, `X-Requested-With: XMLHttpRequest` ou a presença de `Origin` como chamada de API. | P2 | U | ⬜ | `src/utils/verifyRedirectUtils.ts:28-35` |

## Famílias de schemas Yup — o que aceitam e recusam

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| VAL-035 | **DEVE:** todo schema de e-mail de entrada (login, cadastro, convite) normalizar para minúsculas e sem espaços ANTES de comparar com o banco — evita duas contas para `Fulano@Email.com` e `fulano@email.com`. | P0 | U | ⬜ | `src/schemas/authSchema.ts:8-13`, `src/services/invites/inviteService.ts:36` |
| VAL-036 | **NÃO PODE:** o schema de agendamento do PACIENTE (`createPatientBookingSchema`) aceitar o campo `channel` no corpo — é exatamente a causa raiz de AGE-016 (P0); o valor deveria ser sempre `ONLINE_PORTAL`, decidido pelo servidor, nunca pelo cliente. | P0 | U | ⚠ | `src/schemas/patientBookingSchema.ts:20` |
| VAL-037 | **NÃO PODE:** `announcementSchema.targetRoles` aceitar qualquer string como papel — não usa `.oneOf(Object.values(UserRole))`; um valor fora do enum passa da validação e só falha depois, dentro do Prisma (filtro `roles: { hasSome: [...] }` sobre uma coluna de enum), devolvendo um erro sem `statusCode` que vira 500 (ver VAL-026) em vez de um 400 claro "papel inválido". | P2 | U | ⚠ | `src/schemas/notificationSchema.ts:11-14` |
| VAL-038 | **DEVE:** `acceptInviteSchema`/`registerFromInviteSchema` aceitarem `formations: null` (dados de outra clínica sem formação cadastrada) — já foi bug (rejeitava `null`, quebrando o preenchimento automático do aceite de convite) e está corrigido; o teste desta regra é o que evita a regressão. | P0 | U | ⬜ | `src/schemas/inviteSchema.ts:38-43` |
| VAL-039 | **NÃO PODE:** os campos que só a clínica pode alterar (CPF, e-mail) serem aceitos no `PATCH` de perfil do próprio usuário — `rejectField` recusa QUALQUER valor que não seja `undefined`, inclusive o mesmo valor já salvo. | P0 | U | ⬜ | `src/schemas/profileSchema.ts:16-23,47-49,197-199` |
| VAL-040 | **NÃO PODE:** uma nova senha (`changePasswordSchema`) ter menos de 8 caracteres, nem faltar letra maiúscula, minúscula ou número — mais rígido que o schema de LOGIN (que só confere o mínimo de 6 contra o hash salvo) e que o de CADASTRO (mínimo 8, sem exigência de complexidade); a inconsistência entre "criar senha" e "trocar senha" é intencional ou um esquecimento de reforçar a mesma regra na criação? | P2 | U | ❓ | `src/schemas/profileSchema.ts:205-215`, `src/schemas/authSchema.ts:15-18` |
| VAL-041 | **NÃO PODE:** `paginationSchema` aceitar `limit` acima de 100 nem `page`/`limit` não-inteiros ou menores que 1 — protege contra um `limit` gigante virar um *DoS* acidental de banco. | P1 | U | ⬜ | `src/schemas/paginationSchema.ts:6-18` |
| VAL-042 | **NÃO PODE:** o valor de uma transação ou o preço de um procedimento aceitarem zero, negativo, ou mais de R$ 99.999.999,99 — ver FIN-003/CFG-023; citado aqui como família (o mesmo teto aparece em dois schemas diferentes, candidato a uma constante compartilhada). | — | U | — | `src/schemas/transactionSchema.ts:27-30`, `src/schemas/procedureSchema.ts:17-22` |

## Notas

- **VAL-013 (❓ P-VAL-01):** não foi possível confirmar, dentro do escopo desta especificação, se TODO template de e-mail escapa corretamente valores vindos do usuário (nome do paciente, assunto/mensagem de um comunicado livre, motivo de um bloqueio) antes de interpolar no HTML do e-mail — os arquivos de template (`authEmailService.ts`, `emailService.ts`) são extensos e cada `send*Email` precisaria ser conferido individualmente. Isso é um candidato natural a uma bateria de testes unitários (um por template, verificando que `<script>` num nome vira texto inofensivo no HTML gerado) antes de assumir que está tudo protegido — por isso entra como pergunta/tarefa de verificação, não como bug confirmado nem como ⬜ comum.
- **VAL-026 (⚠, achado transversal):** este não é um bug isolado — é um PADRÃO DE ERRO que se repete: qualquer service novo que use `throw new Error("mensagem amigável")` sem `Object.assign(..., {statusCode})` cai nesta armadilha silenciosamente (o código roda, os testes de "caminho feliz" passam, e só um teste que EXPLICITAMENTE verifica o status HTTP e o corpo da resposta de erro pega o problema). Recomenda-se, ao montar os testes desta especificação, incluir uma verificação genérica (ex.: lint de código ou um teste que varre os `throw new Error` dos services de escrita) além dos casos pontuais já confirmados.
- **VAL-036 (⚠ P0, é a MESMA causa de AGE-016):** listada aqui também porque é, estritamente, uma falha de VALIDAÇÃO DE ENTRADA (o schema aceita um campo que nunca deveria vir do cliente) — a correção mais simples é remover `channel` de `createPatientBookingSchema` e deixar de aceitá-lo do body nesta rota, em vez de (ou além de) corrigir no service.
- **Relação com outras áreas:** praticamente toda regra "P0 NÃO PODE" desta lista tem uma consequência concreta documentada em outro arquivo desta especificação — este é o lugar para testar a REGRA EM ISOLAMENTO (função pura, sem banco), enquanto os outros arquivos testam o EFEITO dela dentro de um fluxo completo.
