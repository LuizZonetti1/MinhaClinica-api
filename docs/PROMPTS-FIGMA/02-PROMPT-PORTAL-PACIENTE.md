# Prompt para IA do Figma - Portal do Paciente

## 📋 Contexto do Sistema

**Nome:** Minha Clínica - Portal do Paciente  
**Perfil:** PATIENT (Paciente)  
**Objetivo:** Interface para pacientes gerenciarem agendamentos, perfil e histórico médico

---

## 🎨 Diretrizes de Design

### Identidade Visual
- **Estilo:** Amigável, acessível, tranquilizador
- **Paleta de cores:** 
  - Primária: Azul suave (#3B82F6)
  - Secundária: Verde saúde (#10B981)
  - Alerta: Amarelo (#F59E0B)
  - Erro: Vermelho (#EF4444)
  - Fundo: Cinza claro (#F9FAFB)
- **Tom:** Informal mas profissional, próximo ao usuário
- **Ícones:** Outline, friendly, não intimidadores
- **Ilustrações:** Humanas, diversas, acolhedoras

---

## 📱 Estrutura de Navegação

### Menu Principal (Sidebar Desktop / Bottom Nav Mobile)
- 🏠 Início
- 📅 Agendamentos
- 📋 Histórico
- 👤 Meu Perfil
- 🔔 Notificações (com badge de contador)
- ⚙️ Configurações

### Header (todas as telas)
- Logo da clínica (esquerda)
- Nome da clínica (desktop)
- Barra de busca (opcional)
- Ícone de notificações (badge)
- Avatar do usuário + nome (clicável)
  - Dropdown: Meu Perfil, Configurações, Ajuda, Sair

---

## 📱 Telas a Serem Criadas

### 1. Dashboard / Página Inicial

#### Objetivo
Visão geral rápida com acesso às principais ações.

#### Elementos Necessários

**Saudação Personalizada:**
- Texto dinâmico: "Olá, [Nome do Paciente]!"
- Subtítulo: Data e hora atual
- Mensagem contextual: "Você tem X consultas agendadas"

**Card: Próxima Consulta**
- Destaque visual (card maior, cor diferenciada)
- Informações:
  - Data e horário (grande, legível)
  - Profissional (nome + foto circular)
  - Especialidade
  - Procedimento
  - Status: Badge colorido (Agendado/Confirmado/etc.)
  - Endereço da clínica (com ícone de mapa)
- Ações rápidas:
  - Botão: "Ver Detalhes"
  - Botão: "Confirmar Presença" (se não confirmado)
  - Botão: "Cancelar" (secundário, discreto)
  - Botão: "Adicionar ao Calendário"

**Estado: Nenhuma Consulta Próxima**
- Ilustração: Calendário vazio
- Texto: "Você não tem consultas agendadas"
- Botão: "Agendar Consulta" (primário)

**Card: Atalhos Rápidos**
- Grid 2x2 (mobile: 2 colunas)
- Ícones grandes + texto:
  1. "Nova Consulta" → vai para tela de agendamento
  2. "Meu Histórico" → lista de consultas passadas
  3. "Atualizar Dados" → editar perfil
  4. "Falar com a Clínica" → contato/WhatsApp

**Card: Consultas Futuras (lista resumida)**
- Título: "Próximos Agendamentos"
- Lista dos próximos 3 agendamentos
- Cada item:
  - Data e hora
  - Profissional
  - Status (badge)
  - Seta para ver detalhes
- Link: "Ver todos os agendamentos"

**Card: Lembretes/Alertas**
- Banner colorido se houver ações pendentes:
  - ⚠️ "Você tem 2 consultas aguardando confirmação"
  - 📄 "Atualize seus dados cadastrais"
  - 💳 "Pagamento pendente de consulta anterior"
- Botões de ação rápida

**Card: Dicas de Saúde (opcional)**
- Carrossel de dicas ou artigos
- Imagem + título + preview
- Link: "Ler mais"

---

### 2. Novo Agendamento (Multi-step)

#### Objetivo
Permitir que o paciente agende uma nova consulta de forma intuitiva.

#### Elementos Necessários

**Progresso:**
- Stepper no topo: 4 etapas
  1. Especialidade
  2. Profissional
  3. Data e Horário
  4. Confirmação

**Etapa 1: Escolher Especialidade**

Layout:
- Título: "O que você precisa?"
- Subtítulo: "Escolha a especialidade"

Componentes:
- Grid de cards de especialidades (2-3 colunas)
- Cada card:
  - Ícone grande e colorido
  - Nome da especialidade
  - Breve descrição
  - Quantidade de profissionais disponíveis
  - Hover effect
- Barra de busca: "Buscar especialidade..."
- Botão: "Não sei qual especialidade" (abre ajuda/chat)

**Etapa 2: Escolher Profissional**

Layout:
- Breadcrumb: "Especialidade > Escolher Profissional"
- Título: "Escolha o profissional"
- Filtros (sidebar ou dropdown):
  - Ordenar por: Disponibilidade, Nome, Avaliação
  - Sexo do profissional (opcional)
  - Período disponível (manhã, tarde, noite)

Componentes:
- Lista de cards de profissionais (vertical)
- Cada card:
  - Foto do profissional (grande, circular)
  - Nome completo
  - Especialidade(s)
  - Registro profissional (CRM, CRO, etc.)
  - Estrelas de avaliação (se disponível)
  - Badge: "Primeira vez disponível"
  - Tag: "Próxima disponibilidade: [data]"
  - Botão: "Selecionar"
- Botão: "Voltar para especialidades"

**Etapa 3: Data e Horário**

Layout:
- Breadcrumb: "Especialidade > Profissional > Data e Horário"
- Título: "Quando você prefere?"
- Info card: Dados do profissional selecionado (pequeno, no topo)

Componentes:
- **Seletor de Data:**
  - Calendário visual (mês inteiro)
  - Dias disponíveis: cor normal
  - Dias indisponíveis: cinza, sem hover
  - Dia selecionado: destaque azul
  - Navegação: setas para mudar mês
  - Indicador: "Próximos 60 dias"

- **Lista de Horários Disponíveis:**
  - Aparece após selecionar data
  - Grid de botões (4-5 colunas no desktop)
  - Formato: "09:00", "09:30", "10:00"...
  - Horário selecionado: botão azul preenchido
  - Horários ocupados: não aparecem
  - Agrupados por período:
    - ☀️ Manhã (6h-12h)
    - 🌤️ Tarde (12h-18h)
    - 🌙 Noite (18h-22h)

- **Seletor de Procedimento:**
  - Select ou radio buttons
  - Lista de procedimentos que o profissional realiza
  - Cada item mostra:
    - Nome do procedimento
    - Duração estimada
    - Preço (se visível)
  - Procedimento selecionado: checkbox azul

Ações:
- Botão: "Voltar"
- Botão: "Continuar" (desabilitado até selecionar data + hora + procedimento)

**Etapa 4: Confirmação**

Layout:
- Título: "Confirme seu agendamento"
- Card de resumo (destaque, grande)

Informações:
- **Profissional:**
  - Foto
  - Nome
  - Especialidade
  - Registro

- **Data e Horário:**
  - Ícone de calendário
  - Data por extenso: "Segunda-feira, 20 de Fevereiro de 2026"
  - Horário: "09:00 às 09:30"
  - Duração: "30 minutos"

- **Procedimento:**
  - Nome
  - Descrição breve
  - Preço (se aplicável)

- **Local:**
  - Endereço da clínica
  - Link para abrir no mapa
  - Telefone da clínica

**Observações (opcional):**
- Textarea: "Alguma observação? (opcional)"
- Placeholder: "Ex: Primeira consulta, tenho alergia a..."

**Políticas:**
- Info box:
  - ⏰ "Chegue 10 minutos antes"
  - 📱 "Você receberá lembretes por SMS e e-mail"
  - ❌ "Cancelamento gratuito até 24h antes"

Ações:
- Botão: "Voltar" (editar)
- Botão: "Confirmar Agendamento" (primário, grande)

**Tela de Sucesso:**
- Ícone animado de check verde
- Título: "Agendamento confirmado!"
- Mensagem: "Você receberá uma confirmação por e-mail e SMS"
- Card com resumo do agendamento
- Ações:
  - Botão: "Adicionar ao Calendário" (Google, Outlook, Apple)
  - Botão: "Ver Meus Agendamentos"
  - Botão: "Fazer Novo Agendamento"
  - Botão: "Voltar ao Início"

---

### 3. Meus Agendamentos

#### Objetivo
Listar todos os agendamentos futuros do paciente.

#### Elementos Necessários

**Header da Página:**
- Título: "Meus Agendamentos"
- Botão: "Nova Consulta" (primário, canto superior direito)

**Filtros/Tabs:**
- Tabs:
  - Futuros (badge com contador)
  - Aguardando Confirmação (badge)
  - Todos

- Filtros (dropdown ou sidebar):
  - Por profissional
  - Por especialidade
  - Por procedimento
  - Por período (este mês, próximos 30 dias, todos)

**Lista de Agendamentos:**

Estado: Lista com agendamentos
- Cards de agendamentos (verticais, um abaixo do outro)
- Cada card contém:

  **Header do Card:**
  - Data grande e destacada (esquerda)
  - Badge de status (direita):
    - 🔵 Agendado
    - 🟢 Confirmado
    - 🟡 Aguardando Confirmação
    - 🟣 Em Breve (menos de 2h)

  **Corpo do Card:**
  - Horário: "09:00 - 09:30"
  - Profissional: foto pequena + nome
  - Especialidade
  - Procedimento
  - Local: endereço da clínica (ícone)

  **Ações do Card:**
  - Botão: "Confirmar Presença" (se status = aguardando)
  - Botão: "Ver Detalhes" (ícone de olho)
  - Menu dropdown (3 pontos):
    - Reagendar
    - Cancelar
    - Adicionar ao Calendário
    - Ver no Mapa
    - Compartilhar

Estado: Nenhum agendamento
- Ilustração: Calendário vazio
- Título: "Nenhum agendamento futuro"
- Texto: "Agende sua próxima consulta agora"
- Botão: "Agendar Consulta"

**Modal: Detalhes do Agendamento**
(Abre ao clicar em "Ver Detalhes")

Conteúdo:
- Todos os dados do agendamento (completo)
- Timeline do agendamento:
  - Criado em: [data]
  - Confirmado em: [data] (se confirmado)
  - Última modificação: [data]
- Seção de observações
- Mapa de localização (embed)
- Ações:
  - Confirmar
  - Reagendar
  - Cancelar
  - Compartilhar
  - Fechar

**Modal: Confirmar Presença**
- Pergunta: "Confirma sua presença em [data] às [hora]?"
- Checkbox: "Enviar lembrete 1 dia antes"
- Ações:
  - Cancelar
  - Confirmar (primário)

**Modal: Cancelar Agendamento**
- Alerta: Ícone de atenção
- Título: "Tem certeza que deseja cancelar?"
- Informações do agendamento (resumo)
- Select: "Motivo do cancelamento"
  - Imprevisto pessoal
  - Conflito de horário
  - Problemas de saúde
  - Outro
- Textarea: "Observações (opcional)"
- Info: "Você pode cancelar gratuitamente até 24h antes"
- Se for menos de 24h: Warning: "Cancelamento com menos de 24h pode incorrer em taxas"
- Ações:
  - Voltar
  - Confirmar Cancelamento (vermelho)

**Modal: Reagendar**
- Reabre o fluxo de agendamento, mas:
  - Mantém profissional e procedimento
  - Permite escolher nova data/hora
  - Info: "O agendamento original será cancelado automaticamente"

---

### 4. Histórico de Consultas

#### Objetivo
Visualizar consultas passadas e informações relacionadas.

#### Elementos Necessários

**Header da Página:**
- Título: "Histórico de Consultas"
- Estatística rápida: "Total de X consultas realizadas"

**Filtros:**
- Barra de busca: "Buscar por profissional, procedimento..."
- Filtros:
  - Período: Último mês, 3 meses, 6 meses, 1 ano, Todos, Personalizado (date range)
  - Profissional: Select múltiplo
  - Especialidade: Select múltiplo
  - Procedimento: Select múltiplo
- Ordenação: Mais recente, Mais antigo

**Timeline de Consultas:**

Layout:
- Timeline vertical (linha à esquerda)
- Agrupado por mês/ano: "Fevereiro 2026", "Janeiro 2026"...

Cards de Consulta:
- Conectados à timeline
- Cada card:
  - Data: "20 de Fevereiro, 2026"
  - Horário: "09:00"
  - Profissional: foto + nome
  - Especialidade
  - Procedimento
  - Status final:
    - ✅ Atendido (verde)
    - ❌ Cancelado (vermelho)
    - 🚫 Não Compareceu (laranja)
  - Botão: "Ver Detalhes"
  - Botão: "Agendar Novamente"

Estado: Nenhuma consulta
- Ilustração: Histórico vazio
- Texto: "Você ainda não realizou consultas"
- Botão: "Agendar Primeira Consulta"

**Modal: Detalhes da Consulta Passada**

Conteúdo:
- Data e horário completos
- Profissional (foto + nome + especialidade)
- Procedimento realizado
- Duração
- Status final
- **Resumo do Atendimento:**
  - Observações gerais (se disponível para o paciente)
  - "Retorno recomendado em X dias" (se houver)
- **Documentos:**
  - Lista de documentos anexados (se houver):
    - Atestados
    - Receitas
    - Exames
    - Declarações
  - Botão de download para cada
- **Informações de Pagamento:**
  - Valor pago
  - Forma de pagamento
  - Status: Pago/Pendente
  - Botão: "Ver Recibo"
- Ações:
  - Fechar
  - Agendar Novamente (com mesmo profissional)

---

### 5. Meu Perfil

#### Objetivo
Visualizar e editar dados pessoais.

#### Elementos Necessários

**Layout:**
- Two-column (desktop) / stacked (mobile)

**Coluna Esquerda: Foto e Resumo**

Componentes:
- **Avatar grande:**
  - Foto do paciente (circular, 150px)
  - Botão hover: "Alterar foto"
  - Upload de imagem (modal)
  - Crop e preview

- **Card de Informações Básicas:**
  - Nome completo
  - E-mail (com badge "verificado")
  - CPF (mascarado: ***.***.***-01)
  - Telefone
  - Membro desde: [data de cadastro]

**Coluna Direita: Dados Detalhados (Tabs)**

**Tab 1: Dados Pessoais**

Modo Visualização (padrão):
- Lista de informações em cards:
  - Nome Completo
  - CPF (mascarado)
  - Data de Nascimento (idade calculada)
  - Sexo
  - RG (se cadastrado)
- Botão: "Editar Dados Pessoais"

Modo Edição (ao clicar em editar):
- Formulário com campos:
  - Nome Completo (input)
  - Data de Nascimento (date picker) - com alerta "Mudanças podem requerer verificação"
  - Sexo (select)
  - RG (input, opcional)
- Ações:
  - Cancelar
  - Salvar Alterações (primário)

**Tab 2: Contato**

Modo Visualização:
- E-mail (com badge verificado)
- Telefone Celular
- Telefone Fixo (opcional)
- Botão: "Editar Contatos"

Modo Edição:
- E-mail (input) + botão "Verificar novo e-mail" se alterado
- Telefone Celular (input com máscara)
- Telefone Fixo (input com máscara, opcional)
- Info: "Alteração de e-mail requer verificação"
- Ações:
  - Cancelar
  - Salvar

**Tab 3: Endereço**

Modo Visualização:
- CEP
- Logradouro, Número
- Complemento (se houver)
- Bairro
- Cidade - Estado
- Botão: "Editar Endereço"

Modo Edição:
- CEP (busca automática ao preencher)
- Logradouro (auto-preenchido)
- Número (input)
- Complemento (input, opcional)
- Bairro (auto-preenchido)
- Cidade (auto-preenchido)
- Estado (auto-preenchido)
- Ações:
  - Cancelar
  - Salvar

**Tab 4: Informações de Saúde**

Modo Visualização:
- Alergias (lista)
  - Se vazio: "Nenhuma alergia cadastrada"
- Observações médicas relevantes (text area preenchido)
- Botão: "Editar Informações de Saúde"

Modo Edição:
- Alergias:
  - Input com chips: adicionar/remover alergias
  - Ex: "Dipirona", "Penicilina", "Lactose"
- Observações médicas (textarea)
  - Placeholder: "Ex: uso contínuo de medicamentos, cirurgias anteriores, condições crônicas..."
  - Contador de caracteres (max 500)
- Info: "Estas informações são confidenciais e só serão vistas pelos profissionais que te atenderem"
- Ações:
  - Cancelar
  - Salvar

**Tab 5: Segurança**

Componentes:
- **Alterar Senha:**
  - Botão: "Alterar Senha" (abre modal)
  - Última alteração: [data]

- **Autenticação em Dois Fatores (2FA):**
  - Toggle: Ativado/Desativado
  - Se desativado: botão "Configurar 2FA"
  - Se ativado: badge verde + botão "Desativar"

- **Sessões Ativas:**
  - Lista de dispositivos logados:
    - Ícone do dispositivo (desktop/mobile)
    - Navegador e sistema operacional
    - IP
    - Última atividade
    - Botão: "Encerrar sessão" (para cada, exceto atual)
  - Botão: "Encerrar todas as outras sessões"

**Modal: Alterar Senha**

Campos:
- Senha Atual (input password)
- Nova Senha (input password com indicador de força)
- Confirmar Nova Senha (input password)
- Checklist de requisitos (igual ao cadastro)
Ações:
- Cancelar
- Alterar Senha (primário)

---

### 6. Notificações

#### Objetivo
Central de notificações e avisos.

#### Elementos Necessários

**Header:**
- Título: "Notificações"
- Badge: Contador de não lidas
- Botão: "Marcar todas como lidas"
- Filtros (dropdown):
  - Todas
  - Não lidas
  - Consultas
  - Lembretes
  - Sistema

**Lista de Notificações:**

Layout:
- Lista vertical agrupada por data
  - Hoje
  - Ontem
  - Esta Semana
  - Mais Antigas

Cada notificação:
- Ícone de tipo (calendário, sino, info, alerta)
- Título em negrito (se não lida)
- Mensagem completa ou preview
- Timestamp relativo: "há 2 horas", "ontem às 15:30"
- Badge de tipo: "Lembrete", "Confirmação", etc.
- Se não lida: fundo levemente colorido
- Botão: "Marcar como lida" (hover)
- Ações contextuais (se aplicável):
  - "Ver Agendamento"
  - "Confirmar Presença"
  - "Reagendar"

Tipos de Notificação:
1. **Agendamento Confirmado:**
   - Ícone: check verde
   - Texto: "Seu agendamento foi confirmado para [data] às [hora]"

2. **Lembrete de Consulta:**
   - Ícone: sino
   - Texto: "Lembrete: Você tem consulta amanhã às [hora] com [profissional]"

3. **Cancelamento:**
   - Ícone: X vermelho
   - Texto: "Sua consulta do dia [data] foi cancelada. [Motivo]"

4. **Reagendamento:**
   - Ícone: calendário
   - Texto: "Sua consulta foi reagendada para [nova data]"

5. **Solicitação de Confirmação:**
   - Ícone: interrogação
   - Texto: "Por favor, confirme sua presença na consulta de [data]"
   - Botões: "Confirmar" | "Cancelar"

6. **Aniversário:**
   - Ícone: balão
   - Texto: "Feliz aniversário, [nome]! A equipe da [clínica] deseja um ótimo dia!"

Estado: Nenhuma notificação
- Ilustração: Sino vazio
- Texto: "Você está em dia!"
- Subtexto: "Sem notificações pendentes"

---

### 7. Configurações

#### Objetivo
Preferências e configurações da conta.

#### Elementos Necessários

**Layout:**
- Lista de seções (cards clicáveis)

**Seção 1: Notificações**
- Ícone: Sino
- Título: "Preferências de Notificação"
- Subtítulo: "Gerencie como deseja receber avisos"
- Seta para a direita

Ao clicar:
- Modal ou nova página com toggles:

**Por Canal:**
- 📧 E-mail:
  - Toggle geral: Ativado/Desativado
  - Lembretes de consulta: Toggle
  - Confirmações: Toggle
  - Novidades da clínica: Toggle
  - Marketing: Toggle

- 📱 SMS:
  - Toggle geral
  - Lembretes de consulta: Toggle
  - Confirmações: Toggle

- 💬 WhatsApp:
  - Toggle geral
  - Lembretes de consulta: Toggle
  - Confirmações: Toggle

- 🔔 Push (app mobile - futuro):
  - Toggle geral

**Por Tipo:**
- Lembretes de consulta:
  - Checkbox: 24h antes
  - Checkbox: 2 horas antes
  - Checkbox: No dia da consulta
- Confirmações de agendamento: Toggle
- Cancelamentos: Toggle (forçado - sempre ativo)
- Novidades da clínica: Toggle
- Aniversário: Toggle

Ações:
- Cancelar
- Salvar Preferências

**Seção 2: Privacidade e LGPD**
- Ícone: Cadeado
- Título: "Privacidade e Dados"
- Subtítulo: "Gerencie seus dados pessoais"
- Seta

Ao clicar:
- Lista de opções:
  - **Baixar Meus Dados:**
    - Descrição: "Solicite uma cópia de todos os seus dados (LGPD)"
    - Botão: "Solicitar Download"
    - Info: "Você receberá um e-mail com arquivo .zip em até 48h"
  
  - **Consentimentos:**
    - Ver e gerenciar consentimentos dados
    - Lista:
      - ✅ Uso de dados para agendamento (obrigatório)
      - ✅ Comunicações sobre consultas (obrigatório)
      - ☑️ Pesquisas de satisfação (opcional - toggle)
      - ☑️ Novidades e promoções (opcional - toggle)
  
  - **Excluir Minha Conta:**
    - Botão vermelho: "Solicitar Exclusão de Conta"
    - Abre modal de confirmação grave:
      - Alerta: "Esta ação é irreversível"
      - Explicação: "Todos os seus dados serão permanentemente excluídos"
      - Checkbox: "Entendo que esta ação não pode ser desfeita"
      - Campo: "Digite 'EXCLUIR' para confirmar"
      - Ações: Cancelar | Confirmar Exclusão (vermelho)

**Seção 3: Aparência**
- Ícone: Paleta
- Título: "Tema e Aparência"
- Subtítulo: "Personalize a interface"
- Seta

Ao clicar:
- Radio buttons:
  - ☀️ Claro (padrão)
  - 🌙 Escuro
  - 🔄 Automático (segue sistema)
- Preview ao lado
- Botão: Aplicar

**Seção 4: Acessibilidade**
- Ícone: Olho/Acessibilidade
- Título: "Acessibilidade"
- Subtítulo: "Ajuste a interface às suas necessidades"
- Seta

Ao clicar:
- Slider: Tamanho da fonte (pequeno | médio | grande | extra grande)
- Toggle: Alto contraste
- Toggle: Animações reduzidas
- Botão: Aplicar

**Seção 5: Idioma** (futuro)
- Ícone: Globo
- Título: "Idioma"
- Subtítulo: "Português (Brasil)"
- Seta

**Seção 6: Ajuda e Suporte**
- Ícone: Interrogação
- Título: "Ajuda e Suporte"
- Subtítulo: "Precisa de ajuda?"
- Seta

Ao clicar:
- Lista de opções:
  - 📚 Central de Ajuda (FAQ)
  - 🎥 Tutoriais em Vídeo
  - 💬 Chat com Suporte
  - 📞 Telefone da Clínica
  - 📧 E-mail de Suporte
  - 📱 WhatsApp da Clínica

**Seção 7: Sobre**
- Ícone: Info
- Título: "Sobre o Minha Clínica"
- Versão: v1.0.0

Ao clicar:
- Informações:
  - Logo do sistema
  - Versão
  - Links: Termos de Uso, Política de Privacidade
  - Copyright
  - Informações da clínica

---

## 🎯 Especificações Técnicas para o Desenvolvedor

### Rotas e Endpoints do Paciente

```typescript
// Autenticadas (requerem Bearer token com role PATIENT)

// Dashboard
GET    /api/patient/dashboard                 // Dados do dashboard

// Agendamentos
GET    /api/patient/appointments               // Listar agendamentos
GET    /api/patient/appointments/:id           // Detalhes de agendamento
POST   /api/patient/appointments               // Criar novo agendamento
PUT    /api/patient/appointments/:id           // Editar agendamento
DELETE /api/patient/appointments/:id           // Cancelar agendamento
POST   /api/patient/appointments/:id/confirm   // Confirmar presença
POST   /api/patient/appointments/:id/reschedule // Reagendar

// Disponibilidade
GET    /api/patient/specialties                // Listar especialidades
GET    /api/patient/professionals              // Listar profissionais
GET    /api/patient/professionals/:id/availability // Ver disponibilidade
GET    /api/patient/procedures                 // Listar procedimentos disponíveis

// Histórico
GET    /api/patient/history                    // Histórico de consultas
GET    /api/patient/history/:id                // Detalhes de consulta passada
GET    /api/patient/history/:id/documents      // Documentos da consulta

// Perfil
GET    /api/patient/profile                    // Ver perfil completo
PUT    /api/patient/profile                    // Atualizar perfil
PUT    /api/patient/profile/photo              // Atualizar foto
POST   /api/patient/profile/change-password    // Alterar senha

// Notificações
GET    /api/patient/notifications              // Listar notificações
PUT    /api/patient/notifications/:id/read     // Marcar como lida
POST   /api/patient/notifications/read-all     // Marcar todas como lidas
PUT    /api/patient/notifications/preferences  // Atualizar preferências

// LGPD
GET    /api/patient/data-export                // Solicitar exportação de dados
POST   /api/patient/delete-account             // Solicitar exclusão de conta

// Configurações
GET    /api/patient/settings                   // Ver configurações
PUT    /api/patient/settings                   // Atualizar configurações
```

### Estrutura de Dados

#### Dashboard Response
```typescript
{
  patient: {
    id: string,
    name: string,
    photo: string
  },
  nextAppointment: {
    id: string,
    date: Date,
    startTime: string,
    endTime: string,
    professional: {
      id: string,
      name: string,
      photo: string,
      specialty: string
    },
    procedure: {
      name: string,
      duration: number
    },
    status: AppointmentStatus,
    clinic: {
      address: string,
      phone: string
    }
  } | null,
  upcomingAppointments: Appointment[],
  pendingConfirmations: number,
  alerts: Alert[]
}
```

#### Appointment
```typescript
{
  id: string,
  date: Date,
  startTime: string,
  endTime: string,
  duration: number,
  professional: {
    id: string,
    name: string,
    photo: string,
    specialty: string,
    council: string,
    registrationNumber: string
  },
  procedure: {
    id: string,
    name: string,
    description: string,
    price: number
  },
  status: 'SCHEDULED' | 'CONFIRMED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
  channel: 'IN_PERSON' | 'PHONE' | 'ONLINE_PORTAL' | 'WHATSAPP',
  confirmedAt?: Date,
  cancelledAt?: Date,
  cancellationReason?: string,
  notes?: string,
  clinic: {
    name: string,
    address: string,
    phone: string,
    location: {
      lat: number,
      lng: number
    }
  },
  canCancel: boolean,    // Baseado na política de cancelamento
  canReschedule: boolean,
  canConfirm: boolean
}
```

#### Historical Appointment
```typescript
{
  ...Appointment,
  summary?: string,      // Resumo do atendimento (visível ao paciente)
  documents: Document[], // Atestados, receitas, etc.
  payment: {
    amount: number,
    method: PaymentMethod,
    status: 'PENDING' | 'PAID',
    paidAt?: Date
  }
}
```

#### Notification
```typescript
{
  id: string,
  type: 'APPOINTMENT_CONFIRMATION' | 'APPOINTMENT_REMINDER' | 'APPOINTMENT_CANCELLATION' | 'BIRTHDAY' | etc.,
  title: string,
  message: string,
  read: boolean,
  createdAt: Date,
  relatedAppointment?: {
    id: string,
    date: Date
  },
  actions?: {
    label: string,
    action: string, // URL ou ação
    primary: boolean
  }[]
}
```

### Validações e Regras de Negócio

**Agendamento:**
- Não pode agendar para menos de X horas (configurável pela clínica)
- Não pode agendar para mais de X dias no futuro
- Não pode ter dois agendamentos no mesmo horário
- Bloqueado se tiver X faltas consecutivas (no-show)

**Cancelamento:**
- Gratuito se feito com X horas de antecedência (ex: 24h)
- Fora do prazo: pode incorrer em taxa ou não ser permitido

**Confirmação:**
- Obrigatória se configurado pela clínica
- Disponível a partir de X dias antes da consulta

**Reagendamento:**
- Segue as mesmas regras de agendamento novo
- Cancela automaticamente o agendamento original

---

## 📝 Considerações Finais

### Estados de Loading
- Skeleton screens para listas de agendamentos
- Spinners em botões de ação
- Shimmer effect em cards durante carregamento

### Estados de Erro
- Mensagens amigáveis e contextuais
- Botões de "Tentar novamente"
- Link de suporte se erro persistir

### Empty States
- Ilustrações amigáveis e incentivadoras
- Call-to-actions claros
- Mensagens positivas

### Responsividade
- Mobile-first sempre
- Bottom navigation no mobile
- Sidebar colapsável no desktop
- Gestos: swipe para voltar, pull to refresh

### Animações
- Transições suaves entre telas (300ms)
- Micro-interações em botões e cards
- Loading states animados
- Celebração ao confirmar agendamento (confetti opcional)

### Acessibilidade
- Alto contraste nos status (colorblind-safe)
- Textos alternativos em imagens
- Navegação por teclado
- Screen reader friendly

