# Perguntas em aberto

> Parte da especificação da API (ver [README](README.md)). Comportamentos que o código implementa de um jeito específico, mas sem nenhum comentário ou decisão registrada que diga se é intencional. Diferente de [90-bugs-e-riscos.md](90-bugs-e-riscos.md) — aqui não há evidência de que o código esteja "errado" contra sua própria intenção; é uma decisão de produto que falta tomar (ou confirmar) antes de travar o comportamento num teste. Cada pergunta cita a regra (❓ na tabela do arquivo de origem) e as opções que pareceram razoáveis durante a leitura do código — a resposta certa pode ser nenhuma delas.

**19 perguntas.** Organizadas por área, na mesma ordem dos arquivos de especificação.

## Autenticação e sessão

### P-AUT-01 — Segredos JWT iguais fora de produção
`env.ts` só transforma `JWT_ACCESS_SECRET === JWT_TEMP_SECRET` em erro fatal quando `NODE_ENV=production`; em desenvolvimento/teste vira só aviso. Isso é mitigado em runtime pelo `authMiddleware` recusar tokens com claim `type` (AUT-028), mas um ambiente de *staging* que esqueça `NODE_ENV=production` fica exposto sem aviso forte.
- **Comportamento atual:** erro fatal só em produção; aviso em dev/test.
- **Opções:** manter (já mitigado por AUT-028) · virar erro fatal em qualquer ambiente.
- Regra: AUT-036 · [01-autenticacao-sessao.md](01-autenticacao-sessao.md#tokens-jwt-e-segredos)

### P-AUT-02 — Timeout de sessão só no cliente
`sessionTimeoutMinutes` (a política "encerrar sessão após inatividade" da clínica) nunca é aplicado pelo servidor — o JWT sempre dura 8h fixas, e é o FRONTEND que decide deslogar por inatividade usando esse valor. Não existe *refresh token* no projeto.
- **Comportamento atual:** só client-side; o servidor nunca expira o token antes das 8h.
- **Opções:** manter (simples, sem necessidade de refresh token) · adicionar um mecanismo server-side (ex.: registrar `lastActivityAt` e checar no `authMiddleware`).
- Regra: nota de AUT-018 · [01-autenticacao-sessao.md](01-autenticacao-sessao.md#sessão-e-clínica-ativa)

## Conta unificada, vínculos e bloqueio por faltas

### P-VIN-01 / P-PAC-03 — Quem pode desbloquear um paciente bloqueado por faltas
`Patient.blockedAt` é um bloqueio GLOBAL (afeta a pessoa em todas as clínicas), mas `UnblockPatientService` só exige que o paciente tenha ALGUMA consulta na clínica de quem está desbloqueando — mesmo que o bloqueio tenha sido causado por faltas em OUTRA clínica. Qualquer `ADMIN`/`RECEPTIONIST` de qualquer clínica que o paciente já visitou reverte o bloqueio.
- **Comportamento atual:** qualquer clínica com consulta do paciente pode desbloquear.
- **Opções:** manter (o bloqueio protege a agenda de todo mundo, então qualquer clínica pode reverter) · restringir o desbloqueio à(s) clínica(s) que efetivamente registraram as faltas que geraram o bloqueio, com auditoria mais forte.
- Regras: VIN-033, PAC-023 · [02-conta-unificada-vinculos.md](02-conta-unificada-vinculos.md#isolamento-entre-clínicas-em-notificações-e-bloqueio-de-paciente) · [08-pacientes-recepcao.md](08-pacientes-recepcao.md#bloqueio-e-desbloqueio-por-faltas)

## Agendamentos

### P-AGE-01 — Agendar para paciente bloqueado ou clínica inativa
`CreateAppointmentService` não verifica `Patient.blockedAt`, `Patient.isActive` nem `Clinic.isActive` antes de criar a consulta. Na prática, a recepção/admin conseguem marcar uma consulta nova para um paciente bloqueado por faltas sem passar pelo fluxo formal de desbloqueio, ou numa clínica que o próprio `ADMIN` desativou.
- **Comportamento atual:** sem nenhuma dessas checagens.
- **Opções:** manter (staff sempre pode agendar, é uma decisão manual da recepção) · exigir desbloqueio explícito antes de qualquer novo agendamento · bloquear agendamento em clínica inativa (isso talvez já devesse ser um bug, não uma pergunta — mas não há evidência de que "clínica inativa não agenda" seja uma regra pretendida em algum outro lugar do código).
- Regra: AGE-020 · [05-agendamentos.md](05-agendamentos.md#antecedência-feriados-e-canal-de-agendamento)

### P-AGE-02 — Faltas consecutivas: por clínica ou globais?
O contador que decide bloquear um paciente (`countPatientNoShows`, comparado a `ClinicSettings.maxConsecutiveNoShows`) soma faltas de TODAS as clínicas em que o paciente já foi atendido, não só a clínica cuja configuração está sendo aplicada. Uma pessoa com 2 faltas na Clínica A e 1 na Clínica B pode ser bloqueada pela Clínica B mesmo nunca tendo faltado lá.
- **Comportamento atual:** soma global.
- **Opções:** manter global (é uma identidade de paciente única, o histórico de faltas é dela) · contar só as faltas NAQUELA clínica antes de bloquear.
- Regra: AGE-047 · [05-agendamentos.md](05-agendamentos.md#no-show-automático-e-bloqueio)

### P-AGE-03 — Busca de pacientes para agendar: global ou por clínica?
A recepção busca pacientes (para marcar uma consulta) por nome/CPF em toda a base, ignorando a própria clínica — devolve nome, CPF, telefone e avatar de alguém que nunca pisou ali. Dado o desenho de paciente global, isso pode ser necessário para achar um cadastro existente e não duplicar CPF; mas também expõe dado de uma pessoa que só tem histórico em outra clínica.
- **Comportamento atual:** busca global, sem filtro de clínica.
- **Opções:** manter global (evita duplicar cadastro de paciente pelo mesmo CPF) · restringir a busca por clínica e oferecer um fluxo separado e mais explícito ("importar paciente de outra clínica") quando não encontrar localmente.
- Regra: AGE-052 · [05-agendamentos.md](05-agendamentos.md#acesso-isolamento-e-agenda-da-recepção)

## Documentos clínicos

### P-DOC-01 — Documento em rascunho esquecido na conclusão da consulta
Um documento ainda `DRAFT` quando a consulta é concluída fica "preso": a consulta sai de `IN_PROGRESS`, e editar/finalizar/excluir exigem `IN_PROGRESS`. O rascunho nunca é enviado nem apagado — só existe, invisível ao paciente, para sempre.
- **Comportamento atual:** fica `DRAFT` permanentemente, sem nenhuma ação possível sobre ele.
- **Opções:** descartar automaticamente ao concluir · permitir uma janela de edição/exclusão mesmo com a consulta já `COMPLETED` · manter como está (aceitável — o profissional decide se quer criar um adendo depois).
- Regra: DOC-022 · [06-documentos-clinicos.md](06-documentos-clinicos.md#conclusão-da-consulta-envio-dos-documentos)

## Financeiro e relatórios

### P-FIN-01 — Totais e receita: regime de caixa ou de competência?
Os totais da listagem de transações e do relatório da clínica (receita, lucro) somam lançamentos de QUALQUER `paymentStatus` — `PENDING`, `PAID`, `CANCELLED` e `REFUNDED` contam igual. Times financeiros costumam ter uma resposta forte para isso (regime de caixa vs. competência), e nenhum comentário no código declara a intenção.
- **Comportamento atual:** soma tudo, independente do status de pagamento.
- **Opções:** manter (regime de competência: conta o que foi lançado) · filtrar só `PAID` para "receita realizada" e mostrar `PENDING`/outros como métrica separada.
- Regras: FIN-012, FIN-019 · [07-financeiro-relatorios.md](07-financeiro-relatorios.md#transações-listagem-e-totais)

### P-FIN-02 — De onde viria o `patientId` de uma transação?
Consequência de corrigir o bug FIN-008 (a notificação de pagamento confirmado nunca dispara porque nada grava `patientId`): hoje não existe, em nenhuma tela, uma forma de vincular uma transação a um paciente/consulta.
- **Comportamento atual:** não existe esse vínculo em nenhum formulário.
- **Opções:** adicionar seleção de paciente (ou de consulta, herdando o paciente) no formulário de criação/edição de transação · remover a notificação morta e não implementar o vínculo.
- Regra: FIN-008 · [07-financeiro-relatorios.md](07-financeiro-relatorios.md#transações-criação-e-edição)

## Pacientes e recepção

### P-PAC-01 — Paciente cadastrado sem consulta ainda aparece na lista da clínica?
A listagem de pacientes de uma clínica é construída a partir de quem TEM consulta ali (`Appointment.groupBy`). Um paciente que a recepção acabou de cadastrar, mas que ainda não teve a primeira consulta marcada, fica invisível — inclusive para a própria clínica que o cadastrou.
- **Comportamento atual:** invisível até a primeira consulta.
- **Opções:** manter (a lista representa "pacientes atendidos", não "cadastros") · mostrar também os cadastrados sem consulta, com uma indicação visual diferente.
- Regra: PAC-008 · [08-pacientes-recepcao.md](08-pacientes-recepcao.md#cadastro-de-paciente-pela-recepção)

### P-PAC-02 — Auditoria no detalhe clínico do paciente
O detalhe do paciente que o `ADMIN` acessa (diagnóstico, prescrição, alergias, medicações, contato de emergência de todos os prontuários na clínica) não gera nenhum registro de auditoria — diferente de `ViewDocumentService`, que audita toda visualização de documento.
- **Comportamento atual:** sem auditoria.
- **Opções:** adicionar auditoria de acesso (mesmo padrão de `VIEWED` em documentos) · manter sem (é uma tela só de `ADMIN`, considerada de confiança).
- Regra: PAC-020 · [08-pacientes-recepcao.md](08-pacientes-recepcao.md#detalhe-do-paciente-auditoria-clínica)

### P-PAC-04 — Exclusão de comentário clínico: física ou lógica?
Um comentário do profissional sobre o paciente é apagado com `DELETE` físico, sem histórico nem auditoria do que foi escrito. Diferente de documentos clínicos, que são sempre soft-delete com auditoria.
- **Comportamento atual:** `DELETE` físico, sem rastro.
- **Opções:** manter físico (é uma anotação informal, não um documento clínico oficial) · exigir soft delete + auditoria, pelo mesmo padrão dos documentos.
- Regra: PAC-032 · [08-pacientes-recepcao.md](08-pacientes-recepcao.md#comentários-clínicos-do-profissional-sobre-o-paciente)

## Notificações

### P-NOT-01 — Rótulo de "quem agendou" para a equipe
A notificação que avisa a equipe sobre um novo agendamento usa o `channel` bruto do cadastro ("pelo paciente ... pelo portal online" vs. "pela recepção") em vez de `isOnlineBooking` (já calculado). Como o paciente pode manipular `channel` (ver AGE-016/VAL-036), o rótulo mostrado à equipe pode mentir sobre quem de fato agendou — mas corrigir isso é uma consequência de decidir a política do AGE-016 primeiro.
- **Comportamento atual:** usa `input.channel` bruto.
- **Opções:** trocar para `isOnlineBooking` (mais confiável) · manter como está (baixo impacto — é só um rótulo informativo para a equipe).
- Regra: NOT-004 · [09-notificacoes-crons.md](09-notificacoes-crons.md#criação-de-agendamento-notificações)

## Clínica e configurações

### P-CFG-01 — O horário de funcionamento da clínica deveria valer para os profissionais?
Existem DUAS fontes de "horário da clínica" (`ClinicWorkingHours` por dia, e o par único `ClinicSettings.openTime`/`closeTime`), configuráveis por uma tela real, mas o motor de agendamento só respeita o expediente INDIVIDUAL de cada profissional (`ProfessionalWorkingHours`). Uma clínica pode se dizer fechada aos domingos e ainda assim ter consultas marcadas nesse dia, se algum profissional tiver domingo no próprio expediente.
- **Comportamento atual:** configurável, mas sem nenhum efeito real no agendamento.
- **Opções:** fazer o horário da clínica virar um TETO que nenhum profissional pode exceder (aplicado em `assertSlotIsBookable`) · manter só como informação pública/exibição, sem forçar nada.
- Regra: CFG-008 · [10-clinica-config-procedimentos.md](10-clinica-config-procedimentos.md#horário-de-funcionamento-o-que-é-enforçado-de-verdade)

### P-CFG-02 — Bloquear a agenda sobre um horário que já tem consulta marcada
Criar um bloqueio de agenda (férias, folga) não verifica se já existem consultas confirmadas no período — a consulta continua existindo, marcada, mesmo que o profissional tenha acabado de se declarar indisponível naquele horário.
- **Comportamento atual:** permite sem nenhum aviso ou ação automática.
- **Opções:** impedir a criação do bloqueio se houver consulta marcada no período (obrigando a cancelar/remarcar primeiro) · avisar mas permitir · manter como está (ação manual, o profissional sabe o que está fazendo).
- Regra: CFG-034 · [10-clinica-config-procedimentos.md](10-clinica-config-procedimentos.md#bloqueio-de-agenda-do-profissional)

### P-CFG-03 — Auditoria ao (des)ativar a clínica
`PUT /clinics/:id` permite alternar `Clinic.isActive` sem gerar nenhum `AuditLog` — diferente de praticamente toda outra alteração de configuração desta área, que audita.
- **Comportamento atual:** sem auditoria para essa mudança específica.
- **Opções:** adicionar auditoria (é uma mudança de alto impacto: desativa toda a operação da clínica) · manter sem (a ação já é restrita a `ADMIN` da própria clínica).
- Regra: CFG-020 · [10-clinica-config-procedimentos.md](10-clinica-config-procedimentos.md#dados-cadastrais-da-clínica-clinic)

## Validações

### P-VAL-01 — Todo template de e-mail escapa dado do usuário?
Não foi possível confirmar, sem abrir cada `send*Email` individualmente, se todo template de e-mail escapa (`escapeHtml`) valores como nome do paciente ou mensagem livre de um comunicado antes de interpolar no HTML enviado.
- **Comportamento atual:** não auditado template a template nesta rodada.
- **Opções:** auditar cada template com um teste unitário dedicado (o candidato mais óbvio a checar primeiro é o comunicado livre, que aceita texto arbitrário digitado por `ADMIN`/`RECEPTIONIST`) · aceitar o risco como é hoje (quem escreve o comunicado já é da equipe da própria clínica, não um estranho).
- Regra: VAL-013 · [11-validacoes-utilitarios.md](11-validacoes-utilitarios.md#sanitização-e-escape-de-html)

### P-VAL-02 — Complexidade de senha: só na troca, ou também no cadastro?
`changePasswordSchema` (trocar senha) exige maiúscula + minúscula + número, mas os schemas de CADASTRO (paciente, dono de clínica, convite) só exigem 8 caracteres, sem exigência de complexidade.
- **Comportamento atual:** regras diferentes para criar e para trocar senha.
- **Opções:** aplicar a mesma exigência de complexidade no cadastro (mais seguro, pode gerar fricção) · manter como está (senha inicial mais simples, complexidade só reforçada depois).
- Regra: VAL-040 · [11-validacoes-utilitarios.md](11-validacoes-utilitarios.md#famílias-de-schemas-yup-o-que-aceitam-e-recusam)

## Como usar esta lista

Estas 19 perguntas não bloqueiam a implementação dos testes — toda regra ❓ já tem um COMPORTAMENTO ATUAL documentado e testável (o teste verifica o que o código faz hoje). A resposta do usuário decide se esse teste deve continuar passando no futuro (comportamento confirmado como intencional) ou vai precisar mudar (vira uma correção, com o teste atualizado para o novo comportamento). Nenhuma pergunta aqui foi respondida ainda.
