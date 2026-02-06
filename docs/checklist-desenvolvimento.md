# 📋 Checklist de Desenvolvimento - MinhaClínica API

Use este checklist para acompanhar o progresso do desenvolvimento. Marque ✅ conforme conclui cada item.

---

## 🎯 FASE 1: FUNDAÇÃO (Semana 1-2)

### 1.1 Auth Module (PRIORIDADE MÁXIMA!)
- [ ] **Setup Inicial**
  - [ ] Criar pasta `src/utils/`
  - [ ] Criar `src/utils/errors.ts` (classes de erro)
  - [ ] Criar `src/utils/jwt.ts` (geração/validação de tokens)
  - [ ] Criar `src/utils/password.ts` (bcrypt hash/compare)
  - [ ] Criar `src/@types/express.d.ts` (tipagem req.user)

- [ ] **Middlewares**
  - [ ] Criar `src/middlewares/authMiddleware.ts` (verificar JWT)
  - [ ] Criar `src/middlewares/roleMiddleware.ts` (verificar permissões)
  - [ ] Criar `src/middlewares/errorMiddleware.ts` (tratamento global de erros)

- [ ] **Auth Repository** (`src/repository/authRepository.ts`)
  - [ ] `findUserByEmail(email, clinicId)`
  - [ ] `findUserByCpf(cpf, clinicId)`
  - [ ] `createUser(data)`
  - [ ] `updatePassword(userId, hashedPassword)`
  - [ ] `updateLastLogin(userId)`
  - [ ] `incrementLoginAttempts(userId)`
  - [ ] `resetLoginAttempts(userId)`
  - [ ] `blockUser(userId, blockedUntil)`

- [ ] **Auth Service** (`src/service/authService.ts`)
  - [ ] `login(email, password, clinicId)`
  - [ ] `register(data)` (primeiro admin)
  - [ ] `validateToken(token)`
  - [ ] `refreshToken(refreshToken)`
  - [ ] `forgotPassword(email)`
  - [ ] `resetPassword(token, newPassword)`
  - [ ] `changePassword(userId, oldPassword, newPassword)`

- [ ] **Auth Controller** (`src/controller/authController.ts`)
  - [ ] `login(req, res)` - POST /auth/login
  - [ ] `register(req, res)` - POST /auth/register
  - [ ] `refreshToken(req, res)` - POST /auth/refresh
  - [ ] `forgotPassword(req, res)` - POST /auth/forgot-password
  - [ ] `resetPassword(req, res)` - POST /auth/reset-password
  - [ ] `me(req, res)` - GET /auth/me
  - [ ] `changePassword(req, res)` - POST /auth/change-password

- [ ] **Auth Routes** (`src/routes/authRoutes.ts`)
  - [ ] POST `/auth/login` (público)
  - [ ] POST `/auth/register` (público - apenas primeiro cadastro)
  - [ ] POST `/auth/refresh` (público)
  - [ ] POST `/auth/forgot-password` (público)
  - [ ] POST `/auth/reset-password` (público)
  - [ ] GET `/auth/me` (autenticado)
  - [ ] POST `/auth/change-password` (autenticado)

- [ ] **Testes**
  - [ ] Testar login com credenciais válidas
  - [ ] Testar login com credenciais inválidas
  - [ ] Testar bloqueio após 5 tentativas
  - [ ] Testar token JWT gerado
  - [ ] Testar middleware de autenticação
  - [ ] Testar middleware de permissões

---

### 1.2 User Module
- [ ] **User Repository** (`src/repository/userRepository.ts`)
  - [ ] `create(data)`
  - [ ] `findById(id)`
  - [ ] `findByEmail(email, clinicId)`
  - [ ] `findByCpf(cpf, clinicId)`
  - [ ] `findMany(clinicId, filters)`
  - [ ] `update(id, data)`
  - [ ] `updateStatus(id, status)`
  - [ ] `delete(id)` (soft delete)
  - [ ] `count(clinicId, filters)`

- [ ] **User Service** (`src/service/userService.ts`)
  - [ ] `createUser(clinicId, data, createdBy)`
  - [ ] `getUsers(clinicId, filters)`
  - [ ] `getUserById(id, clinicId)`
  - [ ] `updateUser(id, clinicId, data)`
  - [ ] `updateStatus(id, clinicId, status)`
  - [ ] `deleteUser(id, clinicId)`

- [ ] **User Controller** (`src/controller/userController.ts`)
  - [ ] `create(req, res)` - POST /users
  - [ ] `list(req, res)` - GET /users
  - [ ] `getById(req, res)` - GET /users/:id
  - [ ] `update(req, res)` - PUT /users/:id
  - [ ] `updateStatus(req, res)` - PATCH /users/:id/status
  - [ ] `delete(req, res)` - DELETE /users/:id

- [ ] **User Routes** (`src/routes/userRoutes.ts`)
  - [ ] POST `/users` (admin)
  - [ ] GET `/users` (admin, receptionist)
  - [ ] GET `/users/:id` (autenticado)
  - [ ] PUT `/users/:id` (admin ou próprio usuário)
  - [ ] PATCH `/users/:id/status` (admin)
  - [ ] DELETE `/users/:id` (admin)

- [ ] **Testes**
  - [ ] Criar usuário (admin, recepcionista)
  - [ ] Listar usuários com filtros
  - [ ] Buscar usuário por ID
  - [ ] Atualizar dados do usuário
  - [ ] Bloquear/desbloquear usuário
  - [ ] Validar CPF/email únicos

---

## 🎯 FASE 2: RECURSOS BASE (Semana 3-4)

### 2.1 Specialty Module
- [ ] **Specialty Repository** (`src/repository/specialtyRepository.ts`)
  - [ ] `create(data)`
  - [ ] `findById(id)`
  - [ ] `findByName(name, clinicId)`
  - [ ] `findMany(clinicId, filters)`
  - [ ] `update(id, data)`
  - [ ] `delete(id)` (soft delete)

- [ ] **Specialty Service** (`src/service/specialtyService.ts`)
  - [ ] `createSpecialty(clinicId, data)`
  - [ ] `getSpecialties(clinicId, filters)`
  - [ ] `getSpecialtyById(id, clinicId)`
  - [ ] `updateSpecialty(id, clinicId, data)`
  - [ ] `deleteSpecialty(id, clinicId)`

- [ ] **Specialty Controller** (`src/controller/specialtyController.ts`)
  - [ ] `create(req, res)`
  - [ ] `list(req, res)`
  - [ ] `getById(req, res)`
  - [ ] `update(req, res)`
  - [ ] `delete(req, res)`

- [ ] **Specialty Routes** (`src/routes/specialtyRoutes.ts`)
  - [ ] POST `/specialties` (admin)
  - [ ] GET `/specialties` (todos)
  - [ ] GET `/specialties/:id` (todos)
  - [ ] PUT `/specialties/:id` (admin)
  - [ ] DELETE `/specialties/:id` (admin)

---

### 2.2 Procedure Module
- [ ] **Procedure Repository** (`src/repository/procedureRepository.ts`)
  - [ ] `create(data)`
  - [ ] `findById(id)`
  - [ ] `findByName(name, clinicId)`
  - [ ] `findMany(clinicId, filters)`
  - [ ] `update(id, data)`
  - [ ] `delete(id)` (soft delete)

- [ ] **Procedure Service** (`src/service/procedureService.ts`)
  - [ ] `createProcedure(clinicId, data)`
  - [ ] `getProcedures(clinicId, filters)`
  - [ ] `getProcedureById(id, clinicId)`
  - [ ] `updateProcedure(id, clinicId, data)`
  - [ ] `deleteProcedure(id, clinicId)`

- [ ] **Procedure Controller** (`src/controller/procedureController.ts`)
  - [ ] `create(req, res)`
  - [ ] `list(req, res)`
  - [ ] `getById(req, res)`
  - [ ] `update(req, res)`
  - [ ] `delete(req, res)`

- [ ] **Procedure Routes** (`src/routes/procedureRoutes.ts`)
  - [ ] POST `/procedures` (admin)
  - [ ] GET `/procedures` (todos)
  - [ ] GET `/procedures/:id` (todos)
  - [ ] PUT `/procedures/:id` (admin)
  - [ ] DELETE `/procedures/:id` (admin)

---

## 🎯 FASE 3: ATORES PRINCIPAIS (Semana 5-6)

### 3.1 Professional Module
- [ ] **Professional Repository** (`src/repository/professionalRepository.ts`)
  - [ ] `create(data)`
  - [ ] `findById(id)`
  - [ ] `findByUserId(userId)`
  - [ ] `findMany(clinicId, filters)`
  - [ ] `update(id, data)`
  - [ ] `delete(id)` (soft delete)
  - [ ] **Specialties:**
    - [ ] `addSpecialty(professionalId, specialtyId, isPrimary)`
    - [ ] `removeSpecialty(professionalId, specialtyId)`
    - [ ] `setPrimarySpecialty(professionalId, specialtyId)`
  - [ ] **Working Hours:**
    - [ ] `setWorkingHours(professionalId, workingHours[])`
    - [ ] `getWorkingHours(professionalId)`
  - [ ] **Schedule Blocks:**
    - [ ] `createScheduleBlock(data)`
    - [ ] `getScheduleBlocks(professionalId, dateRange)`
    - [ ] `deleteScheduleBlock(id)`
  - [ ] **Procedures:**
    - [ ] `addProcedure(professionalId, procedureId, customPrice, customDuration)`
    - [ ] `removeProcedure(professionalId, procedureId)`
    - [ ] `getProcedures(professionalId)`

- [ ] **Professional Service** (`src/service/professionalService.ts`)
  - [ ] `createProfessional(clinicId, data)`
  - [ ] `getProfessionals(clinicId, filters)`
  - [ ] `getProfessionalById(id, clinicId)`
  - [ ] `updateProfessional(id, clinicId, data)`
  - [ ] `deleteProfessional(id, clinicId)`
  - [ ] `manageSpecialties(professionalId, specialtyIds)`
  - [ ] `setWorkingHours(professionalId, workingHours)`
  - [ ] `createScheduleBlock(professionalId, blockData)`
  - [ ] `manageProcedures(professionalId, procedures)`

- [ ] **Professional Controller** (`src/controller/professionalController.ts`)
  - [ ] `create(req, res)`
  - [ ] `list(req, res)`
  - [ ] `getById(req, res)`
  - [ ] `update(req, res)`
  - [ ] `delete(req, res)`
  - [ ] `addSpecialty(req, res)`
  - [ ] `removeSpecialty(req, res)`
  - [ ] `setWorkingHours(req, res)`
  - [ ] `createScheduleBlock(req, res)`
  - [ ] `addProcedure(req, res)`

- [ ] **Professional Routes** (`src/routes/professionalRoutes.ts`)
  - [ ] POST `/professionals`
  - [ ] GET `/professionals`
  - [ ] GET `/professionals/:id`
  - [ ] PUT `/professionals/:id`
  - [ ] DELETE `/professionals/:id`
  - [ ] POST `/professionals/:id/specialties`
  - [ ] DELETE `/professionals/:id/specialties/:specialtyId`
  - [ ] POST `/professionals/:id/working-hours`
  - [ ] POST `/professionals/:id/schedule-blocks`
  - [ ] POST `/professionals/:id/procedures`

---

### 3.2 Patient Module
- [ ] **Patient Repository** (`src/repository/patientRepository.ts`)
  - [ ] `create(data)`
  - [ ] `findById(id)`
  - [ ] `findByUserId(userId)`
  - [ ] `findByCpf(cpf, clinicId)`
  - [ ] `findMany(clinicId, filters)`
  - [ ] `search(clinicId, searchTerm)` (por nome, CPF, telefone)
  - [ ] `update(id, data)`
  - [ ] `delete(id)` (soft delete)
  - [ ] `incrementNoShowCount(id)`
  - [ ] `incrementTotalAppointments(id)`

- [ ] **Patient Service** (`src/service/patientService.ts`)
  - [ ] `createPatient(clinicId, data)`
  - [ ] `getPatients(clinicId, filters)`
  - [ ] `getPatientById(id, clinicId)`
  - [ ] `searchPatients(clinicId, searchTerm)`
  - [ ] `updatePatient(id, clinicId, data)`
  - [ ] `deletePatient(id, clinicId)`

- [ ] **Patient Controller** (`src/controller/patientController.ts`)
  - [ ] `create(req, res)`
  - [ ] `list(req, res)`
  - [ ] `getById(req, res)`
  - [ ] `search(req, res)`
  - [ ] `update(req, res)`
  - [ ] `delete(req, res)`

- [ ] **Patient Routes** (`src/routes/patientRoutes.ts`)
  - [ ] POST `/patients`
  - [ ] GET `/patients`
  - [ ] GET `/patients/search?q=...`
  - [ ] GET `/patients/:id`
  - [ ] PUT `/patients/:id`
  - [ ] DELETE `/patients/:id`

---

## 🎯 FASE 4: AGENDAMENTOS (Semana 7-8) ⚠️ COMPLEXO!

### 4.1 Appointment Module
- [ ] **Utils/Helpers**
  - [ ] Criar `src/utils/dateHelper.ts` (manipulação de datas)
  - [ ] Criar `src/utils/appointmentValidator.ts` (validações complexas)
  - [ ] Criar `src/service/availableSlotsService.ts` (calcular horários disponíveis)

- [ ] **Appointment Repository** (`src/repository/appointmentRepository.ts`)
  - [ ] `create(data)`
  - [ ] `findById(id)`
  - [ ] `findMany(clinicId, filters)`
  - [ ] `findByProfessionalAndDate(professionalId, date)`
  - [ ] `findByPatient(patientId, filters)`
  - [ ] `update(id, data)`
  - [ ] `updateStatus(id, status)`
  - [ ] `cancel(id, reason)`
  - [ ] `checkConflict(professionalId, startDateTime, endDateTime, excludeId?)`
  - [ ] `getCalendarView(professionalId, startDate, endDate)`

- [ ] **Appointment Service** (`src/service/appointmentService.ts`)
  - [ ] `createAppointment(clinicId, data)`
  - [ ] `getAppointments(clinicId, filters)`
  - [ ] `getAppointmentById(id, clinicId)`
  - [ ] `updateAppointment(id, clinicId, data)`
  - [ ] `confirmAppointment(id, clinicId)`
  - [ ] `cancelAppointment(id, clinicId, reason)`
  - [ ] `markAsNoShow(id, clinicId)`
  - [ ] `getAvailableSlots(professionalId, date, procedureId)`
  - [ ] `getCalendar(professionalId, startDate, endDate)`
  - [ ] **Validações:**
    - [ ] Validar conflito de horários
    - [ ] Validar horário de trabalho do profissional
    - [ ] Validar antecedência mínima/máxima
    - [ ] Validar bloqueios de agenda
    - [ ] Validar feriados
    - [ ] Validar se profissional realiza o procedimento

- [ ] **Appointment Controller** (`src/controller/appointmentController.ts`)
  - [ ] `create(req, res)`
  - [ ] `list(req, res)`
  - [ ] `getById(req, res)`
  - [ ] `update(req, res)`
  - [ ] `updateStatus(req, res)`
  - [ ] `confirm(req, res)`
  - [ ] `cancel(req, res)`
  - [ ] `getAvailableSlots(req, res)`
  - [ ] `getCalendar(req, res)`

- [ ] **Appointment Routes** (`src/routes/appointmentRoutes.ts`)
  - [ ] POST `/appointments`
  - [ ] GET `/appointments`
  - [ ] GET `/appointments/:id`
  - [ ] PUT `/appointments/:id`
  - [ ] PATCH `/appointments/:id/status`
  - [ ] PATCH `/appointments/:id/confirm`
  - [ ] PATCH `/appointments/:id/cancel`
  - [ ] GET `/appointments/available-slots`
  - [ ] GET `/appointments/calendar`

- [ ] **Testes Críticos**
  - [ ] Criar agendamento válido
  - [ ] Impedir conflito de horários
  - [ ] Impedir agendamento fora do horário de trabalho
  - [ ] Impedir agendamento em bloqueio de agenda
  - [ ] Impedir agendamento em feriado
  - [ ] Calcular horários disponíveis corretamente
  - [ ] Incrementar noShowCount ao marcar NO_SHOW
  - [ ] Criar financialRecord automaticamente

---

## 🎯 FASE 5: ATENDIMENTO (Semana 9-10)

### 5.1 MedicalRecord Module
- [ ] **MedicalRecord Repository** (`src/repository/medicalRecordRepository.ts`)
  - [ ] `create(data)`
  - [ ] `findById(id)`
  - [ ] `findByAppointment(appointmentId)`
  - [ ] `findByPatient(patientId, filters)`
  - [ ] `update(id, data)`

- [ ] **MedicalRecord Service** (`src/service/medicalRecordService.ts`)
  - [ ] `createMedicalRecord(clinicId, data)`
  - [ ] `getMedicalRecordById(id, clinicId)`
  - [ ] `getPatientHistory(patientId, clinicId)`
  - [ ] `updateMedicalRecord(id, clinicId, data)`

- [ ] **MedicalRecord Controller** (`src/controller/medicalRecordController.ts`)
  - [ ] `create(req, res)`
  - [ ] `getById(req, res)`
  - [ ] `getPatientHistory(req, res)`
  - [ ] `update(req, res)`

- [ ] **MedicalRecord Routes** (`src/routes/medicalRecordRoutes.ts`)
  - [ ] POST `/medical-records`
  - [ ] GET `/medical-records/:id`
  - [ ] GET `/medical-records/patient/:patientId`
  - [ ] PUT `/medical-records/:id`

---

## 🎯 FASE 6: FINANCEIRO (Semana 11)

### 6.1 FinancialRecord Module
- [ ] **FinancialRecord Repository** (`src/repository/financialRecordRepository.ts`)
  - [ ] `create(data)`
  - [ ] `findById(id)`
  - [ ] `findMany(clinicId, filters)`
  - [ ] `findByAppointment(appointmentId)`
  - [ ] `update(id, data)`
  - [ ] `updateStatus(id, status)`
  - [ ] `getReports(clinicId, startDate, endDate)`
  - [ ] `getTotalIncome(clinicId, startDate, endDate)`
  - [ ] `getTotalExpense(clinicId, startDate, endDate)`

- [ ] **FinancialRecord Service** (`src/service/financialRecordService.ts`)
  - [ ] `createFinancialRecord(clinicId, data)`
  - [ ] `getFinancialRecords(clinicId, filters)`
  - [ ] `getFinancialRecordById(id, clinicId)`
  - [ ] `updateFinancialRecord(id, clinicId, data)`
  - [ ] `markAsPaid(id, clinicId)`
  - [ ] `getReports(clinicId, startDate, endDate)`

- [ ] **FinancialRecord Controller** (`src/controller/financialRecordController.ts`)
  - [ ] `create(req, res)`
  - [ ] `list(req, res)`
  - [ ] `getById(req, res)`
  - [ ] `update(req, res)`
  - [ ] `markAsPaid(req, res)`
  - [ ] `getReports(req, res)`

- [ ] **FinancialRecord Routes** (`src/routes/financialRecordRoutes.ts`)
  - [ ] POST `/financial-records`
  - [ ] GET `/financial-records`
  - [ ] GET `/financial-records/:id`
  - [ ] PUT `/financial-records/:id`
  - [ ] PATCH `/financial-records/:id/mark-paid`
  - [ ] GET `/financial-records/reports`

---

## 🎯 FASE 7: SUPORTE (Semana 12)

### 7.1 Notification Module
- [ ] **Notification Repository** (`src/repository/notificationRepository.ts`)
  - [ ] `create(data)`
  - [ ] `findById(id)`
  - [ ] `findByUser(userId, filters)`
  - [ ] `markAsRead(id)`
  - [ ] `markAllAsRead(userId)`
  - [ ] `countUnread(userId)`

- [ ] **Notification Service** (`src/service/notificationService.ts`)
  - [ ] `createNotification(data)`
  - [ ] `getUserNotifications(userId, filters)`
  - [ ] `markAsRead(id, userId)`
  - [ ] `markAllAsRead(userId)`
  - [ ] `getUnreadCount(userId)`

- [ ] **Notification Controller** (`src/controller/notificationController.ts`)
  - [ ] `list(req, res)`
  - [ ] `markAsRead(req, res)`
  - [ ] `markAllAsRead(req, res)`
  - [ ] `getUnreadCount(req, res)`

- [ ] **Notification Routes** (`src/routes/notificationRoutes.ts`)
  - [ ] GET `/notifications`
  - [ ] PATCH `/notifications/:id/read`
  - [ ] PATCH `/notifications/mark-all-read`
  - [ ] GET `/notifications/unread-count`

---

### 7.2 Clinic Module
- [ ] **Clinic Repository** (`src/repository/clinicRepository.ts`)
  - [ ] `findById(id)`
  - [ ] `update(id, data)`
  - [ ] **Settings:**
    - [ ] `getSettings(clinicId)`
    - [ ] `updateSettings(clinicId, data)`
  - [ ] **Working Hours:**
    - [ ] `setWorkingHours(clinicId, workingHours[])`
    - [ ] `getWorkingHours(clinicId)`
  - [ ] **Holidays:**
    - [ ] `createHoliday(data)`
    - [ ] `getHolidays(clinicId, year?)`
    - [ ] `deleteHoliday(id)`

- [ ] **Clinic Service** (`src/service/clinicService.ts`)
  - [ ] `getClinic(clinicId)`
  - [ ] `updateClinic(clinicId, data)`
  - [ ] `updateSettings(clinicId, data)`
  - [ ] `setWorkingHours(clinicId, workingHours)`
  - [ ] `manageHolidays(clinicId, holidays)`

- [ ] **Clinic Controller** (`src/controller/clinicController.ts`)
  - [ ] `get(req, res)`
  - [ ] `update(req, res)`
  - [ ] `updateSettings(req, res)`
  - [ ] `setWorkingHours(req, res)`
  - [ ] `createHoliday(req, res)`
  - [ ] `listHolidays(req, res)`
  - [ ] `deleteHoliday(req, res)`

- [ ] **Clinic Routes** (`src/routes/clinicRoutes.ts`)
  - [ ] GET `/clinic`
  - [ ] PUT `/clinic`
  - [ ] PUT `/clinic/settings`
  - [ ] POST `/clinic/working-hours`
  - [ ] POST `/clinic/holidays`
  - [ ] GET `/clinic/holidays`
  - [ ] DELETE `/clinic/holidays/:id`

---

### 7.3 AuditLog Module (Opcional)
- [ ] **Audit Middleware** (`src/middlewares/auditMiddleware.ts`)
  - [ ] Interceptar requisições
  - [ ] Logar ações importantes
  - [ ] Salvar IP, user-agent, etc

- [ ] **AuditLog Repository** (`src/repository/auditLogRepository.ts`)
  - [ ] `create(data)`
  - [ ] `findMany(clinicId, filters)`

- [ ] **AuditLog Service** (`src/service/auditLogService.ts`)
  - [ ] `log(action, userId, resource, data)`
  - [ ] `getLogs(clinicId, filters)`

---

## 🔗 INTEGRAÇÃO FINAL

### Setup do Server
- [ ] **server.ts**
  - [ ] Configurar Express
  - [ ] Aplicar middlewares globais (cors, json, etc)
  - [ ] Importar todas as rotas
  - [ ] Aplicar error middleware
  - [ ] Iniciar servidor

- [ ] **routes/index.ts**
  - [ ] Importar todas as rotas
  - [ ] Agrupar com prefixos (/api/v1)

```typescript
// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import patientRoutes from './patientRoutes';
// ... outros

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/patients', patientRoutes);
// ... outros

export default router;
```

```typescript
// src/server.ts
import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', routes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

---

## 📊 PROGRESSO GERAL

**Fase 1 - Fundação:** [ ] 0/2 módulos
**Fase 2 - Recursos Base:** [ ] 0/2 módulos  
**Fase 3 - Atores Principais:** [ ] 0/2 módulos
**Fase 4 - Agendamentos:** [ ] 0/1 módulo
**Fase 5 - Atendimento:** [ ] 0/1 módulo
**Fase 6 - Financeiro:** [ ] 0/1 módulo
**Fase 7 - Suporte:** [ ] 0/3 módulos

**TOTAL:** 0/12 módulos concluídos

---

## 🎯 PRÓXIMA TAREFA

**Comece por aqui:**
1. ✅ Criar estrutura de pastas
2. ✅ Implementar classes de erro (utils/errors.ts)
3. ✅ Implementar Auth Module (PRIORIDADE!)

**Boa sorte! 🚀**
