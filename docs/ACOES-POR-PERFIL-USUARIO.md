# Ações por Perfil de Usuário - Minha Clínica

Este documento lista todas as ações que cada tipo de usuário pode realizar no sistema, organizado para facilitar o planejamento do frontend.

---

## 📋 Índice

1. [Visão Geral dos Perfis](#visão-geral-dos-perfis)
2. [Paciente (PATIENT)](#paciente-patient)
3. [Profissional de Saúde (PROFESSIONAL)](#profissional-de-saúde-professional)
4. [Recepcionista (RECEPTIONIST)](#recepcionista-receptionist)
5. [Administrador/Dono da Clínica (ADMIN)](#administradordono-da-clínica-admin)
6. [Ações Públicas (Não Autenticadas)](#ações-públicas-não-autenticadas)
7. [Resumo Comparativo](#resumo-comparativo)

---

## Visão Geral dos Perfis

### Hierarquia de Permissões

```
ADMIN (Dono da Clínica)
├── Acesso total ao sistema
├── RECEPTIONIST (Recepcionista)
│   └── Gestão completa de agendamentos + pacientes
└── PROFESSIONAL (Profissional de Saúde)
    └── Acesso apenas à própria agenda e prontuários

PATIENT (Paciente)
└── Acesso limitado ao portal do paciente
```

### Perfis do Sistema

| Perfil | Código | Descrição |
|--------|--------|-----------|
| **Administrador** | `ADMIN` | Dono da clínica com acesso total |
| **Recepcionista** | `RECEPTIONIST` | Atendimento, agendamentos e cadastros |
| **Profissional** | `PROFESSIONAL` | Médico, dentista, fisioterapeuta, etc. |
| **Paciente** | `PATIENT` | Cliente final da clínica |

---

## Paciente (PATIENT)

### 🏠 Dashboard / Página Inicial
- ✅ Visualizar resumo da conta
- ✅ Ver próximos agendamentos (até 5 mais próximos)
- ✅ Ver lembretes pendentes de confirmação
- ✅ Ver alertas importantes (consultas não confirmadas, etc.)
- ✅ Acesso rápido às principais ações

### 📅 Agendamentos

#### Novo Agendamento
- ✅ Listar especialidades disponíveis
- ✅ Listar profissionais por especialidade
- ✅ Visualizar foto e informações básicas dos profissionais
- ✅ Selecionar profissional desejado
- ✅ Listar procedimentos disponíveis para agendamento online
- ✅ Selecionar procedimento
- ✅ Visualizar calendário com dias disponíveis
- ✅ Selecionar data
- ✅ Visualizar horários disponíveis na data selecionada
- ✅ Selecionar horário
- ✅ Revisar dados do agendamento
- ✅ Confirmar agendamento
- ✅ Receber confirmação por e-mail/SMS/WhatsApp
- ❌ Agendar se estiver bloqueado por faltas (no-show)
- ❌ Agendar procedimentos não disponíveis para agendamento online

#### Gerenciar Agendamentos
- ✅ Listar todos os agendamentos futuros
- ✅ Visualizar detalhes de cada agendamento (data, horário, profissional, procedimento, status)
- ✅ Filtrar agendamentos por status (agendado, confirmado, etc.)
- ✅ Confirmar presença em agendamentos
- ✅ Cancelar agendamento (dentro do prazo permitido)
- ✅ Reagendar consulta (dentro do prazo permitido)
- ✅ Adicionar agendamento ao calendário pessoal (Google Calendar, Outlook)
- ❌ Cancelar/reagendar fora do prazo permitido pela clínica
- ❌ Editar horário/profissional diretamente (precisa cancelar e criar novo)

#### Histórico de Agendamentos
- ✅ Visualizar histórico completo de consultas realizadas
- ✅ Filtrar por período (último mês, últimos 3 meses, último ano, personalizado)
- ✅ Filtrar por profissional
- ✅ Filtrar por procedimento
- ✅ Filtrar por status
- ✅ Visualizar detalhes básicos de cada consulta
- ✅ Ver informações de pagamento (se disponível)
- ⚠️ Ver resumo do atendimento (apenas informações básicas, não o prontuário completo)
- ❌ Acessar anotações clínicas detalhadas do profissional

### 👤 Perfil e Dados Pessoais

#### Visualizar Dados
- ✅ Ver todos os dados cadastrais
- ✅ Ver dados pessoais (nome, CPF, RG, data de nascimento)
- ✅ Ver dados de contato (telefone, e-mail)
- ✅ Ver endereço completo
- ✅ Ver foto de perfil
- ✅ Ver informações clínicas (alergias, observações)

#### Editar Dados
- ✅ Atualizar telefone
- ✅ Atualizar telefone alternativo
- ✅ Atualizar e-mail (requer verificação)
- ✅ Atualizar endereço completo
- ✅ Adicionar/editar foto de perfil
- ✅ Informar alergias
- ✅ Adicionar observações médicas relevantes
- ⚠️ Alterar nome (requer aprovação do admin)
- ❌ Alterar CPF (imutável)
- ❌ Alterar data de nascimento (requer contato com a clínica)

#### Segurança da Conta
- ✅ Alterar senha
- ✅ Visualizar histórico de logins
- ✅ Visualizar dispositivos conectados
- ✅ Fazer logout de todos os dispositivos
- ✅ Configurar autenticação em dois fatores (2FA) - se disponível

### 🔔 Notificações
- ✅ Visualizar todas as notificações
- ✅ Filtrar notificações por tipo
- ✅ Marcar notificações como lidas
- ✅ Excluir notificações
- ✅ Configurar preferências de notificação (e-mail, SMS, WhatsApp, push)
- ✅ Ativar/desativar tipos específicos de notificação

### 📄 Documentos e Comprovantes
- ✅ Fazer download de comprovantes de agendamento
- ✅ Visualizar recibos de pagamento
- ⚠️ Solicitar declaração de comparecimento (após a consulta)
- ⚠️ Fazer download de atestados (se emitidos pelo profissional)

### ⚙️ Configurações
- ✅ Gerenciar preferências de notificação
- ✅ Escolher idioma (se multi-idioma)
- ✅ Alternar entre tema claro/escuro
- ✅ Gerenciar consentimentos LGPD
- ✅ Solicitar download dos dados pessoais (LGPD)
- ✅ Solicitar exclusão da conta (LGPD)

### ❌ Restrições do Paciente
- ❌ Acessar dados de outros pacientes
- ❌ Ver agenda de profissionais
- ❌ Criar agendamentos para outras pessoas
- ❌ Ver informações financeiras da clínica
- ❌ Acessar módulo administrativo
- ❌ Visualizar relatórios da clínica
- ❌ Cadastrar outros usuários

---

## Profissional de Saúde (PROFESSIONAL)

### 🏠 Dashboard / Página Inicial
- ✅ Ver resumo do dia (consultas agendadas, confirmadas, realizadas)
- ✅ Ver próximos agendamentos do dia
- ✅ Ver alertas importantes (consultas não confirmadas, atrasos)
- ✅ Ver taxa de ocupação da agenda
- ✅ Ver estatísticas pessoais (consultas do mês, taxa de no-show)
- ✅ Acesso rápido às principais ações

### 📅 Agenda

#### Visualizar Agenda
- ✅ Visualizar própria agenda em modo dia/semana/mês
- ✅ Filtrar agendamentos por status
- ✅ Filtrar agendamentos por procedimento
- ✅ Ver detalhes completos de cada agendamento
- ✅ Ver informações do paciente agendado
- ✅ Ver histórico do paciente (consultas anteriores com o profissional)
- ✅ Ver tempo até a próxima consulta
- ❌ Visualizar agenda de outros profissionais
- ❌ Visualizar agenda consolidada da clínica

#### Gerenciar Agenda
- ✅ Bloquear períodos de tempo (férias, folgas, compromissos)
- ✅ Desbloquear períodos previamente bloqueados
- ✅ Definir recorrência para bloqueios (ex: todas as terças de manhã)
- ✅ Adicionar motivo aos bloqueios (privado)
- ⚠️ Criar agendamentos (se permitido pela clínica)
- ❌ Alterar horários de atendimento base (requer admin)
- ❌ Alterar duração padrão de consultas (requer admin)

#### Atualizar Status de Agendamentos
- ✅ Marcar consulta como "Em Atendimento"
- ✅ Marcar consulta como "Atendido"
- ✅ Registrar "Não Compareceu" (no-show)
- ⚠️ Cancelar agendamento (com justificativa)
- ❌ Excluir agendamentos do sistema

### 👥 Pacientes

#### Visualizar Pacientes
- ✅ Listar pacientes agendados consigo
- ✅ Buscar pacientes que já atendeu
- ✅ Visualizar dados cadastrais básicos dos pacientes
- ✅ Visualizar informações clínicas (alergias, observações gerais)
- ✅ Ver histórico completo de atendimentos que realizou com o paciente
- ❌ Acessar lista completa de pacientes da clínica
- ❌ Ver atendimentos realizados por outros profissionais
- ❌ Editar dados cadastrais de pacientes (telefone, endereço, etc.)

### 📋 Prontuário Eletrônico

#### Registrar Atendimento
- ✅ Criar novo registro de atendimento
- ✅ Registrar queixa principal
- ✅ Registrar anamnese
- ✅ Registrar exame físico
- ✅ Registrar hipótese diagnóstica
- ✅ Registrar conduta/tratamento
- ✅ Registrar observações gerais
- ✅ Salvar rascunho de atendimento
- ✅ Finalizar e assinar atendimento

#### Anexos e Documentos
- ✅ Fazer upload de exames do paciente
- ✅ Fazer upload de imagens
- ✅ Anexar documentos relevantes
- ✅ Visualizar anexos de atendimentos anteriores
- ✅ Fazer download de anexos
- ⚠️ Excluir anexos (com registro em auditoria)

#### Histórico Clínico
- ✅ Visualizar histórico completo do paciente (apenas seus atendimentos)
- ✅ Filtrar por período
- ✅ Buscar por palavra-chave no histórico
- ✅ Exportar histórico em PDF
- ❌ Editar registros de atendimentos finalizados
- ❌ Excluir registros de atendimentos

#### Prescrições e Documentos (se disponível)
- ⚠️ Emitir prescrições médicas
- ⚠️ Emitir atestados
- ⚠️ Emitir declarações de comparecimento
- ⚠️ Emitir encaminhamentos
- ⚠️ Assinar digitalmente documentos

### 📊 Estatísticas Pessoais
- ✅ Ver total de consultas realizadas no período
- ✅ Ver taxa de ocupação da agenda
- ✅ Ver taxa de no-show (faltas)
- ✅ Ver taxa de confirmação de consultas
- ✅ Ver procedimentos mais realizados
- ✅ Ver evolução mensal de atendimentos
- ❌ Acessar dados financeiros (receita gerada)
- ❌ Comparar estatísticas com outros profissionais

### ⚙️ Configurações Pessoais

#### Perfil Profissional
- ✅ Atualizar foto de perfil
- ✅ Atualizar mini-biografia
- ✅ Atualizar telefone e e-mail
- ✅ Gerenciar especialidades (adicionar/remover)
- ⚠️ Atualizar dados de conselho profissional (requer validação admin)
- ❌ Alterar horários de atendimento (requer admin)

#### Preferências
- ✅ Configurar notificações pessoais
- ✅ Definir cor da agenda
- ✅ Escolher visualização padrão (dia/semana/mês)
- ✅ Alternar tema claro/escuro
- ✅ Configurar lembretes pessoais

#### Segurança
- ✅ Alterar senha
- ✅ Visualizar histórico de logins
- ✅ Configurar 2FA
- ✅ Fazer logout de todos os dispositivos

### ❌ Restrições do Profissional
- ❌ Acessar módulo financeiro
- ❌ Cadastrar novos pacientes
- ❌ Editar dados de pacientes
- ❌ Acessar agenda de outros profissionais
- ❌ Visualizar relatórios gerenciais
- ❌ Cadastrar/gerenciar usuários
- ❌ Alterar configurações da clínica
- ❌ Cadastrar/editar procedimentos
- ❌ Gerenciar pagamentos

---

## Recepcionista (RECEPTIONIST)

### 🏠 Dashboard / Página Inicial
- ✅ Ver resumo do dia (total de consultas, confirmadas, aguardando)
- ✅ Ver consultas do dia por profissional
- ✅ Ver alertas importantes (consultas não confirmadas, pacientes aguardando)
- ✅ Ver lista de chegada (check-in de pacientes)
- ✅ Ver estatísticas rápidas (taxa de ocupação, no-show)
- ✅ Acesso rápido às principais ações

### 📅 Gestão de Agendamentos

#### Criar Agendamento
- ✅ Buscar/selecionar paciente existente
- ✅ Cadastrar novo paciente durante o agendamento
- ✅ Selecionar profissional
- ✅ Selecionar procedimento
- ✅ Visualizar disponibilidade em calendário
- ✅ Selecionar data e horário
- ✅ Adicionar observações ao agendamento
- ✅ Definir canal de agendamento (presencial, telefone, WhatsApp)
- ✅ Confirmar e criar agendamento
- ✅ Imprimir comprovante de agendamento

#### Visualizar Agendamentos
- ✅ Ver agenda de todos os profissionais
- ✅ Alternar entre visualização por profissional
- ✅ Visualizar agenda consolidada (todos os profissionais juntos)
- ✅ Filtrar por profissional
- ✅ Filtrar por data/período
- ✅ Filtrar por status
- ✅ Filtrar por procedimento
- ✅ Buscar agendamento por paciente
- ✅ Ver modo dia/semana/mês
- ✅ Ver detalhes completos de cada agendamento

#### Gerenciar Agendamentos
- ✅ Editar agendamento (alterar data, horário, profissional, procedimento)
- ✅ Cancelar agendamento (com motivo)
- ✅ Reagendar consulta
- ✅ Confirmar agendamento
- ✅ Alterar status de agendamentos
- ✅ Registrar chegada do paciente (check-in)
- ✅ Marcar como "Aguardando Atendimento"
- ✅ Marcar como "Em Atendimento"
- ✅ Marcar como "Atendido"
- ✅ Registrar "Não Compareceu" (no-show)
- ✅ Adicionar observações internas ao agendamento

#### Confirmações
- ✅ Ver lista de agendamentos não confirmados
- ✅ Entrar em contato com pacientes (telefone/WhatsApp)
- ✅ Marcar como confirmado após contato
- ✅ Enviar lembretes manuais
- ✅ Reenviar notificações de agendamento

### 👥 Gestão de Pacientes

#### Cadastrar Paciente
- ✅ Criar novo cadastro de paciente
- ✅ Preencher dados pessoais obrigatórios (nome, CPF, data nascimento, sexo, telefone, e-mail)
- ✅ Preencher dados pessoais opcionais (RG, telefone alternativo, endereço)
- ✅ Adicionar informações clínicas (alergias, observações)
- ✅ Sistema gera senha temporária automaticamente
- ✅ Enviar credenciais ao paciente por e-mail/SMS
- ✅ Imprimir credenciais de acesso

#### Visualizar Pacientes
- ✅ Listar todos os pacientes da clínica
- ✅ Buscar paciente por nome
- ✅ Buscar paciente por CPF
- ✅ Buscar paciente por telefone
- ✅ Buscar paciente por e-mail
- ✅ Filtrar pacientes ativos/inativos
- ✅ Ver pacientes com próxima consulta agendada
- ✅ Ver pacientes sem agendamentos há X dias
- ✅ Ver detalhes completos do paciente

#### Editar Paciente
- ✅ Atualizar dados pessoais
- ✅ Atualizar dados de contato
- ✅ Atualizar endereço
- ✅ Atualizar informações clínicas
- ✅ Atualizar foto do paciente
- ✅ Desativar/reativar paciente
- ✅ Resetar senha do paciente
- ❌ Excluir paciente (apenas desativar)

#### Histórico do Paciente
- ✅ Ver histórico completo de agendamentos
- ✅ Ver agendamentos futuros
- ✅ Ver consultas realizadas
- ✅ Ver cancelamentos
- ✅ Ver faltas (no-show)
- ✅ Ver total de consultas realizadas
- ✅ Ver taxa de comparecimento
- ⚠️ Ver histórico de pagamentos (se módulo financeiro disponível)
- ❌ Acessar prontuário médico detalhado

### 🗓️ Gestão de Profissionais (Visualização)

#### Visualizar Profissionais
- ✅ Listar todos os profissionais da clínica
- ✅ Ver dados básicos (nome, especialidade, conselho)
- ✅ Ver horários de atendimento configurados
- ✅ Ver dias e horários disponíveis
- ✅ Ver bloqueios de agenda
- ❌ Cadastrar novos profissionais (apenas admin)
- ❌ Editar dados de profissionais (apenas admin)
- ❌ Editar horários de atendimento (apenas admin)

### 📞 Atendimento e Comunicação

#### Comunicação com Pacientes
- ✅ Fazer ligações direto pelo sistema (integração telefonia)
- ✅ Enviar SMS individual
- ✅ Enviar WhatsApp individual
- ✅ Enviar e-mail individual
- ✅ Registrar histórico de comunicações

#### Comunicação em Massa
- ⚠️ Enviar lembrete em massa para consultas do dia
- ⚠️ Enviar confirmação em massa
- ⚠️ Criar lista de pacientes para comunicação

### 🔔 Notificações e Lembretes
- ✅ Ver todas as notificações pendentes do dia
- ✅ Ver notificações enviadas
- ✅ Ver notificações com falha de envio
- ✅ Reenviar notificações falhadas
- ✅ Marcar notificações como tratadas

### 📊 Relatórios Básicos
- ✅ Relatório de agendamentos do dia
- ✅ Relatório de agendamentos por período
- ✅ Relatório de agendamentos por profissional
- ✅ Relatório de no-show
- ✅ Relatório de novos pacientes
- ✅ Exportar relatórios em PDF/Excel
- ❌ Acessar relatórios financeiros
- ❌ Acessar relatórios gerenciais avançados

### 💼 Check-in e Fluxo de Atendimento

#### Recepção de Pacientes
- ✅ Realizar check-in de paciente
- ✅ Confirmar dados do paciente
- ✅ Atualizar informações se necessário
- ✅ Coletar documentos necessários
- ✅ Adicionar paciente à fila de espera
- ✅ Ver fila de espera em tempo real
- ✅ Avisar profissional que paciente chegou
- ✅ Estimar tempo de espera

#### Sala de Espera
- ✅ Ver todos os pacientes aguardando
- ✅ Ver tempo de espera de cada paciente
- ✅ Priorizar atendimento (casos urgentes)
- ✅ Chamar próximo paciente

### ⚙️ Configurações Pessoais
- ✅ Atualizar foto de perfil
- ✅ Atualizar dados de contato
- ✅ Alterar senha
- ✅ Configurar notificações pessoais
- ✅ Escolher tema claro/escuro
- ✅ Configurar preferências de visualização

### ❌ Restrições do Recepcionista
- ❌ Acessar módulo financeiro
- ❌ Visualizar receitas e despesas
- ❌ Cadastrar/editar profissionais
- ❌ Cadastrar/editar procedimentos
- ❌ Alterar configurações da clínica
- ❌ Acessar logs de auditoria completos
- ❌ Gerenciar usuários do sistema
- ❌ Acessar prontuário médico detalhado
- ❌ Ver relatórios financeiros

---

## Administrador/Dono da Clínica (ADMIN)

### 🏠 Dashboard Executivo
- ✅ Ver KPIs principais (agendamentos, receita, despesas, saldo)
- ✅ Ver gráficos de agendamentos (dia/semana/mês)
- ✅ Ver taxa de ocupação geral e por profissional
- ✅ Ver taxa de confirmação de consultas
- ✅ Ver taxa de no-show
- ✅ Ver receita do dia/semana/mês
- ✅ Ver despesas do período
- ✅ Ver comparativo com períodos anteriores
- ✅ Ver novos pacientes cadastrados
- ✅ Ver alertas e indicadores importantes
- ✅ Ver ranking de profissionais por faturamento
- ✅ Ver procedimentos mais realizados
- ✅ Acesso rápido a todas as funcionalidades

### 🏥 Gestão da Clínica

#### Dados da Clínica
- ✅ Visualizar dados cadastrais completos
- ✅ Editar razão social
- ✅ Editar nome fantasia
- ✅ Atualizar CNPJ
- ✅ Atualizar endereço completo
- ✅ Atualizar telefone e e-mail
- ✅ Atualizar website
- ✅ Atualizar logo da clínica
- ✅ Configurar subdomain (URL personalizada)
- ✅ Configurar domínio personalizado

#### Configurações Gerais
- ✅ Configurar horário de funcionamento (por dia da semana)
- ✅ Configurar fuso horário
- ✅ Cadastrar feriados
- ✅ Cadastrar dias sem atendimento
- ✅ Configurar cores e identidade visual
- ✅ Ativar/desativar tema escuro

#### Configurações de Agendamento
- ✅ Definir intervalo mínimo entre agendamentos
- ✅ Definir antecedência mínima para agendamento online
- ✅ Definir antecedência máxima para agendamento online
- ✅ Definir política de cancelamento (horas antes)
- ✅ Definir tempo de tolerância para atraso
- ✅ Definir limite de faltas para bloqueio automático
- ✅ Ativar/desativar agendamento online
- ✅ Configurar se requer confirmação do paciente

#### Configurações de Notificações
- ✅ Ativar/desativar notificações por tipo
- ✅ Configurar canais de envio (e-mail, SMS, WhatsApp)
- ✅ Definir quando enviar lembretes (horas antes)
- ✅ Ativar/desativar mensagem de aniversário
- ✅ Editar templates de mensagens
- ✅ Configurar variáveis nos templates
- ✅ Testar envio de notificações

### 👥 Gestão de Usuários

#### Usuários do Sistema
- ✅ Listar todos os usuários (admin, recepcionistas, profissionais)
- ✅ Filtrar por tipo de usuário (role)
- ✅ Filtrar por status (ativo, inativo, bloqueado)
- ✅ Buscar usuário por nome, e-mail ou CPF
- ✅ Ver detalhes completos de cada usuário
- ✅ Ver último login de cada usuário
- ✅ Ver histórico de ações (auditoria)

#### Cadastrar Usuários
- ✅ Convidar recepcionista (enviar e-mail de convite)
- ✅ Convidar profissional de saúde (enviar e-mail de convite)
- ✅ Definir permissões especiais (se houver)
- ✅ Gerar senha temporária
- ✅ Enviar credenciais por e-mail

#### Editar Usuários
- ✅ Atualizar dados cadastrais
- ✅ Alterar role (converter recepcionista em admin, etc.)
- ✅ Alterar status (ativar/desativar/bloquear)
- ✅ Resetar senha
- ✅ Desbloquear conta
- ✅ Forçar logout de todas as sessões
- ✅ Revogar tokens de acesso

#### Excluir Usuários
- ✅ Desativar usuário (soft delete)
- ⚠️ Excluir permanentemente (se permitido por LGPD)
- ✅ Transferir agendamentos antes de excluir profissional
- ✅ Ver log de exclusões

### 👨‍⚕️ Gestão de Profissionais

#### Cadastrar Profissional
- ✅ Convidar profissional via e-mail
- ✅ Preencher dados profissionais (conselho, registro, UF)
- ✅ Adicionar especialidades
- ✅ Configurar horários de atendimento (dias e horários)
- ✅ Configurar intervalo para almoço
- ✅ Definir duração padrão de consulta
- ✅ Escolher cor da agenda
- ✅ Vincular procedimentos que o profissional realiza

#### Editar Profissional
- ✅ Atualizar dados pessoais
- ✅ Atualizar dados profissionais
- ✅ Gerenciar especialidades
- ✅ Editar horários de atendimento
- ✅ Editar duração padrão das consultas
- ✅ Alterar cor da agenda
- ✅ Gerenciar procedimentos vinculados
- ✅ Desativar/reativar profissional

#### Visualizar Profissionais
- ✅ Listar todos os profissionais
- ✅ Filtrar por especialidade
- ✅ Filtrar por status (ativo/inativo)
- ✅ Ver estatísticas de cada profissional
- ✅ Ver taxa de ocupação
- ✅ Ver receita gerada
- ✅ Ver procedimentos mais realizados

### 👤 Gestão de Pacientes
**(Todas as ações do recepcionista +)**
- ✅ Visualizar dados completos de todos os pacientes
- ✅ Editar qualquer dado de paciente
- ✅ Desativar/reativar pacientes
- ✅ Ver histórico completo de agendamentos
- ✅ Ver histórico financeiro do paciente
- ✅ Exportar lista de pacientes
- ✅ Importar pacientes em massa (CSV/Excel)
- ✅ Gerenciar bloqueios por faltas
- ✅ Perdoar faltas (desbloquear)

### 📅 Gestão de Agendamentos
**(Todas as ações do recepcionista +)**
- ✅ Criar agendamento para qualquer profissional
- ✅ Editar qualquer agendamento
- ✅ Cancelar qualquer agendamento
- ✅ Ver agenda de todos os profissionais
- ✅ Visualizar estatísticas de agendamentos
- ✅ Exportar agendamentos por período
- ✅ Ver taxa de ocupação por profissional
- ✅ Ver comparativos de períodos

### 📋 Procedimentos e Serviços

#### Cadastrar Procedimento
- ✅ Criar novo procedimento
- ✅ Definir nome e descrição
- ✅ Definir código interno (opcional)
- ✅ Definir duração padrão (minutos)
- ✅ Definir preço
- ✅ Definir se está disponível para agendamento online
- ✅ Vincular profissionais que realizam o procedimento
- ✅ Definir cor para identificação na agenda

#### Editar Procedimento
- ✅ Atualizar nome e descrição
- ✅ Atualizar duração
- ✅ Atualizar preço
- ✅ Ativar/desativar procedimento
- ✅ Alterar disponibilidade online
- ✅ Gerenciar profissionais vinculados

#### Visualizar Procedimentos
- ✅ Listar todos os procedimentos
- ✅ Filtrar por status (ativo/inativo)
- ✅ Filtrar por profissional
- ✅ Ver estatísticas de cada procedimento
- ✅ Ver quantas vezes foi realizado
- ✅ Ver receita total gerada
- ✅ Exportar lista de procedimentos

### 🎓 Especialidades

#### Cadastrar Especialidade
- ✅ Criar nova especialidade
- ✅ Definir nome e descrição
- ✅ Escolher ícone/emoji
- ✅ Escolher cor
- ✅ Ativar/desativar

#### Gerenciar Especialidades
- ✅ Listar todas as especialidades
- ✅ Editar especialidades
- ✅ Excluir especialidades (se não estiver em uso)
- ✅ Ver profissionais por especialidade

### 💰 Gestão Financeira

#### Receitas
- ✅ Registrar receita manual
- ✅ Visualizar todas as receitas
- ✅ Filtrar receitas por período
- ✅ Filtrar por profissional
- ✅ Filtrar por procedimento
- ✅ Filtrar por forma de pagamento
- ✅ Filtrar por status (pago/pendente)
- ✅ Editar receita
- ✅ Excluir receita (com auditoria)
- ✅ Marcar como pago/pendente
- ✅ Adicionar observações
- ✅ Anexar comprovantes
- ✅ Gerar recibo

#### Despesas
- ✅ Registrar nova despesa
- ✅ Visualizar todas as despesas
- ✅ Filtrar despesas por período
- ✅ Filtrar por categoria
- ✅ Filtrar por forma de pagamento
- ✅ Editar despesa
- ✅ Excluir despesa (com auditoria)
- ✅ Adicionar observações
- ✅ Anexar notas fiscais/comprovantes

#### Categorias de Despesas
- ✅ Criar nova categoria
- ✅ Editar categorias existentes
- ✅ Excluir categorias (se não estiver em uso)
- ✅ Ver total gasto por categoria

#### Formas de Pagamento
- ✅ Configurar formas de pagamento aceitas
- ✅ Ativar/desativar formas de pagamento
- ✅ Adicionar novas formas de pagamento

#### Relatórios Financeiros
- ✅ Resumo mensal (receitas vs despesas)
- ✅ Fluxo de caixa (diário/semanal/mensal)
- ✅ Receitas por profissional
- ✅ Receitas por procedimento
- ✅ Despesas por categoria
- ✅ Comparativo mensal/anual
- ✅ Projeções e tendências
- ✅ Exportar relatórios em PDF/Excel
- ✅ Gráficos de evolução
- ✅ Indicadores de performance financeira

### 📊 Relatórios e Analytics

#### Relatórios de Agendamentos
- ✅ Total de agendamentos por período
- ✅ Agendamentos por profissional
- ✅ Agendamentos por procedimento
- ✅ Agendamentos por canal (online, presencial, telefone, WhatsApp)
- ✅ Taxa de ocupação geral e por profissional
- ✅ Horários de pico
- ✅ Dias com mais/menos agendamentos
- ✅ Comparativos de períodos

#### Relatórios de Pacientes
- ✅ Total de pacientes cadastrados
- ✅ Novos pacientes por período
- ✅ Pacientes ativos vs inativos
- ✅ Pacientes sem agendamentos há X tempo
- ✅ Distribuição geográfica (por cidade)
- ✅ Faixa etária
- ✅ Gênero
- ✅ Top 10 pacientes (mais consultas)

#### Relatórios de Performance
- ✅ Taxa de confirmação de consultas
- ✅ Taxa de no-show geral e por profissional
- ✅ Taxa de cancelamento
- ✅ Tempo médio entre agendamento e consulta
- ✅ Tempo médio de atendimento
- ✅ Produtividade por profissional
- ✅ Satisfação dos pacientes (se houver pesquisa)

#### Exportação e Compartilhamento
- ✅ Exportar qualquer relatório em PDF
- ✅ Exportar qualquer relatório em Excel
- ✅ Agendar envio automático de relatórios por e-mail
- ✅ Compartilhar dashboard com outros usuários

### 🔔 Notificações e Comunicação

#### Gerenciar Notificações
- ✅ Ver todas as notificações enviadas
- ✅ Ver notificações pendentes
- ✅ Ver notificações com falha
- ✅ Filtrar por tipo de notificação
- ✅ Filtrar por canal (e-mail, SMS, WhatsApp)
- ✅ Reenviar notificações falhadas
- ✅ Ver histórico de notificações por paciente

#### Comunicação em Massa
- ✅ Criar campanha de comunicação
- ✅ Selecionar público-alvo (todos, por especialidade, por profissional)
- ✅ Criar mensagem personalizada
- ✅ Escolher canal de envio
- ✅ Agendar envio
- ✅ Testar mensagem antes de enviar
- ✅ Ver estatísticas de abertura/leitura

### 🔍 Auditoria e Logs

#### Logs de Sistema
- ✅ Visualizar todos os logs de auditoria
- ✅ Filtrar por tipo de ação
- ✅ Filtrar por usuário
- ✅ Filtrar por data/período
- ✅ Filtrar por entidade (agendamento, paciente, usuário, etc.)
- ✅ Ver detalhes completos de cada ação
- ✅ Ver dados anteriores e novos (antes/depois)
- ✅ Ver IP e dispositivo de origem
- ✅ Exportar logs para auditoria

#### Segurança
- ✅ Ver tentativas de login falhadas
- ✅ Ver contas bloqueadas
- ✅ Ver sessões ativas de todos os usuários
- ✅ Forçar logout de usuários
- ✅ Ver histórico de alterações de senha
- ✅ Ver acessos suspeitos

### ⚙️ Configurações Avançadas

#### Integrações
- ✅ Configurar integração WhatsApp Business
- ✅ Configurar gateway de SMS
- ✅ Configurar servidor de e-mail (SMTP)
- ✅ Configurar API keys
- ⚠️ Configurar webhook para integrações externas
- ⚠️ Testar integrações

#### Backup e Segurança
- ✅ Visualizar histórico de backups
- ✅ Fazer backup manual
- ✅ Restaurar backup
- ✅ Configurar frequência de backups automáticos
- ✅ Baixar backup local

#### LGPD e Privacidade
- ✅ Gerenciar consentimentos dos pacientes
- ✅ Exportar dados de um paciente (portabilidade)
- ✅ Anonimizar dados de paciente (direito ao esquecimento)
- ✅ Ver log de solicitações LGPD
- ✅ Configurar políticas de privacidade
- ✅ Configurar termos de uso

#### Sistema
- ✅ Ver versão do sistema
- ✅ Ver status de serviços
- ✅ Ver uso de recursos (espaço, processamento)
- ✅ Gerenciar plano de assinatura
- ✅ Ver histórico de pagamentos do SaaS
- ✅ Atualizar método de pagamento

### 🎨 Personalização

#### Portal do Paciente
- ✅ Personalizar cores
- ✅ Personalizar logo
- ✅ Personalizar textos de boas-vindas
- ✅ Adicionar banner/imagens
- ✅ Configurar páginas institucionais
- ✅ Preview antes de publicar

### 🆘 Suporte

#### Central de Ajuda
- ✅ Acessar FAQ
- ✅ Ver tutoriais em vídeo
- ✅ Baixar manuais
- ✅ Abrir ticket de suporte
- ✅ Chat com suporte
- ✅ Agendar treinamento

### ✅ Nenhuma Restrição
- ✅ **Acesso total a todas as funcionalidades do sistema**
- ✅ Único perfil que pode excluir dados permanentemente
- ✅ Único perfil com acesso ao módulo financeiro completo
- ✅ Único perfil que pode gerenciar outros usuários
- ✅ Único perfil que pode alterar configurações críticas

---

## Ações Públicas (Não Autenticadas)

### 🌐 Acesso Público (Sem Login)

#### Landing Page da Clínica
- ✅ Visualizar informações institucionais
- ✅ Ver endereço e horário de funcionamento
- ✅ Ver telefone e formas de contato
- ✅ Ver especialidades oferecidas
- ✅ Ver profissionais da clínica (se configurado como público)

#### Cadastro e Autenticação
- ✅ Acessar página de cadastro de paciente
- ✅ Preencher formulário de pré-cadastro
- ✅ Criar conta como paciente (aguarda ativação)
- ✅ Fazer login (e-mail + senha)
- ✅ Recuperar senha (esqueci minha senha)
- ✅ Verificar e-mail (link de verificação)

#### Completar Cadastro (após convite)
- ✅ Profissional: completar cadastro após convite do admin
- ✅ Recepcionista: completar cadastro após convite do admin
- ✅ Acessar com token temporário
- ✅ Definir senha pessoal
- ✅ Aceitar termos e condições

#### Recuperação de Senha
- ✅ Solicitar reset de senha
- ✅ Receber link por e-mail
- ✅ Definir nova senha

#### Agendamento Rápido (se habilitado)
- ⚠️ Visualizar disponibilidade de horários
- ⚠️ Fazer agendamento sem cadastro prévio (guest checkout)
- ⚠️ Receber confirmação por e-mail

---

## Resumo Comparativo

### Tabela de Permissões

| Funcionalidade | Paciente | Profissional | Recepcionista | Admin |
|----------------|----------|--------------|---------------|-------|
| **AGENDAMENTOS** |
| Criar próprio agendamento | ✅ | ❌ | ✅ | ✅ |
| Criar agendamento para outros | ❌ | ❌ | ✅ | ✅ |
| Ver próprios agendamentos | ✅ | ✅ | ✅ | ✅ |
| Ver agendamentos de todos | ❌ | ❌ | ✅ | ✅ |
| Cancelar agendamentos | ✅ (próprios) | ⚠️ (com justificativa) | ✅ | ✅ |
| Reagendar | ✅ (próprios) | ❌ | ✅ | ✅ |
| Confirmar agendamentos | ✅ (próprios) | ❌ | ✅ | ✅ |
| **PACIENTES** |
| Ver próprios dados | ✅ | ❌ | ✅ | ✅ |
| Ver dados de outros | ❌ | ⚠️ (agendados) | ✅ | ✅ |
| Cadastrar paciente | ❌ | ❌ | ✅ | ✅ |
| Editar dados | ✅ (próprios) | ❌ | ✅ | ✅ |
| **PROFISSIONAIS** |
| Ver lista de profissionais | ✅ (básico) | ⚠️ (básico) | ✅ (completo) | ✅ |
| Cadastrar profissional | ❌ | ❌ | ❌ | ✅ |
| Editar profissional | ❌ | ⚠️ (próprio) | ❌ | ✅ |
| Gerenciar horários | ❌ | ⚠️ (bloqueios) | ❌ | ✅ |
| **PRONTUÁRIO** |
| Ver próprio histórico | ⚠️ (resumo) | ❌ | ❌ | ❌ |
| Registrar atendimento | ❌ | ✅ | ❌ | ⚠️ |
| Ver histórico completo | ❌ | ⚠️ (seus atendimentos) | ❌ | ✅ |
| **FINANCEIRO** |
| Ver próprios pagamentos | ⚠️ | ❌ | ❌ | ✅ |
| Registrar receitas | ❌ | ❌ | ❌ | ✅ |
| Registrar despesas | ❌ | ❌ | ❌ | ✅ |
| Relatórios financeiros | ❌ | ❌ | ❌ | ✅ |
| **CONFIGURAÇÕES** |
| Configurar clínica | ❌ | ❌ | ❌ | ✅ |
| Gerenciar usuários | ❌ | ❌ | ❌ | ✅ |
| Configurar procedimentos | ❌ | ❌ | ❌ | ✅ |
| Configurar notificações | ✅ (próprias) | ✅ (próprias) | ✅ (próprias) | ✅ |
| **RELATÓRIOS** |
| Relatórios pessoais | ⚠️ | ✅ | ⚠️ | ✅ |
| Relatórios gerenciais | ❌ | ❌ | ⚠️ (básicos) | ✅ |
| Auditoria | ❌ | ❌ | ❌ | ✅ |

**Legenda:**
- ✅ Acesso completo
- ⚠️ Acesso parcial/condicional
- ❌ Sem acesso

---

## Fluxos de Trabalho Principais

### Fluxo 1: Novo Paciente (Cadastro Online)
```
[Paciente] Acessa site da clínica
    ↓
[PÚBLICO] Clica em "Criar conta"
    ↓
[PÚBLICO] Preenche formulário de cadastro
    ↓
[PÚBLICO] Verifica e-mail
    ↓
[PACIENTE] Login no portal
    ↓
[PACIENTE] Completa cadastro (dados adicionais)
    ↓
[PACIENTE] Agenda primeira consulta
```

### Fluxo 2: Agendamento Presencial
```
[Paciente] Chega à recepção
    ↓
[RECEPCIONISTA] Busca/cadastra paciente
    ↓
[RECEPCIONISTA] Verifica disponibilidade
    ↓
[RECEPCIONISTA] Cria agendamento
    ↓
[SISTEMA] Envia confirmação ao paciente
    ↓
[Paciente] Recebe confirmação
```

### Fluxo 3: Dia do Atendimento
```
[RECEPCIONISTA] Confirma agendamentos do dia
    ↓
[Paciente] Chega à clínica
    ↓
[RECEPCIONISTA] Registra chegada (check-in)
    ↓
[RECEPCIONISTA] Status → "Aguardando"
    ↓
[PROFISSIONAL] Chama paciente
    ↓
[PROFISSIONAL] Status → "Em Atendimento"
    ↓
[PROFISSIONAL] Realiza consulta
    ↓
[PROFISSIONAL] Registra no prontuário
    ↓
[PROFISSIONAL] Status → "Atendido"
    ↓
[ADMIN] Registra pagamento (receita)
```

### Fluxo 4: Onboarding de Profissional
```
[ADMIN] Convida profissional
    ↓
[SISTEMA] Envia e-mail com link
    ↓
[PROFISSIONAL] Clica no link
    ↓
[PROFISSIONAL] Completa cadastro
    ↓
[PROFISSIONAL] Define senha
    ↓
[ADMIN] Configura horários de atendimento
    ↓
[ADMIN] Vincula procedimentos
    ↓
[PROFISSIONAL] Login e acesso à agenda
```

---

## Módulos do Frontend por Perfil

### Para PACIENTE
```
📱 Portal do Paciente
├── 🏠 Home/Dashboard
├── 📅 Meus Agendamentos
│   ├── Novo Agendamento
│   ├── Agendamentos Futuros
│   └── Histórico
├── 👤 Meu Perfil
│   ├── Dados Pessoais
│   ├── Endereço
│   ├── Segurança
│   └── Informações Clínicas
├── 🔔 Notificações
├── 📄 Documentos
└── ⚙️ Configurações
```

### Para PROFISSIONAL
```
💼 Área do Profissional
├── 🏠 Dashboard
├── 📅 Minha Agenda
│   ├── Visualizar (dia/semana/mês)
│   ├── Bloqueios
│   └── Configurações
├── 👥 Meus Pacientes
│   ├── Agendados Hoje
│   ├── Histórico
│   └── Buscar
├── 📋 Prontuário
│   ├── Registrar Atendimento
│   ├── Anexos
│   └── Histórico
├── 📊 Estatísticas
├── 👤 Meu Perfil
└── ⚙️ Configurações
```

### Para RECEPCIONISTA
```
🖥️ Sistema de Recepção
├── 🏠 Dashboard
├── 📅 Agenda
│   ├── Visualizar Agenda (todos)
│   ├── Novo Agendamento
│   ├── Gerenciar Agendamentos
│   └── Confirmações
├── 👥 Pacientes
│   ├── Lista de Pacientes
│   ├── Cadastrar Paciente
│   ├── Buscar
│   └── Editar
├── 💼 Check-in
│   ├── Recepção
│   └── Sala de Espera
├── 🔔 Notificações
├── 📊 Relatórios Básicos
└── ⚙️ Configurações Pessoais
```

### Para ADMIN
```
⚙️ Painel Administrativo
├── 🏠 Dashboard Executivo
├── 🏥 Gestão da Clínica
│   ├── Dados da Clínica
│   ├── Configurações Gerais
│   ├── Horários
│   └── Integrações
├── 👥 Usuários
│   ├── Lista de Usuários
│   ├── Convidar Usuário
│   └── Gerenciar Permissões
├── 👨‍⚕️ Profissionais
│   ├── Lista de Profissionais
│   ├── Cadastrar/Convidar
│   ├── Horários de Atendimento
│   └── Estatísticas
├── 👤 Pacientes
│   ├── Todos os Pacientes
│   ├── Cadastrar
│   ├── Importar/Exportar
│   └── Bloqueios
├── 📅 Agenda
│   ├── Visualizar (todos)
│   ├── Gerenciar
│   └── Estatísticas
├── 📋 Procedimentos
│   ├── Lista de Procedimentos
│   ├── Cadastrar
│   └── Vincular Profissionais
├── 🎓 Especialidades
│   ├── Lista
│   └── Gerenciar
├── 💰 Financeiro
│   ├── Dashboard Financeiro
│   ├── Receitas
│   ├── Despesas
│   ├── Categorias
│   └── Relatórios
├── 📊 Relatórios
│   ├── Agendamentos
│   ├── Pacientes
│   ├── Financeiro
│   ├── Performance
│   └── Exportar
├── 🔔 Notificações
│   ├── Configurações
│   ├── Histórico
│   ├── Templates
│   └── Campanhas
├── 🔍 Auditoria
│   ├── Logs de Sistema
│   ├── Segurança
│   └── LGPD
├── 🎨 Personalização
│   ├── Portal do Paciente
│   └── Identidade Visual
└── ⚙️ Configurações
    ├── Sistema
    ├── Integrações
    ├── Backup
    └── Suporte
```

---

## Considerações para o Frontend

### Componentes Reutilizáveis Necessários

1. **Componentes de Agendamento**
   - Calendário com disponibilidade
   - Seletor de horários
   - Card de agendamento
   - Timeline de consultas
   - Filtros de agenda

2. **Componentes de Usuário**
   - Card de paciente
   - Card de profissional
   - Lista de usuários
   - Formulário de cadastro multi-step
   - Avatar com upload

3. **Componentes de Dashboard**
   - KPI cards (métricas)
   - Gráficos (linha, barra, pizza, área)
   - Tabelas com paginação
   - Filtros avançados
   - Widgets personalizáveis

4. **Componentes de Notificação**
   - Toast/Snackbar
   - Badge de notificações
   - Centro de notificações
   - Templates de mensagem

5. **Componentes de Formulário**
   - Input com validação
   - Select/Autocomplete
   - Date/Time picker
   - File upload
   - Editor de texto rico (prontuário)

6. **Componentes de Layout**
   - Sidebar navegação
   - Header com menu de usuário
   - Breadcrumb
   - Tabs
   - Modal/Dialog

### Páginas Principais por Perfil

#### Paciente (10-15 páginas)
- Login/Cadastro
- Dashboard
- Novo Agendamento
- Meus Agendamentos
- Histórico
- Perfil
- Configurações
- Notificações
- Documentos

#### Profissional (12-18 páginas)
- Dashboard
- Agenda (dia/semana/mês)
- Bloqueios de Agenda
- Pacientes
- Detalhes do Paciente
- Prontuário
- Novo Atendimento
- Estatísticas
- Perfil
- Configurações

#### Recepcionista (15-20 páginas)
- Dashboard
- Agenda Consolidada
- Novo Agendamento
- Gerenciar Agendamento
- Lista de Pacientes
- Cadastrar Paciente
- Editar Paciente
- Detalhes do Paciente
- Check-in
- Sala de Espera
- Confirmações
- Notificações
- Relatórios
- Configurações

#### Admin (40-60 páginas)
- Dashboard Executivo
- Dados da Clínica
- Configurações Gerais
- Usuários (lista, cadastrar, editar)
- Profissionais (lista, cadastrar, editar, horários)
- Pacientes (lista, cadastrar, editar, importar)
- Agenda (visualizar, gerenciar)
- Procedimentos (lista, cadastrar, editar)
- Especialidades
- Dashboard Financeiro
- Receitas (lista, cadastrar, editar)
- Despesas (lista, cadastrar, editar)
- Categorias de Despesas
- Relatórios (múltiplos com filtros)
- Notificações (configurar, histórico, templates, campanhas)
- Auditoria
- Logs de Sistema
- LGPD
- Personalização
- Integrações
- Backup
- Suporte

### APIs Necessárias (Estimativa)

- **Autenticação:** 5-8 endpoints
- **Pacientes:** 10-15 endpoints
- **Profissionais:** 10-15 endpoints
- **Agendamentos:** 15-20 endpoints
- **Procedimentos:** 8-10 endpoints
- **Especialidades:** 5-8 endpoints
- **Financeiro:** 15-20 endpoints
- **Notificações:** 10-12 endpoints
- **Relatórios:** 15-20 endpoints
- **Auditoria:** 5-8 endpoints
- **Configurações:** 10-15 endpoints

**Total estimado:** 100-150 endpoints REST

---

## Priorização para Desenvolvimento (MVP)

### Fase 1 - Essencial (MVP)
1. ✅ Autenticação (login, cadastro, recuperar senha)
2. ✅ Cadastro de clínica
3. ✅ Gestão de usuários (admin, recepcionista, profissional, paciente)
4. ✅ Cadastro de pacientes
5. ✅ Cadastro de profissionais
6. ✅ Cadastro de procedimentos
7. ✅ Agendamentos (criar, editar, cancelar, visualizar)
8. ✅ Agenda (visualização dia/semana/mês)
9. ✅ Dashboard básico

### Fase 2 - Importante
10. ✅ Notificações (e-mail/SMS)
11. ✅ Confirmação de agendamentos
12. ✅ Portal do paciente
13. ✅ Prontuário básico
14. ✅ Check-in de pacientes
15. ✅ Bloqueios de agenda
16. ✅ Especialidades

### Fase 3 - Desejável
17. ✅ Módulo financeiro
18. ✅ Relatórios básicos
19. ✅ Auditoria
20. ✅ Configurações avançadas
21. ✅ Personalização do portal

### Fase 4 - Futuro
22. ⏳ WhatsApp chatbot
23. ⏳ Integrações externas
24. ⏳ Pagamento online
25. ⏳ Telemedicina
26. ⏳ App móvel

---

*Documento gerado em 17 de Fevereiro de 2026*  
*Versão 1.0 - Sistema Minha Clínica*
