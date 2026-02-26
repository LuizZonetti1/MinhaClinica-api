# Prompt para IA do Figma - Painel Administrativo (Dono da Clínica)

## 📋 Contexto do Sistema

**Nome:** Minha Clínica - Painel Administrativo  
**Perfil:** ADMIN (Dono da Clínica / Administrador)  
**Objetivo:** Interface completa para gestão da clínica, usuários, financeiro e configurações

---

## 🎨 Diretrizes de Design

### Identidade Visual
- **Estilo:** Executivo, profissional, data-driven
- **Paleta de cores:**
  - Primária: Azul escuro (#1E40AF - Blue 800)
  - Secundária: Azul médio (#3B82F6)
  - Sucesso: Verde (#10B981)
  - Receita: Verde escuro (#059669)
  - Despesa: Vermelho (#DC2626)
  - Alerta: Amarelo (#F59E0B)
  - Info: Azul claro (#60A5FA)
- **Densidade:** Alta densidade de dados com visualizações claras
- **Dashboards:** Foco em KPIs, gráficos e métricas

---

## 📱 Estrutura de Navegação

### Sidebar Principal (Expansível)
- 🏠 **Dashboard Executivo**
- 🏥 **Gestão da Clínica**
  - Dados da Clínica
  - Configurações Gerais
  - Horários
  - Especialidades
- 👥 **Usuários**
  - Todos os Usuários
  - Convidar Usuário
- 👨‍⚕️ **Profissionais**
  - Lista de Profissionais
  - Convidar Profissional
  - Horários de Atendimento
- 👤 **Pacientes**
  - Todos os Pacientes
  - Import/Export
- 📅 **Agenda**
  - Visualizar Agenda
  - Estatísticas
- 📋 **Procedimentos**
  - Lista de Procedimentos
  - Cadastrar Novo
- 💰 **Financeiro**
  - Dashboard Financeiro
  - Receitas
  - Despesas
  - Categorias
  - Relatórios
- 📊 **Relatórios**
  - Agendamentos
  - Pacientes
  - Financeiro
  - Performance
- 🔔 **Notificações**
  - Configurações
  - Histórico
  - Templates
- 🔍 **Auditoria**
   - Logs do Sistema
  - Segurança
  - LGPD
- ⚙️ **Configurações**
  - Sistema
  - Integrações
  - Backup

### Top Bar
- Logo da clínica
- Breadcrumb de navegação
- Busca global (pacientes, profissionais, agendamentos)
- Notificações (badge)
- Perfil do admin (dropdown)

---

## 📱 Telas a Serem Criadas

### 1. Dashboard Executivo

#### Objetivo
Visão geral de métricas e indicadores-chave da clínica.

#### Elementos Necessários

**Header:**
- Título: "Dashboard Executivo"
- Seletor de período:
  - Hoje
  - Esta Semana
  - Este Mês
  - Últimos 3 Meses
  - Este Ano
  - Personalizado (date range)
- Info: "Última atualização: [timestamp]"
- Botão: "Atualizar"

**Seção: KPIs Principais**
Grid 4 colunas (responsive)

Card 1: Receita do Período
- Valor grande: "R$ 45.250,00"
- Label: "Receita Total"
- Indicador de tendência:
  - Seta verde ↑ "+15% vs período anterior"
  - Mini gráfico sparkline
- Link: "Ver detalhes"

Card 2: Despesas do Período
- Valor: "R$ 18.500,00"
- Label: "Despesas Totais"
- Indicador: "↓ -5% vs período anterior"
- Progress bar: % do orçamento

Card 3: Saldo
- Valor (destaque): "R$ 26.750,00"
- Label: "Saldo (Receita - Despesas)"
- Indicador: Positivo (verde) ou Negativo (vermelho)
- Margem: "+59%"

Card 4: Consultas Realizadas
- Número: "156"
- Label: "Consultas no Período"
- Subtexto: "Média de 5,2/dia"
- Indicador de tendência

**Seção: Gráficos Principais**
Grid 2 colunas (grande)

Gráfico 1: Receitas vs Despesas
- Gráfico de barras agrupadas
- Eixo X: Períodos (dias, semanas ou meses - conforme filtro)
- Eixo Y: Valores em R$
- Duas séries:
  - Barras verdes: Receitas
  - Barras vermelhas: Despesas
- Linha: Saldo
- Legenda
- Tooltip com valores exatos
- Botão: "Expandir"

Gráfico 2: Agendamentos por Status
- Gráfico de rosca (donut)
- Segmentos:
  - Realizados (verde)
  - Cancelados (vermelho)
  - Não Compareceu (laranja)
- Centro: Número total
- Legenda com percentuais
- Clique em segmento: filtra dados

**Seção: Métricas de Agendamentos**
Grid 3 colunas

Card: Taxa de Ocupação
- Percentual grande: "82%"
- Label: "Taxa de Ocupação Geral"
- Progress bar colorido (verde se >70%)
- Breakdown por profissional (mini-bars)

Card: Taxa de Confirmação
- Percentual: "91%"
- Label: "Consultas Confirmadas"
- Comparativo período anterior
- Badge: "Excelente" / "Bom" / "Atenção"

Card: Taxa de No-Show
- Percentual: "4%"
- Label: "Faltas (No-Show)"
- Indicador: quanto menor, melhor
- Badge de alerta se >10%

**Seção: Consultasde Hoje**

Mini-agenda:
- Lista compacta das próximas 5 consultas
- Para cada:
  - Horário
  - Paciente
  - Profissional
  - Status
- Link: "Ver agenda completa"

**Seção: Alertas e Notificações**

Cards de alerta por prioridade:
- 🔴 CRÍTICO: "5 consultas não confirmadas em menos de 2h"
- 🟡 AVISO: "Despesas do mês 20% acima da média"
- 🔵 INFO: "3 novos pacientes cadastrados hoje"
- 🟢 SUCESSO: "Meta de consultas do mês atingida"

**Seção: Ranking de Profissionais**

Tabela ou lista:
Colunas:
- # (posição)
- Profissional (foto + nome)
- Consultas realizadas
- Receita gerada
- Taxa de ocupação
- Taxa de no-show
Top 5 ou todos (toggle)

**Seção: Novos Pacientes**

Card com mini-lista:
- Últimos 5 pacientes cadastrados
- Foto + nome + data
- Link: "Ver todos"

**Seção: Ações Rápidas**

Grid de botões:
- "Registrar Receita"
- "Registrar Despesa"
- "Convidar Profissional"
- "Cadastrar Procedimento"
- "Ver Relatórios"
- "Configurações"

---

### 2. Gestão da Clínica

#### 2.1. Dados da Clínica

**Header:**
- Título: "Dados da Clínica"
- Botão: "Editar" (modo visualização) / "Salvar" (modo edição)

**Seções:**

**1. Informações Básicas**
Modo visualização (cards informativos):
- Logo da clínica (grande)
- Razão Social
- Nome Fantasia
- CNPJ
- E-mail institucional
- Telefone principal
- Website

Modo edição:
- Upload de logo (drag&drop, crop)
- Inputs para todos os campos
- Validações em tempo real

**2. Endereço**
- CEP (busca automática)
- Logradouro
- Número
- Complemento
- Bairro
- Cidade
- Estado
- Mapa interativo (Google Maps embed)

**3. Configurações de URL**
- Subdomínio: [nome].minhaclinica.com.br
- Domínio personalizado: suaçlinica.com.br
- Certificado SSL: Status
- DNS: Instruções de configuração

**4. Identidade Visual**
- Cor primária (color picker)
- Cor secundária
- Preview de como aparece no portal do paciente
- Botão: "Aplicar Cores"

---

#### 2.2. Configurações Gerais

**Tab 1: Horário de Funcionamento**

Tabela de dias da semana:
- Segunda a Domingo
- Para cada dia:
  - Toggle: Aberto / Fechado
  - Hora de abertura (time picker)
  - Hora de fechamento
- Botão: "Aplicar mesmo horário para todos os dias úteis"
- Botão: "Salvar Horários"

**Tab 2: Feriados e Fechamentos**

Lista de feriados cadastrados:
- Data
- Descrição (ex: "Natal", "Feriado Municipal")
- Recorrente anualmente: Checkbox
- Ações: Editar, Excluir

Botão: "Adicionar Feriado"

Modal de adicionar:
- Data (date picker)
- Descrição (input)
- Recorrente (checkbox)
- Botão: Salvar

Importação:
- Botão: "Importar Feriados Nacionais de [ano]"
- Importa automaticamente feriados brasileiros

**Tab 3: Políticas de Agendamento**

Formulário com sliders e inputs:

- **Intervalo mínimo entre consultas:**
  - Slider: 15, 30, 45, 60 minutos
  - Preview: "15 em 15 minutos"

- **Antecedência mínima para agendamento online:**
  - Input: X horas
  - Exemplo: "2 horas - Paciente não pode agendar para menos de 2h"

- **Antecedência máxima para agendamento online:**
  - Input: X dias
  - Exemplo: "60 dias - Paciente pode agendar até 60 dias no futuro"

- **Prazo para cancelamento gratuito:**
  - Input: X horas
  - Exemplo: "24 horas antes"

- **Tempo de tolerância para atraso:**
  - Input: X minutos
  - Exemplo: "15 min - Após esse tempo, marcar como no-show"

- **Limite de faltas consecutivas:**
  - Input: X faltas
  - Exemplo: "3 faltas - Bloqueia agendamento online"

- **Agendamento online disponível:**
  - Toggle: Ativado / Desativado

- **Requer confirmação do paciente:**
  - Toggle: Sim / Não

Botão: "Salvar Configurações"

**Tab 4: Notificações**

Para cada tipo de notificação:

Confirmação de Agendamento:
- Toggle: Ativo/Inativo
- Canais (checkboxes):
  - ✅ E-mail
  - ✅ SMS
  - ✅ WhatsApp
- Botão: "Editar Template"

Lembrete de Consulta:
- Toggle: Ativo
- Canais
- Quando enviar:
  - Checkbox: 24h antes
  - Checkbox: 2h antes
  - Checkbox: No dia (manhã)
- Botão: "Editar Template"

(Repetir para cada tipo)

---

#### 2.3. Especialidades

**Lista de Especialidades:**

Tabela ou grid:
- Nome
- Ícone/Cor
- Nº de profissionais vinculados
- Status (Ativo/Inativo)
- Ações: Editar, Desativar/Ativar

Botão: "Adicionar Especialidade"

**Modal: Adicionar/Editar Especialidade**

Formulário:
- Nome (input)
- Descrição (textarea)
- Ícone:
  - Galeria de ícones pré-definidos
  - Ou upload customizado
- Cor (color picker)
- Preview do card como aparecerá
- Status: Ativo
- Botão: Salvar

---

### 3. Gestão de Usuários

#### Objetivo
Gerenciar todos os usuários do sistema (admins, recepcionistas, profissionais).

**Header:**
- Título: "Usuários do Sistema"
- Botão: "Convidar Usuário" (primário)
- Estatística: "Total: X usuários"

**Filtros:**
- Tabs por tipo:
  - Todos
  - Administradores
  - Recepcionistas
  - Profissionais
  - (Pacientes têm tela separada)
- Status:
  - Ativos
  - Inativos
  - Bloqueados
  - Pendentes de ativação
- Busca: Nome, e-mail, CPF

**Lista de Usuários:**

Tabela:
- Colunas:
  - Foto
  - Nome
  - E-mail
  - Tipo (badge colorido)
  - Status
  - Último login
  - Ações

Cada linha:
- Avatar colorido
- Nome clicável (abre detalhes)
- Badge de tipo: ADMIN (azul escuro), REC (azul), PROF (verde)
- Badge de status: Ativo (verde), Inativo (cinza), Bloqueado (vermelho)
-Último login: timestamp relativo

Ações:
- Ícone: Ver detalhes
- Ícone: Editar
- Menu (3 pontos):
  - Alterar perfil (role)
  - Resetar senha
  - Desativar/Ativar
  - Desbloquear (se bloqueado)
  - Ver logs de auditoria
  - Forçar logout
  - Excluir (se permitido)

---

**Modal: Convidar Usuário**

Formulário em steps:

**Step 1: Tipo de Usuário**
- Radio buttons grandes (cards):
  - 👨‍⚕️ Profissional de Saúde
  - 👥 Recepcionista
  - ⚙️ Administrador
- Cada opção com descrição das permissões

**Step 2: Dados Básicos**
- Nome completo
- CPF
- E-mail
- Telefone

**Step 3: Dados Específicos**

Se Profissional:
- Conselho profissional (select: CRM, CRO, etc.)
- Número de registro
- UF do registro
- Especialidades (select múltiplo)
- Foto (opcional)

Se Recepcionista:
- Foto (opcional)

Se Admin:
- Foto (opcional)
- Permissões especiais (checkboxes)

**Step 4: Confirmação**
- Resumo dos dados
- Info: "Um e-mail de convite será enviado para [email]"
- Checkbox: "Enviar SMS também"
- Botão: "Enviar Convite"

---

**Modal: Editar Usuário**

Tabs:
1. Dados Pessoais
2. Permissões e Acesso
3. Histórico de Atividades

**Tab 1: Dados Pessoais**
- Todos os campos editáveis
- Foto (upload/alterar)
- Status: Toggle ativo/inativo
- Botão: Salvar Alterações

**Tab 2: Permissões e Acesso**
- Tipo de usuário: Select (permite mudar role)
- Alerta ao mudar role
- Permissões especiais (se implementado)
- Status de verificação:
  - E-mail verificado: Badge
  - Telefone verificado: Badge
- Botões:
  - Forçar alteração de senha no próximo login
  - Resetar senha
  - Enviar novo e-mail de verificação
  - desbloquear conta
  - Revogar todos os tokens

**Tab 3: Histórico**
- Último login: Data/hora + IP
- Total de logins
- Sessões ativas: Lista
- Dispositivos recentes
- Ações recentes (últimas 10)
- Botão: "Ver log completo de auditoria"

---

### 4. Gestão de Profissionais

#### Objetivo
Gerenciar cadastro, horários e configurações de profissionais.

**Header:**
- Título: "Profissionais"
- Botão: "Convidar Profissional"
- Estatística: "X profissionais ativos"

**Filtros:**
- Status: Ativo / Inativo
- Especialidade: Select múltiplo
- Ordenação: Nome, Especialidade, Taxa de ocupação

**Lista de Profissionais:**

Cards (2-3 colunas):
- Foto grande (circular)
- Nome
- Especialidade(s) - tags
- Conselho + registro
- Badge: Status
- **Estatísticas do profissional:**
  - Taxa de ocupação: Progress bar
  - Consultas este mês: Número
  - Avaliação média: Estrelas (se houver)
- Ações:
  - Ver Agenda
  - Configurar Horários
  - Editar Perfil
  - Ver Estatísticas

---

**Modal: Configurar Horários de Atendimento**

Para o profissional selecionado:

**Header:**
- Nome e foto do profissional
- Info: "Configure os dias e horários que [nome] atende"

**Tabela de Horários:**

Para cada dia da semana:
- Nome do dia
- Toggle: Atende / Não atende
- Se atende:
  - Hora início (time picker)
  - Hora fim
  - Checkbox: "Tem intervalo?"
  - Se sim:
    - Hora início intervalo
    - Hora fim intervalo

**Configurações Adicionais:**
- Duração padrão de consulta:
  - Input: minutos (ex: 30)
  - Info: "Usado para calcular horários disponíveis"

- Cor na agenda:
  - Color picker
  - Preview

**Cópia Rápida:**
- Botão: "Copiar horário de segunda para todos os dias úteis"

**Preview:**
- Calendário mostrando como ficará a disponibilidade

Botões:
- Cancelar
- Salvar Horários

---

**Página: Estatísticas do Profissional**

Dashboard individual do profissional:

KPIs:
- Total de consultas (período)
- Receita gerada
- Taxa de ocupação
- Taxa de no-show
- Avaliação média

Gráficos:
- Consultas por semana/mês
- Procedimentos mais realizados
- Horários de pico
- Taxa de comparecimento

---

### 5. Gestão de Pacientes (Admin)

Funcionalidades similares à recepção, mas com adições:

**Funções Extras do Admin:**

- **Importação em Massa:**
  - Botão: "Importar Pacientes"
  - Upload de CSV/Excel
  - Mapeamento de colunas
  - Preview antes de importar
  - Log de importação (sucessos/erros)

- **Exportação:**
  - Botão: "Exportar Pacientes"
  - Formatos: CSV, Excel, PDF
  - Filtros para export

- **Gerenciar: Bloqueios**
  - Ver pacientes bloqueados por faltas
  - Desbloquear manualmente
  - Ver histórico de faltas
  - "Perdoar" faltas

- **Exclusão de Dados (LGPD):**
  - Ver solicitações de exclusão
  - Aprovar/Processar exclusões
  - Log de dados excluídos

---

### 6. Procedimentos

#### Objetivo
Cadastrar e gerenciar procedimentos oferecidos.

**Header:**
- Título: "Procedimentos"
- Botão: "Cadastrar Procedimento"
- Estatística: "X procedimentos cadastrados"

**Filtros:**
- Status: Ativo / Inativo / Todos
- Profissional que realiza: Select
- Disponível online: Sim / Não
- Ordenação: Nome, Mais realizados, Preço

**Lista de Procedimentos:**

Tabela:
- Colunas:
  - Nome
  - Código interno
  - Duração (min)
  - Preço (R$)
  - Profissionais vinculados (#)
  - Disponível online (badge)
  - Total realizado (este mês)
  - Status
  - Ações

Cada linha:
- Nome (clicável - abre detalhes)
- Duração: badge com minutos
- Preço formatado
- Profissionais: "+3" (hover mostra lista)
- Badge verde se disponível online
- Status: Toggle ativo/inativo inline

Ações:
- Editar
- Duplicar
- Desativar/Ativar
- Ver Estatísticas

---

**Modal: Cadastrar/Editar Procedimento**

Formulário:

**Seção 1: Informações Básicas**
- Nome do procedimento *
- Código interno (opcional)
- Descrição (textarea)
- Categoria/Tipo (select)

**Seção 2: Configurações**
- Duração padrão:
  - Input: minutos
  - Slider: 15, 30, 45, 60, 90, 120
- Preço padrão:
  - Input: R$ (mask)
  - Info: "Pode ser personalizado por profissional"

**Seção 3: Disponibilidade**
- Toggle: Disponível para agendamento online
- Toggle: Requer autorização manual
- Toggle: Ativo no sistema

**Seção 4: Profissionais**
- Lista de profissionais da clínica
- Checkbox para cada:
  - [x] Dr. João Silva
    - Duração customizada: 45 min (opcional)
    - Preço customizado: R$ 200 (opcional)
  - [ ] Dra. Maria Santos

**Seção 5: Cores e Identificação**
- Cor para agenda (color picker)
- Ícone/Emoji (opcional)
- Preview de como aparece

**Preview:**
- Card mostrando como será exibido

Botões:
- Cancelar
- Salvar Procedimento

---

### 7. Financeiro

#### 7.1. Dashboard Financeiro

**Header:**
- Título: "Financeiro"
- Seletor de período (igual dashboard principal)
- Botão: "Registrar Receita"
- Botão: "Registrar Despesa"

**Seção: Resumo Financeiro**

Grid 4 cards grandes:

Card 1: Receitas
- Valor grande: "R$ 45.250,00"
- Label: "Receitas Totais"
- Indicador vs período anterior
- Breakdown:
  - Recebidas: R$ X
  - Pendentes: R$ Y
- Mini gráfico

Card 2: Despesas
- Valor: "R$ 18.500,00"
- Label: "Despesas Totais"
- Indicador
- Breakdown:
  - Pagas: R$ X
  - Pendentes: R$ Y

Card 3: Saldo
- Valor destacado: "R$ 26.750,00"
- Label: "Saldo do Período"
- Percentual de margem
- Indicador (positivo/negativo)

Card 4: Lucro Médio
- Valor: "R$ 892/dia"
- Label: "Lucro Médio Diário"
- Comparativo

**Gráfico: Evolução Financeira**
- Gráfico de área empilhada ou linhas
- Eixo X: Períodos (dias, semanas, meses)
- Três linhas/áreas:
  - Receitas (verde)
  - Despesas (vermelho)
  - Saldo (azul)
- Legenda
- Zoom/drag
- Exportar imagem

**Gráfico: Receitas por Categoria**
- Gráfico de pizza ou barras horizontais
- Categorias:
  - Consultas
  - Procedimentos
  - Produtos
  - Outras receitas
- Valor e percentual
- Clique: detalha aquela categoria

**Gráfico: Despesas por Categoria**
- Similar ao de receitas
- Categorias:
  - Folha depagamento
  - Aluguel
  - Materiais
  - Marketing
  - Utilidades
  - Outros

**Tabela: Maiores Receitas**
- Top 10 receitas do período
- Colunas: Data, Paciente, Procedimento, Valor, Status
- Link para detalhes

**Tabela: Maiores Despesas**
- Top 10 despesas do período
- Colunas: Data, Descrição, Categoria, Valor, Status

---

#### 7.2. Receitas

**Header:**
- Título: "Receitas"
- Botão: "Registrar Receita Manual"
- Filtros e busca

**Filtros:**
- Status: Todas, Pagas, Pendentes
- Período: Date range
- Profissional: Select
- Procedimento: Select
- Paciente: Input (busca)
- Forma de pagamento: Select múltiplo
- Valor: Range (R$ min - max)

**Lista de Receitas:**

Tabela:
- Colunas:
  - ID/Nº
  - Data
  - Paciente
  - Profissional
  - Procedimento/Descrição
  - Forma de pagamento
  - Valor
  - Status
  - Ações

Cada linha:
- ID: clicável (abre detalhes)
- Data: formatada
- Paciente e Profissional: com foto mini
- Badge de forma de pagamento: Dinheiro, Cartão, PIX, etc.
- Valor: formatado em R$, grande
- Status: Badge colorido (Pago verde, Pendente amarelo)

Ações:
- Ver detalhes
- Editar
- Marcar como paga/pendente
- Gerar recibo
- Excluir (com confirmação)

**Totalizadores:**
No rodapé da tabela:
- Total de receitas: R$ X
- Total pago: R$ Y
- Total pendente: R$ Z

---

**Modal: Registrar Receita Manual**

Formulário:

**Origem:**
- Radio:
  - De uma consulta (vincula a agendamento)
  - Avulsa (não vinculada)

Se "De uma consulta":
- Buscar agendamento: Input (paciente ou data)
- Campos preenchidos automaticamente

Campos:
- Data de referência * (date picker)
- Descrição * (input)

- Paciente (select/busca - se não vinculado a consulta)
- Profissional (select)
- Procedimento (select)
- Categoria (select): Consulta, Procedimento, Produto, Outra

- Valor * (input R$)
- Forma de pagamento *:
  - Radio ou select:
    - Dinheiro
    - Cartão de Débito
    - Cartão de Crédito
    - PIX
    - Transferência
    - Cheque

- Status de pagamento *:
  - Radio:
    - Pago (abre campo "Data do pagamento")
    - Pendente (abre campo "Data de vencimento")

- Observações (textarea)
- Anexos: Upload de comprovantes

Botões:
- Cancelar
- Salvar e Novo
- Salvar Receita

---

#### 7.3. Despesas

Similar à Receitas, mas adaptado:

**Modal: Registrar Despesa**

Campos:
- Data de referência *
- Descrição *
- Categoria * (select):
  - Aluguel
  - Folha de Pagamento
  - Materiais e Insumos
  - Marketing
  - Utilidades (água, luz, internet)
  - Manutenção
  - Impostos e Taxas
  - Outras
  - (+ Gerenciar Categorias)

- Fornecedor (input)
- Valor *
- Forma de pagamento
- Status *:
  - Paga
  - Pendente
- Data de vencimento (se pendente)
- Data do pagamento (se paga)

- Observações
- Anexos: Notas fiscais, comprovantes

Botões:
- Cancelar
- Salvar e Nova
- Salvar Despesa

---

#### 7.4. Categorias de Despesas

**Gerenciar Categorias:**

Lista:
- Nome da categoria
- Total gasto (este mês)
- Total gasto (este ano)
- Ações: Editar, Excluir

Botão: "Adicionar Categoria"

Modal:
- Nome da categoria
- Cor (color picker)
- Ícone/Emoji
- Botão: Salvar

---

### 8. Relatórios Avançados

#### Objetivo
Gerar relatórios detalhados com filtros e exportação.

**Página de Relatórios:**

Cards de tipos de relatório:

**1. Relatório de Agendamentos**
- Descrição: "Análise completa de agendamentos"
- Filtros disponíveis: Período, Profissional, Status, Procedimento
- Botão: "Gerar"

**2. Relatório de Pacientes**
- Descrição: "Cadastro e análise de pacientes"
- Filtros: Período cadastro, Status, Com/sem agendamento
- Botão: "Gerar"

**3. Relatório Financeiro**
- Descrição: "Receitas, despesas e DRE"
- Filtros: Período, Categorias
- Botão: "Gerar"

**4. Relatório de Performance**
- Descrição: "KPIs e métricas de performance"
- Filtros: Período, Profissional
- Botão: "Gerar"

**5. Relatório de No-Show**
- Descrição: "Análise de faltas"
- Filtros: Período, Profissional, Paciente
- Botão: "Gerar"

**6. Relatório de Produtividade**
- Descrição: "Produtividade por profissional"
- Filtros: Período, Profissional
- Botão: "Gerar"

---

**Visualização de Relatório:**

Modal fullscreen ou página:

Header:
- Título do relatório
- Filtros aplicados (tags)
- Botão: "Editar Filtros"
- Botões de ação:
  - Exportar PDF
  - Exportar Excel
  - Imprimir
  - Compartilhar
  - Agendar envio automático

Conteúdo:
- Sumário executivo (cards de resumo)
- Gráficos (múltiplos, conforme relatório)
- Tabelas de dados
- Insights automáticos (se possível):
  - "Procedimento X foi 30% mais realizado que média"
  - "Terça-feira é o dia com mais faltas"
  - "Profissional Y tem maior taxa de retorno de pacientes"

Footer:
- Data de geração
- Usuário que gerou
- Disclaimer

---

### 9. Notificações (Admin)

#### 9.1. Configurações de Notificações

**Tabs:**
1. Configurações Gerais
2. Templates de Mensagens
3. Histórico de Envios
4. Campanhas

**Tab 1: Configurações Gerais**

Para cada tipo de notificação:

Card: Confirmação de Agendamento
- Toggle: Ativo/Inativo
- Canais disponíveis:
  - [x] E-mail
  - [x] SMS
  - [x] WhatsApp
  - [ ] Push (futuro)
- Botão: "Editar Template"

(Repetir para todos os tipos)

Configurações globais:
- Horário de envio de lembretes:
  - Input: "Enviar às [hora]"
- Não enviar notificações:
  - Checkboxes: Domingos, Feriados
- Remetente padrão:
  - Nome: [Nome da Clínica]
  - E-mail: [email]

Botão: "Salvar Configurações Gerais"

---

**Tab 2: Templates**

Lista de templates:
- Nome do template
- Tipo (Agendamento, Lembrete, etc.)
- Canal (E-mail, SMS, WhatsApp)
- Última edição
- Ações: Editar, Duplicar, Preview

**Modal: Editar Template**

Editor:
- Tipo de notificação (readonly)
- Canal (readonly)

Para E-mail:
- Assunto (input): 
  - "Confirmação de Agendamento - {CLINICA_NOME}"
- Corpo (texto editor rich text):
  - Variáveis dinâmicas (inserir com botão):
    - {PACIENTE_NOME}
    - {DATA}
    - {HORARIO}
    - {PROFISSIONAL}
    - {PROCEDIMENTO}
    - {CLINICA_NOME}
    - {CLINICA_ENDERECO}
    - {CLINICA_TELEFONE}
    - {LINK_CONFIRMACAO}
    - {LINK_CANCELAMENTO}
  - Formatação: bold, italic, cores, links
  - Preview HTML

Para SMS/WhatsApp:
- Mensagem (textarea):
  - Contador de caracteres
  - Limite: 140/160 (SMS) ou 1000 (WhatsApp)
  - Mesmas variáveis dinâmicas
  - Preview formatado

**Preview em Tempo Real:**
- Painel à direita mostrando como ficará
- Dados de exemplo preenchidos

Botões:
- Cancelar
- Testar (envia para seu próprio contato)
- Salvar Template

---

**Tab 3: Histórico de Envios**

Filtros:
- Período
- Tipo de notificação
- Canal
- Status: Enviadas, Falhas, Pe, Lidas
- Destinatário: Busca

Tabela:
- Colunas:
  - Data/Hora
  - Tipo
  - Canal
  - Destinatário
  - Status
  - Ações

Status:
- ✅ Enviado (verde)
- ❌ Falha (vermelho)
- ⏳ Pendente (amarelo)
- 📖 Lido (azul) - se rastreável

Ações:
- Ver detalhes
- Reenviar (se falhou)

Modal de detalhes:
- Todos os dados da notificação
- Conteúdo enviado
- Log de tentativas
- Mensagem de erro (se houver)

Estatísticas no topo:
- Total enviado
-Taxa de entrega
- Taxa de leitura (e-mail)
- Taxa de falha

---

**Tab 4: Campanhas**

Criar comunicação em massa.

Botão: "Nova Campanha"

Lista de campanhas:
- Nome da campanha
- Data de criação
- Data de envio (agendada ou enviada)
- Público-alvo (#)
- Canal
- Status: Rascunho, Agendada, Enviada
- Estatísticas: Enviados, Lidos, Cliques
- Ações

**Modal: Criar Campanha**

Steps:

**Step 1: Definir Público**
- Nome da campanha
- Filtros de público:
  - Todos os pacientes
  - Pacientes ativos
  - Pacientes com consulta futura
  - Pacientes com especialidade X
  - Pacientes de profissional Y
  - Pacientes aniversariantes do mês
  - Importar lista (CSV)
- Preview: "X pacientes selecionados"

**Step 2: Criar Mensagem**
- Canal: Email, SMS, WhatsApp
- Usar template: Select (ou criar nova)
- Editar mensagem (igual aos templates)
- Variáveis dinâmicas disponíveis
- Preview

**Step 3: Agendar Envio**
- Enviar agora: Radio
- Agendar: Radio
  - Data e hora (date+time picker)
  - Fuso horário
- Envio gradual:
  - Checkbox: "Enviar em lotes"
  - X mensagens a cada Y minutos

**Step 4: Revisar e Confirmar**
- Resumo completo
- Estimativa de custo (se SMS)
- Checkbox: "Confirmo que revisei a mensagem"
- Botões:
  - Voltar
  - Salvar Rascunho
  - Agendar/Enviar

---

### 10. Auditoria e Logs

#### Objetivo
Rastreamento completo de ações no sistema.

**Header:**
- Título: "Logs de Auditoria"
- Info: "Todas as ações são registradas para segurança e conformidade"

**Filtros Avançados:**
- Período: Date range + time
- Usuário: Select (todos usuários)
- Tipo de ação:
  - Todos
  - Criar (CREATE)
  - Editar (UPDATE)
  - Excluir (DELETE)
  - Login/Logout (AUTH)
  - Acesso (VIEW)
- Entidade:
  - Todas
  - User
  - Patient
  - Appointment
  - Procedure
  - Financial
  - etc.
- IP: Input
- Busca livre: Input (busca em qualquer campo)

**Tabela de Logs:**

Colunas:
- Data/Hora (precisa - com milissegundos)
- Usuário (foto + nome)
- Ação (badge colorido)
  - CREATE (verde)
  - UPDATE (azul)
  - DELETE (vermelho)
  - VIEW (cinza)
  - LOGIN (amarelo)
- Entidade afetada
- Detalhes (preview)
- IP origem
- Dispositivo
- Ações: Ver detalhes

**Modal: Detalhes do Log**

Informações completas:
- Timestamp exato
- Usuário:
  - Nome
  - E-mail
  - Role
- Ação realizada
- Entidade e ID
- **Dados Antes:** (se UPDATE ou DELETE)
  - JSON formatado
  - Diff highlighting
- **Dados Depois:** (se CREATE ou UPDATE)
  - JSON formatado
- Contexto:
  - IP
  - User-Agent
  - Localização (se disponível)
  - Sessão ID

Botão: "Exportar este log"

---

**Tab: Segurança**

**Tentativas de Login Falhadas:**
- Lista de tentativas malsucedidas
- Filtros: Período, Usuário, IP
- Colunas:
  - Data/Hora
  - E-mail tentado
  - IP
  - Motivo (senha incorreta, usuário não existe, conta bloqueada)
  - Ações: Bloquear IP, Investigar

**Contas Bloqueadas:**
- Lista de usuários bloqueados
- Motivo do bloqueio
- Data do bloqueio
- Ação: Desbloquear

**Sessões Ativas:**
- Todas as sessões ativas no sistema
- Usuário
- IP
- Dispositivo
- Última atividade
- Ação: Forçar logout

**Acessos Suspeitos:**
- Algoritmo detecta padrões suspeitos
- Alertas:
  - Login de IP desconhecido
  - Múltiplos logins simultâneos
  - Acessos fora do horário
  - Localização inesperada
- Ação: Investigar, Bloquear

---

**Tab: LGPD**

**Solicitações de Dados:**
- Lista de solicitações de portabilidade de dados
- Status: Pendente, Processando, Concluída
- Ações: Processar, Baixar arquivo, Enviar ao solicitante

**Solicitações de Exclusão:**
- Lista de pedidos de exclusão de conta
- Status: Pendente aprovação, Agendada, Concluída
- Prazo legal: Contador
- Ações: Aprovar, Rejeitar (com justificativa), Processar

**Consentimentos:**
- Lista de tipos de consentimento
- Quantos usuários consentiram
- Taxa de consentimento
- Gerenciar textos de consentimento

**Histórico de Exclusões:**
- Registro de dados excluídos
- Não reversível
- Apenas visualização

---

### 11. Configurações do Sistema

#### 11.1. Integrações

**Card: WhatsApp Business API**
- Status: Conectado / Desconectado
- Número vinculado: +55 (11) 99999-9999
- Última mensagem: timestamp
- Estatísticas: X mensagens enviadas este mês
- Botões:
  - Configurar
  - Testar Conexão
  - Desconectar

Modal de configuração:
- API Key
- Webhook URL
- Instruções de setup

**Card: Gateway de SMS**
- Status
- Provedor: (Twilio, Zenvia, etc.)
- Créditos restantes: X SMS
- Botões:
  - Configurar
  - Comprar Créditos
  - Testar

**Card: E-mail (SMTP)**
- Status
- Servidor: smtp.seuprovedor.com
- E-mail remetente: clinica@example.com
- Botões:
  - Configurar
  - Testar Envio

**Card: Pagamento Online** (futuro)
- Status: Não configurado
- Provedores disponíveis: Stripe, PagSeguro, Mercado Pago
- Botão: Configurar

**Card: Calendário** (futuro)
- Sincronização com:
  - Google Calendar
  - Microsoft Outlook
- Status: Não configurado

**Card: Telemedicina** (futuro)
- Integração com plataforma de videochamada
- Status: Não configurado

---

#### 11.2. Backup e Segurança

**Backups Automáticos:**
- Status: Ativo
- Frequência: Diário às 03:00
- Última execução: [timestamp]
- Resultado: Sucesso / Falha
- Tamanho: 1.2 GB
- Retenção: 30 dias

Botões:
- Fazer Backup Agora
- Configurar Frequência
- Ver Histórico de Backups

**Lista de Backups:**
- Data
- Tamanho
- Status
- Ações:
  - Baixar
  - Restaurar (com alerta grave)
  - Excluir

**Modal: Restaurar Backup**
- ALERTA CRÍTICO
- "Esta ação substituirá todos os dados atuais"
- "Todos os dados desde [data do backup] serão perdidos"
- Checkbox: "Entendo os riscos"
- Campo: Digite "RESTAURAR" para confirmar
- Botões:
  - Cancelar
  - Confirmar Restauração (vermelho)

---

#### 11.3. Informações do Sistema

**Card: Versão do Sistema**
- Versão atual: v1.0.0
- Última atualização: [data]
- Notas da versão: Link
- Botão: "Verificar Atualizações"

**Card: Uso de Recursos**
- Espaço em disco:
  - Usado: 1.5 GB / 10 GB
  - Progress bar
- Uploads de arquivos: 850 MB
- Banco de dados: 650 MB
- Usuários: 45 / 100
- Pacientes: 1.250 / ∞

Card: Plano e Assinatura**
- Plano atual: Profissional
- Valor: R$ 199/mês
- Próxima cobrança: 20/03/2026
- Forma de pagamento: Cartão •••• 1234
- Botões:
  - Alterar Plano
  - Atualizar Pagamento
  - Ver Faturas

**Card: Suporte:**
- Central de Ajuda: Link
- FAQ: Link
- Tutoriais: Link
- Contato: E-mail, Telefone, Chat
- Agendar treinamento: Link

---

## 🎯 Especificações Técnicas

### Rotas e Endpoints do Admin

```typescript
// Autenticadas (Bearer token com role ADMIN)

// Dashboard
GET    /api/admin/dashboard                    // Dashboard executivo
GET    /api/admin/dashboard/kpis               // KPIs principais
GET    /api/admin/dashboard/charts             // Dados dos gráficos

// Clínica
GET    /api/admin/clinic                       // Dados da clínica
PUT    /api/admin/clinic                       // Atualizar clínica
PUT    /api/admin/clinic/logo                  // Atualizar logo
GET    /api/admin/clinic/settings              // Ver configurações
PUT    /api/admin/clinic/settings              // Atualizar configurações

// Usuários (CRUD completo)
GET    /api/admin/users                        // Listar todos
POST   /api/admin/users/invite                 // Convidar
PUT    /api/admin/users/:id                    // Editar
PUT    /api/admin/users/:id/role               // Alterar perfil
DELETE /api/admin/users/:id                    // Excluir
POST   /api/admin/users/:id/reset-password     // Resetar senha
POST   /api/admin/users/:id/unlock             // Desbloquear
POST   /api/admin/users/:id/force-logout       // Forçar logout

// Profissionais
GET    /api/admin/professionals                // Listar
POST   /api/admin/professionals/invite         // Convidar
PUT    /api/admin/professionals/:id            // Editar
PUT    /api/admin/professionals/:id/schedule   // Config horários
GET    /api/admin/professionals/:id/stats      // Estatísticas

// Especialidades
GET    /api/admin/specialties                  // Listar
POST   /api/admin/specialties                  // Criar
PUT    /api/admin/specialties/:id              // Editar
DELETE /api/admin/specialties/:id              // Excluir

// Procedimentos
GET    /api/admin/procedures                   // Listar
POST   /api/admin/procedures                   // Criar
PUT    /api/admin/procedures/:id               // Editar
DELETE /api/admin/procedures/:id               // Excluir

// Financeiro
GET    /api/admin/financial/dashboard          // Dashboard financeiro
GET    /api/admin/financial/revenues           // Listar receitas
POST   /api/admin/financial/revenues           // Registrar receita
PUT    /api/admin/financial/revenues/:id       // Editar
DELETE /api/admin/financial/revenues/:id       // Excluir
GET    /api/admin/financial/expenses           // Listar despesas
POST   /api/admin/financial/expenses           // Registrar despesa
PUT    /api/admin/financial/expenses/:id       // Editar
DELETE /api/admin/financial/expenses/:id       // Excluir
GET    /api/admin/financial/categories         // Categorias
POST   /api/admin/financial/categories         // Criar categoria

// Relatórios
POST   /api/admin/reports/generate             // Gerar relatório
GET    /api/admin/reports/:id                  // Buscar relatório
POST   /api/admin/reports/:id/export           // Exportar

// Notificações
GET    /api/admin/notifications/settings       // Config notificações
PUT    /api/admin/notifications/settings       // Atualizar config
GET    /api/admin/notifications/templates      // Templates
PUT    /api/admin/notifications/templates/:id  // Editar template
GET    /api/admin/notifications/history        // Histórico
POST   /api/admin/notifications/campaign       // Criar campanha
POST   /api/admin/notifications/test           // Testar notificação

// Auditoria
GET    /api/admin/audit/logs                   // Logs de auditoria
GET    /api/admin/audit/security               // Logs de segurança
GET    /api/admin/audit/lgpd                   // Solicitações LGPD
POST   /api/admin/audit/lgpd/:id/process       // Processar solicitação

// Sistema
GET    /api/admin/system/info                  // Info do sistema
GET    /api/admin/system/backups               // Listar backups
POST   /api/admin/system/backups               // Criar backup
POST   /api/admin/system/backups/:id/restore   // Restaurar
GET    /api/admin/system/integrations          // Integrações
PUT    /api/admin/system/integrations/:name    // Config integração
```

---

## 📝 Considerações Finais para o Admin

### UX Específica
- **Data-Driven:** Muitos gráficos, tabelas e métricas
- **Controle Total:** Acesso a todas as funcionalidades
- **Decisões Informadas:** Insights e análises automáticas
- **Eficiência:** Exportações, importações em massa
- **Segurança:** Confirmações em ações críticas

### Performance
- Paginação em todas as listas grandes
- Lazy loading de gráficos
- Cache de dashboards
- Background jobs para relatórios pesados

### Visualização de Dados
- Biblioteca de gráficos: Chart.js, Recharts, ApexCharts
- Tabelas: React Table, AG Grid
- Exportação: ExcelJS, jsPDF
- Cores consistentes nos gráficos

### Responsividade
- Desktop-first (admin geralmente usa desktop)
- Tablet parcialmente suportado
- Mobile: apenas visualizações críticas

