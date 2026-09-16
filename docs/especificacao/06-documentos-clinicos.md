# Documentos clínicos — especificação de comportamento

> Parte da especificação da API (ver [README](README.md)). Legenda: prioridade P0/P1/P2 · camada U/I/C/E2E · status ✅ testado · ⬜ sem teste · ⚠ bug confirmado · ❓ decisão pendente.

## Escopo

Ciclo de vida do prontuário eletrônico (`Document`): criação em rascunho, edição, finalização, conclusão da consulta (envio), adendo, exclusão, visualização/listagem por papel, impressão, verificação de integridade e anexos. Esta é, junto com [05-agendamentos.md](05-agendamentos.md), a área com mais bugs confirmados — três deles envolvem vazamento de dados (`internalNotes` e PII) e um impede que uma segunda clínica emita documentos.

## Criação e numeração

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| DOC-001 | **DEVE:** criar documento só em consulta `IN_PROGRESS`, na clínica ativa, pelo PROFISSIONAL da própria consulta — nasce `DRAFT`, versão 1. | P1 | I | ⬜ | `src/services/documents/createDocumentService.ts:24-41` |
| DOC-002 | **DEVE:** gerar `documentNumber` sequencial por clínica e ano (`DocumentCounter`, upsert + increment numa transação com lock). | P1 | I | ⬜ | `src/repository/documentRepository.ts:151-171` |
| DOC-003 | **NÃO PODE:** `Document.documentNumber` ser `@unique` GLOBALMENTE enquanto o contador que o gera (`DocumentCounter`) é isolado por `(clinicId, year)` — toda clínica recomeça a sequência em `DOC-{ano}-00001`; o primeiro documento do ano de uma SEGUNDA clínica colide com o primeiro documento já existente de outra clínica e falha com erro de unicidade (P2002) sem tratamento específico. | P0 | I | ⚠ | `prisma/schema.prisma:1049,1098` |
| DOC-004 | **NÃO PODE:** o ano do número do documento vir do relógio do SERVIDOR (`new Date().getFullYear()`) em vez de um horário com fuso definido — só importa perto da virada do ano. | P2 | I | ⬜ | `src/repository/documentRepository.ts:152` |
| DOC-005 | **DEVE:** gravar `internalNotes` só a partir do que o profissional escreveu — não existe rota de criação de documento para o paciente. | P1 | I | ⬜ | `src/services/documents/createDocumentService.ts:54` |
| DOC-006 | **DEVE:** auditar (`CREATED`) toda criação de documento, com o `documentNumber` gerado. | P2 | I | ⬜ | `src/services/documents/createDocumentService.ts:62-77` |

## Edição

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| DOC-007 | **NÃO PODE:** editar um documento fora de uma consulta `IN_PROGRESS`, mesmo que o documento esteja `DRAFT` ou `FINALIZED`. | P0 | I | ⬜ | `src/services/documents/updateDocumentService.ts:33-38` |
| DOC-008 | **NÃO PODE:** editar um documento `SENT` ou `ADDENDUM` — imutáveis após o envio. | P0 | I | ⬜ | `src/services/documents/updateDocumentService.ts:40-45` |
| DOC-009 | **NÃO PODE:** editar um documento que não foi criado pelo próprio profissional — 403 auditado como `EDIT_DENIED`. | P0 | I | ⬜ | `src/services/documents/updateDocumentService.ts:47-59` |
| DOC-010 | **DEVE:** cada edição incrementar `version` e auditar `EDITED`, com o conteúdo anterior no log. | P1 | I | ⬜ | `src/services/documents/updateDocumentService.ts:61-89` |

## Finalização e validação de conteúdo

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| DOC-011 | **NÃO PODE:** finalizar um documento que não está `DRAFT`, fora de consulta `IN_PROGRESS`, ou que não foi criado pelo profissional que está finalizando. | P0 | I | ⬜ | `src/services/documents/finalizeDocumentService.ts:32-50` |
| DOC-012 | **NÃO PODE:** finalizar um documento `CONTROLLED_PRESCRIPTION` (receita controlada) com conteúdo incompleto, mesmo com `acknowledgeIncomplete: true` — é o único tipo sem override permitido. | P0 | I | ⬜ | `src/services/documents/finalizeDocumentService.ts:52-69`, `src/schemas/documentContentSchemas.ts:195` |
| DOC-013 | **DEVE:** para os demais tipos, permitir finalizar incompleto só com `acknowledgeIncomplete: true`, registrando os campos faltantes na auditoria. | P1 | I | ⬜ | `src/services/documents/finalizeDocumentService.ts:63-71,86-89` |
| DOC-014 | **DEVE:** revalidar o conteúdo pelo schema do TIPO do documento (`DOCUMENT_CONTENT_SCHEMAS`), nunca por um schema genérico. | P1 | I | ⬜ | `src/services/documents/finalizeDocumentService.ts:52-58` |
| DOC-015 | **NÃO PODE:** `ConcludeAppointmentService` deixar um documento `CONTROLLED_PRESCRIPTION` incompleto virar `SENT` — revalida de novo no momento da conclusão, fechando a brecha de ele ter sido finalizado antes desta checagem existir. | P0 | I | ⬜ | `src/services/documents/concludeAppointmentService.ts:48-70` |

## Exclusão

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| DOC-016 | **NÃO PODE:** excluir um documento `SENT` ou `ADDENDUM` — só `DRAFT` ou `FINALIZED`. | P0 | I | ⬜ | `src/services/documents/deleteDocumentService.ts:32-36` |
| DOC-017 | **NÃO PODE:** excluir fora de uma consulta `IN_PROGRESS`. | P0 | I | ⬜ | `src/services/documents/deleteDocumentService.ts:25-30` |
| DOC-018 | **NÃO PODE:** excluir um documento que não foi criado pelo profissional que está excluindo — 403 auditado como `DELETE_DENIED`. | P0 | I | ⬜ | `src/services/documents/deleteDocumentService.ts:38-49` |
| DOC-019 | **DEVE:** a exclusão ser lógica (`deletedAt`), preservando o conteúdo para auditoria/integridade — nunca `DELETE` físico. | P1 | I | ⬜ | `src/services/documents/deleteDocumentService.ts:51,65-66`, `src/repository/documentRepository.ts:136-144` |

## Conclusão da consulta (envio dos documentos)

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| DOC-020 | **NÃO PODE:** concluir uma consulta que não está `IN_PROGRESS`, de outra clínica, ou por quem não é o profissional dela. | P0 | I | ⬜ | `src/services/documents/concludeAppointmentService.ts:26-40` |
| DOC-021 | **DEVE:** mover TODOS os documentos `FINALIZED` da consulta para `SENT`, gravando `integrityHash`, na MESMA transação que muda a consulta para `COMPLETED`. | P0 | I | ⬜ | `src/services/documents/concludeAppointmentService.ts:72-100` |
| DOC-022 | **NÃO PODE:** um documento ainda `DRAFT` na hora de concluir a consulta ser perdido num limbo — hoje ele continua `DRAFT` para sempre: a consulta deixa de estar `IN_PROGRESS`, então `UpdateDocumentService`/`FinalizeDocumentService`/`DeleteDocumentService` (todos exigem `IN_PROGRESS`) não conseguem mais tocá-lo, e ele nunca é enviado. | P1 | I | ❓ | `src/services/documents/concludeAppointmentService.ts:42-46,131-135` |
| DOC-023 | **DEVE:** auditar `CONCLUDED` (consulta) e `SENT` (cada documento enviado) separadamente. | P2 | I | ⬜ | `src/services/documents/concludeAppointmentService.ts:102-122` |
| DOC-024 | **DEVE:** devolver ao profissional a lista de documentos enviados e a de rascunhos que ficaram para trás, para ele saber o que não foi ao paciente. | P2 | I | ⬜ | `src/services/documents/concludeAppointmentService.ts:124-136` |

## Adendo

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| DOC-025 | **NÃO PODE:** criar adendo numa consulta que não está `COMPLETED`/`COMPLETED_WITH_ADDENDUM`, de outra clínica, ou por quem não é o profissional dela. | P0 | I | ⬜ | `src/services/documents/createAddendumService.ts:23-45` |
| DOC-026 | **NÃO PODE:** referenciar como `originalDocumentId` um documento de OUTRA consulta. | P1 | I | ⬜ | `src/services/documents/createAddendumService.ts:48-58` |
| DOC-027 | **NÃO PODE:** referenciar como `originalDocumentId` um documento ainda em `DRAFT` (nunca finalizado nem enviado) — hoje só confere que existe e é da mesma consulta, não o status do original. | P2 | I | ⚠ | `src/services/documents/createAddendumService.ts:48-58` |
| DOC-028 | **NÃO PODE:** criar adendo `CONTROLLED_PRESCRIPTION` incompleto, mesmo com `acknowledgeIncomplete`. | P0 | I | ⬜ | `src/services/documents/createAddendumService.ts:60-76` |
| DOC-029 | **DEVE:** gravar o adendo já com `integrityHash` (nunca passa por `DRAFT`) e mudar a consulta para `COMPLETED_WITH_ADDENDUM`. | P1 | I | ⬜ | `src/services/documents/createAddendumService.ts:78-109` |
| DOC-030 | **NÃO PODE:** o hash de integridade de um ADENDO dar falso-negativo ("não íntegro") por causa da ordem das chaves do JSON — `CreateAddendumService` calcula o hash sobre `input.content` (o objeto ainda não persistido, na ordem em que chegou), mas `VerifyIntegrityService` recalcula sobre o valor já lido de volta do banco (JSONB), e o Postgres não preserva a ordem original das chaves de um `jsonb`; as duas serializações podem divergir sem que o conteúdo tenha mudado. (`ConcludeAppointmentService`, que gera o hash de documentos `SENT` comuns, não tem esse problema porque calcula o hash sobre o valor JÁ lido do banco — a mesma leitura que a verificação usará depois.) | P1 | I | ⚠ | `src/services/documents/createAddendumService.ts:82`, `src/services/documents/verifyIntegrityService.ts:25`, `src/utils/hashUtils.ts:7-9` |

## Visualização e listagem por papel

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| DOC-031 | **NÃO PODE:** visualizar ou listar documentos de uma consulta sem um papel resolvido por `resolveAppointmentRole` — 403. | P0 | I | ⬜ | `src/services/documents/viewDocumentService.ts:69-83`, `src/services/documents/listDocumentsService.ts:31-45` |
| DOC-032 | **NÃO PODE:** `PATIENT` visualizar ou listar documentos de uma consulta que não é sua, mesmo com o papel `PATIENT` na sessão — 403 auditado (`VIEW_DENIED`/`ACCESS_DENIED`). | P0 | I | ⬜ | `src/services/documents/viewDocumentService.ts:89-99`, `src/services/documents/listDocumentsService.ts:51-62` |
| DOC-033 | **NÃO PODE:** `PATIENT` ver ou listar documento fora de `SENT`/`ADDENDUM` — nunca vê `DRAFT`/`FINALIZED`. | P0 | I | ⬜ | `src/services/documents/viewDocumentService.ts:100-103`, `src/services/documents/listDocumentsService.ts:87-90` |
| DOC-034 | **NÃO PODE:** `ADMIN`/`RECEPTIONIST` ver o detalhe de um documento fora de `SENT`/`ADDENDUM` — mesma regra do paciente. | P0 | I | ⬜ | `src/services/documents/viewDocumentService.ts:115-119` |
| DOC-035 | **DEVE:** `PROFESSIONAL` ver TODOS os documentos da própria consulta, incluindo `DRAFT`. | P1 | I | ⬜ | `src/services/documents/listDocumentsService.ts:82-84` |
| DOC-036 | **NÃO PODE:** um `PROFESSIONAL` que não é o da consulta visualizar o documento — 403 auditado; aqui a regra de posse É aplicada corretamente (compare com AGE-050, onde a mesma checagem falta). | P0 | I | ⬜ | `src/services/documents/viewDocumentService.ts:104-114` |
| DOC-037 | **NÃO PODE:** `ViewDocumentService` ou `ListDocumentsService` incluir `internalNotes` na resposta para `PATIENT`, `ADMIN` ou `RECEPTIONIST` — o campo ("Observações internas", pensado para o profissional) vai junto porque nenhum dos dois serviços usa `select` para excluí-lo: ambos devolvem o registro inteiro do Prisma (`{...document}` na visualização; o array cru de `findByAppointmentId` na listagem). | P0 | I | ⚠ | `src/services/documents/viewDocumentService.ts:17,138-139`, `src/services/documents/listDocumentsService.ts:79,88-90`, `src/repository/documentRepository.ts:36-63,82-90` |
| DOC-038 | **DEVE:** toda visualização bem-sucedida gerar auditoria `VIEWED`, sempre na clínica DA CONSULTA (não a clínica ativa da sessão, que pode ser outra quando quem acessa é o paciente). | P1 | I | ⬜ | `src/services/documents/viewDocumentService.ts:85-87,122-128` |

## Impressão

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| DOC-039 | **NÃO PODE:** imprimir um documento `DRAFT`. | P0 | I | ⬜ | `src/services/documents/printDocumentService.ts:31-36` |
| DOC-040 | **NÃO PODE:** um `PROFESSIONAL` que não é o da consulta imprimir o documento. | P0 | I | ⬜ | `src/services/documents/printDocumentService.ts:62-65` |
| DOC-041 | **NÃO PODE:** `ADMIN`/`RECEPTIONIST` imprimir um documento `FINALIZED` que ainda não foi enviado (`SENT`) — a impressão só bloqueia `DRAFT` (DOC-039), então um documento que a tela de VISUALIZAÇÃO já nega a `ADMIN`/`RECEPTIONIST` por não estar `SENT`/`ADDENDUM` (DOC-034) pode ser impresso mesmo assim pela rota de impressão. | P1 | I | ⚠ | `src/services/documents/printDocumentService.ts:31-36,62-68` vs `src/services/documents/viewDocumentService.ts:115-119` |

## Integridade

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| DOC-042 | **NÃO PODE:** verificar a integridade de um documento de OUTRA clínica — 403; a checagem inclui documentos já EXCLUÍDOS (soft delete), de propósito. | P0 | I | ⬜ | `src/services/documents/verifyIntegrityService.ts:8-16`, `src/repository/documentRepository.ts:65-80` |
| DOC-043 | **NÃO PODE:** verificar a integridade de um documento que nunca foi enviado (sem `integrityHash`) — 400. | P1 | I | ⬜ | `src/services/documents/verifyIntegrityService.ts:18-23` |

## Anexos

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| DOC-044 | **NÃO PODE:** anexar ou remover um arquivo de um documento de OUTRA clínica, ou já excluído (`deletedAt`). | P0 | I | ⬜ | `src/services/documents/uploadAttachmentService.ts:19-31`, `src/services/documents/deleteAttachmentService.ts:13-25` |
| DOC-045 | **NÃO PODE:** anexar ou remover arquivo de um documento já `SENT`/`ADDENDUM` (enviado ao paciente) — nenhum dos dois serviços checa `document.status`. | P1 | I | ⚠ | `src/services/documents/uploadAttachmentService.ts:19-31`, `src/services/documents/deleteAttachmentService.ts:13-25` |
| DOC-046 | **NÃO PODE:** um membro da equipe que NÃO é o autor do documento anexar ou remover arquivos dele sem nenhuma checagem de autoria nem auditoria própria da ação — hoje qualquer `PROFESSIONAL`, `ADMIN` ou `RECEPTIONIST` da clínica pode. | P1 | I | ⚠ | `src/services/documents/uploadAttachmentService.ts`, `src/services/documents/deleteAttachmentService.ts`, `src/routes/document.routes.ts:126-145` |
| DOC-047 | **NÃO PODE:** excluir um anexo deixar de remover de fato o arquivo do Cloudinary — `storedName` guarda a URL pública do Cloudinary, mas `DeleteAttachmentService` tenta apagar um caminho LOCAL (`src/uploads/documents/<storedName>`) que nunca existe; o `unlinkSync` falha silenciosamente (`catch` vazio) e só o REGISTRO no banco é removido — o arquivo enviado continua acessível pela URL antiga indefinidamente. | P2 | I | ⚠ | `src/services/documents/deleteAttachmentService.ts:36-49` |
| DOC-048 | **NÃO PODE:** o download de um anexo (`GET .../attachments/:attachmentId/file`) usar só `resolveAppointmentRole(...) !== null` como critério de acesso — mesma falha de posse de AGE-050/DOC-036: um `PROFESSIONAL` que não é o da consulta baixa o anexo de um colega da mesma clínica. | P0 | I | ⚠ | `src/routes/document.routes.ts:196-210` |
| DOC-049 | **NÃO PODE:** o download de anexo ignorar o STATUS do documento (baixa anexo de documento `DRAFT`, mesmo para quem só poderia ver `SENT`/`ADDENDUM` na tela normal) nem o `deletedAt` do documento (anexo de documento excluído continua baixável pela URL direta). | P0 | I | ⚠ | `src/routes/document.routes.ts:165-224` |
| DOC-050 | **DEVE:** limitar o upload de anexo a 5 MB por arquivo. | P2 | I | ⬜ | `src/routes/document.routes.ts:126-132` |

## Notas

- **DOC-003 (⚠ P0):** já era conhecido antes desta especificação; reconfirmado nesta rodada com a leitura de `generateDocumentNumber` e da linha exata do schema. É o bug de maior impacto operacional desta área — qualquer clínica que não seja a primeira a emitir um documento no ano trava na primeira tentativa. Correção sugerida (fora do escopo de documentação): trocar `@unique` por `@@unique([clinicId, documentNumber])`, ou incluir o `clinicId`/uma parte dele no próprio número.
- **DOC-037 (⚠ P0):** também já era suspeitado antes desta especificação só para a tela de visualização; esta rodada CONFIRMOU que a mesma falha existe na LISTAGEM (`ListDocumentsService`) — o array inteiro devolvido por `findByAppointmentId` nunca teve `internalNotes` removido. Recomenda-se um único ponto de "sanitização por papel" (função pura, testável) reaproveitado pelos três serviços de leitura (view/list/print), em vez de cada um decidir sozinho o que devolver.
- **DOC-048/DOC-049 (⚠ P0):** mesma classe de falha de AGE-050 (`GetAppointmentByIdService`) — `resolveAppointmentRole` foi desenhado para devolver um papel não-nulo mesmo quando a posse específica falha (documentado no próprio comentário da função, ver [05-agendamentos.md](05-agendamentos.md)), esperando que quem a chama complete a checagem. Três consumidores diferentes (`GetAppointmentByIdService`, e aqui a rota de download de anexo) tratam o retorno não-nulo como "acesso liberado", sem completar a checagem de posse nem de status. Recomenda-se, ao implementar os testes, cobrir os três casos com a MESMA bateria de cenários (profissional dono / colega / paciente dono / paciente de outra consulta / equipe de outra clínica) para não haver um quarto lugar com a mesma lacuna.
- **DOC-022 (❓ P-DOC-01):** ver [pergunta em aberto](99-perguntas-em-aberto.md) — o que deveria acontecer com um documento `DRAFT` esquecido quando a consulta é concluída? Descartar automaticamente, permitir editá-lo depois (reabrindo uma janela de edição sem a consulta estar `IN_PROGRESS`), ou é aceitável que fique como um rascunho morto (nunca visto pelo paciente, mas também nunca removido)?
- **Relação com outras áreas:** a resolução de papel usada em toda esta área (`resolveAppointmentRole`) é compartilhada com agendamentos — ver [05-agendamentos.md](05-agendamentos.md) para o caso análogo em `GetAppointmentByIdService`, e [02-conta-unificada-vinculos.md](02-conta-unificada-vinculos.md) para as regras gerais de isolamento entre clínicas.
