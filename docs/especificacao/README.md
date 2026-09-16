# Especificação de comportamento — API

Esta pasta descreve, regra por regra, o que a API do Minha Clínica **deve** fazer e o que **não pode** acontecer — é a base para os testes automatizados que ainda serão escritos. Nenhum arquivo aqui contém teste; é só especificação, escrita lendo o código linha a linha.

## Como ler

Cada regra tem um ID único (ex.: `AGE-016`), começando pelo prefixo da área (tabela abaixo). Uma tabela por seção, sempre com as mesmas colunas:

| ID | Regra | Prioridade | Camada | Status | Onde no código |
|---|---|---|---|---|---|
| AGE-016 | **NÃO PODE:** paciente escolher o canal do próprio agendamento para escapar da política online | P0 | I | ⚠ | `patientCreateAppointmentService.ts:29` |

- **Regra** começa sempre com **DEVE:** ou **NÃO PODE:**.
- **Prioridade** — **P0**: segurança, isolamento entre clínicas, LGPD ou dinheiro. **P1**: regra central do negócio. **P2**: conveniência ou UX.
- **Camada** — **U**: unitário, função pura, sem banco. **I**: integração (API + banco). **C**: componente (web/mobile). **E2E**: fluxo de tela.
- **Status** — ✅ já existe teste cobrindo exatamente a regra (hoje só 9 regras, cobertas pelos 19 testes de `sessionContext.test.ts`/`appointmentAccess.test.ts`). ⬜ sem teste ainda. ⚠ bug confirmado lendo o código — o teste deve nascer FALHANDO contra o comportamento atual. ❓ depende de uma decisão do usuário, listada em [99-perguntas-em-aberto.md](99-perguntas-em-aberto.md). Um punhado de regras usa `—` em prioridade/camada/status: são referências cruzadas a uma regra já descrita em outro arquivo, não uma regra independente.
- **Rastreabilidade:** o nome do teste sempre começa com o ID — `it("AGE-016 — paciente não escolhe o canal do próprio agendamento", ...)`. Um `grep` pelo ID liga a regra ao teste, ao PR que a corrigiu e a esta especificação.

## Índice por área

| Arquivo | Prefixo | Assunto | Regras | P0 | ✅ | ⬜ | ⚠ | ❓ |
|---|---|---|---|---|---|---|---|---|
| [01-autenticacao-sessao.md](01-autenticacao-sessao.md) | AUT | Login, 2FA, sessão por clínica ativa, `authMiddleware`, tokens, redefinição de senha, rate limit | 45 | 31 | 1 | 44 | 0 | 0 |
| [02-conta-unificada-vinculos.md](02-conta-unificada-vinculos.md) | VIN | `ClinicMembership`, papéis por clínica, papéis self-service, desligamento sem apagar conta, bloqueio por faltas | 35 | 26 | 6 | 28 | 0 | 1 |
| [03-convites.md](03-convites.md) | CNV | Convite de equipe: criar, reenviar, cancelar, aceitar (com ou sem conta), recusar | 32 | 17 | 0 | 32 | 0 | 0 |
| [04-cadastro-paciente-clinica.md](04-cadastro-paciente-clinica.md) | CAD | Cadastro público de paciente e de clínica (4 casos), verificação de e-mail | 34 | 20 | 0 | 32 | 2 | 0 |
| [05-agendamentos.md](05-agendamentos.md) | AGE | Criação, conflito, antecedência, horários, status, cancelamento, remarcação, no-show, acesso | 54 | 21 | 1 | 42 | 8 | 3 |
| [06-documentos-clinicos.md](06-documentos-clinicos.md) | DOC | Prontuário: rascunho, edição, finalização, conclusão, adendo, integridade, anexos, visibilidade por papel | 50 | 26 | 0 | 39 | 10 | 1 |
| [07-financeiro-relatorios.md](07-financeiro-relatorios.md) | FIN | Transações manuais, relatório da clínica, exportação em PDF | 24 | 5 | 0 | 15 | 7 | 2 |
| [08-pacientes-recepcao.md](08-pacientes-recepcao.md) | PAC | Cadastro pela recepção, ativação, busca, detalhe clínico, bloqueio/desbloqueio, comentários | 32 | 16 | 0 | 25 | 3 | 4 |
| [09-notificacoes-crons.md](09-notificacoes-crons.md) | NOT | Notificações in-app/e-mail e as 5 rotinas agendadas (lembrete, aniversário, relatório diário, limpeza) | 30 | 8 | 0 | 22 | 7 | 1 |
| [10-clinica-config-procedimentos.md](10-clinica-config-procedimentos.md) | CFG | Configurações da clínica, horário, feriados, procedimentos, bloqueio de agenda | 34 | 8 | 0 | 27 | 5 | 2 |
| [11-validacoes-utilitarios.md](11-validacoes-utilitarios.md) | VAL | Funções puras, middlewares transversais, famílias de schemas Yup | 42 | 13 | 1 | 32 | 3 | 2 |
| **Total** | | | **412** | **191** | **9** | **338** | **45** | **16** |
| [90-bugs-e-riscos.md](90-bugs-e-riscos.md) | BUG | Lista de triagem dos 45 bugs confirmados, por severidade | — | — | — | — | — | — |
| [99-perguntas-em-aberto.md](99-perguntas-em-aberto.md) | — | As 19 perguntas de produto (2 delas — AUT — não têm linha ❓ própria, são notas) | — | — | — | — | — | — |

*Das 412 regras, 4 (`VAL-023`, `VAL-031`, `VAL-032`, `VAL-042`) são referências cruzadas sem prioridade/camada/status próprios — apontam para uma regra já contada em outro arquivo, para não testar a mesma coisa duas vezes.*

## Estratégia de testes recomendada

A API já usa **vitest**. Hoje só `src/services/auth/sessionContext.test.ts` e `src/utils/appointmentAccess.test.ts` existem (19 testes) — cobrem as 9 regras marcadas ✅ acima.

### 1. Unitários (camada U) — sem banco, os mais baratos e os primeiros a escrever
- Funções puras de `src/utils/*` (validadores de CPF/CNPJ/CEP, sanitização, tokens, `roles.ts`, `resolveAppointmentDuration`, `appointmentTransitions`, `hashUtils`).
- Schemas Yup: um `describe` por schema, casos que devem passar e casos que devem ser recusados (ver [11-validacoes-utilitarios.md](11-validacoes-utilitarios.md)).
- `checkRole`, `checkSameClinic`, `validate`, `handleControllerError` com `req`/`res` falsos (mock de Express), sem subir o servidor.

### 2. Integração (camada I) — a maior parte das 412 regras
- `supertest` sobre o `app` do Express. `src/app.ts` já exporta o app sem `listen()` e sem registrar os crons — dá para montar o app em teste sem efeitos colaterais.
- Banco de teste real: `embedded-postgres` (já validado nesta máquina nesta mesma sessão de trabalho, sem precisar de Docker). Um `globalSetup` cria um banco UTF-8 e roda `prisma migrate deploy`; `TRUNCATE` entre testes; factories pequenas (clínica, membro, paciente, consulta) em vez do seed de milhares de linhas.
- **Travas obrigatórias no setup**, na ordem:
  1. abortar se `DATABASE_URL` não apontar para `localhost`/`127.0.0.1` — o `.env` do projeto aponta para o banco Neon na nuvem;
  2. remover (`unset`, não deixar vazio) `GMAIL_*`, `BREVO_API_KEY` e `MAILTRAP_*` do ambiente de teste antes de qualquer `dotenv`, e usar um provedor de e-mail que só imprime no console — nenhum teste pode enviar e-mail de verdade;
  3. mocar Cloudinary e `multer` (upload de arquivo);
  4. neutralizar os rate limiters (hoje não relaxam em teste — rodar a suíte inteira bateria no limite de 5 tentativas de login bem antes de terminar);
  5. banco e cálculos de data em UTC explícito nos testes, já que várias regras desta especificação (`FIN-006`, `FIN-010`, `FIN-017`, `AGE-024`, `NOT-012`) são justamente sobre fuso horário — o teste precisa fixar o fuso para não ficar dependente de rodar às 21h de Brasília ou não.
- **Ordem sugerida:** P0 de isolamento/segurança primeiro (multi-tenant, LGPD) → P0 de dinheiro → P1 → P2. Dentro de cada prioridade, os bugs confirmados (⚠) antes das regras ⬜, porque um teste que já nasce falhando é o sinal mais forte de "vale a pena corrigir isto agora".

### 3. E2E de fluxo completo
- Só depois de I e U cobrirem as regras críticas. Candidatos: cadastro de clínica ponta a ponta (4 casos), aceite de convite, agendamento com conflito real, conclusão de consulta com documentos.

## Antes de implementar os testes

1. Revisar [90-bugs-e-riscos.md](90-bugs-e-riscos.md) e decidir, por bug: escrever o teste já esperando a correção (teste fica vermelho até corrigir) ou corrigir primeiro.
2. Responder o quanto der de [99-perguntas-em-aberto.md](99-perguntas-em-aberto.md) — cada resposta define se uma regra ❓ vira DEVE/NÃO PODE definitivo ou se vai mudar.
3. Nenhuma migração, seed ou teste deve rodar contra o banco do `.env` (Neon). Ver `docs/api-local-e2e-testing.md`-style de configuração já usada nesta sessão para o ambiente local.
