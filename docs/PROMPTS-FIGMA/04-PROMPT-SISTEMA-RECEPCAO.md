# Prompt para IA do Figma - Sistema da Recepção

## 📋 Contexto do Sistema

**Nome:** Minha Clínica - Sistema de Recepção  
**Perfil:** RECEPTIONIST (Recepcionista)  
**Objetivo:** Interface para gerenciar agendamentos, pacientes e fluxo de atendimento presencial

---

## 🎨 Diretrizes de Design

### Identidade Visual
- **Estilo:** Funcional, eficiente, organizado mas amigável
- **Paleta de cores:**
  - Primária: Azul (#3B82F6)
  -Secundária: Verde (#10B981)
  - Urgente: Vermelho (#EF4444)
  - Alerta: Amarelo (#F59E0B)
  - Aguardando: Laranja (#F97316)
  - Neutros: Cinzas
- **Densidade:** Alta densidade de informação (opera o dia todo)
- **Acessibilidade:** Telas grandes, textos legíveis à distância

---

## 📱 Estrutura de Navegação

### Sidebar Principal
- 🏠 Dashboard
- 📅 Agenda (todos profissionais)
- ➕ Novo Agendamento
- 👥 Pacientes
- ✅ Check-in / Recepção
- 🔔 Confirmações
- 📊 Relatórios
- ⚙️ Configurações

### Top Bar
- Logo da clínica
- Data e hora
- **Contador de Aguardando:** Badge com número de pacientes na sala de espera
- **Próxima Consulta:** Mini card com countdown
- Notificações (badge)
- Perfil (dropdown)

---

## 📱 Telas a Serem Criadas

### 1. Dashboard da Recepção

#### Objetivo
Visão geral do dia e alertas importantes.

#### Elementos Necessários

**Header:**
- Saudação: "Olá, [Nome da Recepcionista]!"
- Data completa e hora
- Info: "Última atualização há X segundos" (auto-refresh)

**Seção: Resumo do Dia**
Grid 5 cards

Card 1: Total de Consultas
- Número grande: "24"
- Label: "Consultas Hoje"
- Breakdown: "15 realizadas, 9 restantes"

Card 2: Confirmadas
- Percentual: "75%"
- Label: "Taxa de Confirmação"
- Subtexto: "18 de 24 confirmadas"
- Progress bar

Card 3: Aguardando
- Número com destaque: "3"
- Label: "Pacientes Aguardando"
- Lista de nomes (hover ou clique)
- Badge vermelho se esperando >20min

Card 4: Não Confirmadas
- Número: "6"
- Label: "Aguardando Confirmação"
- Botão: "Ver Lista"
- Alerta se consulta em menos de 2h

Card 5: Faltas do Dia
- Número: "1"
- Label: "Não Compareceram"
- Subtexto: "Taxa: 4%"

**Seção: Alertas e Notificações**
Lista de banners coloridos por prioridade

Exemplos:
- 🔴 URGENTE: "3 consultas em menos de 30min sem confirmação"
- 🟡 AVISO: "Paciente [Nome] já está aguardando há 15 minutos"
- 🔵 INFO: "2 pacientes novos agendados para hoje - confirmar cadastro"
- 🟢 SUCESSO: "Todas as consultas da manhã foram confirmadas"

Cada alerta:
- Ícone de prioridade
- Mensagem
- Timestamp
- Botão de ação rápida se aplicável
- Botão: "Dispensar"

**Seção: Agenda do Dia (Visão Consolidada)**

Toggle de visualização:
- Por profissional (tabs)
- Consolidada (timeline única)

Modo Consolidada:
- Timeline vertical
- Todas as consultas de todos profissionais
- Código de cores por profissional
- Agrupamento por horário

Cada consulta:
- Horário
- Nome do profissional (tag colorida)
- Nome do paciente + foto
- Badge de status
- Ícones de ações rápidas:
  - Telefone (ligar)
  - WhatsApp
  - Check-in
  - Ver detalhes

**Seção: Próximas 3 Consultas**
Cards horizontais

Cada card:
- Horário grande + countdown
- Profissional
- Paciente (foto + nome)
- Status
- Botão: "Fazer Check-in"
- Botão: "Confirmar por Telefone"

**Seção: Atalhos Rápidos**
Grid de botões grandes

- "Novo Agendamento"
- "Cadastrar Paciente"
- "Check-in Rápido"
- "Ver Sala de Espera"
- "Ligar para Próximo Paciente"

---

### 2. Agenda (Todos os Profissionais)

#### Objetivo
Visualizar e gerenciar agenda de todos os profissionais simultaneamente.

#### Elementos Necessários

**Header:**
- Título: "Agenda Geral"
- Seletor de visualização:
  - 📆 Dia
  - 📅 Semana
  - Por Profissional
- Botão: "Novo Agendamento" (primário, sempre visível)
- Botão: "Impressão "

**Filtros (Sidebar ou Dropdown):**
- Profissional: Checkboxes múltiplos
  - "Selecionar Todos"
  - Lista com checkbox por profissional
- Status:
  - Todos
  - Agendados
  - Confirmados
  - Aguardando
  - Em Atendimento
  - Atendidos
  - Cancelados
  - Não Compareceu
- Procedimento: Select múltiplo
- Buscar: Input para buscar paciente

**Navegação de Data:**
- Botão: "Hoje"
- Setas: Anterior / Próximo
- Date picker

---

**Modo: Dia - Todas Consultas**

Layout:
- Timeline vertical (eixo Y: horários)
- Colunas por profissional (eixo X)
- Header de cada coluna:
  - Foto do profissional
  - Nome
  - Especialidade
  - Badge: "X consultas"
  - Mini-indicador de ocupação

Consultas:
- Blocos coloridos
- Altura proporcional à duração
- Conteúdo:
  - Horário
  - Nome do paciente
  - Telefone (pequeno)
  - Procedimento
  - Badge de status
- Hover: Card expandido com ações
- Clique: Modal de detalhes completos

Horários livres:
- Espaços em branco
- Hover: "Clique para agendar"
- Clique: Abre novo agendamento já com profissional e horário

Linha "Agora":
- Se dia atual, linha vermelha horizontal
- Badge: hora atual

**Modo: Semana**
- Grid 7 colunas (dias)
- Linhas: profissionais
- Células: quantidade de consultas por dia
- Cores indicam ocupação
- Clique na célula: detalha aquele dia

**Modo: Por Profissional (Tabs)**
- Tabs com nome de cada profissional
- Agenda individual (igual ao modo dia, mas só um profissional)
- Mais espaço para detalhes

---

**Modal: Detalhes do Agendamento**

Informações completas:
- **Paciente:**
  - Foto
  - Nome completo + idade
  - CPF
  - Telefones (clicáveis - ligar direto)
  - E-mail
  - Badge: "Primeira vez" ou "Retorno"

- **Agendamento:**
  - Data e horário
  - Duração
  - Profissional (foto + nome)
  - Procedimento
  - Status atual (com histórico de mudanças)
  - Forma de agendamento (online, telefone, presencial)
  - Criado por: [nome da recepcionista]
  - Data de criação

- **Observações:**
  - Observações do paciente
  - Observações internas (campo editável)

- **Histórico de Contatos:**
  - Log de ligações, mensagens
  - "Confirmado por telefone em [data/hora] por [recepcionista]"

- **Alertas:**
  - Se houver alergias
  - Se tem histórico de faltas
  - Observações importantes

**Ações do Modal:**
Botões principais:
- "Fazer Check-in" (se é a hora)
- "Confirmar por Telefone"
- "Editar Agendamento"
- "Reagendar"
- "Cancelar"
- "Ligar para Paciente" (integração telefonia)
- "Enviar WhatsApp"
- "Imprimir Comprovante"

Menu dropdown (mais ações):
- Ver histórico do paciente
- Ver prontuários anteriores
- Enviar lembrete manual
- Marcar como não compareceu
- Adicionar observação

Botões inferiores:
- Fechar (ESC)
- Salvar (se editou algo)

---

### 3. Novo Agendamento

#### Objetivo
Criar novo agendamento de forma rápida e eficiente.

#### Elementos Necessários

**Modal ou página dedicada (preferência: modal fullscreen)**

**Etapa 1: Selecionar/Cadastrar Paciente**

Opções:
- Tab 1: Buscar Paciente Existente
- Tab 2: Cadastro Rápido de Novo Paciente

**Tab 1: Buscar Paciente**
- Barra de busca grande
- Busca por: Nome, CPF, telefone, e-mail
- Busca em tempo real
- Resultados:
  - Lista de pacientes matching
  - Card de cada paciente:
    - Foto
    - Nome completo
    - CPF
    - Telefone
    - Última consulta
    - Botão: "Selecionar"

**Tab 2: Cadastro Rápido**
Formulário simplificado (campos essenciais):
- Nome completo *
- CPF *
- Data de nascimento *
- Sexo *
- Telefone celular *
- E-mail *
- Senha (gerada automaticamente)
- Checkbox: "Enviar credenciais por e-mail/SMS"
- Botão: "Cadastrar e Continuar"

**Etapa 2: Escolher Profissional**

Se veio de clique em horário livre:
- Profissional já selecionado (mostrar)
- Checkbox: "Desejo escolher outro profissional"

Layout:
- Grid ou lista de profissionais
- Cada card:
  - Foto
  - Nome
  - Especialidade
  - Próxima disponibilidade
  - Badge de disponibilidade hoje
  - Botão: "Selecionar"
- Filtro: Por especialidade

**Etapa 3: Escolher Procedimento**

- Lista de procedimentos que o profissional realiza
- Radio buttons ou cards clicáveis
- Cada item:
  - Nome do procedimento
  - Descrição breve
  - Duração
  - Preço (se visível)
  - Badge: "Disponível online" (se for)

**Etapa 4: Data e Horário**

Layout split:
- Esquerda: Calendário
- Direita: Horários disponíveis

**Calendário:**
- Mês inteiro
- Dias com disponibilidade: normal
- Dias sem disponibilidade: cinza
- Dia selecionado: destaque
- Feriados/bloqueios: marcados

**Lista de Horários:**
- Aparece após selecionar data
- Grid de botões de horários
- Agrupados por período (manhã, tarde, noite)
- Cada botão:
  - Horário (ex: "09:00")
  - Se é horário de pico, mostrar
- Horário selecionado: azul preenchido

Filtros:
- Apenas manhã / tarde / noite

**Etapa 5: Confirmação**

Card de resumo:
- Paciente:
  - Foto
  - Nome
  - Telefone
  
- Agendamento:
  - Data e horário (grande, destaque)
  - Profissional (foto + nome)
  - Procedimento
  - Duração
  - Valor (se aplicável)

- Local:
  - Endereço da clínica

Campos adicionais:
- Canal de agendamento:
  - Radio: Presencial, Telefone, WhatsApp
- Observações:
  - Textarea: "Observações internas (opcional)"

Ações rápidas:
- Checkbox: "Já está confirmado"
- Checkbox: "Imprimir comprovante ao confirmar"
- Checkbox: "Enviar confirmação por WhatsApp agora"

Botões:
- "Voltar" (editar)
- "Agendar" (primário)

**Tela de Sucesso:**
- Check animado
- "Agendamento realizado com sucesso!"
- Resumo do agendamento
- Ações:
  - "Imprimir Comprovante"
  - "Enviar WhatsApp para Paciente"
  - "Novo Agendamento"
  - "Ver na Agenda"
  - "Voltar ao Dashboard"

---

### 4. Gerenciar Pacientes

#### Objetivo
Cadastrar, buscar e editar dados de pacientes.

#### Elementos Necessários

**Header:**
- Título: "Pacientes"
- Botão: "Cadastrar Novo Paciente" (primário)
- Botão: "Importar Pacientes" (CSV - secundário)
- Estatística: "Total: X pacientes cadastrados"

**Barra de Busca Avançada:**
- Input principal: "Buscar por nome, CPF, telefone ou e-mail..."
- Filtros expandíveis (accordion):
  - Status: Ativo / Inativo
  - Novo paciente (últimos 30 dias)
  - Com consulta agendada
  - Sem agendamento há X dias
  - Com histórico de faltas

**Ordenação:**
- Select: Nome (A-Z), Última consulta, Total de consultas, Novo

**Lista de Pacientes:**

Modo Tabela (desktop):
- Colunas:
  - Foto mini
  - Nome completo
  - CPF
  - Telefone
  - E-mail
  - Última consulta
  - Próxima consulta
  - Status
  - Ações
- Cabeçalhos clicáveis para ordenar
- Paginação ou scroll infinito

Modo Cards (móvel/opcional):
- Cards de paciente
- Conteúdo principal visível
- Clique: expandir detalhes

Cada linha/card:
- **Highlight** se:
  - Novo paciente (badge "NOVO")
  - Consulta agendada hoje (badge "HOJE")
  - Inativo (texto cinza)
  - Histórico de faltas (ícone de alerta)

**Ações por paciente:**
- Ícone: Ver detalhes
- Ícone: Editar
- Ícone: Agendar consulta
- Ícone: Ligar
- Ícone: WhatsApp
- Menu (3 pontos):
  - Ver histórico completo
  - Desativar/Reativar
  - Resetar senha
  - Imprimir ficha

---

**Modal: Cadastrar Novo Paciente (Completo)**

Formulário em abas ou seções:

**Seção 1: Dados Pessoais**
Campos obrigatórios (`*`):
- Nome completo *
- CPF * (com máscara e validação)
- RG
- Data de nascimento * (date picker)
- Sexo * (radio buttons)
- Foto (upload opcional)

**Seção 2: Contato**
- Telefone celular * (com máscara)
- Telefone fixo
- E-mail *
- Checkbox: "Enviar credenciais de acesso por e-mail"

**Seção 3: Endereço**
- CEP (busca automática)
- Logradouro
- Número
- Complemento
- Bairro
- Cidade
- Estado

**Seção 4: Informações de Saúde**
- Alergias conhecidas (textarea ou chips)
- Observações gerais (textarea)
- Info: "Estas informações aparecerão nos agendamentos"

**Seção 5: Senha e Acesso**
- Senha (auto-gerada)
- Botão: "Gerar Nova Senha"
- Display: senha gerada
- Checklist:
  - ✅ Enviar por e-mail
  - ✅ Enviar por SMS
  - Imprimir credenciais

**Preview:**
Card à direita mostrando como ficará o cadastro

**Ações:**
- Cancelar
- Salvar e Agendar Consulta
- Salvar Cadastro

---

**Modal: Editar Paciente**

Similar ao cadastro, mas:
- Campos preenchidos
- Seções adicionais:
  - **Histórico:** Resumo de consultas
  - **Observações Internas:** Textarea para anotações da recepção
  - **Status:** Toggle Ativo/Inativo
  
Ações:
- Cancelar
- Salvar Alterações
- Resetar Senha
- Ver Histórico Completo

---

### 5. Check-in e Recepção

#### Objetivo
Gerenciar chegada de pacientes e sala de espera.

#### Elementos Necessários

**Layout Split-Screen:**
- Esquerda (60%): Check-in
- Direita (40%): Sala de Espera

---

**Painel Esquerdo: Check-in**

**Busca Rápida:**
- Input grande: "Nome do paciente ou código do agendamento"
- Busca ao digitar (debounced)
- Leitura de QR Code (se implementado)

**Resultados:**
Lista de agendamentos do dia que correspondem

Cada item:
- Horário do agendamento
- Nome do paciente (grande)
- Profissional
- procedimento
- Status atual
- Badge: "ATRASADO" se passou do horário
- Badge: "EM BREVE" se falta <15min
- Botão: "Fazer Check-in" (primário)

**Modal: Confirmação de Check-in**

Mostra:
- Foto do paciente
- Nome
- Horário do agendamento
- Profissional
- Hora atual vs horário agendado
  - Se adiantado: "Chegou X minutos antes"
  - Se pontual: "No horário" (verde)
  - Se atrasado: "Atrasado X minutos" (vermelho)

Ações:
- Confirmar dados cadastrais rápidos:
  - Telefone ainda é [número]? (sim/editar)
  - Endereço ainda é [endereço]? (sim/editar)
- Checkbox: "Paciente confirmou dados"
- Textarea: "Observações do check-in"
- Botão: "Confirmar Check-in e Adicionar à Fila"
- Botão: "Cancelar"

Após check-in:
- Success feedback
- Paciente aparece na sala de espera
- Status muda para "AGUARDANDO"
- Opcional: Imprimir ficha de atendimento

---

**Painel Direito: Sala de Espera**

**Header:**
- Título: "Sala de Espera"
- Badge: Contador de pacientes
- Botão: "Atualizar" (refresh icon)

**Lista de Pacientes Aguardando:**
Cards verticais, ordenados por:
- Prioridade (urgente primeiro)
- Horário de chegada (FIFO)

Cada card:
- Foto do paciente
- Nome (grande)
- Horário do agendamento
- Profissional (com foto mini)
- **Tempo de espera:** Grande e destacado
  - Verde: <10min
  - Amarelo: 10-20min
  - Vermelho: >20min (piscando se >30min)
- Badge de prioridade (se marcado)
- Ações:
  - Botão: "Chamar" (avisar profissional)
  - Botão: "Priorizar" (move para topo)
  - Menu: Mais opções

**Estado: Nenhum Paciente**
- Ilustração: Sala vazia
- Texto: "Nenhum paciente aguardando"

**Notificações:**
- Alert no topo se alguém espera >20min
- Som/notificação desktop quando novo paciente faz check-in

---

**Modal: Chamar Paciente**

Quando clica em "Chamar":
- Título: "Chamar [Nome do Paciente]"
- Info: "Para atendimento com [Profissional]"
- Ações:
  - Sistema: Envia notificação para profissional
  - Opcional: Anuncia em painel de TV/display
- Mudança de status: "AGUARDANDO" → "EM ATENDIMENTO"
- Botão: "Confirmar Chamada"
- Paciente é removido da fila de espera

---

### 6. Confirmações de Consultas

#### Objetivo
Gerenciar lista de consultas não confirmadas e realizar confirmações.

#### Elementos Necessários

**Header:**
- Título: "Confirmações Pendentes"
- Badge: Contador de não confirmadas
- Filtros:
  - Todas
  - Hoje
  - Amanhã
  - Esta semana
  - Urgente (<2h)

**Lista de Confirmações:**

Ordenada por urgência:
1. Consultas em <2h (vermelho)
2. Consultas hoje (laranja)
3. Consultas amanhã (amarelo)
4. Próximos 7 dias (normal)

Cada item (card ou linha):
- Badge de urgência (cor + texto)
- Data e horário
- Countdown se for hoje
- Nome do paciente
- Telefone (clicável)
- WhatsApp (clicável)
- Profissional
- Procedimento
- Tentativas de contato: "Tentado X vezes"
- Último contato: timestamp

**Ações por item:**
- Botão: "Ligar" (integração telefonia)
- Botão: "WhatsApp"
- Botão: "Marcar como Confirmado"
- Botão: "Enviar Lembrete Automático"
- Menu:
  - Ver detalhes do agendamento
  - Cancelar agendamento
  - Reagendar

**Modal: Registrar Contato**

Quando liga ou manda WhatsApp:
- Paciente: [nome]
- Consulta: [data/hora]
- Resultado do contato:
  - Radio: Confirmou presença
  - Radio: Não atendeu - deixei mensagem
  - Radio: Não atendeu - sem mensagem
  - Radio: Solicitou cancelamento
  - Radio: Solicitou reagendamento
  Radio: Telefone inválido
- Observações (textarea)
- Botão: "Registrar e Próximo"

**Estatísticas no topo:**
- Taxa de confirmação: X%
- Confirmadas hoje: X de Y
- Não confirmadas urgentes: X

**Ação em massa:**
- Checkbox para selecionar múltiplos
- Botão: "Enviar Lembrete para Selecionados"

---

### 7. Relatórios

#### Objetivo
Gerar relatórios simples de agendamentos e pacientes.

#### Elementos Necessários

**Header:**
- Título: "Relatórios"

**Cards de Tipos de Relatório:**

Card 1: Agendamentos
- Descrição: "Relatório de agendamentos por período"
- Campos:
  - Período: date range
  - Profissional: select (todos ou específico)
  - Status: select múltiplo
  - Procedimento: select
- Botão: "Gerar Relatório"

Card 2: Pacientes Cadastrados
- Descrição: "Lista de pacientes cadastrados"
- Campos:
  - Período de cadastro
  - Status: Ativo/Inativo/Todos
  - Com/sem agendamento futuro
- Botão: "Gerar Relatório"

Card 3: No-Show (Faltas)
- Descrição: "Relatório de faltas"
- Campos:
  - Período
  - Profissional
- Botão: "Gerar Relatório"

Card 4: Taxa de Ocupação
- Descrição: "Ocupação por profissional"
- Campos:
  - Período
  - Profissional
- Botão: "Gerar Relatório"

**Visualização do Relatório:**

Modal fullscreen ou nova página:
- Título do relatório
- Filtros aplicados (resumo)
- Tabela de dados
- Gráficos (se aplicável)
- Estatísticas resumidas

Ações:
- Exportar PDF
- Exportar Excel
- Imprimir
- Fechar

---

### 8. Configurações da Recepção

#### Objetivo
Configurações pessoais da recepcionista.

#### Elementos Necessários

Similar ao paciente, mas simplificado:

**Tab 1: Perfil**
- Foto
- Nome
- E-mail
- Telefone
- Editar

**Tab 2: Notificações**
- Preferências de notificações
- Sons e alertas

**Tab 3: Segurança**
- Alterar senha
- Sessões ativas

**Tab 4: Preferências**
- Visualização padrão da agenda
- Som de notificação
- Auto-refresh do dashboard

---

## 🎯 Especificações Técnicas

### Rotas e Endpoints da Recepção

```typescript
// Autenticadas (Bearer token com role RECEPTIONIST)

// Dashboard
GET    /api/receptionist/dashboard              // Dados do dashboard

// Agenda (todos profissionais)
GET    /api/receptionist/agenda                 // Agenda geral
GET    /api/receptionist/agenda/day/:date       // Agenda do dia
GET    /api/receptionist/agenda/week/:date      // Agenda da semana

// Agendamentos (CRUD completo)
GET    /api/receptionist/appointments           // Listar
GET    /api/receptionist/appointments/:id       // Buscar
POST   /api/receptionist/appointments           // Criar
PUT    /api/receptionist/appointments/:id       // Editar
DELETE /api/receptionist/appointments/:id       // Cancelar
POST   /api/receptionist/appointments/:id/confirm // Confirmar
POST   /api/receptionist/appointments/:id/checkin // Check-in

// Pacientes (CRUD completo)
GET    /api/receptionist/patients               // Listar
GET    /api/receptionist/patients/:id           // Buscar
POST   /api/receptionist/patients               // Cadastrar
PUT    /api/receptionist/patients/:id           // Editar
PUT    /api/receptionist/patients/:id/status    // Ativar/Desativar
POST   /api/receptionist/patients/:id/reset-password // Resetar senha
GET    /api/receptionist/patients/:id/history   // Histórico

// Profissionais (visualização)
GET    /api/receptionist/professionals          // Listar profissionais
GET    /api/receptionist/professionals/:id/availability // Disponibilidade

// Procedures
GET    /api/receptionist/procedures             // Listar procedimentos

// Sala de Espera
GET    /api/receptionist/waiting-room           // Pacientes aguardando
POST   /api/receptionist/waiting-room/call/:patientId // Chamar paciente

// Confirmações
GET    /api/receptionist/confirmations/pending  // Não confirmadas
POST   /api/receptionist/confirmations/:id/log  // Registrar tentativa contato

// Relatórios
POST   /api/receptionist/reports/appointments   // Relatório de agendamentos
POST   /api/receptionist/reports/patients       // Relatório de pacientes
POST   /api/receptionist/reports/no-show        // Relatório de faltas

// Comunicação
POST   /api/receptionist/communication/call     // Registrar ligação
POST   /api/receptionist/communication/whatsapp // Enviar WhatsApp
POST   /api/receptionist/communication/sms      // Enviar SMS
```

### Regras de Negócio

**Agendamento:**
- Pode criar para qualquer profissional
- Pode editar até horário da consulta
- Cancelamento: precisa informar motivo
- Não pode marcar dois agendamentos no mesmo horário (mesmo profissional)

**Paciente:**
- Pode cadastrar novos pacientes
- Pode editar dados de contato e endereço
- Não pode editar CPF (identificador único)
- Pode resetar senha
- Pode ativar/desativar

**Check-in:**
- Só pode para consultas do dia
- Muda status para "AGUARDANDO"
- Adiciona à fila da sala de espera

**Confirmação:**
- Pode marcar como confirmado manualmente
- Deve registrar log de tentativas de contato
- Se não confirmado em X horas antes: alerta

---

## 📝Considerações Finais

### UX Específica
- **Rapidez:** Fluxos otimizados para alta demanda
- **Clareza Visual:** Cores e badges para identificação rápida
- **Auto-refresh:** Dashboard atualiza automaticamente
- **Notificações Sonoras:** Alertas importantes com som
- **Atalhos de Teclado:** Para ações frequentes
- **Multi-tasking:** Suporte a múltiplas janelas/tabs

### Performance
- Cache de agendamentos do dia
- Websockets para atualizações em tempo real
- Otimização para telas grandes

### Hardware
- Suporte a impressora térmica (comprovantes)
- Integração com telefonia (opcional)
- Leitor de código de barras/QR (opcional)
- Display/painel de chamada (opcional)

