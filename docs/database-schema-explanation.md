# Minha Clínica - Documentação do Schema do Banco de Dados

## 📊 Visão Geral

Este documento explica detalhadamente cada **model** e **enum** do banco de dados PostgreSQL usando Prisma ORM.

---

## 🔢 ENUMS (Tipos Enumerados)

### UserRole
**Finalidade:** Define os 4 perfis de acesso ao sistema

| Valor | Descrição |
|-------|-----------|
| `ADMIN` | Dono da clínica - acesso total ao sistema |
| `RECEPTIONIST` | Recepcionista - gerencia agendamentos e pacientes |
| `PROFESSIONAL` | Profissional de saúde - acessa sua agenda e prontuários |
| `PATIENT` | Paciente - acesso ao portal do paciente |

---

### UserStatus
**Finalidade:** Status atual do usuário no sistema

| Valor | Descrição |
|-------|-----------|
| `ACTIVE` | Usuário ativo, pode acessar o sistema |
| `INACTIVE` | Usuário inativo, não pode acessar |
| `BLOCKED` | Usuário bloqueado (muitas tentativas de login ou motivo administrativo) |
| `PENDING_ACTIVATION` | Cadastrado mas aguardando confirmação de e-mail |

---

### Gender
**Finalidade:** Gênero do paciente

| Valor | Descrição |
|-------|-----------|
| `MALE` | Masculino |
| `FEMALE` | Feminino |
| `OTHER` | Outro |
| `PREFER_NOT_TO_SAY` | Prefere não informar |

---

### AppointmentStatus
**Finalidade:** Status atual do agendamento (fluxo da consulta)

| Valor | Descrição | Cor Sugerida |
|-------|-----------|--------------|
| `SCHEDULED` | Agendamento criado, aguardando confirmação | 🔵 Azul |
| `CONFIRMED` | Paciente confirmou presença | 🟢 Verde |
| `WAITING` | Paciente chegou e está na recepção | 🟡 Amarelo |
| `IN_PROGRESS` | Paciente está sendo atendido | 🟣 Roxo |
| `COMPLETED` | Consulta finalizada com sucesso | ⚫ Cinza |
| `CANCELLED` | Consulta cancelada (por paciente ou clínica) | 🔴 Vermelho |
| `NO_SHOW` | Paciente não compareceu sem avisar | 🟠 Laranja |
| `RESCHEDULED` | Foi reagendado para outra data | 🔵 Azul claro |

---

### AppointmentChannel
**Finalidade:** Por qual canal o agendamento foi feito

| Valor | Descrição |
|-------|-----------|
| `IN_PERSON` | Presencial na recepção |
| `PHONE` | Por telefone |
| `ONLINE_PORTAL` | Portal do paciente (site/app) |
| `WHATSAPP` | Via WhatsApp (chatbot ou atendente) |

---

### CancellationReason
**Finalidade:** Motivo do cancelamento do agendamento

| Valor | Descrição |
|-------|-----------|
| `PATIENT_REQUEST` | Paciente solicitou cancelamento |
| `PROFESSIONAL_UNAVAILABLE` | Profissional não pôde atender (doença, imprevisto) |
| `CLINIC_CLOSURE` | Clínica fechada (feriado, manutenção) |
| `EMERGENCY` | Emergência (paciente ou profissional) |
| `RESCHEDULED` | Cancelado para reagendar |
| `OTHER` | Outro motivo |

---

### TransactionType
**Finalidade:** Tipo de transação financeira

| Valor | Descrição |
|-------|-----------|
| `INCOME` | Receita (entrada de dinheiro) |
| `EXPENSE` | Despesa (saída de dinheiro) |

---

### PaymentMethod
**Finalidade:** Forma de pagamento utilizada

| Valor | Descrição |
|-------|-----------|
| `CASH` | Dinheiro em espécie |
| `DEBIT_CARD` | Cartão de débito |
| `CREDIT_CARD` | Cartão de crédito |
| `PIX` | PIX |
| `BANK_TRANSFER` | Transferência bancária |
| `CHECK` | Cheque |


---

### PaymentStatus
**Finalidade:** Status do pagamento

| Valor | Descrição |
|-------|-----------|
| `PENDING` | Aguardando pagamento |
| `PAID` | Pago |
| `CANCELLED` | Cancelado |
| `REFUNDED` | Reembolsado (devolvido ao paciente) |

---

### NotificationType
**Finalidade:** Tipo de notificação enviada

| Valor | Descrição |
|-------|-----------|
| `APPOINTMENT_CONFIRMATION` | Confirmação de agendamento |
| `APPOINTMENT_REMINDER` | Lembrete de consulta (24h antes) |
| `APPOINTMENT_CANCELLATION` | Aviso de cancelamento |
| `APPOINTMENT_RESCHEDULED` | Aviso de reagendamento |
| `PASSWORD_RESET` | Link para redefinir senha |
| `WELCOME` | Boas-vindas ao novo usuário |
| `BIRTHDAY` | Felicitações de aniversário |
| `NO_SHOW_WARNING` | Aviso por falta sem justificativa |

---

### NotificationChannel
**Finalidade:** Canal pelo qual a notificação é enviada

| Valor | Descrição |
|-------|-----------|
| `EMAIL` | E-mail |
| `SMS` | Mensagem SMS |
| `WHATSAPP` | WhatsApp |
| `IN_APP` | Notificação dentro do app/sistema |

---

### NotificationStatus
**Finalidade:** Status de envio da notificação

| Valor | Descrição |
|-------|-----------|
| `PENDING` | Aguardando envio |
| `SENT` | Enviada com sucesso |
| `FAILED` | Falha no envio |
| `READ` | Lida pelo destinatário |

---

### DayOfWeek
**Finalidade:** Dias da semana (para horários de funcionamento)

| Valor | Descrição |
|-------|-----------|
| `MONDAY` | Segunda-feira |
| `TUESDAY` | Terça-feira |
| `WEDNESDAY` | Quarta-feira |
| `THURSDAY` | Quinta-feira |
| `FRIDAY` | Sexta-feira |
| `SATURDAY` | Sábado |
| `SUNDAY` | Domingo |

---

## 🗂️ MODELS (Tabelas do Banco)

### 1. Clinic (Clínicas)
**Finalidade:** Tabela principal do sistema multi-tenant. Cada clínica é um tenant isolado.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único da clínica |
| `legalName` | String | Razão social (nome jurídico) |
| `tradeName` | String | Nome fantasia (como é conhecida) |
| `cnpj` | String(14) | CNPJ (único no sistema) |
| `email` | String | E-mail institucional da clínica |
| `phone` | String(15) | Telefone principal |
| `website` | String? | Site institucional (opcional) |
| `logoUrl` | String? | URL da logo da clínica |
| **Endereço** | | |
| `zipCode` | String(8) | CEP |
| `street` | String | Logradouro (rua, avenida) |
| `number` | String(10) | Número do endereço |
| `complement` | String? | Complemento (sala, andar) |
| `neighborhood` | String | Bairro |
| `city` | String | Cidade |
| `state` | String(2) | UF (SP, RJ, MG, etc) |
| **Configurações** | | |
| `subdomain` | String | Subdomínio único (ex: clinicaxyz) |
| `customDomain` | String? | Domínio personalizado opcional |
| `timezone` | String | Fuso horário (padrão: America/Sao_Paulo) |
| `isActive` | Boolean | Se a clínica está ativa |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Última atualização |

**Relacionamentos:**
- 1:N com User, Patient, Professional, Appointment, etc.
- 1:1 com ClinicSettings
- 1:N com ClinicWorkingHours, ClinicHoliday

**Observações:**
- ✅ CNPJ e subdomain são únicos
- ✅ Cada clínica tem dados completamente isolados
- ✅ Logo pode ser armazenada em storage (S3, etc)

---

### 2. ClinicSettings (Configurações da Clínica)
**Finalidade:** Configurações personalizáveis de cada clínica

| Campo | Tipo | Descrição | Padrão |
|-------|------|-----------|--------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Referência à clínica (1:1) |
| **Agendamentos** | | |
| `minIntervalBetweenAppointments` | Int | Intervalo mínimo entre consultas (min) | 15 |
| `minAdvanceBookingHours` | Int | Antecedência mínima para agendar online (h) | 2 |
| `maxAdvanceBookingDays` | Int | Antecedência máxima para agendar (dias) | 60 |
| `maxCancellationHours` | Int | Prazo máximo para cancelar (h antes) | 24 |
| **Políticas** | | |
| `maxConsecutiveNoShows` | Int | Máximo de faltas consecutivas antes de bloquear | 3 |
| `appointmentToleranceMinutes` | Int | Tolerância de atraso do paciente (min) | 15 |
| **Agendamento Online** | | |
| `allowOnlineBooking` | Boolean | Permitir agendamento pelo site | true |
| `requirePatientConfirmation` | Boolean | Exigir confirmação do paciente | true |
| **Notificações** | | |
| `sendAppointmentConfirmation` | Boolean | Enviar confirmação automática | true |
| `sendAppointmentReminder` | Boolean | Enviar lembrete | true |
| `reminderHoursBefore` | Int | Quantas horas antes enviar lembrete | 24 |
| `sendBirthdayMessage` | Boolean | Enviar mensagem de aniversário | true |
| **Visual** | | |
| `primaryColor` | String | Cor primária (hex) | #3B82F6 |
| `secondaryColor` | String | Cor secundária (hex) | #1E40AF |
| `darkMode` | Boolean | Modo escuro ativado | false |

**Observações:**
- ✅ Valores padrão sensatos já configurados
- ✅ Admin pode alterar a qualquer momento
- ✅ Cores são em hexadecimal (#RRGGBB)

---

### 3. ClinicWorkingHours (Horário de Funcionamento)
**Finalidade:** Define dias e horários de funcionamento da clínica

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Referência à clínica |
| `dayOfWeek` | DayOfWeek | Dia da semana |
| `isOpen` | Boolean | Se está aberto neste dia |
| `openTime` | String(5) | Horário de abertura (ex: "08:00") |
| `closeTime` | String(5) | Horário de fechamento (ex: "18:00") |

**Exemplo de uso:**
```
Segunda: 08:00 - 18:00
Terça: 08:00 - 18:00
Quarta: 08:00 - 18:00
Quinta: 08:00 - 18:00
Sexta: 08:00 - 18:00
Sábado: 08:00 - 12:00
Domingo: Fechado (isOpen = false)
```

---

### 4. ClinicHoliday (Feriados e Dias Fechados)
**Finalidade:** Registra feriados e dias em que a clínica não atenderá

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Referência à clínica |
| `date` | Date | Data do feriado |
| `description` | String | Descrição (ex: "Natal", "Carnaval") |
| `isRecurring` | Boolean | Se repete todo ano (ex: Natal é sempre 25/12) |

**Observações:**
- ✅ Feriados recorrentes não precisam ser cadastrados todos os anos
- ✅ Sistema bloqueia agendamentos nestas datas

---

### 5. User (Usuários do Sistema)
**Finalidade:** Tabela base de todos os usuários (admins, recepcionistas, profissionais, pacientes)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Clínica à qual pertence |
| **Dados Pessoais** | | |
| `name` | String | Nome completo |
| `cpf` | String(11) | CPF (único no tenant) |
| `email` | String | E-mail (único no tenant) |
| `phone` | String(15) | Telefone celular |
| **Autenticação** | | |
| `password` | String | Senha com hash bcrypt |
| `role` | UserRole | Perfil de acesso |
| `status` | UserStatus | Status do usuário |
| **Controle de Acesso** | | |
| `mustChangePassword` | Boolean | Forçar troca de senha no primeiro login | true |
| `lastLoginAt` | DateTime? | Data/hora do último login |
| `loginAttempts` | Int | Tentativas de login falhadas | 0 |
| `blockedUntil` | DateTime? | Bloqueado até esta data (se houver) |
| **Outros** | | |
| `avatarUrl` | String? | URL da foto do perfil |
| `termsAcceptedAt` | DateTime? | Quando aceitou termos de uso (LGPD) |
| `privacyAcceptedAt` | DateTime? | Quando aceitou política de privacidade |

**Relacionamentos:**
- 1:1 com Professional (se for profissional)
- 1:1 com Patient (se for paciente)

**Observações:**
- ✅ CPF e email são únicos dentro do tenant (clinicId)
- ✅ Senha NUNCA é armazenada em texto plano (apenas hash)
- ✅ Após 5 tentativas de login falhadas, bloquear por 15 minutos

---

### 6. Specialty (Especialidades)
**Finalidade:** Especialidades médicas/odontológicas/etc disponíveis na clínica

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Referência à clínica |
| `name` | String | Nome da especialidade (ex: "Cardiologia") |
| `description` | String? | Descrição opcional |
| `icon` | String? | Nome do ícone ou emoji |
| `color` | String? | Cor em hexadecimal |
| `isActive` | Boolean | Se está ativa |

**Exemplos:**
- Clínica Geral
- Cardiologia
- Pediatria
- Ortodontia
- Implantodontia
- Fisioterapia Ortopédica

**Observações:**
- ✅ Um profissional pode ter múltiplas especialidades
- ✅ Usada para filtrar profissionais no agendamento online

---

### 7. Professional (Profissionais de Saúde)
**Finalidade:** Dados específicos dos profissionais de saúde

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Referência à clínica |
| `userId` | UUID | Referência ao usuário (1:1) |
| **Dados Profissionais** | | |
| `professionalCouncil` | String | Conselho (CRM, CRO, CREFITO, etc) |
| `registrationNumber` | String | Número de registro no conselho |
| `registrationState` | String(2) | UF do registro |
| **Agenda** | | |
| `defaultAppointmentDuration` | Int | Duração padrão de consulta (min) | 30 |
| `calendarColor` | String | Cor na agenda (hex) | #3B82F6 |
| `isActive` | Boolean | Se está ativo |

**Relacionamentos:**
- N:M com Specialty (via ProfessionalSpecialty)
- 1:N com ProfessionalWorkingHours
- 1:N com ProfessionalScheduleBlock
- N:M com Procedure (via ProfessionalProcedure)

**Observações:**
- ✅ Combinação (professionalCouncil + registrationNumber) única no tenant
- ✅ Cada profissional tem cor diferente para facilitar visualização na agenda

---

### 8. ProfessionalSpecialty (Especialidades do Profissional)
**Finalidade:** Relacionamento N:M entre Professional e Specialty

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `professionalId` | UUID | Referência ao profissional |
| `specialtyId` | UUID | Referência à especialidade |
| `isPrimary` | Boolean | Se é a especialidade principal |

**Exemplo:**
```
Dr. João Silva:
- Clínica Geral (isPrimary: true)
- Geriatria (isPrimary: false)
```

---

### 9. ProfessionalWorkingHours (Horário do Profissional)
**Finalidade:** Horários de trabalho de cada profissional por dia da semana

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `professionalId` | UUID | Referência ao profissional |
| `dayOfWeek` | DayOfWeek | Dia da semana |
| `isWorking` | Boolean | Se trabalha neste dia |
| `startTime` | String(5) | Início do expediente (ex: "08:00") |
| `endTime` | String(5) | Fim do expediente (ex: "17:00") |
| `lunchBreakStart` | String(5)? | Início do intervalo (ex: "12:00") |
| `lunchBreakEnd` | String(5)? | Fim do intervalo (ex: "13:00") |

**Exemplo:**
```
Dr. João - Segunda-feira:
08:00 - 12:00 (atende)
12:00 - 13:00 (almoço)
13:00 - 17:00 (atende)
```

**Observações:**
- ✅ Pode ser diferente do horário da clínica
- ✅ Sistema calcula automaticamente horários disponíveis

---

### 10. ProfessionalScheduleBlock (Bloqueios de Agenda)
**Finalidade:** Períodos em que o profissional não atende (férias, folgas, etc)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `professionalId` | UUID | Referência ao profissional |
| `startDateTime` | DateTime | Início do bloqueio |
| `endDateTime` | DateTime | Fim do bloqueio |
| `reason` | String | Motivo (férias, curso, reunião) |
| `isAllDay` | Boolean | Se bloqueia o dia inteiro |

**Exemplos:**
- Férias: 01/03/2026 a 15/03/2026 (all-day)
- Reunião: 10/02/2026 14:00 às 16:00
- Curso: 05/02/2026 09:00 às 18:00

---

### 11. Patient (Pacientes)
**Finalidade:** Dados específicos dos pacientes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Referência à clínica |
| `userId` | UUID | Referência ao usuário (1:1) |
| **Dados Adicionais** | | |
| `rg` | String(20)? | RG (opcional) |
| `dateOfBirth` | Date | Data de nascimento |
| `gender` | Gender | Gênero |
| **Endereço** | | |
| `zipCode` | String(8)? | CEP |
| `street` | String? | Logradouro |
| `number` | String(10)? | Número |
| `complement` | String? | Complemento |
| `neighborhood` | String? | Bairro |
| `city` | String? | Cidade |
| `state` | String(2)? | UF |
| `alternativePhone` | String(15)? | Telefone adicional |
| **Dados Clínicos** | | |
| `allergies` | Text? | Alergias conhecidas |
| `observations` | Text? | Observações gerais |
| **Controle** | | |
| `isActive` | Boolean | Se está ativo |
| `noShowCount` | Int | Contador de faltas | 0 |
| `totalAppointments` | Int | Total de consultas | 0 |

**Observações:**
- ✅ Endereço é opcional (pacientes podem não querer informar)
- ✅ noShowCount incrementa a cada falta sem justificativa
- ✅ Sistema pode bloquear agendamento online após N faltas

---

### 12. Procedure (Procedimentos/Serviços)
**Finalidade:** Procedimentos oferecidos pela clínica

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Referência à clínica |
| `name` | String | Nome do procedimento |
| `code` | String? | Código interno (opcional) |
| `description` | Text? | Descrição detalhada |
| `defaultDuration` | Int | Duração padrão (minutos) |
| `defaultPrice` | Decimal | Preço padrão (R$) |
| `isActive` | Boolean | Se está ativo |
| `allowOnlineBooking` | Boolean | Disponível para agendamento online |

**Exemplos:**
| Procedimento | Duração | Preço |
|--------------|---------|-------|
| Consulta Inicial | 30 min | R$ 200,00 |
| Retorno | 15 min | Cortesia |
| Limpeza Dental | 45 min | R$ 180,00 |
| Aplicação de Botox | 30 min | R$ 1.200,00 |

**Observações:**
- ✅ Pode ter valores diferentes por profissional (via ProfessionalProcedure)
- ✅ Preço pode ser R$ 0,00 (cortesia)

---

### 13. ProfessionalProcedure (Procedimentos por Profissional)
**Finalidade:** Relacionamento N:M entre Professional e Procedure, com valores customizados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `professionalId` | UUID | Referência ao profissional |
| `procedureId` | UUID | Referência ao procedimento |
| `customDuration` | Int? | Duração customizada (se diferente) |
| `customPrice` | Decimal? | Preço customizado (se diferente) |

**Exemplo:**
```
Procedimento: Consulta de Avaliação
- Padrão: 30 min, R$ 200,00

Dr. João (generalista):
- 30 min, R$ 200,00 (usa padrão)

Dr. Pedro (especialista):
- 45 min, R$ 350,00 (customizado)
```

---

### 14. Appointment (Agendamentos)
**Finalidade:** Registra todos os agendamentos/consultas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Referência à clínica |
| `patientId` | UUID | Paciente agendado |
| `professionalId` | UUID | Profissional que atenderá |
| `procedureId` | UUID | Procedimento a ser realizado |
| **Data/Hora** | | |
| `appointmentDate` | Date | Data da consulta |
| `startTime` | String(5) | Horário de início (ex: "09:00") |
| `endTime` | String(5) | Horário de fim (ex: "09:30") |
| `duration` | Int | Duração em minutos |
| **Status** | | |
| `status` | AppointmentStatus | Status atual |
| `channel` | AppointmentChannel | Como foi agendado |
| **Confirmação** | | |
| `confirmedAt` | DateTime? | Quando foi confirmado |
| `confirmedBy` | String? | userId que confirmou |
| **Cancelamento** | | |
| `cancelledAt` | DateTime? | Quando foi cancelado |
| `cancelledBy` | String? | userId que cancelou |
| `cancellationReason` | CancellationReason? | Motivo |
| `cancellationNotes` | Text? | Observações |
| **Outros** | | |
| `notes` | Text? | Observações gerais |
| `rescheduledFrom` | String? | ID do agendamento original (se reagendou) |
| `createdBy` | String | userId que criou |

**Relacionamentos:**
- 1:1 com MedicalRecord (prontuário)
- 1:1 com FinancialRecord (se gerar receita)
- 1:N com Notification

**Observações:**
- ✅ Sistema valida se horário está disponível antes de criar
- ✅ Impede agendamentos sobrepostos do mesmo profissional
- ✅ Ao marcar como COMPLETED, pode gerar receita automaticamente

---

### 15. MedicalRecord (Prontuário Médico)
**Finalidade:** Registra informações clínicas do atendimento

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `appointmentId` | UUID | Referência ao agendamento (1:1) |
| `patientId` | UUID | Paciente atendido |
| `professionalId` | UUID | Profissional que atendeu |
| **Conteúdo** | | |
| `chiefComplaint` | Text? | Queixa principal do paciente |
| `symptoms` | Text? | Sintomas relatados |
| `diagnosis` | Text? | Diagnóstico |
| `treatment` | Text? | Tratamento realizado |
| `prescription` | Text? | Prescrição médica |
| `observations` | Text? | Observações gerais |
| `attachments` | String[] | URLs de arquivos anexos (exames, imagens) |

**Observações:**
- ✅ Apenas profissional que atendeu pode criar/editar
- ✅ Admin pode visualizar mas não editar
- ✅ Paciente NÃO acessa (confidencialidade médica)
- ⚠️ Para PEP certificado SBIS, integrar com sistema especializado

---

### 16. FinancialRecord (Registros Financeiros)
**Finalidade:** Controle financeiro - receitas e despesas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Referência à clínica |
| `type` | TransactionType | INCOME ou EXPENSE |
| **Valores** | | |
| `amount` | Decimal | Valor (R$) |
| `description` | String | Descrição |
| `category` | String? | Categoria (ex: "Consulta", "Aluguel") |
| **Pagamento** | | |
| `paymentMethod` | PaymentMethod? | Forma de pagamento |
| `paymentStatus` | PaymentStatus | Status do pagamento |
| `paidAt` | DateTime? | Quando foi pago |
| **Datas** | | |
| `referenceDate` | Date | Data de competência |
| `dueDate` | Date? | Data de vencimento |
| **Relacionamentos** | | |
| `appointmentId` | UUID? | Se veio de um agendamento |
| `patientId` | UUID? | Se relacionado a paciente |
| `notes` | Text? | Observações |
| `createdBy` | String | userId que registrou |

**Observações:**
- ✅ Receitas automáticas ao marcar consulta como COMPLETED
- ✅ Despesas registradas manualmente pelo admin
- ✅ Não é um sistema contábil completo (básico)

---

### 17. Notification (Notificações)
**Finalidade:** Registra notificações enviadas (e-mail, SMS, WhatsApp)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Referência à clínica |
| **Destinatário** | | |
| `recipientEmail` | String | E-mail do destinatário |
| `recipientPhone` | String? | Telefone |
| `recipientName` | String | Nome |
| **Conteúdo** | | |
| `type` | NotificationType | Tipo de notificação |
| `channel` | NotificationChannel | Canal (EMAIL, SMS, WHATSAPP) |
| `subject` | String? | Assunto (para e-mails) |
| `message` | Text | Mensagem |
| **Status** | | |
| `status` | NotificationStatus | Status de envio |
| `sentAt` | DateTime? | Quando foi enviada |
| `readAt` | DateTime? | Quando foi lida |
| `errorMessage` | Text? | Mensagem de erro (se falhou) |
| `appointmentId` | UUID? | Se relacionada a agendamento |

**Observações:**
- ✅ Envios são assíncronos (fila)
- ✅ Retenta até 3x em caso de falha
- ✅ Admin pode ver histórico de notificações

---

### 18. AuditLog (Logs de Auditoria)
**Finalidade:** Registra TODAS as ações importantes no sistema (rastreabilidade)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `clinicId` | UUID | Referência à clínica |
| **Usuário** | | |
| `userId` | String? | userId que executou |
| `userName` | String | Nome armazenado (caso usuário seja deletado) |
| **Ação** | | |
| `action` | String | Ex: "CREATE_PATIENT", "UPDATE_APPOINTMENT" |
| `entity` | String | Ex: "Patient", "Appointment" |
| `entityId` | String | ID da entidade afetada |
| **Dados** | | |
| `oldData` | JSON? | Dados antes da alteração |
| `newData` | JSON? | Dados depois da alteração |
| **Contexto** | | |
| `ipAddress` | String? | IP de origem |
| `userAgent` | Text? | Navegador/dispositivo |
| `createdAt` | DateTime | Timestamp da ação |

**Ações auditadas:**
- Login (sucesso e falha)
- Criação de agendamento
- Cancelamento de agendamento
- Cadastro/edição de paciente
- Criação/desativação de usuário
- Alterações em configurações
- Acesso ao prontuário

**Observações:**
- ✅ Logs são IMUTÁVEIS (não podem ser editados/deletados)
- ✅ Apenas Admin acessa
- ✅ Retenção mínima: 5 anos (LGPD)

---

### 19. PasswordResetToken (Tokens de Recuperação de Senha)
**Finalidade:** Tokens temporários para redefinição de senha

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `email` | String | E-mail do usuário |
| `token` | String | Token único e seguro |
| `expiresAt` | DateTime | Expira em 2 horas |
| `usedAt` | DateTime? | Quando foi usado (se usado) |

**Fluxo:**
1. Usuário esquece senha e informa e-mail
2. Sistema gera token e envia por e-mail
3. Usuário clica no link e define nova senha
4. Token é marcado como usado

**Observações:**
- ✅ Token expira em 2 horas
- ✅ Pode ser usado apenas 1 vez
- ✅ Token deve ser aleatório e seguro (UUID)

---

## 🔍 ANÁLISE E SUGESTÕES

### ✅ Pontos Fortes do Schema:

1. **Multi-tenant bem implementado** - Isolamento por clinicId
2. **LGPD contemplada** - Campos de consentimento, auditoria
3. **Flexível** - Muitos campos opcionais
4. **Completo** - Cobre MVP e fases futuras
5. **Relacionamentos claros** - Cascade e Restrict bem definidos
6. **Enums bem pensados** - Cobrem casos reais

### ⚠️ Pontos de Atenção:

1. **Generate client com output customizado**
   ```prisma
   output = "../generated/prisma"
   ```
   ❓ **Sugestão:** Usar o padrão `node_modules/.prisma/client` facilita imports

2. **Campos de tempo como String**
   ```prisma
   startTime String @db.VarChar(5) // "09:00"
   ```
   ✅ **OK para simplicidade**, mas poderia usar DateTime completo

3. **Attachments como String[]**
   ```prisma
   attachments String[]
   ```
   ✅ **OK**, mas considere tabela separada se precisar de metadados (nome original, tamanho, tipo)

4. **Falta datasource URL**
   ```prisma
   datasource db {
     provider = "postgresql"
     // Falta: url = env("DATABASE_URL")
   }
   ```

### 📝 Sugestões de Melhorias (Opcionais):

1. **Adicionar campo `deletedAt` (Soft Delete)**
   - Para não perder dados históricos
   ```prisma
   deletedAt DateTime?
   ```

2. **Tabela para Templates de Notificação**
   - Textos customizáveis por clínica

3. **Tabela para Arquivos/Anexos**
   - Com metadados (nome, tipo, tamanho)

4. **Índices adicionais em campos frequentes**
   - Já tem vários, mas pode adicionar mais conforme uso

---

## ❓ Perguntas para Você:

1. ✅ O output do Prisma client em `../generated/prisma` é intencional?
2. ✅ Quer adicionar soft delete (deletedAt)?
3. ✅ Precisa de tabela separada para arquivos ou String[] está OK?
4. ✅ Algum campo faltando que você identificou?
5. ✅ Algum relacionamento que precisa ajustar?

---

**➡️ Após revisar, me diga quais mudanças quer fazer que eu atualizo o schema! 🚀**
