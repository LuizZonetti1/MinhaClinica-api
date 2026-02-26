# Prompt para IA do Figma - Área do Profissional de Saúde

## 📋 Contexto do Sistema

**Nome:** Minha Clínica - Área do Profissional  
**Perfil:** PROFESSIONAL (Médico, Dentista, Fisioterapeuta, etc.)  
**Objetivo:** Interface focada em agenda, atendimentos e prontuário eletrônico

---

## 🎨 Diretrizes de Design

### Identidade Visual
- **Estilo:** Profissional, eficiente, organizado
- **Paleta de cores:**
  - Primária: Azul profissional (#

2563EB - Blue 600)
  - Secundária: Verde saúde (#059669 - Green 600)
  - Info: Azul claro (#3B82F6)
  - Sucesso: Verde (#10B981)
  - Alerta: Amarelo (#F59E0B)
  - Urgente: Vermelho (#EF4444)
  - Neutros: Escala de cinza
- **Tipografia:**
  - Títulos: Inter Bold/Semibold
  - Corpo: Inter Regular/Medium
  - Médico: SF Mono/JetBrains Mono (para dados técnicos)
- **Densidade:** Informação densa mas organizada (profissional precisa de eficiência)

---

## 📱 Estrutura de Navegação

### Sidebar Principal (Desktop)
- 🏠 Dashboard
- 📅 Minha Agenda
- 👥 Meus Pacientes
- 📋 Prontuários
- 📊 Estatísticas
- ⚙️ Configurações

### Top Bar
- Logo da clínica (esquerda)
- Data e hora atual
- Próximo paciente (badge com countdown)
- Notificações (badge)
- Perfil do profissional (dropdown):
  - Meu Perfil
  - Bloqueios de Agenda
  - Configurações
  - Ajuda
  - Sair

---

## 📱 Telas a Serem Criadas

### 1. Dashboard do Profissional

#### Objetivo
Visão geral do dia e acesso rápido às principais funcionalidades.

#### Elementos Necessários

**Header do Dashboard:**
- Saudação: "Bom dia, Dr(a). [Nome]"
- Data completa: "Segunda-feira, 17 de Fevereiro de 2026"
- Hora atual (relógio digital)

**Seção: Resumo do Dia (Cards KPI)**
Grid 4 colunas (mobile: 2x2)

Card 1: Consultas do Dia
- Número grande: "8"
- Label: "Consultas Agendadas"
- Subtexto: "5 confirmadas, 3 aguardando"
- Ícone: Calendário

Card 2: Próxima Consulta
- Horário grande: "09:30"
- Label: "Próximo Paciente"
- Nome do paciente
- Badge: "Em 15 minutos"
- Botão rápido: "Ver Detalhes"

Card 3: Taxa de Ocupação
- Percentual grande: "75%"
- Label: "Ocupação de Hoje"
- Progress bar
- Subtexto: "6 de 8 horários ocupados"

Card 4: Faltas (No-Show)
- Número: "1"
- Label: "Faltas Este Mês"
- Badge de comparação: "↓ 50% vs. mês anterior"
- Cor: verde se melhorou, vermelho se piorou

**Seção: Agenda de Hoje (Timeline)**

Layout:
- Timeline vertical com horários (lado esquerdo)
- Cards de consultas (lado direito)
- Linha do tempo atual (indicador "AGORA" se dentro do horário)

Cada consulta na timeline:
- Horário: "09:00 - 09:30"
- Nome do paciente + foto circular
- Badge de status:
  - 🔵 Agendado
  - 🟢 Confirmado
  - 🟡 Aguardando (paciente na recepção)
  - 🟣 Em Andamento
  - ⚫ Concluído
  - 🔴 Não Compareceu
- Procedimento
- Tag: "Primeira vez" (se for primeira consulta com o profissional)
- Tag: "Retorno" (se já atendeu antes)
- Ações rápidas (hover ou swipe):
  - Ver Histórico
  - Iniciar Atendimento
  - Ver Prontuário Anterior

**Horários Livres:**
- Bloco cinza claro na timeline
- Texto: "Horário livre"
- Duração mostrada

**Bloqueios:**
- Bloco com lista diagonal
- Texto: "Bloqueado: [motivo]"
- Ex: "Intervalo para almoço"

**Seção: Pacientes Aguardando**
- Lista horizontal de cards (carrossel se muitos)
- Cada card:
  - Foto do paciente
  - Nome
  - Horário agendado
  - Tempo de espera: "Aguardando há 5 min"
  - Badge: "AGUARDANDO" (amarelo)
  - Botão: "Chamar Paciente"

Estado vazio:
- Ícone: Check verde
- Texto: "Nenhum paciente aguandando"

**Seção: Ações Rápidas**
Grid 2x2 ou horizontal

Botões grandes com ícones:
- "Ver Agenda Completa"
- "Bloquear Horário"
- "Buscar Paciente"
- "Registrar Atendimento Avulso"

**Seção: Estatísticas Rápidas (Charts)**
Grid 2 colunas

Gráfico 1: Consultas por Semana
- Gráfico de linha ou barras
- Últimas 4 semanas
- Comparativo

Gráfico 2: Procedimentos Mais Realizados
- Gráfico de pizza ou barras horizontais
- Top 5 procedimentos deste mês

---

### 2. Agenda Completa

#### Objetivo
Visualizar e gerenciar agenda em diferentes modos de visualização.

#### Elementos Necessários

**Header da Agenda:**
- Título: "Minha Agenda"
- Seletor de visualização (tabs):
  - 📆 Dia
  - 📅 Semana
  - 📊 Mês
- Botão: "Bloquear Horário" (primário)
- Filtros (dropdown):
  - Status: Todos, Confirmados, Não Confirmados, etc.
  - Procedimento: Select múltiplo

**Navegação de Data:**
- Botão: "Hoje" (volta para data atual)
- Setas: Anterior / Próximo
- Date picker: Clique na data para calendário
- Data atual destacada em formato extenso

---

**Modo: Visualização Dia**

Layout:
- Timeline vertical de 30 em 30 minutos
- Horários à esquerda (do primeiro ao último horário de atendimento)
- Consultas em blocos coloridos

Cada bloco de consulta:
- Altura proporcional à duração
- Cor de fundo baseada no procedimento ou status
- Conteúdo:
  - Horário
  - Nome do paciente (bold)
  - Procedimento
  - Ícone de status
- Hover: Mostra card expandido com mais detalhes
- Clique: Abre modal de detalhes completos

Bloqueios:
- Bloco cinza com padrão listrado
- Texto: "Bloqueado: [motivo]"
- Ícone de cadeado

Horários livres:
- Espaços em branco
- Hover: "Clique para bloquear este horário"

**Linha "Agora":**
- Se estiver no dia atual, mostrar linha vermelha horizontal no horário atual
- Badge: "AGORA" + hora

---

**Modo: Visualização Semana**

Layout:
- Grid de 7 colunas (dias da semana)
- Horários no eixo Y
- Dias no eixo X (Segunda a Domingo)

Cada dia:
- Header com data
- Hoje destacado
- Consultas em blocos compactos
- Quantidade de consultas no topo de cada dia

Blocos de consulta:
- Menor que no modo dia
- Mostra: horário + iniciais do paciente
- Cor de fundo por status
- Clique: modal de detalhes

---

**Modo: Visualização Mês**

Layout:
- Calendário mensal tradicional
- Grade 7x5 ou 7x6 (conforme mês)

Cada dia:
- Número do dia no canto superior
- Indicadores de consultas:
  - Bolinhas coloridas (uma por consulta)
  - Se mais de 3 consultas: "+X" indicador
- Dia atual: border ou fundo destacado
- Dias com consultas: bold
- Dias sem expediente: cinza claro

Clique no dia:
- Abre modal ou sidebar com lista de consultas daquele dia

---

**Modal/Sidebar: Detalhes da Consulta**

Conteúdo completo:
- **Paciente:**
  - Foto grande
  - Nome completo
  - Idade
  - Telefone (clicável)
  - E-mail (clicável)
  - Badge: "Paciente novo" ou "Já atendido X vezes"

- **Agendamento:**
  - Data e horário
  - Duração
  - Procedimento
  - Status atual
  - Forma de agendamento (online, presencial, telefone)

- **Observações:**
  - Observações do paciente ao agendar
  - Campo para adicionar observações internas

- **Histórico Rápido:**
  - Últimas 3 consultas com você
  - Procedimentos realizados
  - Link: "Ver histórico completo"

- **Alergias e Alertas:**
  - Se houver alergias: Banner vermelho com lista
  - Se houver observações importantes: Banner amarelo

- **Ações:**
  - Botão: "Iniciar Atendimento" (se é a consulta atual)
  - Botão: "Ver Prontuário Completo"
  - Botão: "Marcar como Não Compareceu"
  - Botão: "Compartilhar com Colega" (opcional)
  - Link: "Editar Agendamento" (se permitido)
  - Link: "Cancelar" (com justificativa)

---

**Modal: Bloquear Horário**

Formulário:
- Título: "Bloquear Período na Agenda"

Campos:
1. **Tipo de Bloqueio:**
   - Radio buttons:
     - Um dia inteiro
     - Período específico
     - Recorrente

2. **Data/Período:**
   - Se "Um dia": Date picker único
   - Se "Período específico": Date + time pickers (início e fim)
   - Se "Recorrente": 
     - Select dias da semana (checkboxes)
     - Time pickers (hora início e fim)
     - Date range: "De X até Y"

3. **Motivo:**
   - Select:
     - Férias
     - Folga
     - Curso/Treinamento
     - Compromisso Pessoal
     - Reunião
     - Outro (abre campo de texto)

4. **Observação (opcional):**
   - Textarea
   - Placeholder: "Adicione detalhes se necessário (apenas você verá)"

5. **Notificar Admin:**
   - Checkbox: "Avisar administrador sobre este bloqueio"

Preview:
- Card mostrando como aparecerá na agenda
- Resumo: "Bloqueado de [data/hora] até [data/hora]: [motivo]"

Ações:
- Cancelar
- Confirmar Bloqueio (primário)

---

### 3. Meus Pacientes

#### Objetivo
Lista e busca de pacientes atendidos ou agendados com o profissional.

#### Elementos Necessários

**Header:**
- Título: "Meus Pacientes"
- Estatística: "Total de X pacientes"

**Barra de Busca:**
- Input grande: "Buscar por nome, CPF ou telefone..."
- Busca em tempo real (debounced)
- Ícone de lupa

**Filtros (sidebar ou top bar):**
- Por status:
  - Todos
  - Agendados comigo
  - Já atendidos
  - Com retorno pendente
- Ordenação:
  - Nome (A-Z)
  - Última consulta (mais recente)
  - Total de consultas (mais frequente)
- Por procedimento realizado: Select múltiplo
- Por período de atendimento: Date range

**Lista de Pacientes:**

Layout:
- Cards de paciente (2-3 colunas no desktop, 1 no mobile)
- Alternativa: Lista com linhas (mais densa)

Card de Paciente (modo card):
- Foto do paciente (grande, circular)
- Nome completo
- Idade e sexo (ícone)
- Telefone (com botão de ligar)
- E-mail
- **Estatísticas:**
  - Total de consultas com você: "X consultas"
  - Última consulta: "Há 15 dias"
  - Próxima consulta: "Agendada para 20/02" (se houver)
- **Tags:**
  - "Primeira vez agendada" (se ainda não atendeu)
  - "Retorno pendente" (se recomendou retorno)
  - "VIP" (se configurado)
- **Alertas (se houver):**
  - ⚠️ "Alergia a [medicamento]"
  - ⚠️ "Observação importante"
- Ações:
  - Botão: "Ver Prontuário"
  - Botão: "Ver Histórico"
  - Menu (3 pontos): Mais opções

Estado: Nenhum resultado
- Ilustração: Busca vazia
- Texto: "Nenhum paciente encontrado"
- Se busca ativa: "Tente outros termos de busca"
- Se filtro ativo: Botão "Limpar Filtros"

---

**Modal: Perfil do Paciente**

Tabs:
1. Informações Pessoais
2. Histórico de Consultas
3. Prontuários

**Tab 1: Informações Pessoais**
- Foto grande
- Nome completo
- CPF (mascarado parcialmente)
- Data de nascimento + idade
- Sexo
- Telefones (clicáveis)
- E-mail (clicável)
- Endereço completo
- **Informações de Saúde:**
  - Alergias (lista com destaque vermelho se houver)
  - Observações gerais do paciente
- Ícone: "Editar" (se tiver permissão - geralmente não)

**Tab 2: Histórico de Consultas**
- Timeline de todas as consultas com você
- Filtros: Período, Procedimento, Status
- Cada item:
  - Data e horário
  - Procedimento
  - Status final
  - Link: "Ver prontuário"
- Estatísticas:
  - Total de consultas
  - Consultas no último ano
  - Taxa de comparecimento

**Tab 3: Prontuários**
- Lista de prontuários (um por consulta)
- Visualização em cards ou lista
- Cada item:
  - Data do atendimento
  - Procedimento
  - Preview do prontuário (primeiras linhas)
  - Tags/Labels se houver
  - Botão: "Ver Completo"

---

### 4. Prontuário Eletrônico

#### Objetivo
Registrar e visualizar informações clínicas dos atendimentos.

#### Elementos Necessários

**Contexto:**
Esta tela é acessada de duas formas:
1. Durante o atendimento (criando novo prontuário)
2. Consultando prontuário de atendimento passado

---

**Layout Geral:**

**Header do Prontuário:**
- Breadcrumb: "Pacientes > [Nome] > Prontuário > [Data]"
- Info do paciente (sempre visível, card fixo no topo):
  - Foto pequena
  - Nome + idade + sexo
  - Badges de alerta (alergias, observações importantes)
  - Botão: "Histórico Completo"

**Sidebar Lateral (Desktop) / Tabs (Mobile):**
- Lista de prontuários anteriores
- Ordenados por data (mais recente primeiro)
- Cada item:
  - Data
  - Procedimento
  - Ícone se em rascunho ou finalizado
  - Clique: carrega aquele prontuário

---

**Formulário de Prontuário (Novo ou Edição):**

**Seção 1: Dados do Atendimento**
(Read-only ou pré-preenchido)
- Data e hora do atendimento
- Procedimento realizado
- Duração
- Profissional (você)

**Seção 2: Anamnese e Avaliação**

Campo: Queixa Principal
- Textarea grande
- Placeholder: "Descreva a queixa principal do paciente..."
- Contador de caracteres
- Sugestões (autocomplete) baseadas em atendimentos anteriores (opcional)

Campo: História da Doença Atual (HDA)
- Textarea
- Placeholder: "Quando começou? Como evoluiu? Fatores de melhora/piora..."

Campo: Exame Físico
- Textarea
- Placeholder: "Descrição do exame físico realizado..."
- Ferramenta: Diagrama corporal interativo (opcional)
  - Clique para marcar áreas afetadas
  - Adicionar anotações

**Seção 3: Diagnóstico e Conduta**

Campo: Hipótese Diagnóstica / Diagnóstico
- Textarea ou autocomplete com CID-10
- Suporte a múltiplos diagnósticos
- Tags/Chips para cada diagnóstico

Campo: Conduta / Plano de Tratamento
- Rich text editor
- Formatação básica (bold, lista, numeração)
- Placeholder: "Descreva o tratamento proposto..."

Campo: Prescrição
- Textarea ou ferramenta especializada
- Formato estruturado:
  - Medicamento
  - Dosagem
  - Via de administração
  - Frequência
  - Duração
- Botão: "Adicionar Medicamento" (abre form estruturado)
- Preview de como ficará a receita

Campo: Orientações ao Paciente
- Textarea
- Placeholder: "Repouso, dieta, cuidados especiais..."

Campo: Retorno Recomendado
- Checkbox: "Solicitar retorno"
- Se marcado:
  - Input: Prazo (em dias ou data específica)
  - Select: Motivo (reavaliação, troca de curativo, etc.)

**Seção 4: Anexos**

- Área de upload (drag and drop)
- Tipos:, PDF, JPG, PNG, DICOM
- Preview de arquivos anexados
- Categorização:
  - Exames laboratoriais
  - Imagens (RX, TC, RM)
  - Documentos
  - Fotos clínicas
- Cada anexo:
  - Thumbnail
  - Nome do arquivo
  - Data de upload
  - Tamanho
  - Botões: Visualizar, Baixar, Remover

**Seção 5: Observações Internas**

- Textarea
- Placeholder: "Observações que não aparecerão em documentos para o paciente..."
- Ícone de cadeado (indicando que é privado)

---

**Ações do Prontuário:**

Bottom bar fixo (sticky):
- Botão: "Salvar Rascunho" (secundário)
  - Salva sem finalizar
  - Permite editar depois
- Botão: "Finalizar e Assinar" (primário)
  - Marca como concluído
  - Gera registro de auditoria
  - Não permite mais edição (apenas visualização)
  - Modal de confirmação: "Tem certeza? Esta ação não pode ser desfeita"
- Botão: "Cancelar" (link)
- Auto-save indicator: "Salvo automaticamente há X segundos"

**Após Finalizar:**
- Success feedback
- Opções pós-atendimento:
  - Gerar documentos:
    - Atestado Médico
    - Declaração de Comparecimento
    - Receita
    - Pedido de Exame
    - Encaminhamento
  - Ações:
    - "Ver Prontuário" (modo leitura)
    - "Voltar para Agenda"
    - "Próximo Paciente"

---

**Visualização de Prontuário Finalizado:**

Modo leitura:
- Todos os dados preenchidos exibidos de forma organizada
- Não editável
- Seções colapsáveis
- Cabeçalho:
  - Badge: "Finalizado" + data/hora
  - Assinatura digital:
    - Nome do profissional
    - Registro profissional
    - Data e hora
    - Carimbo digital (hash)
- Ações:
  - Exportar PDF
  - Imprimir
  - Compartilhar com outro profissional (se houver integração)
  - Fechar

---

### 5. Estatísticas Pessoais

#### Objetivo
Dashboard com métricas e análises do desempenho do profissional.

#### Elementos Necessários

**Header:**
- Título: "Minhas Estatísticas"
- Seletor de período:
  - Este mês
  - Últimos 3 meses
  - Últimos 6 meses
  - Este ano
  - Personalizado (date range)

**Seção: KPIs Principais**
Grid 4 colunas

KPI 1: Total de Consultas
- Número grande
- Comparativo com período anterior
- Mini gráfico sparkline

KPI 2: Taxa de Ocupação
- Percentual
- Progress bar
- Comparativo

KPI 3: Taxa de Comparecimento
- Percentual (consultas realizadas / agendadas)
- Indicador de faltas (no-show)
- Comparativo

KPI 4: Média de Duração
- Tempo médio de consulta
- Comparativo com duração padrão
- Indicador de eficiência

**Gráfico: Consultas por Período**
- Gráfico de linhas ou barras
- Eixo X: Semanas ou meses
- Eixo Y: Quantidade de consultas
- Cores diferentes para status:
  - Realizadas (verde)
  - Não compareceu (vermelho)
  - Canceladas (cinza)
- Tooltip com detalhes

**Gráfico: Distribuição por Procedimento**
- Gráfico de pizza ou rosca
- Mostra os procedimentos mais realizados
- Percentuais
- Legenda com cores
- Hover: quantidade absoluta

**Gráfico: Distribuição por Horário**
- Heatmap ou gráfico de barras
- Eixo X: Dias da semana
- Eixo Y: Horários do dia
- Cor: intensidade (quantidade de consultas)
- Identifica horários de pico

**Tabela: Procedimentos Mais Realizados**
- Lista top 10
- Colunas:
  - Procedimento
  - Quantidade
  - Percentual do total
  - Tempo médio
  - Tendência (↑↓)

**Seção: Pacientes**

Card: Novos Pacientes
- Quantidade de pacientes novos no período
- Lista dos últimos 5
- Link: "Ver todos"

Card: Pacientes Frequentes
- Top 5 pacientes com mais consultas
- Foto + nome + quantidade

Card: Retornos
- Pacientes com retorno recomendado
- Pacientes que retornaram conforme recomendado
- Taxa de adesão

**Seção: Tempo e Produtividade**

Card: Horas Trabalhadas
- Total de horas no período
- Média por dia/semana
- Gráfico de distribuição

Card: Intervalos Médios
- Tempo médio entre consultas
- Comparativo com ideal
- Sugere otimizações se muito alto ou baixo

**Exportação:**
- Botão: "Exportar Relatório"
- Formatos: PDF, Excel
- Inclui todos os gráficos e tabelas

---

### 6. Configurações do Profissional

#### Objetivo
Gerenciar perfil profissional e preferências.

#### Elementos Necessários

**Tab 1: Perfil Profissional**

Visualização:
- Foto grande (circular, 150px)
- Botão: "Alterar Foto"
- Nome completo
- Especialidade(s) - tags
- Conselho profissional + número + UF
- E-mail
- Telefone
- Mini-biografia (max 200 caracteres)
- Botão: "Editar Perfil"

Modo Edição:
- Upload de foto (com crop)
- Campos editáveis:
  - Nome (com alerta que mudará em todo sistema)
  - Telefone
  - E-mail (requer verificação se mudar)
  - Mini-biografia (textarea)
- Especialidades:
  - Adicionar/remover da lista da clínica
  - Marcar principal
- Campos bloqueados (requer admin):
  - Conselho profissional
  - Número de registro
  - UF
- Ações:
  - Cancelar
  - Salvar Alterações

**Tab 2: Agenda e Horários**

Visualização dos horários configurados:
- Tabela semanal
- Cada dia mostra:
  - Status: Trabalha / Não trabalha
  - Horário início
  - Horário fim
  - Intervalo (se houver)

Info:
- "Estes horários definem quando você pode ter consultas agendadas"
- "Para alterações, entre em contato com o administrador"

**Tab 3: Preferências de Agenda**

Configurações:
- Duração padrão de consulta:
  - Input: minutos
  - Aplicado a novos agendamentos
  
- Cor da agenda:
  - Color picker
  - Preview de como aparece

- Visualização padrão:
  - Radio buttons: Dia / Semana / Mês

- Notificações:
  - Toggle: Notificar quando paciente chegar (check-in)
  - Toggle: Lembrete X minutos antes da consulta
  - Toggle: Notificar cancelamentos

**Tab 4: Segurança**
- Alterar senha (abre modal)
- Histórico de logins
- Sessões ativas
- 2FA (toggle)

**Tab 5: Prontuário**

Preferências:
- Templates de prontuário:
  - Salvos pelo profissional
  - Criar novo template
  - Editar templates existentes

- Campos favoritos:
  - Selecionar campos mais usados para acesso rápido

- Assinatura digital:
  - Upload de assinatura escaneada (opcional)
  - Preview de como aparece nos documentos

---

## 🎯 Especificações Técnicas

### Rotas e Endpoints do Profissional

```typescript
// Autenticadas (Bearer token com role PROFESSIONAL)

// Dashboard
GET    /api/professional/dashboard              // Dados do dashboard

// Agenda
GET    /api/professional/agenda                 // Ver agenda
GET    /api/professional/agenda/day/:date       // Agenda de dia específico
GET    /api/professional/agenda/week/:date      // Agenda da semana
GET    /api/professional/agenda/month/:year/:month // Agenda do mês
POST   /api/professional/schedule-blocks        // Criar bloqueio
PUT    /api/professional/schedule-blocks/:id    // Editar bloqueio
DELETE /api/professional/schedule-blocks/:id    // Remover bloqueio
GET    /api/professional/schedule-blocks        // Listar bloqueios

// Pacientes
GET    /api/professional/patients               // Listar meus pacientes
GET    /api/professional/patients/:id           // Detalhes do paciente
GET    /api/professional/patients/:id/history   // Histórico com o profissional

// Prontuário
GET    /api/professional/appointments/:id       // Detalhes da consulta
GET    /api/professional/medical-records/:appointmentId  // Ver prontuário
POST   /api/professional/medical-records        // Criar prontuário
PUT    /api/professional/medical-records/:id    // Atualizar prontuário (rascunho)
POST   /api/professional/medical-records/:id/finalize // Finalizar prontuário
POST   /api/professional/medical-records/:id/attachments // Upload anexo
DELETE /api/professional/medical-records/:id/attachments/:fileId // Remover anexo

// Documentos
POST   /api/professional/documents/prescription // Gerar receita
POST   /api/professional/documents/certificate  // Gerar atestado
POST   /api/professional/documents/declaration  // Gerar declaração

// Estatísticas
GET    /api/professional/statistics             // Estatísticas pessoais
GET    /api/professional/statistics/procedures  // Procedimentos realizados
GET    /api/professional/statistics/schedule    // Análise de agenda

// Perfil
GET    /api/professional/profile                // Ver perfil
PUT    /api/professional/profile                // Atualizar perfil
PUT    /api/professional/profile/photo          // Atualizar foto
POST   /api/professional/profile/change-password
```

### Estrutura de Dados

#### Dashboard Response
```typescript
{
  professional: {
    id: string,
    name: string,
    photo: string,
    specialties: string[]
  },
  today: {
    date: Date,
    totalAppointments: number,
    confirmedAppointments: number,
    completedAppointments: number,
    noShowAppointments: number,
    occupancyRate: number,
    nextAppointment: Appointment | null,
    waitingPatients: Patient[]
  },
  appointments: Appointment[], // Do dia
  thisMonth: {
    totalAppointments: number,
    noShowCount: number,
    occupancyRate: number
  }
}
```

#### Medical Record
```typescript
{
  id: string,
  appointmentId: string,
  patientId: string,
  professionalId: string,
  appointment: {
    date: Date,
    startTime: string,
    procedure: string
  },
  patient: {
    name: string,
    age: number,
    allergies: string[],
    observations: string
  },
  chiefComplaint: string,
  symptoms: string,
  physicalExam: string,
  diagnosis: string,
  treatment: string,
  prescription: string,
  patientGuidance: string,
  observations: string, // Interno
  attachments: Attachment[],
  returnRecommended: boolean,
  returnInDays: number,
  status: 'DRAFT' | 'FINALIZED',
  finalizedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Validações e Regras

**Bloqueio de Agenda:**
- Não pode bloquear no passado
- Não pode bloquear se houver consultas agendadas no período
- Admin é notificado de bloqueios longos (>3 dias)

**Prontuário:**
- Salva rascunho automaticamente a cada 30 segundos
- Após finalizar, não pode mais editar
- Campos obrigatórios: queixa principal, diagnóstico, conduta
- Limite de tamanho de anexos: 10MB por arquivo

**Atendimento:**
- Só pode marcar como "Em Andamento" consultas do dia atual
- Só pode marcar como "Atendido" se houver prontuário finalizado
- "Não Compareceu" só após 15 minutos do horário + tentativa de contato

---

## 📝 Considerações Finais

### UX Específica
- **Eficiência:** Profissional precisa de agilidade - menos cliques melhor
- **Teclado:** Suporte completo a atalhos de teclado
- **Multi-tarefa:** Possibilidade de abrir múltiplas abas/janelas
- **Dados densos:** Mostrar bastante informação de forma organizada

### Performance
- Cache agressivo da agenda do dia
- Paginação em listas longas
- Lazy loading de prontuários antigos

### Mobile
- Agenda otimizada para tablet
- Prontuário responsivo mas desktop-first
- Touch gestures para navegação rápida

