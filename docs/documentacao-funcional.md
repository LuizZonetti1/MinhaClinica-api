# Minha Clínica - Documentação Funcional do Produto

## Sistema SaaS para Gestão de Clínicas de Saúde

---

## 1. VISÃO GERAL DO PRODUTO

**Minha Clínica** é uma plataforma SaaS (Software as a Service) desenvolvida para clínicas de saúde de pequeno e médio porte, incluindo clínicas médicas, odontológicas, estéticas, de fisioterapia e demais especialidades da área da saúde.

O sistema foi projetado para ser **simples, intuitivo e focado no fluxo de trabalho real** das clínicas, permitindo:
- Gestão completa de agendamentos
- Controle financeiro básico
- Histórico de pacientes
- Portal de autoatendimento para pacientes
- Notificações automatizadas

---

## 2. ARQUITETURA MULTI-TENANT

### 2.1 Conceito
O sistema opera em modelo **multi-tenant**, onde cada clínica representa um **tenant isolado**. Isso significa que:

- Cada clínica possui seus próprios dados completamente segregados
- Não há compartilhamento de informações entre clínicas distintas
- Um único código-base atende múltiplas clínicas simultaneamente
- Cada clínica acessa o sistema através de um subdomínio próprio (ex: `clinicaexemplo.minhaclinica.com.br`) ou domínio personalizado

### 2.2 Cadastro de Nova Clínica
O processo de onboarding de uma nova clínica inclui:

1. **Dados Cadastrais da Clínica:**
   - Razão Social
   - Nome Fantasia
   - CNPJ
   - Endereço completo (CEP, logradouro, número, complemento, bairro, cidade, estado)
   - Telefone principal
   - E-mail institucional
   - Logo da clínica (para personalização do sistema)

2. **Configurações Iniciais:**
   - Horário de funcionamento (dias da semana e horários)
   - Fuso horário
   - Intervalo mínimo entre agendamentos (ex: 15, 30, 60 minutos)
   - Antecedência mínima para agendamento online (ex: 2 horas)
   - Antecedência máxima para agendamento online (ex: 60 dias)
   - Política de cancelamento (ex: até 24h antes)

3. **Criação do Usuário Administrador:**
   - O primeiro usuário cadastrado será automaticamente o **Dono da Clínica (Admin)**

---

## 3. USUÁRIOS E PERFIS DE ACESSO

### 3.1 Perfis do Sistema

O sistema possui **quatro perfis de usuário** com permissões distintas:

| Perfil | Descrição |
|--------|-----------|
| **Dono da Clínica (Admin)** | Acesso total ao sistema, incluindo configurações, financeiro e relatórios |
| **Recepcionista** | Gestão de agendamentos, cadastro de pacientes, atendimento presencial |
| **Profissional de Saúde** | Acesso à própria agenda, prontuário dos pacientes, registro de atendimentos |
| **Paciente** | Acesso ao portal do paciente para visualizar/gerenciar seus agendamentos |

### 3.2 Matriz de Permissões Detalhada

#### 3.2.1 Dono da Clínica (Admin)
- ✅ Cadastrar, editar e desativar usuários (recepcionistas e profissionais)
- ✅ Configurar dados da clínica
- ✅ Cadastrar e gerenciar procedimentos e preços
- ✅ Visualizar agenda de todos os profissionais
- ✅ Criar, editar e cancelar agendamentos
- ✅ Acessar módulo financeiro completo (receitas e despesas)
- ✅ Visualizar relatórios e dashboard
- ✅ Acessar logs de auditoria
- ✅ Configurar horários de funcionamento
- ✅ Gerenciar notificações automáticas

#### 3.2.2 Recepcionista
- ✅ Cadastrar novos pacientes
- ✅ Editar dados de pacientes
- ✅ Visualizar agenda de todos os profissionais
- ✅ Criar, editar e cancelar agendamentos
- ✅ Confirmar presença de pacientes
- ✅ Registrar faltas (no-show)
- ❌ Acessar módulo financeiro
- ❌ Acessar relatórios gerenciais
- ❌ Cadastrar usuários
- ❌ Alterar configurações da clínica

#### 3.2.3 Profissional de Saúde
- ✅ Visualizar **apenas sua própria agenda**
- ✅ Visualizar dados dos pacientes agendados consigo
- ✅ Registrar atendimentos e evoluções no prontuário
- ✅ Marcar consulta como realizada
- ✅ Bloquear horários em sua agenda (férias, indisponibilidade)
- ❌ Criar agendamentos (apenas visualizar)
- ❌ Acessar agenda de outros profissionais
- ❌ Acessar módulo financeiro
- ❌ Cadastrar novos pacientes

#### 3.2.4 Paciente
- ✅ Visualizar seus próprios agendamentos
- ✅ Agendar consultas (quando habilitado pela clínica)
- ✅ Cancelar ou reagendar consultas (respeitando política da clínica)
- ✅ Visualizar histórico de consultas realizadas
- ✅ Atualizar dados pessoais
- ✅ Confirmar agendamentos
- ❌ Acessar dados de outros pacientes
- ❌ Visualizar informações financeiras

---

## 4. CADASTRO E GESTÃO DE PACIENTES

### 4.1 Dados do Paciente

O cadastro de paciente contempla:

**Dados Pessoais (Obrigatórios):**
- Nome completo
- CPF
- Data de nascimento
- Sexo
- Telefone celular (com DDD)
- E-mail

**Dados Pessoais (Opcionais):**
- RG
- Telefone fixo
- Endereço completo

**Dados Clínicos (Opcionais):**
- Convênio/Plano de saúde
- Número da carteirinha
- Alergias conhecidas
- Observações gerais

### 4.2 Fluxo de Cadastro

**Cadastro pela Recepção:**
1. Recepcionista acessa o módulo de pacientes
2. Preenche os dados obrigatórios
3. Sistema gera automaticamente uma **senha temporária**
4. Paciente recebe credenciais por e-mail e/ou SMS
5. No primeiro acesso, paciente é obrigado a alterar a senha

**Cadastro pelo Próprio Paciente (Portal):**
1. Paciente acessa o portal da clínica
2. Clica em "Criar conta"
3. Preenche formulário de cadastro
4. Confirma e-mail através de link enviado
5. Cadastro liberado para uso

### 4.3 Busca e Filtros
- Busca por nome, CPF, telefone ou e-mail
- Filtro por status (ativo/inativo)
- Listagem de pacientes com próxima consulta agendada
- Listagem de pacientes sem agendamentos há X dias

---

## 5. PROFISSIONAIS DE SAÚDE

### 5.1 Cadastro de Profissional

**Dados Obrigatórios:**
- Nome completo
- CPF
- E-mail
- Telefone
- Conselho profissional (CRM, CRO, CREFITO, etc.)
- Número do registro
- UF do registro
- Especialidade(s)

**Configurações de Agenda:**
- Dias de atendimento (ex: segunda a sexta)
- Horário de início e término do atendimento
- Intervalo para almoço
- Duração padrão de consulta
- Procedimentos que realiza

### 5.2 Especialidades
O sistema permite cadastrar múltiplas especialidades:
- Cada profissional pode ter uma ou mais especialidades
- Especialidades são utilizadas para filtro no agendamento online
- Exemplos: Clínica Geral, Cardiologia, Ortodontia, Implantodontia, Fisioterapia Ortopédica

---

## 6. PROCEDIMENTOS

### 6.1 Cadastro de Procedimentos

Cada procedimento possui:
- **Nome:** Descrição clara do procedimento (ex: "Consulta Inicial", "Limpeza Dental", "Sessão de Fisioterapia")
- **Código interno:** Identificador único opcional
- **Duração estimada:** Tempo em minutos (ex: 30, 45, 60, 90 minutos)
- **Preço:** Valor em reais (ex: R$ 150,00)
- **Profissionais vinculados:** Quais profissionais realizam este procedimento
- **Disponível para agendamento online:** Sim/Não
- **Status:** Ativo/Inativo

### 6.2 Exemplos de Procedimentos

| Procedimento | Duração | Preço |
|--------------|---------|-------|
| Consulta de Avaliação | 30 min | R$ 200,00 |
| Retorno | 15 min | Cortesia |
| Limpeza Dental | 45 min | R$ 180,00 |
| Clareamento Dental | 90 min | R$ 800,00 |
| Sessão de Fisioterapia | 50 min | R$ 120,00 |
| Aplicação de Botox | 30 min | R$ 1.200,00 |

---

## 7. AGENDAMENTO DE CONSULTAS

### 7.1 Cálculo Automático de Horários Disponíveis

O sistema calcula automaticamente os horários disponíveis baseando-se em:

1. **Horário de funcionamento da clínica**
2. **Horário de atendimento do profissional**
3. **Duração do procedimento selecionado**
4. **Agendamentos já existentes**
5. **Bloqueios de agenda**

**Exemplo Prático:**
- Profissional atende das 08:00 às 12:00
- Procedimento "Limpeza Dental" tem duração de 45 minutos
- Já existe agendamento às 09:00 de um procedimento de 30 minutos

**Horários disponíveis calculados:**
- 08:00 ✅
- 09:30 ✅
- 10:15 ✅
- 11:00 ✅
- 11:45 ❌ (não caberia os 45 minutos antes das 12:00)

### 7.2 Canais de Agendamento

#### 7.2.1 Agendamento pela Recepção
1. Recepcionista seleciona ou cadastra o paciente
2. Seleciona o profissional desejado
3. Seleciona o procedimento
4. Sistema exibe calendário com dias disponíveis
5. Ao selecionar o dia, exibe horários disponíveis
6. Recepcionista confirma o agendamento
7. Sistema envia notificação automática ao paciente

#### 7.2.2 Agendamento pelo Portal do Paciente (Website)
1. Paciente faz login no portal
2. Clica em "Novo Agendamento"
3. Seleciona a especialidade ou profissional
4. Seleciona o procedimento (apenas os disponíveis online)
5. Seleciona data e horário
6. Confirma agendamento
7. Recebe confirmação por e-mail/SMS
8. Agendamento aparece com status "Aguardando Confirmação" (opcional, configurável)

#### 7.2.3 Agendamento via WhatsApp
O sistema oferece integração com WhatsApp através de chatbot:

1. Paciente envia mensagem para o número da clínica
2. Bot apresenta menu de opções
3. Paciente seleciona "Agendar Consulta"
4. Bot solicita identificação (CPF ou telefone)
5. Se paciente já cadastrado, prossegue; se não, inicia cadastro simplificado
6. Bot apresenta profissionais disponíveis
7. Bot apresenta datas e horários
8. Paciente confirma
9. Agendamento é criado no sistema

**Funcionalidades do Bot WhatsApp:**
- Agendar consulta
- Confirmar agendamento existente
- Cancelar agendamento
- Consultar próximos agendamentos
- Falar com a recepção (transfere para atendente humano)

### 7.3 Status dos Agendamentos

| Status | Descrição | Cor |
|--------|-----------|-----|
| **Agendado** | Consulta marcada, aguardando confirmação | 🔵 Azul |
| **Confirmado** | Paciente confirmou presença | 🟢 Verde |
| **Aguardando** | Paciente chegou e está na recepção | 🟡 Amarelo |
| **Em Atendimento** | Paciente está sendo atendido | 🟣 Roxo |
| **Atendido** | Consulta realizada com sucesso | ⚫ Cinza |
| **Cancelado** | Consulta cancelada (pelo paciente ou clínica) | 🔴 Vermelho |
| **Não Compareceu** | Paciente faltou sem avisar (no-show) | 🟠 Laranja |

### 7.4 Fluxo Completo de um Agendamento

```
[Agendado] → [Confirmado] → [Aguardando] → [Em Atendimento] → [Atendido]
                    ↓              ↓
              [Cancelado]    [Não Compareceu]
```

### 7.5 Regras de Negócio para Agendamentos

- **Conflito de horários:** Sistema impede agendamentos sobrepostos para o mesmo profissional
- **Antecedência mínima:** Paciente só pode agendar online com X horas de antecedência (configurável)
- **Antecedência máxima:** Limite de dias para agendamento futuro (configurável)
- **Cancelamento:** Paciente pode cancelar até X horas antes (configurável, ex: 24h)
- **Reagendamento:** Permitido dentro da política de cancelamento
- **Limite de faltas:** Sistema pode bloquear agendamento online para pacientes com histórico de no-show (configurável)

---

## 8. AGENDA DOS PROFISSIONAIS

### 8.1 Visualização

**Para Recepcionistas e Admin:**
- Visualização em formato de calendário (dia, semana, mês)
- Filtro por profissional
- Filtro por status do agendamento
- Visualização simultânea de múltiplos profissionais (lado a lado)

**Para Profissionais:**
- Visualização apenas da própria agenda
- Não tem acesso à agenda de colegas

### 8.2 Bloqueio de Horários

Profissionais podem bloquear períodos em sua agenda:
- **Férias**
- **Folgas**
- **Compromissos pessoais**
- **Reuniões**
- **Cursos e treinamentos**

O bloqueio impede que novos agendamentos sejam feitos no período.

### 8.3 Cores e Legenda

A agenda utiliza cores para facilitar a visualização:
- Cada procedimento pode ter uma cor específica
- Status do agendamento também é indicado por cor
- Agendamentos de primeira vez podem ser destacados

---

## 9. GESTÃO FINANCEIRA

### 9.1 Escopo do Módulo Financeiro

O módulo financeiro do **Minha Clínica** é **simplificado**, focado em:
- Registro de receitas provenientes de procedimentos realizados
- Registro de despesas gerais
- Visão consolidada de entradas e saídas
- **Não inclui controle de estoque**

### 9.2 Receitas (Entradas)

#### 9.2.1 Receita Automática
Quando um agendamento é marcado como "Atendido", o sistema pode:
- Gerar automaticamente um registro de receita com o valor do procedimento
- Permitir ajuste manual do valor (desconto, acréscimo)
- Registrar forma de pagamento

#### 9.2.2 Receita Manual
O administrador pode registrar receitas adicionais:
- Venda de produtos
- Serviços avulsos
- Outras receitas

#### 9.2.3 Dados da Receita
- Data do recebimento
- Paciente (quando aplicável)
- Profissional responsável (quando aplicável)
- Procedimento realizado (quando aplicável)
- Descrição
- Valor
- Forma de pagamento (Dinheiro, Cartão Débito, Cartão Crédito, PIX, Transferência)
- Status (Pago, Pendente)

### 9.3 Despesas (Saídas)

O administrador pode registrar despesas operacionais:

**Exemplos:**
| Data | Descrição | Categoria | Valor |
|------|-----------|-----------|-------|
| 05/02/2026 | Compra de materiais odontológicos | Materiais | R$ 10.000,00 |
| 05/02/2026 | Aluguel do consultório | Aluguel | R$ 3.500,00 |
| 05/02/2026 | Conta de luz | Utilidades | R$ 450,00 |
| 05/02/2026 | Salário recepcionista | Folha de Pagamento | R$ 2.500,00 |

**Dados da Despesa:**
- Data
- Descrição
- Categoria (cadastrável pelo admin)
- Valor
- Forma de pagamento
- Fornecedor (opcional)
- Observações

### 9.4 Categorias de Despesas

Categorias pré-cadastradas (editáveis):
- Aluguel
- Materiais e Insumos
- Folha de Pagamento
- Utilidades (água, luz, internet)
- Marketing
- Manutenção
- Impostos e Taxas
- Outros

### 9.5 Relatórios Financeiros

- **Resumo Mensal:** Total de receitas vs. despesas
- **Fluxo de Caixa:** Visão diária/semanal de entradas e saídas
- **Receitas por Profissional:** Quanto cada profissional gerou
- **Receitas por Procedimento:** Procedimentos mais rentáveis
- **Despesas por Categoria:** Onde o dinheiro está sendo gasto
- **Comparativo Mensal:** Evolução ao longo dos meses

---

## 10. PRONTUÁRIO E HISTÓRICO DO PACIENTE

### 10.1 Histórico de Consultas

O sistema mantém registro completo de todas as consultas:
- Data e horário
- Profissional que atendeu
- Procedimento realizado
- Status final (atendido, cancelado, falta)
- Valor cobrado

### 10.2 Prontuário Eletrônico (Simplificado)

Após cada atendimento, o profissional pode registrar:

**Evolução/Anamnese:**
- Campo de texto livre para anotações clínicas
- Queixa principal
- Observações do atendimento
- Conduta adotada

**Anexos:**
- Upload de exames
- Upload de imagens
- Upload de documentos

**Importante:** O sistema armazena os registros, mas **não substitui** um prontuário eletrônico certificado pela SBIS. Para clínicas que necessitam de PEP completo, recomenda-se integração com sistemas especializados.

### 10.3 Acesso ao Histórico

- **Profissional:** Acessa histórico de pacientes que atendeu
- **Admin:** Acessa histórico de todos os pacientes
- **Paciente:** Acessa apenas seu próprio histórico (consultas realizadas, não as anotações clínicas)

---

## 11. SISTEMA DE NOTIFICAÇÕES

### 11.1 Tipos de Notificações

#### 11.1.1 Confirmação de Agendamento
- **Quando:** Imediatamente após o agendamento ser criado
- **Conteúdo:** Data, horário, profissional, procedimento, endereço da clínica
- **Canais:** E-mail, SMS, WhatsApp

#### 11.1.2 Lembrete de Consulta
- **Quando:** Configurável (24h antes, 48h antes, 1 semana antes)
- **Conteúdo:** Lembrete com dados da consulta e link para confirmar/cancelar
- **Canais:** E-mail, SMS, WhatsApp

#### 11.1.3 Solicitação de Confirmação
- **Quando:** X dias antes da consulta
- **Conteúdo:** Solicita que paciente confirme presença
- **Canais:** WhatsApp (com botões de resposta)

#### 11.1.4 Cancelamento
- **Quando:** Imediatamente após cancelamento
- **Conteúdo:** Aviso de cancelamento e opção de reagendar
- **Canais:** E-mail, SMS, WhatsApp

#### 11.1.5 Reagendamento
- **Quando:** Após alteração de data/hora
- **Conteúdo:** Novos dados do agendamento
- **Canais:** E-mail, SMS, WhatsApp

### 11.2 Configuração de Notificações

O administrador pode configurar:
- Quais notificações estão ativas
- Quais canais utilizar para cada tipo
- Antecedência dos lembretes
- Texto personalizado das mensagens

### 11.3 Templates de Mensagens

O sistema oferece templates personalizáveis com variáveis:
- `{PACIENTE_NOME}` - Nome do paciente
- `{DATA}` - Data da consulta
- `{HORARIO}` - Horário da consulta
- `{PROFISSIONAL}` - Nome do profissional
- `{PROCEDIMENTO}` - Procedimento agendado
- `{CLINICA_NOME}` - Nome da clínica
- `{CLINICA_ENDERECO}` - Endereço da clínica
- `{CLINICA_TELEFONE}` - Telefone da clínica
- `{LINK_CONFIRMACAO}` - Link para confirmar consulta
- `{LINK_CANCELAMENTO}` - Link para cancelar consulta

**Exemplo de mensagem:**
```
Olá, {PACIENTE_NOME}! 

Sua consulta está confirmada:
📅 {DATA} às {HORARIO}
👨‍⚕️ {PROFISSIONAL}
📍 {CLINICA_ENDERECO}

Para confirmar sua presença, clique aqui: {LINK_CONFIRMACAO}

Em caso de dúvidas, entre em contato: {CLINICA_TELEFONE}
```

---

## 12. LOGS DE AUDITORIA

### 12.1 Objetivo

O sistema mantém registro detalhado de todas as ações relevantes para garantir:
- Rastreabilidade
- Segurança
- Conformidade
- Resolução de disputas

### 12.2 Ações Registradas

**Agendamentos:**
- Criação de agendamento (quem criou, quando, para quem)
- Alteração de data/hora
- Alteração de status
- Cancelamento (motivo, se informado)

**Pacientes:**
- Cadastro de novo paciente
- Alteração de dados cadastrais

**Usuários:**
- Login no sistema
- Falhas de login
- Alteração de senha
- Criação/desativação de usuários

**Financeiro:**
- Registro de receita
- Registro de despesa
- Alteração de registros financeiros

### 12.3 Dados do Log

Cada registro de auditoria contém:
- **Data e hora:** Timestamp preciso da ação
- **Usuário:** Quem realizou a ação
- **Ação:** O que foi feito
- **Entidade:** O que foi afetado (agendamento, paciente, etc.)
- **Detalhes:** Dados anteriores e novos (quando aplicável)
- **IP:** Endereço IP de origem
- **Dispositivo:** Identificação do navegador/dispositivo

### 12.4 Acesso aos Logs

- Apenas o **Admin** tem acesso aos logs de auditoria
- Logs são somente leitura (não podem ser alterados ou excluídos)
- Filtros por data, usuário, tipo de ação
- Exportação em formato CSV/Excel

---

## 13. AUTENTICAÇÃO E SEGURANÇA

### 13.1 Sistema de Login

**Credenciais:**
- E-mail + Senha
- Opção de "Lembrar-me" (sessão estendida)

**Recuperação de Senha:**
1. Usuário clica em "Esqueci minha senha"
2. Informa o e-mail cadastrado
3. Recebe link de redefinição por e-mail
4. Link expira em 2 horas
5. Usuário define nova senha

### 13.2 Política de Senhas

- Mínimo de 8 caracteres
- Pelo menos uma letra maiúscula
- Pelo menos uma letra minúscula
- Pelo menos um número
- Recomendado: caractere especial

### 13.3 Senha para Pacientes Criados pela Recepção

Quando a recepção cadastra um novo paciente:
1. Sistema gera senha temporária aleatória (ex: `MinhaClin@2026`)
2. Credenciais são enviadas por e-mail ao paciente
3. No primeiro login, sistema obriga alteração de senha
4. Senha temporária expira em 7 dias se não utilizada

### 13.4 Controle de Sessão

- Sessão expira após 8 horas de inatividade
- Logout automático ao fechar o navegador (se não marcou "Lembrar-me")
- Apenas uma sessão ativa por usuário (logout automático de sessões anteriores)

### 13.5 Proteções de Segurança

- **HTTPS:** Toda comunicação é criptografada
- **Bloqueio por tentativas:** Após 5 tentativas falhas, conta é bloqueada por 15 minutos
- **Tokens:** Utilização de JWT com expiração
- **LGPD:** Conformidade com Lei Geral de Proteção de Dados

---

## 14. PORTAL DO PACIENTE

### 14.1 Acesso

- URL dedicada: `portal.minhaclinica.com.br` ou área no subdomínio da clínica
- Login com e-mail e senha
- Design responsivo (funciona em celular, tablet e computador)

### 14.2 Funcionalidades

#### 14.2.1 Dashboard do Paciente
- Próximas consultas agendadas
- Lembretes pendentes de confirmação
- Acesso rápido às principais ações

#### 14.2.2 Meus Agendamentos
- Lista de consultas futuras
- Lista de consultas passadas
- Para cada consulta:
  - Data e horário
  - Profissional
  - Procedimento
  - Status
  - Botão para confirmar (se pendente)
  - Botão para cancelar (se dentro do prazo)
  - Botão para reagendar (se dentro do prazo)

#### 14.2.3 Novo Agendamento
1. Selecionar especialidade ou profissional
2. Selecionar procedimento
3. Visualizar calendário com disponibilidade
4. Selecionar data
5. Selecionar horário
6. Confirmar agendamento

#### 14.2.4 Meu Histórico
- Lista de todas as consultas realizadas
- Filtro por período
- Filtro por profissional
- Visualização de detalhes básicos de cada consulta

#### 14.2.5 Meus Dados
- Visualizar dados cadastrais
- Editar dados de contato (telefone, e-mail, endereço)
- Alterar senha

### 14.3 Restrições do Portal

O paciente **NÃO pode:**
- Acessar dados de outros pacientes
- Ver anotações clínicas/prontuário detalhado
- Ver informações financeiras da clínica
- Cancelar consultas fora do prazo permitido
- Agendar se tiver bloqueio por faltas

---

## 15. FLUXO DE TRABALHO DA RECEPÇÃO

### 15.1 Início do Dia

1. Login no sistema
2. Verificar agenda do dia (todos os profissionais)
3. Identificar consultas ainda não confirmadas
4. Entrar em contato com pacientes para confirmação
5. Atualizar status das consultas conforme retorno

### 15.2 Chegada de Paciente

1. Paciente chega à recepção
2. Recepcionista localiza o agendamento
3. Altera status para **"Aguardando"**
4. Confirma/atualiza dados cadastrais se necessário
5. Direciona paciente para sala de espera

### 15.3 Durante o Atendimento

1. Profissional chama o paciente
2. Recepcionista pode alterar status para **"Em Atendimento"** (ou profissional faz isso)
3. Ao final, status é alterado para **"Atendido"**

### 15.4 Novo Agendamento Presencial

1. Paciente solicita agendamento na recepção
2. Recepcionista verifica se paciente está cadastrado
3. Se não, realiza cadastro rápido
4. Seleciona profissional e procedimento
5. Verifica disponibilidade e oferece opções ao paciente
6. Confirma agendamento
7. Sistema envia confirmação automática

### 15.5 Atendimento Telefônico

Mesmo fluxo do presencial, porém:
- Confirmar identidade do paciente (nome, CPF, data de nascimento)
- Confirmar telefone e e-mail para envio de confirmação

### 15.6 Gestão de Faltas (No-Show)

1. Verificar horário da consulta
2. Se paciente não chegou após tolerância (ex: 15 min)
3. Tentar contato telefônico
4. Se não conseguir contato, marcar como **"Não Compareceu"**
5. Sistema registra a falta no histórico do paciente

### 15.7 Encerramento do Dia

1. Revisar consultas do dia
2. Garantir que todos os status estão corretos
3. Verificar agenda do dia seguinte
4. Identificar pacientes que precisam de confirmação

---

## 16. FLUXO DE TRABALHO DO PROFISSIONAL

### 16.1 Início do Dia

1. Login no sistema
2. Visualizar agenda do dia
3. Revisar histórico dos pacientes que serão atendidos
4. Preparar-se para os atendimentos

### 16.2 Durante o Atendimento

1. Chamar o paciente
2. Alterar status para **"Em Atendimento"** (opcional, pode ser feito pela recepção)
3. Realizar o atendimento
4. Registrar evolução/anotações no prontuário
5. Anexar documentos se necessário
6. Finalizar atendimento
7. Alterar status para **"Atendido"**

### 16.3 Bloqueio de Agenda

1. Acessar "Minha Agenda"
2. Selecionar período a bloquear
3. Informar motivo (visível apenas para admin)
4. Confirmar bloqueio
5. Sistema impede novos agendamentos no período

### 16.4 Visualização de Pacientes

O profissional pode visualizar:
- Lista de pacientes agendados consigo
- Histórico de consultas de cada paciente (apenas as realizadas por ele)
- Dados cadastrais básicos
- Anotações de consultas anteriores

---

## 17. DASHBOARD DO ADMINISTRADOR

### 17.1 Visão Geral

O dashboard apresenta indicadores-chave em tempo real:

**Hoje:**
- Consultas agendadas
- Consultas confirmadas
- Consultas realizadas
- Cancelamentos
- Faltas (no-show)

**Financeiro (Mês Atual):**
- Total de receitas
- Total de despesas
- Saldo (receitas - despesas)
- Comparativo com mês anterior

### 17.2 Gráficos e Indicadores

- **Agendamentos por dia/semana/mês:** Evolução do volume de consultas
- **Taxa de ocupação por profissional:** % de horários ocupados vs. disponíveis
- **Taxa de confirmação:** % de consultas confirmadas
- **Taxa de no-show:** % de faltas
- **Receita por profissional:** Ranking de faturamento
- **Procedimentos mais realizados:** Top 10 procedimentos
- **Novos pacientes:** Quantidade de cadastros por período

### 17.3 Alertas e Notificações

O dashboard exibe alertas como:
- ⚠️ 5 consultas de hoje ainda não confirmadas
- ⚠️ 3 pacientes com histórico de faltas agendados hoje
- ⚠️ Profissional X com baixa ocupação esta semana
- ⚠️ Despesas do mês 20% acima do mês anterior

### 17.4 Relatórios Disponíveis

- Relatório de agendamentos (período, profissional, status)
- Relatório financeiro detalhado
- Relatório de produtividade por profissional
- Relatório de pacientes (novos, ativos, inativos)
- Relatório de no-show
- Exportação em PDF e Excel

---

## 18. CONFIGURAÇÕES DO SISTEMA

### 18.1 Dados da Clínica
- Informações cadastrais
- Logo e identidade visual
- Horário de funcionamento
- Feriados e dias sem atendimento

### 18.2 Configurações de Agendamento
- Intervalo mínimo entre consultas
- Antecedência mínima para agendamento online
- Antecedência máxima para agendamento online
- Tempo de tolerância para atraso
- Limite de faltas para bloqueio
- Política de cancelamento

### 18.3 Configurações de Notificações
- Ativar/desativar cada tipo de notificação
- Canais de envio (e-mail, SMS, WhatsApp)
- Horários para envio de lembretes
- Templates de mensagens

### 18.4 Configurações Financeiras
- Categorias de despesas
- Formas de pagamento aceitas
- Integrações (futuros gateways de pagamento)

### 18.5 Integrações
- API WhatsApp Business
- Gateway de SMS
- Serviço de e-mail (SMTP ou provedor)
- Webhook para integrações externas (futuro)

---

## 19. REQUISITOS NÃO-FUNCIONAIS

### 19.1 Performance
- Tempo de resposta < 2 segundos para operações comuns
- Suporte a múltiplos usuários simultâneos
- Escalabilidade horizontal

### 19.2 Disponibilidade
- SLA de 99,5% de disponibilidade
- Backups diários automatizados
- Recuperação de desastres

### 19.3 Segurança
- Criptografia em trânsito (TLS 1.3)
- Criptografia de dados sensíveis em repouso
- Conformidade com LGPD
- Segregação de dados entre tenants

### 19.4 Compatibilidade
- Navegadores: Chrome, Firefox, Safari, Edge (últimas 2 versões)
- Dispositivos: Desktop, tablet e smartphone
- Design responsivo

### 19.5 Usabilidade
- Interface intuitiva, sem necessidade de treinamento extenso
- Acessibilidade básica (WCAG 2.1 nível A)
- Suporte a tema claro e escuro

---

## 20. ROADMAP FUTURO (PÓS-MVP)

Funcionalidades planejadas para versões futuras:

**Fase 2:**
- Integração com convênios (TISS/TUSS)
- Controle de estoque básico
- Prescrição eletrônica
- Atestados e declarações digitais

**Fase 3:**
- Telemedicina integrada
- App mobile nativo (iOS e Android)
- Integração com calendário Google/Outlook
- Pagamento online

**Fase 4:**
- Prontuário eletrônico certificado (integração SBIS)
- BI avançado e relatórios customizáveis
- Assinatura digital de documentos
- Multi-unidades (filiais)

---

## 21. GLOSSÁRIO

| Termo | Definição |
|-------|-----------|
| **Tenant** | Instância isolada de dados de uma clínica no sistema multi-tenant |
| **No-show** | Quando o paciente falta à consulta sem aviso prévio |
| **Slot** | Horário disponível para agendamento |
| **Prontuário** | Registro de informações clínicas do paciente |
| **LGPD** | Lei Geral de Proteção de Dados |
| **SLA** | Service Level Agreement (Acordo de Nível de Serviço) |
| **MVP** | Minimum Viable Product (Produto Mínimo Viável) |

---

## 22. SUPORTE E CONTATO

**Canais de Suporte:**
- Central de Ajuda (FAQ e tutoriais)
- Chat no sistema
- E-mail: suporte@minhaclinica.com.br
- WhatsApp: (11) 99999-9999

**Horário de Atendimento:**
- Segunda a sexta: 08:00 às 18:00
- Sábado: 08:00 às 12:00

---

*Documento elaborado em Fevereiro de 2026*
*Versão 1.0 - MVP*
*Minha Clínica © Todos os direitos reservados*
