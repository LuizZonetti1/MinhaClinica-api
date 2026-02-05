# Minha Clínica - Documentação de Requisitos

## Sistema SaaS Multi-Tenant para Gestão de Clínicas de Saúde

**Versão:** 1.0  
**Data:** 05 de fevereiro de 2026  
**Status:** Em Desenvolvimento

---

## SUMÁRIO

1. [Requisitos Funcionais](#1-requisitos-funcionais)
2. [Requisitos Não Funcionais](#2-requisitos-não-funcionais)
3. [Regras de Negócio](#3-regras-de-negócio)
4. [Requisitos de Interface](#4-requisitos-de-interface)
5. [Requisitos de Segurança e Compliance](#5-requisitos-de-segurança-e-compliance)

---

## 1. REQUISITOS FUNCIONAIS

### 1.1 Gestão de Clínicas (Multi-Tenant)

#### RF001 - Cadastro de Nova Clínica
**Prioridade:** Alta | **Fase:** MVP

O sistema deve permitir o cadastro de novas clínicas com os seguintes dados:

**Obrigatórios:**
- Razão Social
- Nome Fantasia
- CNPJ
- Endereço completo (CEP, logradouro, número, bairro, cidade, estado)
- Telefone principal
- E-mail institucional

**Opcionais:**
- Complemento do endereço
- Logo da clínica (upload de imagem)
- Website
- Redes sociais

**Critérios de Aceitação:**
- Sistema deve validar CNPJ (formato e dígitos verificadores)
- CEP deve buscar endereço automaticamente via API (ViaCEP)
- Logo aceita formatos: PNG, JPG, SVG (máximo 2MB)
- Após cadastro, criar automaticamente o schema isolado no banco de dados
- Gerar subdomínio único (ex: `clinicaexemplo.minhaclinica.com.br`)

#### RF002 - Configurações Iniciais da Clínica
**Prioridade:** Alta | **Fase:** MVP

O sistema deve permitir configurar:

- Horário de funcionamento (dias da semana e horários de abertura/fechamento)
- Fuso horário
- Intervalo mínimo entre agendamentos (15, 30, 45, 60 minutos)
- Antecedência mínima para agendamento online (horas)
- Antecedência máxima para agendamento online (dias)
- Tempo máximo para cancelamento pelo paciente (horas)
- Bloqueio automático após N faltas consecutivas

**Critérios de Aceitação:**
- Todas as configurações devem ser editáveis a qualquer momento
- Alterações devem ser auditadas
- Horários devem considerar fuso horário da clínica

#### RF003 - Personalização Visual
**Prioridade:** Média | **Fase:** 2

O sistema deve permitir personalização da interface:

- Upload de logo
- Escolha de cores primárias e secundárias
- Tema claro/escuro
- Customização de e-mails (templates)

---

### 1.2 Gestão de Usuários

#### RF004 - Cadastro de Usuários
**Prioridade:** Alta | **Fase:** MVP

O sistema deve permitir cadastro de usuários com os seguintes perfis:

1. **Dono da Clínica (Admin)**
2. **Recepcionista**
3. **Profissional de Saúde**
4. **Paciente**

**Dados obrigatórios:**
- Nome completo
- CPF
- E-mail
- Telefone
- Perfil de acesso

**Critérios de Aceitação:**
- O primeiro usuário cadastrado na clínica é automaticamente Admin
- CPF deve ser único no tenant
- E-mail deve ser único no tenant
- Senha temporária deve ser gerada automaticamente
- Enviar credenciais por e-mail

#### RF005 - Autenticação
**Prioridade:** Alta | **Fase:** MVP

O sistema deve implementar autenticação segura:

- Login com e-mail e senha
- Token JWT com expiração de 15 minutos (access token)
- Refresh token com expiração de 7 dias
- Opção "Lembrar-me" (sessão estendida)
- Recuperação de senha via e-mail
- Link de recuperação expira em 2 horas
- Forçar alteração de senha no primeiro acesso

**Critérios de Aceitação:**
- Sistema deve bloquear conta após 5 tentativas de login falhadas
- Registrar todas as tentativas de login (sucesso e falha) no log de auditoria
- Implementar captcha após 3 tentativas falhadas

#### RF006 - Controle de Acesso (RBAC)
**Prioridade:** Alta | **Fase:** MVP

O sistema deve implementar controle de acesso baseado em papéis (RBAC):

| Funcionalidade | Admin | Recepcionista | Profissional | Paciente |
|----------------|-------|---------------|--------------|----------|
| Configurar clínica | ✅ | ❌ | ❌ | ❌ |
| Gerenciar usuários | ✅ | ❌ | ❌ | ❌ |
| Cadastrar pacientes | ✅ | ✅ | ❌ | ❌ |
| Ver todas as agendas | ✅ | ✅ | ❌ | ❌ |
| Ver própria agenda | ✅ | ✅ | ✅ | ✅ |
| Criar agendamentos | ✅ | ✅ | ❌ | ✅* |
| Acessar financeiro | ✅ | ❌ | ❌ | ❌ |
| Ver relatórios | ✅ | ❌ | ❌ | ❌ |
| Registrar atendimento | ✅ | ❌ | ✅ | ❌ |
| Bloquear horários | ✅ | ❌ | ✅ | ❌ |

*Paciente: apenas quando habilitado pela clínica

**Critérios de Aceitação:**
- Cada requisição deve validar permissões
- Tentativas de acesso não autorizado devem ser registradas
- Interface deve ocultar funcionalidades não permitidas

---

### 1.3 Gestão de Pacientes

#### RF007 - Cadastro de Pacientes
**Prioridade:** Alta | **Fase:** MVP

O sistema deve permitir cadastro de pacientes:

**Dados obrigatórios:**
- Nome completo
- CPF
- Data de nascimento
- Sexo/Gênero
- Telefone celular (com DDD)
- E-mail

**Dados opcionais:**
- RG
- Telefone fixo
- Endereço completo
- Convênio/Plano de saúde
- Número da carteirinha
- Alergias conhecidas
- Observações gerais

**Critérios de Aceitação:**
- CPF deve ser único no tenant
- E-mail deve ser único no tenant
- Sistema gera senha temporária automaticamente
- Enviar credenciais por e-mail e/ou SMS
- Validar formato de telefone e e-mail
- Calcular idade automaticamente pela data de nascimento

#### RF008 - Autocadastro de Pacientes
**Prioridade:** Média | **Fase:** 2

O sistema deve permitir que pacientes se cadastrem via portal público:

**Fluxo:**
1. Paciente acessa portal da clínica
2. Clica em "Criar conta"
3. Preenche formulário
4. Confirma e-mail via link
5. Define senha própria
6. Cadastro liberado

**Critérios de Aceitação:**
- E-mail deve ser confirmado antes de liberar acesso
- Link de confirmação expira em 24 horas
- Senha deve atender política de segurança
- Dados ficam com status "Aguardando validação" até confirmação

#### RF009 - Busca e Filtros de Pacientes
**Prioridade:** Média | **Fase:** MVP

O sistema deve permitir buscar pacientes por:

- Nome (busca parcial)
- CPF
- Telefone
- E-mail
- Status (ativo/inativo)

**Filtros adicionais:**
- Pacientes com consulta agendada
- Pacientes sem agendamento há X dias
- Pacientes com histórico de faltas
- Aniversariantes do mês

**Critérios de Aceitação:**
- Busca deve ser case-insensitive
- Resultado deve ser paginado (20 itens por página)
- Tempo de resposta menor que 1 segundo

#### RF010 - Edição de Dados de Pacientes
**Prioridade:** Alta | **Fase:** MVP

O sistema deve permitir edição de dados cadastrais:

- Admin e Recepcionista: podem editar todos os campos
- Paciente: pode editar apenas dados pessoais (não pode alterar CPF)

**Critérios de Aceitação:**
- Alterações devem ser registradas no log de auditoria
- CPF não pode ser alterado após cadastro (apenas inativar e criar novo)
- Notificar paciente por e-mail quando dados forem alterados por terceiros

#### RF011 - Inativação de Pacientes
**Prioridade:** Média | **Fase:** MVP

O sistema deve permitir inativação de pacientes:

- Paciente inativo não pode fazer novos agendamentos
- Histórico permanece preservado
- Pode ser reativado a qualquer momento

**Critérios de Aceitação:**
- Não permitir inativação se houver agendamentos futuros
- Registrar motivo da inativação
- Registrar data e usuário que inativou

---

### 1.4 Gestão de Profissionais

#### RF012 - Cadastro de Profissionais
**Prioridade:** Alta | **Fase:** MVP

O sistema deve permitir cadastro de profissionais de saúde:

**Dados obrigatórios:**
- Nome completo
- CPF
- E-mail
- Telefone
- Conselho profissional (CRM, CRO, CREFITO, etc.)
- Número do registro
- UF do registro
- Especialidade(s)
- Cor de identificação na agenda (para facilitar visualização)

**Configurações de agenda obrigatórias:**
- Dias de atendimento
- Horário de início e término
- Intervalo para almoço/descanso
- Duração padrão de consulta
- Procedimentos que realiza

**Critérios de Aceitação:**
- Validar formato do registro profissional
- Permitir múltiplas especialidades
- Validar conflito de horários nos dias de atendimento
- Gerar automaticamente usuário no sistema

#### RF013 - Gestão de Especialidades
**Prioridade:** Média | **Fase:** MVP

O sistema deve permitir cadastro de especialidades:

- Nome da especialidade
- Descrição
- Ícone/Cor (opcional)

**Exemplos:**
- Clínica Geral
- Cardiologia
- Pediatria
- Ortodontia
- Implantodontia
- Fisioterapia Ortopédica
- Dermatologia

**Critérios de Aceitação:**
- Especialidades são compartilhadas no tenant
- Não permitir exclusão de especialidades em uso
- Permitir associar múltiplas especialidades ao profissional

#### RF014 - Bloqueio de Agenda do Profissional
**Prioridade:** Média | **Fase:** 2

O sistema deve permitir que profissionais bloqueiem períodos em sua agenda:

**Tipos de bloqueio:**
- Férias
- Folga
- Compromisso pessoal
- Reunião
- Curso/Treinamento
- Indisponibilidade temporária

**Critérios de Aceitação:**
- Bloqueio impede novos agendamentos no período
- Agendamentos existentes não são afetados (opcional: permitir cancelamento automático)
- Profissional pode visualizar histórico de bloqueios
- Admin pode visualizar bloqueios de todos os profissionais

---

### 1.5 Gestão de Procedimentos

#### RF015 - Cadastro de Procedimentos
**Prioridade:** Alta | **Fase:** MVP

O sistema deve permitir cadastro de procedimentos/serviços:

**Dados obrigatórios:**
- Nome do procedimento
- Duração estimada (minutos)
- Preço (R$)
- Status (Ativo/Inativo)

**Dados opcionais:**
- Código interno
- Descrição
- Código TUSS (para convênios)
- Instruções para o paciente

**Configurações:**
- Profissionais vinculados (quais profissionais realizam este procedimento)
- Disponível para agendamento online (Sim/Não)
- Requer autorização prévia
- Permite múltiplas sessões

**Exemplos:**
| Procedimento | Duração | Preço |
|--------------|---------|-------|
| Consulta de Avaliação | 30 min | R$ 200,00 |
| Retorno | 15 min | Cortesia |
| Limpeza Dental | 45 min | R$ 180,00 |
| Clareamento Dental | 90 min | R$ 800,00 |
| Sessão de Fisioterapia | 50 min | R$ 120,00 |
| Aplicação de Botox | 30 min | R$ 1.200,00 |

**Critérios de Aceitação:**
- Duração deve ser múltipla do intervalo configurado na clínica
- Não permitir exclusão de procedimentos com histórico
- Permitir inativação
- Preço pode ser R$ 0,00 (cortesia)

#### RF016 - Vinculação Procedimento-Profissional
**Prioridade:** Alta | **Fase:** MVP

O sistema deve gerenciar vinculação entre procedimentos e profissionais:

- Um procedimento pode ser realizado por múltiplos profissionais
- Um profissional pode realizar múltiplos procedimentos
- Preço pode variar por profissional (opcional)
- Duração pode variar por profissional (opcional)

**Critérios de Aceitação:**
- No agendamento, mostrar apenas procedimentos do profissional selecionado
- Validar se profissional pode realizar procedimento antes de confirmar agendamento

---

### 1.6 Agendamento de Consultas

#### RF017 - Cálculo Automático de Horários Disponíveis
**Prioridade:** Alta | **Fase:** MVP

O sistema deve calcular automaticamente horários disponíveis baseando-se em:

1. Horário de funcionamento da clínica
2. Horário de atendimento do profissional
3. Duração do procedimento selecionado
4. Agendamentos já existentes
5. Bloqueios de agenda
6. Intervalo mínimo entre agendamentos (configurável)

**Exemplo:**
```
Profissional atende: 08:00 - 12:00
Procedimento: 45 minutos
Agendamento existente: 09:00 (30 min)
Intervalo mínimo: 15 minutos

Horários disponíveis:
✅ 08:00
✅ 09:45 (09:00 + 30 min + 15 min)
✅ 10:45
❌ 11:30 (não caberia 45 min até 12:00)
```

**Critérios de Aceitação:**
- Não permitir agendamentos sobrepostos
- Considerar fuso horário da clínica
- Considerar feriados (opcional)
- Performance: calcular horários em menos de 500ms

#### RF018 - Agendamento pela Recepção
**Prioridade:** Alta | **Fase:** MVP

O sistema deve permitir que recepcionistas e admins criem agendamentos:

**Fluxo:**
1. Selecionar ou cadastrar paciente
2. Selecionar profissional ou especialidade
3. Selecionar procedimento
4. Sistema exibe calendário com dias disponíveis
5. Selecionar dia
6. Sistema exibe horários disponíveis
7. Confirmar agendamento
8. Adicionar observações (opcional)
9. Sistema envia notificação ao paciente

**Critérios de Aceitação:**
- Status inicial: "Agendado"
- Registrar na auditoria quem criou o agendamento
- Enviar confirmação automaticamente
- Permitir criar agendamentos recorrentes (opcional)

#### RF019 - Agendamento Online pelo Paciente
**Prioridade:** Alta | **Fase:** 2

O sistema deve permitir agendamento online pelo portal do paciente:

**Fluxo:**
1. Paciente faz login
2. Clica em "Novo Agendamento"
3. Seleciona especialidade ou profissional preferido
4. Seleciona procedimento (apenas disponíveis online)
5. Seleciona data e horário
6. Confirma agendamento
7. Recebe confirmação

**Restrições:**
- Respeitar antecedência mínima (ex: 2 horas)
- Respeitar antecedência máxima (ex: 60 dias)
- Permitir apenas 1 agendamento futuro por vez (configurável)
- Bloquear se paciente tiver N faltas consecutivas

**Critérios de Aceitação:**
- Status inicial pode ser "Aguardando Confirmação" (configurável)
- Interface deve ser responsiva (mobile-friendly)
- Tempo de carregamento < 2 segundos
- Exibir mapa com localização da clínica

#### RF020 - Agendamento via WhatsApp
**Prioridade:** Média | **Fase:** 3

O sistema deve integrar com WhatsApp Business API via chatbot:

**Funcionalidades do bot:**
- Agendar consulta
- Confirmar agendamento
- Cancelar agendamento
- Consultar próximos agendamentos
- Falar com atendente humano

**Fluxo de agendamento:**
1. Bot solicita identificação (CPF ou telefone)
2. Se novo paciente, coleta dados básicos
3. Apresenta especialidades/profissionais
4. Apresenta dias disponíveis
5. Apresenta horários disponíveis
6. Confirma agendamento

**Critérios de Aceitação:**
- Bot deve entender variações de linguagem natural
- Tempo de resposta < 5 segundos
- Fallback para atendimento humano
- Registrar todas as interações

#### RF021 - Estados dos Agendamentos
**Prioridade:** Alta | **Fase:** MVP

O sistema deve gerenciar os seguintes estados:

| Estado | Descrição | Cor | Permite Edição |
|--------|-----------|-----|----------------|
| **Agendado** | Consulta marcada | 🔵 Azul | Sim |
| **Confirmado** | Paciente confirmou | 🟢 Verde | Sim |
| **Aguardando** | Paciente na recepção | 🟡 Amarelo | Sim |
| **Em Atendimento** | Sendo atendido | 🟣 Roxo | Apenas horário |
| **Atendido** | Consulta realizada | ⚫ Cinza | Não |
| **Cancelado** | Cancelado | 🔴 Vermelho | Não |
| **Não Compareceu** | No-show | 🟠 Laranja | Não |

**Transições permitidas:**
```
Agendado → Confirmado → Aguardando → Em Atendimento → Atendido
  ↓            ↓            ↓              ↓
Cancelado  Cancelado    Cancelado    Não Compareceu
```

**Critérios de Aceitação:**
- Registrar timestamp de cada mudança de status
- Registrar usuário que alterou status
- Estados finais (Atendido, Cancelado, Não Compareceu) não podem ser revertidos

#### RF022 - Cancelamento e Reagendamento
**Prioridade:** Alta | **Fase:** MVP

O sistema deve permitir cancelamento de agendamentos:

**Por paciente:**
- Via portal: até X horas antes (configurável)
- Via WhatsApp: até X horas antes
- Ligação para clínica: sem restrição

**Por recepcionista/admin:**
- Sem restrição de horário
- Deve informar motivo (opcional)
- Opção de notificar paciente

**Reagendamento:**
- Cancela agendamento atual
- Abre tela para novo agendamento
- Mantém vínculo no histórico

**Critérios de Aceitação:**
- Enviar notificação de cancelamento
- Liberar horário imediatamente
- Registrar em auditoria
- Permitir informar motivo do cancelamento

#### RF023 - Confirmação de Presença
**Prioridade:** Média | **Fase:** 2

O sistema deve gerenciar confirmação de presença:

**Solicitação automática:**
- Enviar X horas antes da consulta
- Canais: WhatsApp, SMS, E-mail
- Botões: "Confirmar" / "Cancelar"

**Confirmação manual:**
- Paciente liga ou comparece presencialmente
- Recepcionista marca como confirmado

**Critérios de Aceitação:**
- Link de confirmação único e seguro
- Expiração após horário da consulta
- Atualizar status para "Confirmado" automaticamente
- Dashboard indicar taxa de confirmação

#### RF024 - Listagem e Filtros de Agendamentos
**Prioridade:** Alta | **Fase:** MVP

O sistema deve permitir visualização de agendamentos:

**Visualizações:**
- Calendário mensal (visão geral)
- Agenda diária (lista detalhada)
- Agenda semanal (visão de 7 dias)
- Lista tabular com paginação

**Filtros:**
- Por profissional
- Por paciente
- Por procedimento
- Por status
- Por período (data inicial/final)

**Critérios de Aceitação:**
- Cores conforme status do agendamento
- Ícones indicativos (primeira consulta, retorno, etc.)
- Clicar no agendamento abre detalhes
- Arrastar e soltar para reagendar (opcional)

---

### 1.7 Módulo Financeiro

#### RF025 - Registro de Receitas
**Prioridade:** Média | **Fase:** 2

O sistema deve permitir registro de receitas:

**Receita automática:**
- Gerada ao marcar agendamento como "Atendido"
- Valor padrão: preço do procedimento
- Permite ajuste manual (desconto/acréscimo)

**Receita manual:**
- Admin pode registrar outras receitas
- Venda de produtos
- Serviços avulsos

**Dados da receita:**
- Data do recebimento
- Paciente (opcional)
- Profissional responsável (opcional)
- Procedimento (opcional)
- Descrição
- Valor (R$)
- Forma de pagamento (Dinheiro, Débito, Crédito, PIX, Transferência)
- Status (Recebido/Pendente)
- Observações

**Critérios de Aceitação:**
- Receitas pendentes aparecem no dashboard
- Permitir marcar como recebida posteriormente
- Exportar receitas em PDF/Excel
- Calcular total por período

#### RF026 - Registro de Despesas
**Prioridade:** Média | **Fase:** 2

O sistema deve permitir registro de despesas:

**Dados da despesa:**
- Data do pagamento
- Descrição
- Categoria
- Valor (R$)
- Forma de pagamento
- Fornecedor (opcional)
- Status (Pago/Pendente)
- Observações

**Categorias padrão:**
- Aluguel
- Materiais e Insumos
- Folha de Pagamento
- Utilidades (água, luz, internet)
- Marketing
- Manutenção
- Impostos e Taxas
- Outros (customizável)

**Critérios de Aceitação:**
- Admin pode criar/editar categorias
- Despesas pendentes aparecem no dashboard
- Permitir upload de comprovante (nota fiscal, recibo)
- Exportar despesas em PDF/Excel

#### RF027 - Relatórios Financeiros
**Prioridade:** Média | **Fase:** 2

O sistema deve gerar relatórios financeiros:

**Relatórios disponíveis:**
1. **Resumo Mensal:** Total receitas vs. despesas
2. **Fluxo de Caixa:** Entradas e saídas por dia/semana
3. **Receitas por Profissional:** Produtividade de cada um
4. **Receitas por Procedimento:** Procedimentos mais rentáveis
5. **Despesas por Categoria:** Onde o dinheiro está sendo gasto
6. **Comparativo Mensal:** Evolução mês a mês
7. **Formas de Pagamento:** Distribuição dos recebimentos

**Filtros:**
- Período (data inicial e final)
- Profissional
- Procedimento
- Forma de pagamento
- Status (pago/pendente)

**Critérios de Aceitação:**
- Gráficos visuais (linhas, barras, pizza)
- Exportação em PDF e Excel
- Cálculos precisos com 2 casas decimais
- Atualização em tempo real

---

### 1.8 Prontuário e Histórico

#### RF028 - Histórico de Consultas do Paciente
**Prioridade:** Alta | **Fase:** MVP

O sistema deve manter histórico completo de consultas:

**Informações registradas:**
- Data e horário
- Profissional que atendeu
- Procedimento realizado
- Status final (atendido, cancelado, falta)
- Valor cobrado
- Forma de pagamento
- Observações

**Acesso:**
- **Profissional:** apenas pacientes que atendeu
- **Admin:** todos os pacientes
- **Paciente:** seu próprio histórico (consultas, não prontuário)

**Critérios de Aceitação:**
- Ordenação cronológica reversa (mais recente primeiro)
- Filtro por profissional e procedimento
- Filtro por período
- Indicador visual de faltas

#### RF029 - Prontuário Eletrônico Simplificado
**Prioridade:** Média | **Fase:** 2

O sistema deve permitir registro de informações clínicas:

**Após atendimento, profissional pode registrar:**
- Anamnese/Queixa principal
- Observações do atendimento
- Conduta adotada
- Prescrições (texto livre)
- Evolução do quadro

**Upload de anexos:**
- Exames (PDF, imagens)
- Documentos relacionados
- Fotos (antes/depois)
- Limite: 10MB por arquivo

**Critérios de Aceitação:**
- Apenas profissional que atendeu pode editar
- Admin pode visualizar, mas não editar
- Timestamp de criação e edição
- Versionamento de alterações
- Download de anexos
- Paciente NÃO pode acessar anotações clínicas (apenas histórico de consultas)

**⚠️ Observação:** Sistema NÃO substitui prontuário eletrônico certificado (SBIS). Para necessitar de PEP completo, integrar com sistema especializado.

#### RF030 - Documentos e Relatórios Médicos
**Prioridade:** Baixa | **Fase:** 3

O sistema deve permitir geração de documentos:

**Tipos de documentos:**
- Atestado médico
- Receita médica
- Solicitação de exames
- Declaração de comparecimento
- Relatório médico

**Funcionalidades:**
- Templates personalizáveis
- Preenchimento automático de dados (paciente, profissional, data)
- Assinatura digital (opcional)
- Geração em PDF
- Envio por e-mail

**Critérios de Aceitação:**
- Apenas profissional pode gerar documentos
- Documentos armazenados no histórico
- Marca d'água com identificação da clínica
- Conformidade com CFM (Conselho Federal de Medicina)

---

### 1.9 Sistema de Notificações

#### RF031 - Notificações por E-mail
**Prioridade:** Alta | **Fase:** MVP

O sistema deve enviar notificações por e-mail:

**Tipos de notificações:**
1. **Confirmação de agendamento**
2. **Lembrete de consulta** (configurável: 24h, 48h, 1 semana antes)
3. **Cancelamento de consulta**
4. **Reagendamento de consulta**
5. **Confirmação de pagamento**
6. **Credenciais de acesso** (primeiro acesso)
7. **Recuperação de senha**

**Critérios de Aceitação:**
- Envio assíncrono (não bloquear requisição)
- Fila de envio (job queue)
- Tentativa de reenvio em caso de falha
- Log de envios (sucesso/falha)
- Templates personalizáveis
- Variáveis dinâmicas (nome, data, horário, etc.)

#### RF032 - Notificações por SMS
**Prioridade:** Média | **Fase:** 2

O sistema deve enviar notificações por SMS:

**Tipos prioritários:**
- Lembrete de consulta (24h antes)
- Confirmação de agendamento

**Critérios de Aceitação:**
- Mensagens curtas (até 160 caracteres)
- Integração com gateway SMS (Twilio, Zenvia)
- Contabilizar custo por SMS
- Opção de desabilitar por clínica
- Paciente pode optar por não receber

#### RF033 - Notificações por WhatsApp
**Prioridade:** Média | **Fase:** 3

O sistema deve enviar notificações via WhatsApp:

**Tipos de notificações:**
- Confirmação de agendamento
- Lembrete com botões interativos (Confirmar/Cancelar)
- Cancelamento
- Mensagens personalizadas (aniversário, follow-up)

**Critérios de Aceitação:**
- Integração com WhatsApp Business API
- Templates aprovados pelo WhatsApp
- Botões de resposta rápida
- Status de entrega e leitura
- Fallback para SMS se WhatsApp falhar

#### RF034 - Configuração de Notificações
**Prioridade:** Média | **Fase:** 2

O sistema deve permitir configurar notificações:

**Por clínica (Admin):**
- Ativar/desativar cada tipo de notificação
- Definir canais (e-mail, SMS, WhatsApp)
- Definir antecedência dos lembretes
- Customizar templates
- Definir horário de envio (não enviar à noite)

**Por paciente:**
- Escolher receber ou não notificações
- Escolher canais preferenciais
- Gerenciar frequência

**Critérios de Aceitação:**
- Interface intuitiva de configuração
- Preview de mensagens
- Testar envio
- Estatísticas (taxa de entrega, abertura, cliques)

---

### 1.10 Dashboard e Relatórios

#### RF035 - Dashboard do Administrador
**Prioridade:** Alta | **Fase:** MVP

O sistema deve exibir dashboard com métricas principais:

**Métricas gerais:**
- Total de agendamentos do dia/semana/mês
- Consultas confirmadas vs. pendentes
- Taxa de ocupação da agenda
- Total de receitas do período
- Total de despesas do período
- Saldo (receitas - despesas)

**Gráficos:**
- Agendamentos por dia (últimos 30 dias)
- Receitas mensais (últimos 6 meses)
- Procedimentos mais agendados
- Profissionais mais procurados
- Taxa de no-show

**Alertas:**
- Agendamentos não confirmados
- Contas a receber pendentes
- Profissionais sem agenda disponível
- Aniversariantes do dia

**Critérios de Aceitação:**
- Carregamento rápido (< 2 segundos)
- Atualização em tempo real (WebSocket ou polling)
- Filtros por período
- Exportação de dados
- Responsivo (visualização em tablets)

#### RF036 - Relatórios Gerenciais
**Prioridade:** Média | **Fase:** 2

O sistema deve gerar relatórios gerenciais:

**Relatórios disponíveis:**
1. **Produtividade por Profissional**
   - Número de atendimentos
   - Receita gerada
   - Taxa de no-show
   - Média de avaliação

2. **Performance de Procedimentos**
   - Mais agendados
   - Mais rentáveis
   - Duração média real vs. estimada

3. **Comportamento de Pacientes**
   - Novos pacientes
   - Pacientes recorrentes
   - Taxa de retenção
   - Pacientes inativos

4. **Análise de Cancelamentos**
   - Motivos de cancelamento
   - Taxa de cancelamento por profissional
   - Horários com mais cancelamentos

5. **Saúde do Negócio**
   - MRR (Monthly Recurring Revenue)
   - Crescimento mensal
   - Ticket médio
   - CAC (Custo de Aquisição de Cliente)

**Critérios de Aceitação:**
- Filtros por período, profissional, procedimento
- Exportação em PDF e Excel
- Gráficos visuais e interativos
- Comparação entre períodos
- Benchmark (quando disponível)

#### RF037 - Dashboard do Profissional
**Prioridade** Média | **Fase:** 2

O sistema deve exibir dashboard simplificado para profissionais:

**Informações disponíveis:**
- Agenda do dia
- Número de atendimentos do mês
- Próximas consultas (3 dias)
- Alertas (consultas não confirmadas)
- Avaliações recebidas (opcional)

**Critérios de Aceitação:**
- Visualização apenas de próprios dados
- Interface simplificada
- Acesso rápido à agenda

---

### 1.11 Logs de Auditoria

#### RF038 - Registro de Auditoria
**Prioridade:** Alta | **Fase:** MVP

O sistema deve registrar todas as ações relevantes:

**Ações auditadas:**
- Login (sucesso e falha)
- Criação de agendamento
- Alteração de agendamento (data, horário, status)
- Cancelamento de agendamento
- Cadastro de paciente
- Alteração de dados de paciente
- Criação/desativação de usuário
- Alterações em configurações da clínica
- Registro de receita/despesa
- Acesso ao prontuário

**Dados do log:**
- Timestamp preciso (com milissegundos)
- Usuário que executou a ação
- Tipo de ação
- Entidade afetada (ID e tipo)
- Dados anteriores (quando aplicável)
- Dados novos (quando aplicável)
- Endereço IP
- User-Agent (navegador/dispositivo)

**Critérios de Aceitação:**
- Logs são immutáveis (não podem ser alterados/excluídos)
- Retenção mínima de 5 anos
- Performance: não impactar requisições principais
- Registrar de forma assíncrona

#### RF039 - Consulta de Logs de Auditoria
**Prioridade:** Média | **Fase:** MVP

O sistema deve permitir consulta de logs:

**Acesso:**
- Apenas Admin

**Filtros:**
- Por usuário
- Por tipo de ação
- Por entidade
- Por período (data/hora)
- Por IP

**Funcionalidades:**
- Busca textual
- Exportação em CSV
- Visualização detalhada
- Timeline de ações relacionadas

**Critérios de Aceitação:**
- Resultados paginados
- Performance adequada mesmo com milhões de registros
- Interface intuitiva

---

### 1.12 Portal do Paciente

#### RF040 - Autenticação no Portal
**Prioridade:** Alta | **Fase:** MVP

O paciente deve acessar portal com:

- Login com e-mail e senha
- Recuperação de senha
- Lembrar credenciais (opcional)

**Critérios de Aceitação:**
- Interface responsiva (mobile-first)
- Acesso via subdomínio da clínica
- Sessão expira em 7 dias (com renovação automática)

#### RF041 - Visualização de Agendamentos
**Prioridade:** Alta | **Fase:** MVP

O paciente deve visualizar:

- Próximas consultas agendadas
- Histórico de consultas passadas
- Status de cada agendamento

**Critérios de Aceitação:**
- Exibir data, horário, profissional, procedimento
- Indicar consultas não confirmadas
- Botão de ação rápida (confirmar/cancelar)

#### RF042 - Gerenciamento de Agendamentos pelo Paciente
**Prioridade:** Alta | **Fase:** 2

O paciente deve poder:

- Criar novo agendamento (quando habilitado)
- Cancelar agendamento (dentro da política)
- Reagendar consulta

**Critérios de Aceitação:**
- Validar regras da clínica (antecedência, limite de faltas)
- Notificação de confirmação
- Feedback visual claro

#### RF043 - Atualização de Dados Pessoais
**Prioridade:** Média | **Fase:** 2

O paciente deve poder atualizar:

- Telefone
- E-mail
- Endereço
- Foto de perfil

**Não pode alterar:**
- CPF
- Nome (apenas via recepção)
- Data de nascimento

**Critérios de Aceitação:**
- Validação de formato
- Confirmação por e-mail se alterar e-mail
- Notificar clínica de alterações importantes

#### RF044 - Histórico de Consultas
**Prioridade:** Média | **Fase:** 2

O paciente deve visualizar:

- Lista de consultas passadas
- Data, profissional, procedimento
- Status (atendido, cancelado, falta)
- Documentos gerados (atestados, receitas) - se compartilhados

**Não visualiza:**
- Anotações clínicas do profissional
- Valores pagos (opcional)

**Critérios de Aceitação:**
- Ordenação cronológica
- Filtro por período
- Download de documentos compartilhados

---

### 1.13 Integrações

#### RF045 - Integração com Google Calendar
**Prioridade:** Baixa | **Fase:** 3

O sistema deve sincronizar agendamentos com Google Calendar:

**Funcionalidades:**
- Profissional vincula sua conta Google
- Agendamentos aparecem automaticamente no Google Calendar
- Bloqueios no Google Calendar refletem no sistema
- Sincronização bidirecional

**Critérios de Aceitação:**
- OAuth 2.0 para autenticação
- Sincronização em tempo real (webhook)
- Detectar e resolver conflitos
- Permitir desabilitar sincronização

#### RF046 - API Pública
**Prioridade:** Baixa | **Fase:** 3

O sistema deve oferecer API RESTful para integrações:

**Endpoints principais:**
- Listar agendamentos
- Criar agendamento
- Cancelar agendamento
- Buscar paciente
- Listar profissionais disponíveis
- Webhooks (eventos)

**Critérios de Aceitação:**
- Autenticação via API Key
- Rate limiting (100 req/min)
- Documentação completa (OpenAPI/Swagger)
- Sandbox para testes
- Logs de uso da API

---

## 2. REQUISITOS NÃO FUNCIONAIS

### 2.1 Desempenho

#### RNF001 - Tempo de Resposta
**Prioridade:** Alta

- Páginas devem carregar em até **2 segundos**
- APIs devem responder em até **500ms** (p95)
- Busca de pacientes em até **300ms**
- Cálculo de horários disponíveis em até **500ms**
- Dashboard em até **2 segundos**

**Métrica:** p95 (95% das requisições devem atender os limites)

#### RNF002 - Throughput
**Prioridade:** Alta

- Suportar **100 usuários simultâneos por tenant** sem degradação
- Suportar **1000 requisições por minuto** por tenant
- Suportar **10.000 agendamentos por mês** por tenant

#### RNF003 - Escalabilidade
**Prioridade:** Alta

- Sistema deve escalar horizontalmente (adicionar mais servidores)
- Suportar **1000 tenants simultâneos**
- Banco de dados deve suportar **100 GB** por tenant
- Arquitetura preparada para escalar para **10.000 clínicas**

#### RNF004 - Otimização
**Prioridade:** Média

- Imagens otimizadas (WebP, lazy loading)
- Code splitting (carregar apenas código necessário)
- Cache de recursos estáticos (CDN)
- Compressão Gzip/Brotli
- Minificação de CSS e JavaScript

---

### 2.2 Confiabilidade

#### RNF005 - Disponibilidade
**Prioridade:** Alta

- SLA de **99,5%** de uptime mensal
- Máximo de **3,6 horas** de downtime por mês
- Manutenções programadas fora do horário comercial
- Comunicação prévia de 48h para manutenções

#### RNF006 - Recuperação de Desastres
**Prioridade:** Alta

- RTO (Recovery Time Objective): **4 horas**
- RPO (Recovery Point Objective): **1 hora** (máximo perda de dados)
- Backup automático diário em múltiplas regiões
- Teste de restore mensal
- Plano de disaster recovery documentado

#### RNF007 - Tolerância a Falhas
**Prioridade:** Alta

- Sistema deve continuar operando mesmo com falha de componentes não críticos
- Fila de notificações: tentar reenvio 3x com backoff exponencial
- Fallback para modo degradado se serviço externo falhar
- Circuit breaker em integrações externas

#### RNF008 - Backup
**Prioridade:** Alta

- Backup automático diário do banco de dados
- Backup incremental a cada 6 horas
- Retenção de 30 dias
- Armazenamento em 3 regiões diferentes
- Criptografia AES-256 dos backups

---

### 2.3 Segurança

#### RNF009 - Autenticação e Autorização
**Prioridade:** Alta

- Autenticação via JWT (JSON Web Tokens)
- Tokens com expiração: 15 min (access), 7 dias (refresh)
- Password hashing com bcrypt (cost factor 12)
- Política de senha: mínimo 8 caracteres, maiúsculas, minúsculas, números
- Bloqueio de conta após 5 tentativas de login falhadas
- Autenticação de dois fatores (2FA) opcional

#### RNF010 - Criptografia
**Prioridade:** Alta

- HTTPS obrigatório (TLS 1.3)
- Dados sensíveis criptografados em repouso (CPF, RG, dados clínicos)
- Algoritmo: AES-256-GCM
- Senhas com hash bcrypt (nunca armazenar senha em texto plano)

#### RNF011 - Isolamento Multi-Tenant
**Prioridade:** Alta

- Dados de diferentes tenants completamente isolados
- Schema-based isolation (um schema por tenant no PostgreSQL)
- Row-Level Security (RLS) como camada adicional
- Validação de tenant em TODAS as queries
- Testes automatizados de isolamento

#### RNF012 - Proteção contra Ataques
**Prioridade:** Alta

- **SQL Injection:** Prevenção via ORM (Prisma) e prepared statements
- **XSS:** Sanitização de inputs, Content Security Policy
- **CSRF:** Tokens CSRF em formulários
- **DDoS:** Rate limiting (100 req/min por IP), Cloudflare
- **Brute Force:** Bloqueio progressivo, captcha após 3 tentativas
- **Session Hijacking:** HttpOnly cookies, secure flag

#### RNF013 - Rate Limiting
**Prioridade:** Média

- **Geral:** 100 requisições por minuto por IP
- **Login:** 5 tentativas por minuto por IP
- **API Pública:** 60 requisições por minuto por API key
- **WhatsApp/SMS:** 10 notificações por hora por paciente

#### RNF014 - Auditoria de Segurança
**Prioridade:** Média

- Scan de vulnerabilidades semanal (Snyk, OWASP ZAP)
- Análise de dependências (GitHub Dependabot)
- Penetration testing semestral
- Bug bounty program (futuro)

---

### 2.4 Usabilidade

#### RNF015 - Interface do Usuário
**Prioridade:** Alta

- Interface intuitiva (usuário deve aprender em **15 minutos**)
- Seguir padrões de design (Material Design ou similar)
- Feedback visual para todas as ações (loading, sucesso, erro)
- Mensagens de erro claras e acionáveis
- Tooltips explicativos em campos complexos

#### RNF016 - Responsividade
**Prioridade:** Alta

- Interface 100% responsiva (mobile, tablet, desktop)
- Mobile-first design
- Testes em:
  - Chrome/Edge (desktop e mobile)
  - Safari (desktop e mobile)
  - Firefox
- Touch-friendly (botões com mínimo 44x44px)

#### RNF017 - Acessibilidade (WCAG 2.1)
**Prioridade:** Média

- Conformidade com WCAG 2.1 nível AA
- Suporte a leitores de tela (NVDA, JAWS)
- Navegação por teclado
- Contraste adequado (mínimo 4.5:1)
- Alt text em imagens
- Labels em campos de formulário

#### RNF018 - Internacionalização
**Prioridade:** Baixa (Fase futura)

- Sistema preparado para múltiplos idiomas
- Português (pt-BR) como padrão
- Separação de strings do código
- Formato de data/hora localizável
- Moeda (R$ por padrão)

---

### 2.5 Manutenibilidade

#### RNF019 - Código
**Prioridade:** Alta

- Código limpo e bem documentado
- TypeScript em modo strict
- Padrões de projeto (SOLID, Clean Architecture)
- Comentários apenas onde necessário
- Nomenclatura clara e consistente

#### RNF020 - Testes
**Prioridade:** Alta

- **Cobertura mínima:** 80%
- Testes unitários para services e utils
- Testes de integração para APIs
- Testes E2E para fluxos críticos
- CI/CD com testes automatizados

#### RNF021 - Documentação
**Prioridade:** Média

- README atualizado
- Documentação da API (OpenAPI/Swagger)
- Diagramas de arquitetura (C4 Model)
- Guia de contribuição
- Changelog (semantic versioning)

#### RNF022 - Monitoramento
**Prioridade:** Alta

- APM (Application Performance Monitoring) - DataDog ou New Relic
- Error tracking - Sentry
- Logs estruturados (JSON) - ELK Stack ou CloudWatch
- Alertas automáticos:
  - Error rate > 1%
  - Response time p95 > 2s
  - Disponibilidade < 99%
  - Uso de CPU > 80%

#### RNF023 - CI/CD
**Prioridade:** Alta

- Pipeline automatizado (GitHub Actions)
- Deploy automático em staging (branch develop)
- Deploy manual em produção (branch main)
- Rollback automático em caso de erro
- Blue-green deployment

---

### 2.6 Portabilidade

#### RNF024 - Independência de Plataforma
**Prioridade:** Média

- Backend deve rodar em Linux, Windows, macOS
- Containerização com Docker
- Orquestração com Kubernetes (opcional)
- Infraestrutura como código (Terraform)

#### RNF025 - Independência de Cloud Provider
**Prioridade:** Baixa

- Evitar vendor lock-in
- Usar serviços compatíveis (S3 API, Postgres padrão)
- Possibilidade de migrar entre AWS, GCP, Azure

---

### 2.7 Compatibilidade

#### RNF026 - Navegadores Suportados
**Prioridade:** Alta

| Navegador | Versão Mínima |
|-----------|---------------|
| Chrome | Últimas 2 versões |
| Edge | Últimas 2 versões |
| Firefox | Últimas 2 versões |
| Safari | Últimas 2 versões |
| Opera | Últimas 2 versões |

#### RNF027 - Dispositivos Móveis
**Prioridade:** Alta

- iOS: 14+
- Android: 10+
- Progressive Web App (PWA) opcional

---

### 2.8 Conformidade Legal

#### RNF028 - LGPD (Lei Geral de Proteção de Dados)
**Prioridade:** Alta

**Requisitos:**
- Consentimento explícito para tratamento de dados
- Direito ao esquecimento (anonimização)
- Portabilidade de dados (exportação)
- Relatório de dados pessoais do titular
- DPO (Data Protection Officer) designado
- Política de Privacidade clara e acessível
- Termo de Uso aceito no cadastro
- Log de consentimentos
- Prazo de retenção de dados definido

**Implementação:**
- Criptografia de dados sensíveis
- Auditoria completa
- Processo de anonimização
- Endpoint para download de dados
- Base legal documentada

#### RNF029 - CFM/CNS (Regulamentações de Saúde)
**Prioridade:** Média

- Prontuário eletrônico em conformidade com CFM
- Confidencialidade médico-paciente
- Assinatura digital de documentos (ICP-Brasil)
- Certificação SBIS (futuro, se necessário)

#### RNF030 - Código de Defesa do Consumidor
**Prioridade:** Alta

- Transparência em preços e políticas
- Política de cancelamento clara
- SAC (canal de atendimento)
- Prazo de resposta de solicitações: 5 dias úteis

---

## 3. REGRAS DE NEGÓCIO

### 3.1 Agendamentos

#### RN001 - Conflito de Horários
**Descrição:** O sistema NÃO deve permitir agendamentos sobrepostos para o mesmo profissional.

**Validação:**
```
IF EXISTS agendamento no mesmo profissional
WHERE (novo_inicio < existente_fim AND novo_fim > existente_inicio)
THEN rejeitar agendamento
```

#### RN002 - Antecedência Mínima
**Descrição:** Pacientes só podem agendar online com antecedência mínima configurada pela clínica (padrão: 2 horas).

**Exceção:** Recepcionista e Admin podem agendar a qualquer momento.

#### RN003 - Antecedência Máxima
**Descrição:** Pacientes não podem agendar com mais de X dias de antecedência (padrão: 60 dias).

#### RN004 - Limite de Agendamentos Futuros
**Descrição:** Paciente pode ter apenas 1 agendamento futuro ativo por vez (configurável).

**Exceção:** Procedimentos recorrentes (ex: sessões de fisioterapia).

#### RN005 - Bloqueio por Faltas
**Descrição:** Paciente com N faltas consecutivas (padrão: 3) tem agendamento online bloqueado.

**Desbloqueio:** Apenas por Admin ou mediante contato com a clínica.

#### RN006 - Cancelamento
**Descrição:** Paciente pode cancelar até X horas antes (padrão: 24h).

**Penalidade:** Após N cancelamentos em Y dias, pode haver bloqueio temporário (configurável).

#### RN007 - Reagendamento
**Descrição:** Reagendamento cancela agendamento atual e cria novo, mantendo vínculo no histórico.

**Restrição:** Mesmas regras de cancelamento aplicam-se.

#### RN008 - Duração do Procedimento
**Descrição:** Duração do procedimento define o slot de tempo ocupado na agenda.

**Validação:** Duração deve ser múltipla do intervalo mínimo da clínica.

#### RN009 - Horário de Funcionamento
**Descrição:** Agendamentos só podem ser criados dentro do horário de funcionamento da clínica E do profissional.

#### RN010 - Status "Atendido" Gera Receita
**Descrição:** Marcar agendamento como "Atendido" gera automaticamente uma receita no módulo financeiro.

**Valor:** Preço do procedimento (editável).

---

### 3.2 Usuários e Acessos

#### RN011 - Usuário Único por CPF
**Descrição:** Cada CPF pode ter apenas UM usuário por tenant.

**Exceção:** Em caso de erro cadastral, Admin pode inativar e criar novo.

#### RN012 - E-mail Único
**Descrição:** E-mail deve ser único no tenant.

#### RN013 - Primeiro Usuário é Admin
**Descrição:** O primeiro usuário cadastrado em uma clínica é automaticamente Dono da Clínica (Admin).

#### RN014 - Admin Inativo Bloqueia Clínica
**Descrição:** Se não houver nenhum Admin ativo, sistema envia alerta crítico.

**Ação:** Suporte deve reativar ou criar novo Admin.

#### RN015 - Senha Temporária
**Descrição:** Senha temporária gerada deve expirar em 7 dias e forçar alteração no primeiro acesso.

---

### 3.3 Financeiro

#### RN016 - Receita Automática
**Descrição:** Status "Atendido" gera receita automaticamente com valor do procedimento.

**Editável:** Admin pode ajustar valor (desconto, acréscimo).

#### RN017 - Valor Zero Permitido
**Descrição:** Procedimentos podem ter valor R$ 0,00 (cortesia, retorno).

#### RN018 - Exclusão de Receita/Despesa
**Descrição:** Receitas e despesas NÃO podem ser excluídas, apenas marcadas como "Estornado" ou "Cancelado".

**Auditoria:** Mantém registro original.

#### RN019 - Categorias Customizáveis
**Descrição:** Admin pode criar categorias personalizadas de despesas.

**Restrição:** Não permitir exclusão de categoria em uso.

---

### 3.4 Notificações

#### RN020 - Notificação Automática de Agendamento
**Descrição:** Ao criar agendamento, sistema envia notificação automática ao paciente (e-mail/SMS/WhatsApp).

**Exceção:** Admin pode desabilitar envio manual.

#### RN021 - Lembrete Configurável
**Descrição:** Clínica configura antecedência do lembrete (24h, 48h, 1 semana).

#### RN022 - Não Enviar de Madrugada
**Descrição:** Notificações não devem ser enviadas entre 22h e 8h (horário local da clínica).

**Exceção:** Notificações urgentes (cancelamento pela clínica).

#### RN023 - Limite de Notificações
**Descrição:** Máximo de 10 notificações automáticas por dia para o mesmo paciente.

**Finalidade:** Evitar spam.

---

### 3.5 Multi-Tenant

#### RN024 - Isolamento Total
**Descrição:** Dados de diferentes tenants NUNCA devem ser compartilhados ou visíveis entre si.

**Técnica:** Schema-based isolation + validação em cada query.

#### RN025 - Subdomínio Único
**Descrição:** Cada clínica possui subdomínio único (ex: `clinica123.minhaclinica.com.br`).

**Geração:** Baseado no nome fantasia (slugify).

#### RN026 - Domínio Personalizado
**Descrição:** Clínica pode configurar domínio próprio (ex: `agendamento.clinicaxyz.com.br`).

**Requisito:** Configuração de DNS (CNAME).

---

### 3.6 Auditoria

#### RN027 - Logs Imutáveis
**Descrição:** Logs de auditoria NÃO podem ser alterados ou excluídos.

**Retenção:** Mínimo 5 anos.

#### RN028 - Ações Auditadas
**Descrição:** Todas as ações de criação, alteração e exclusão devem ser auditadas.

**Exceção:** Leituras (consultas) não são auditadas por padrão (alto volume).

---

## 4. REQUISITOS DE INTERFACE

### 4.1 Design

#### RI001 - Design System Consistente
**Descrição:** Interface deve seguir design system único e consistente (Material Design, Ant Design ou similar).

**Componentes:**
- Buttons
- Forms
- Modais
- Tables
- Cards
- Alerts
- Badges

#### RI002 - Tema Claro e Escuro
**Descrição:** Sistema deve oferecer tema claro e escuro.

**Padrão:** Tema claro.

**Armazenamento:** Preferência salva no perfil do usuário.

#### RI003 - Cores e Identidade Visual
**Descrição:** Clínica pode personalizar cores primárias e secundárias.

**Aplicação:**
- Logo
- Botões principais
- Cabeçalho
- Sidebar

#### RI004 - Tipografia
**Descrição:** Fontes legíveis e apropriadas para aplicação médica.

**Sugestões:**
- Inter
- Roboto
- Open Sans
- Nunito

**Tamanhos:**
- Corpo: 14-16px
- Títulos: 20-32px
- Pequeno: 12px

---

### 4.2 Navegação

#### RI005 - Menu Lateral
**Descrição:** Sidebar com menu de navegação principal.

**Itens (variam por perfil):**
- Dashboard
- Agendamentos
- Pacientes
- Profissionais
- Procedimentos
- Financeiro
- Relatórios
- Configurações
- Logs de Auditoria

#### RI006 - Breadcrumbs
**Descrição:** Indicar caminho de navegação (opcional).

**Exemplo:** Dashboard > Agendamentos > Novo Agendamento

#### RI007 - Busca Global
**Descrição:** Campo de busca global no topo da interface.

**Busca por:**
- Pacientes
- Profissionais
- Agendamentos (por ID)

---

### 4.3 Feedback Visual

#### RI008 - Loading States
**Descrição:** Indicadores de carregamento em todas as ações assíncronas.

**Tipos:**
- Spinners
- Skeleton loaders (preferencial)
- Progress bars

#### RI009 - Mensagens de Sucesso/Erro
**Descrição:** Feedback claro após cada ação.

**Tipos:**
- Toast notifications (canto superior direito)
- Alerts inline
- Modais de confirmação

**Duração:** Toasts desaparecem após 3-5 segundos.

#### RI010 - Validação de Formulários
**Descrição:** Validação em tempo real com mensagens claras.

**Exibição:**
- Erro abaixo do campo
- Borda vermelha no campo com erro
- Campo verde quando válido

---

### 4.4 Responsividade

#### RI011 - Breakpoints
**Descrição:** Design responsivo com breakpoints padrão.

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

#### RI012 - Menu Mobile
**Descrição:** Em mobile, menu lateral vira hamburger menu.

#### RI013 - Tabelas Responsivas
**Descrição:** Tabelas devem adaptar-se a telas pequenas (scroll horizontal ou cards).

---

## 5. REQUISITOS DE SEGURANÇA E COMPLIANCE

### 5.1 LGPD - Lei Geral de Proteção de Dados

#### RS001 - Consentimento
**Descrição:** Obter consentimento explícito para tratamento de dados pessoais.

**Implementação:**
- Checkbox de aceite no cadastro
- Termo de Privacidade claro e acessível
- Registro de data/hora do consentimento
- Possibilidade de revogação

#### RS002 - Direito ao Esquecimento
**Descrição:** Titular pode solicitar exclusão de seus dados.

**Implementação:**
- Processo de anonimização (não exclusão física)
- Manter histórico para fins legais (5 anos)
- Anonimizar: nome, CPF, e-mail, telefone, endereço
- Prazo: até 15 dias

#### RS003 - Portabilidade de Dados
**Descrição:** Titular pode solicitar exportação de seus dados.

**Formato:** JSON ou CSV

**Conteúdo:**
- Dados cadastrais
- Histórico de agendamentos
- Prontuário (quando aplicável)
- Logs de acesso

**Prazo:** até 15 dias

#### RS004 - DPO - Data Protection Officer
**Descrição:** Designar responsável pela proteção de dados.

**Função:**
- Orientar sobre LGPD
- Atender solicitações de titulares
- Comunicação com ANPD

#### RS005 - Política de Privacidade
**Descrição:** Documento claro explicando tratamento de dados.

**Conteúdo:**
- Quais dados são coletados
- Finalidade do tratamento
- Base legal
- Compartilhamento (se houver)
- Direitos do titular
- Contato do DPO

**Acesso:** Link visível em todas as páginas.

#### RS006 - Termo de Uso
**Descrição:** Documento com regras de uso do sistema.

**Aceite:** Obrigatório no primeiro acesso.

#### RS007 - Criptografia de Dados Sensíveis
**Descrição:** Dados sensíveis devem ser criptografados.

**Dados a criptografar:**
- CPF
- RG
- Dados clínicos (alergias, observações)
- Prontuário

**Algoritmo:** AES-256-GCM

#### RS008 - Retenção de Dados
**Descrição:** Definir prazo de retenção.

**Prazos:**
- Dados cadastrais: 5 anos após última consulta (CFM)
- Logs de auditoria: 5 anos
- Backups: 30 dias

**Após prazo:** Anonimizar ou excluir.

---

### 5.2 Segurança da Informação

#### RS009 - Princípio do Menor Privilégio
**Descrição:** Usuários têm apenas acessos necessários para suas funções.

#### RS010 - Separação de Ambientes
**Descrição:** Ambientes development, staging e production separados.

**Restrição:** Dados de produção NÃO devem ser usados em dev/staging.

#### RS011 - Secrets Management
**Descrição:** Credenciais e chaves NÃO podem estar no código.

**Solução:** Variáveis de ambiente, AWS Secrets Manager, HashiCorp Vault.

#### RS012 - Firewall e WAF
**Descrição:** Proteção contra ataques via firewall e WAF (Web Application Firewall).

**Provedor:** Cloudflare WAF ou AWS WAF.

#### RS013 - Logs de Segurança
**Descrição:** Registrar eventos de segurança.

**Eventos:**
- Tentativas de login falhadas
- Acessos não autorizados
- Mudanças de permissão
- Exportação de dados

#### RS014 - Penetration Testing
**Descrição:** Testes de invasão periódicos.

**Frequência:** Semestral.

**Escopo:** Toda a aplicação.

#### RS015 - Plano de Resposta a Incidentes
**Descrição:** Procedimento documentado para resposta a incidentes de segurança.

**Conteúdo:**
- Identificação do incidente
- Contenção
- Erradicação
- Recuperação
- Lições aprendidas
- Notificação de afetados (LGPD)

**Prazo notificação (LGPD):** 72 horas após ciência do incidente.

---

### 5.3 Compliance Saúde

#### RS016 - Confidencialidade Médico-Paciente
**Descrição:** Informações clínicas são sigilosas.

**Acesso:**
- Profissional que atendeu
- Admin (justificado)
- Paciente (seu próprio histórico)

#### RS017 - Assinatura Digital de Documentos
**Descrição:** Documentos médicos podem requerer assinatura digital (ICP-Brasil).

**Aplicação:**
- Receitas (receita digital)
- Atestados
- Relatórios

**Fase:** 3 (opcional no MVP)

#### RS018 - Certificação SBIS
**Descrição:** Para prontuário eletrônico completo, buscar certificação SBIS (Sociedade Brasileira de Informática em Saúde).

**Requisitos SBIS:**
- Segurança
- Privacidade
- Autenticação
- Integridade
- Disponibilidade

**Fase:** Futura (se necessário)

---

## GLOSSÁRIO

- **Tenant:** Clínica isolada no sistema multi-tenant
- **Schema:** Namespace isolado no banco de dados PostgreSQL
- **JWT:** JSON Web Token - padrão de autenticação
- **RBAC:** Role-Based Access Control - controle de acesso por papéis
- **ORM:** Object-Relational Mapping - mapeamento objeto-relacional
- **SLA:** Service Level Agreement - acordo de nível de serviço
- **RTO:** Recovery Time Objective - tempo para recuperação
- **RPO:** Recovery Point Objective - ponto de recuperação de dados
- **API:** Application Programming Interface
- **CRUD:** Create, Read, Update, Delete
- **LGPD:** Lei Geral de Proteção de Dados
- **DPO:** Data Protection Officer
- **WAF:** Web Application Firewall
- **CDN:** Content Delivery Network
- **p95:** Percentil 95 (95% das requisições)
- **MRR:** Monthly Recurring Revenue
- **NPS:** Net Promoter Score
- **CAC:** Customer Acquisition Cost
- **No-show:** Falta sem aviso prévio

---

## CONTROLE DE VERSÃO

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | 05/02/2026 | Sistema | Versão inicial completa |

---

**Documento gerado automaticamente para o projeto Minha Clínica**  
**Todos os direitos reservados © 2026**
