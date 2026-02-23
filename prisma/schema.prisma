// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum UserRole {
  ADMIN // Dono da clínica
  RECEPTIONIST // Recepcionista
  PROFESSIONAL // Profissional de saúde
  PATIENT // Paciente
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BLOCKED
  PENDING_ACTIVATION
  EMAIL_VERIFIED
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}

enum AppointmentStatus {
  SCHEDULED // Agendado
  CONFIRMED // Confirmado pelo paciente
  WAITING // Paciente aguardando atendimento
  IN_PROGRESS // Em atendimento
  COMPLETED // Atendido
  CANCELLED // Cancelado
  NO_SHOW // Paciente não compareceu
  RESCHEDULED // Reagendado
}

enum AppointmentChannel {
  IN_PERSON // Presencial na recepção
  PHONE // Por telefone
  ONLINE_PORTAL // Portal do paciente
  WHATSAPP // WhatsApp
}

enum CancellationReason {
  PATIENT_REQUEST
  PROFESSIONAL_UNAVAILABLE
  CLINIC_CLOSURE
  EMERGENCY
  RESCHEDULED
  OTHER
}

enum TransactionType {
  INCOME // Receita
  EXPENSE // Despesa
}

enum PaymentMethod {
  CASH // Dinheiro
  DEBIT_CARD // Cartão de débito
  CREDIT_CARD // Cartão de crédito
  PIX // PIX
  BANK_TRANSFER // Transferência bancária
  CHECK // Cheque
}

enum PaymentStatus {
  PENDING
  PAID
  CANCELLED
  REFUNDED
}

enum NotificationType {
  APPOINTMENT_CONFIRMATION
  APPOINTMENT_REMINDER
  APPOINTMENT_CANCELLATION
  APPOINTMENT_RESCHEDULED
  PASSWORD_RESET
  WELCOME
  BIRTHDAY
  NO_SHOW_WARNING
}

enum NotificationChannel {
  EMAIL
  SMS
  WHATSAPP
  IN_APP
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  READ
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

// ========================================
// TABELAS GLOBAIS (Compartilhadas entre todos os tenants)
// ========================================

// Tabela de clínicas (cada clínica é um tenant)
model Clinic {
  id String @id @default(uuid())

  // Dados cadastrais
  legalName String // Razão social
  tradeName String // Nome fantasia
  cnpj      String  @unique @db.VarChar(14)
  email     String  @unique
  phone     String  @db.VarChar(15)
  website   String?
  logoUrl   String?

  // Endereço
  zipCode      String  @db.VarChar(8)
  street       String
  number       String  @db.VarChar(10)
  complement   String?
  neighborhood String
  city         String
  state        String  @db.VarChar(2)

  // Configurações
  subdomain    String? @unique // Ex: clinicaexemplo (opcional - para uso futuro)
  customDomain String? @unique // Ex: www.clinicaexemplo.com.br (opcional)
  timezone     String  @default("America/Sao_Paulo")

  // Multi-tenant
  isActive Boolean @default(true)

  // Verificação de Email
  verificationToken   String? // Token hasheado para verificação de email
  verificationExpires DateTime? // Data de expiração do token

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  users            User[]
  settings         ClinicSettings?
  workingHours     ClinicWorkingHours[]
  holidays         ClinicHoliday[]
  specialties      Specialty[]
  professionals    Professional[]
  patients         Patient[]
  procedures       Procedure[]
  appointments     Appointment[]
  financialRecords FinancialRecord[]
  notifications    Notification[]
  auditLogs        AuditLog[]

  @@index([cnpj])
  @@index([city, state]) // Índice para busca por localização
  @@map("clinics")
}

// Configurações da clínica
model ClinicSettings {
  id       String @id @default(uuid())
  clinicId String @unique
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  // Agendamentos
  minIntervalBetweenAppointments Int @default(15) // minutos
  minAdvanceBookingHours         Int @default(2) // horas
  maxAdvanceBookingDays          Int @default(60) // dias
  maxCancellationHours           Int @default(24) // horas antes

  // Políticas
  maxConsecutiveNoShows       Int @default(3) // Bloqueio após N faltas
  appointmentToleranceMinutes Int @default(15) // Tolerância para atraso

  // Agendamento online
  allowOnlineBooking         Boolean @default(true)
  requirePatientConfirmation Boolean @default(true)

  // Notificações
  sendAppointmentConfirmation Boolean @default(true)
  sendAppointmentReminder     Boolean @default(true)
  reminderHoursBefore         Int     @default(24)
  sendBirthdayMessage         Boolean @default(true)

  // Visual
  primaryColor   String  @default("#3B82F6")
  secondaryColor String  @default("#1E40AF")
  darkMode       Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("clinic_settings")
}

// Horário de funcionamento da clínica
model ClinicWorkingHours {
  id       String @id @default(uuid())
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  dayOfWeek DayOfWeek
  isOpen    Boolean   @default(true)
  openTime  String    @db.VarChar(5) // Ex: "08:00"
  closeTime String    @db.VarChar(5) // Ex: "18:00"

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([clinicId, dayOfWeek])
  @@map("clinic_working_hours")
}

// Feriados e dias sem atendimento
model ClinicHoliday {
  id       String @id @default(uuid())
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  date        DateTime @db.Date
  description String
  isRecurring Boolean  @default(false) // Para feriados anuais

  createdAt DateTime @default(now())

  @@index([clinicId, date])
  @@map("clinic_holidays")
}

// ========================================
// USUÁRIOS
// ========================================

model User {
  id       String  @id @default(uuid())
  clinicId String?
  clinic   Clinic? @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  // Dados pessoais
  name  String
  cpf   String  @db.VarChar(11)
  email String
  phone String  @db.VarChar(15)

  // Autenticação
  password String // Hash bcrypt
  role     UserRole
  status   UserStatus @default(ACTIVE)

  // Controle de acesso
  mustChangePassword Boolean   @default(true)
  lastLoginAt        DateTime?
  loginAttempts      Int       @default(0)
  blockedUntil       DateTime?

  // Avatar
  avatarUrl String?

  // Consentimento LGPD
  termsAcceptedAt   DateTime?
  privacyAcceptedAt DateTime?

  // Verificação de Email
  verificationToken   String?   // Token hasheado para verificação de email
  verificationExpires DateTime? // Data de expiração do token

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  professional     Professional?
  patient          Patient?
  createdAuditLogs AuditLog[]    @relation("AuditLogUser")

  @@unique([email])                  // Email globalmente único
  @@unique([clinicId, email])        // Email único por clínica (staff/admin)
  @@index([clinicId, role])
  @@map("users")
}

// ========================================
// ESPECIALIDADES
// ========================================

model Specialty {
  id       String @id @default(uuid())
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  name        String
  description String?
  icon        String? // Nome do ícone ou emoji
  color       String? // Cor em hex
  isActive    Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  professionals ProfessionalSpecialty[]

  @@unique([clinicId, name])
  @@map("specialties")
}

// ========================================
// PROFISSIONAIS DE SAÚDE
// ========================================

model Professional {
  id       String @id @default(uuid())
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Dados profissionais
  professionalCouncil String // CRM, CRO, CREFITO, etc
  registrationNumber  String
  registrationState   String @db.VarChar(2)

  // Configuração de agenda
  defaultAppointmentDuration Int    @default(30) // minutos
  calendarColor              String @default("#3B82F6") // Cor na agenda

  // Status
  isActive Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  specialties    ProfessionalSpecialty[]
  workingHours   ProfessionalWorkingHours[]
  scheduleBlocks ProfessionalScheduleBlock[]
  procedures     ProfessionalProcedure[]
  appointments   Appointment[]
  medicalRecords MedicalRecord[]

  @@unique([clinicId, professionalCouncil, registrationNumber])
  @@map("professionals")
}

// Relacionamento N:N entre Profissional e Especialidade
model ProfessionalSpecialty {
  id             String       @id @default(uuid())
  professionalId String
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  specialtyId    String
  specialty      Specialty    @relation(fields: [specialtyId], references: [id], onDelete: Cascade)

  isPrimary Boolean @default(false) // Especialidade principal

  createdAt DateTime @default(now())

  @@unique([professionalId, specialtyId])
  @@map("professional_specialties")
}

// Horário de atendimento do profissional
model ProfessionalWorkingHours {
  id             String       @id @default(uuid())
  professionalId String
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)

  dayOfWeek DayOfWeek
  isWorking Boolean   @default(true)
  startTime String    @db.VarChar(5) // Ex: "08:00"
  endTime   String    @db.VarChar(5) // Ex: "12:00"

  // Intervalo para almoço/descanso
  lunchBreakStart String? @db.VarChar(5)
  lunchBreakEnd   String? @db.VarChar(5)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([professionalId, dayOfWeek])
  @@map("professional_working_hours")
}

// Bloqueios de agenda (férias, folgas, etc)
model ProfessionalScheduleBlock {
  id             String       @id @default(uuid())
  professionalId String
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)

  startDateTime DateTime
  endDateTime   DateTime
  reason        String
  isAllDay      Boolean  @default(false)

  createdAt DateTime @default(now())

  @@index([professionalId, startDateTime, endDateTime])
  @@map("professional_schedule_blocks")
}

// ========================================
// PACIENTES
// ========================================

model Patient {
  id       String  @id @default(uuid())
  clinicId String? // Nulo no registro — vinculado na primeira consulta
  clinic   Clinic? @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Dados pessoais adicionais
  cpf String  @db.VarChar(11)
  rg  String? @db.VarChar(20)

  dateOfBirth DateTime @db.Date
  gender      Gender

  // Endereço
  zipCode      String? @db.VarChar(8)
  street       String?
  number       String? @db.VarChar(10)
  complement   String?
  neighborhood String?
  city         String?
  state        String? @db.VarChar(2)

  // Telefone adicional
  alternativePhone String? @db.VarChar(15)

  // Dados clínicos
  bloodType             String? @db.VarChar(10)
  allergies             String? @db.Text
  medications           String? @db.Text
  conditions            String? @db.Text
  observations          String? @db.Text
  emergencyContactName  String? @db.VarChar(100)
  emergencyContactPhone String? @db.VarChar(15)

  // Controle
  isActive          Boolean @default(true)
  noShowCount       Int     @default(0)
  totalAppointments Int     @default(0)

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  appointments     Appointment[]
  medicalRecords   MedicalRecord[]
  financialRecords FinancialRecord[]

  @@unique([cpf]) // CPF globalmente único
  @@map("patients")
}

// ========================================
// PROCEDIMENTOS
// ========================================

model Procedure {
  id       String @id @default(uuid())
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  // Dados do procedimento
  name        String
  code        String? // Código interno
  description String? @db.Text

  // Configurações
  defaultDuration Int // Duração em minutos
  defaultPrice    Decimal @db.Decimal(10, 2)

  // Controle
  isActive           Boolean @default(true)
  allowOnlineBooking Boolean @default(true)

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  professionals ProfessionalProcedure[]
  appointments  Appointment[]

  @@unique([clinicId, name])
  @@map("procedures")
}

// Relacionamento N:N entre Profissional e Procedimento
model ProfessionalProcedure {
  id             String       @id @default(uuid())
  professionalId String
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  procedureId    String
  procedure      Procedure    @relation(fields: [procedureId], references: [id], onDelete: Cascade)

  // Pode sobrescrever valores padrão
  customDuration Int? // Se diferente do padrão
  customPrice    Decimal? @db.Decimal(10, 2)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([professionalId, procedureId])
  @@map("professional_procedures")
}

// ========================================
// AGENDAMENTOS
// ========================================

model Appointment {
  id       String @id @default(uuid())
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  // Relacionamentos principais
  patientId String
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Restrict)

  professionalId String
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Restrict)

  procedureId String
  procedure   Procedure @relation(fields: [procedureId], references: [id], onDelete: Restrict)

  // Data e hora
  appointmentDate DateTime @db.Date
  startTime       String   @db.VarChar(5) // Ex: "09:00"
  endTime         String   @db.VarChar(5) // Ex: "10:00"
  duration        Int // Duração em minutos

  // Status e controle
  status  AppointmentStatus  @default(SCHEDULED)
  channel AppointmentChannel @default(IN_PERSON)

  // Confirmação
  confirmedAt DateTime?
  confirmedBy String? // userId que confirmou

  // Cancelamento
  cancelledAt        DateTime?
  cancelledBy        String? // userId que cancelou
  cancellationReason CancellationReason?
  cancellationNotes  String?             @db.Text

  // Observações
  notes String? @db.Text

  // Reagendamento
  rescheduledFrom String? // ID do agendamento original

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String // userId que criou

  // Relacionamentos
  medicalRecord   MedicalRecord?
  financialRecord FinancialRecord?
  notifications   Notification[]

  @@index([clinicId, appointmentDate, professionalId])
  @@index([clinicId, patientId])
  @@index([professionalId, appointmentDate])
  @@index([status])
  @@map("appointments")
}

// ========================================
// PRONTUÁRIO MÉDICO
// ========================================

model MedicalRecord {
  id String @id @default(uuid())

  appointmentId String      @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  patientId String
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Restrict)

  professionalId String
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Restrict)

  // Conteúdo do prontuário
  chiefComplaint String? @db.Text // Queixa principal
  symptoms       String? @db.Text // Sintomas
  diagnosis      String? @db.Text // Diagnóstico
  treatment      String? @db.Text // Tratamento realizado
  prescription   String? @db.Text // Prescrição
  observations   String? @db.Text // Observações gerais

  // Anexos
  attachments String[] // URLs de arquivos anexos

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([patientId])
  @@index([professionalId])
  @@map("medical_records")
}

// ========================================
// FINANCEIRO
// ========================================

model FinancialRecord {
  id       String @id @default(uuid())
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  // Tipo
  type TransactionType

  // Valores
  amount      Decimal @db.Decimal(10, 2)
  description String
  category    String? // Ex: "Consulta", "Aluguel", "Materiais"

  // Pagamento
  paymentMethod PaymentMethod?
  paymentStatus PaymentStatus  @default(PENDING)
  paidAt        DateTime?

  // Data
  referenceDate DateTime  @db.Date // Data de referência (competência)
  dueDate       DateTime? @db.Date // Data de vencimento

  // Relacionamentos opcionais
  appointmentId String?      @unique
  appointment   Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)

  patientId String?
  patient   Patient? @relation(fields: [patientId], references: [id], onDelete: SetNull)

  // Observações
  notes String? @db.Text

  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String // userId

  @@index([clinicId, type, referenceDate])
  @@index([clinicId, paymentStatus])
  @@map("financial_records")
}

// ========================================
// NOTIFICAÇÕES
// ========================================

model Notification {
  id       String @id @default(uuid())
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  // Destinatário
  recipientEmail String
  recipientPhone String?
  recipientName  String

  // Conteúdo
  type    NotificationType
  channel NotificationChannel
  subject String?
  message String              @db.Text

  // Status
  status       NotificationStatus @default(PENDING)
  sentAt       DateTime?
  readAt       DateTime?
  errorMessage String?            @db.Text

  // Relacionamentos opcionais
  appointmentId String?
  appointment   Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)

  // Metadata
  createdAt DateTime @default(now())

  @@index([clinicId, status])
  @@index([recipientEmail])
  @@map("notifications")
}

// ========================================
// AUDITORIA
// ========================================

model AuditLog {
  id       String @id @default(uuid())
  clinicId String
  clinic   Clinic @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  // Usuário que realizou a ação
  userId   String?
  user     User?   @relation("AuditLogUser", fields: [userId], references: [id], onDelete: SetNull)
  userName String // Nome armazenado para caso o usuário seja deletado

  // Ação
  action   String // Ex: "CREATE_PATIENT", "UPDATE_APPOINTMENT", "DELETE_USER"
  entity   String // Ex: "Patient", "Appointment", "User"
  entityId String // ID da entidade afetada

  // Dados
  oldData Json? // Dados antes da alteração
  newData Json? // Dados depois da alteração

  // Contexto
  ipAddress String?
  userAgent String? @db.Text

  // Metadata
  createdAt DateTime @default(now())

  @@index([clinicId, createdAt])
  @@index([userId])
  @@index([entity, entityId])
  @@map("audit_logs")
}

// ========================================
// TOKENS DE RECUPERAÇÃO DE SENHA
// ========================================

model PasswordResetToken {
  id        String    @id @default(uuid())
  email     String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?

  createdAt DateTime @default(now())

  @@index([email])
  @@index([token])
  @@map("password_reset_tokens")
}
