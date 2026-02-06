# Guia de Desenvolvimento Backend - MinhaClínica API

## 📋 Índice
1. [Arquitetura da Aplicação](#arquitetura)
2. [Responsabilidades de Cada Camada](#responsabilidades)
3. [Ordem de Implementação](#ordem-de-implementação)
4. [Templates de Código](#templates)
5. [Checklist de Módulos](#checklist)
6. [Padrões e Convenções](#padrões)

---

## 🏗️ Arquitetura da Aplicação {#arquitetura}

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────┐
│   Router    │ ← Define rotas e métodos HTTP
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Middleware  │ ← Autenticação, Validação, etc
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │ ← Recebe request, chama service, retorna response
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │ ← Lógica de negócio, regras, validações
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repository  │ ← Acesso ao banco de dados (Prisma)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │
└─────────────┘
```

---

## 🎯 Responsabilidades de Cada Camada {#responsabilidades}

### **Repository** (Acesso aos Dados)
- ✅ Queries diretas ao banco (Prisma)
- ✅ CRUD básico (create, findMany, findById, update, delete)
- ✅ Queries complexas e filtros
- ❌ Lógica de negócio
- ❌ Validações de regras

**Exemplo:**
```typescript
// src/repository/patientRepository.ts
export class PatientRepository {
  async create(data: PatientCreateData) {
    return prisma.patient.create({ data });
  }

  async findById(id: string) {
    return prisma.patient.findUnique({ where: { id } });
  }

  async findByClinicId(clinicId: string) {
    return prisma.patient.findMany({ 
      where: { clinicId, isActive: true },
      include: { user: true }
    });
  }

  async update(id: string, data: PatientUpdateData) {
    return prisma.patient.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.patient.update({ 
      where: { id }, 
      data: { isActive: false } 
    });
  }
}
```

---

### **Service** (Lógica de Negócio)
- ✅ Regras de negócio
- ✅ Validações complexas
- ✅ Orquestração entre múltiplos repositories
- ✅ Transformação de dados
- ✅ Tratamento de erros de negócio
- ❌ Lógica de HTTP (req/res)

**Exemplo:**
```typescript
// src/service/patientService.ts
export class PatientService {
  constructor(
    private patientRepository: PatientRepository,
    private userRepository: UserRepository
  ) {}

  async createPatient(clinicId: string, data: CreatePatientDTO) {
    // Validação 1: CPF único na clínica
    const existingPatient = await this.patientRepository.findByCpf(
      clinicId, 
      data.cpf
    );
    if (existingPatient) {
      throw new BusinessError('CPF já cadastrado nesta clínica');
    }

    // Validação 2: Email único
    const existingUser = await this.userRepository.findByEmail(
      clinicId,
      data.email
    );
    if (existingUser) {
      throw new BusinessError('Email já cadastrado');
    }

    // Regra de negócio: Criar User primeiro, depois Patient
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await this.userRepository.create({
      clinicId,
      name: data.name,
      cpf: data.cpf,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: 'PATIENT',
      status: 'ACTIVE'
    });

    const patient = await this.patientRepository.create({
      clinicId,
      userId: user.id,
      cpf: data.cpf,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      // ... outros campos
    });

    return { user, patient };
  }

  async getActivePatients(clinicId: string, filters?: PatientFilters) {
    // Regra: Retornar apenas pacientes ativos
    return this.patientRepository.findByClinicId(clinicId, {
      isActive: true,
      ...filters
    });
  }
}
```

---

### **Controller** (Camada HTTP)
- ✅ Receber e validar request
- ✅ Chamar service apropriado
- ✅ Formatar e retornar response
- ✅ Tratamento de erros HTTP
- ❌ Lógica de negócio
- ❌ Acesso direto ao banco

**Exemplo:**
```typescript
// src/controller/patientController.ts
export class PatientController {
  constructor(private patientService: PatientService) {}

  async create(req: Request, res: Response) {
    try {
      // Pegar clinicId do token JWT (middleware de auth)
      const { clinicId } = req.user;
      
      // Validar body com Yup
      const schema = yup.object({
        name: yup.string().required(),
        cpf: yup.string().length(11).required(),
        email: yup.string().email().required(),
        // ... outros campos
      });
      
      const validatedData = await schema.validate(req.body);
      
      // Chamar service
      const result = await this.patientService.createPatient(
        clinicId,
        validatedData
      );
      
      // Retornar resposta
      return res.status(201).json({
        message: 'Paciente criado com sucesso',
        data: result
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof BusinessError) {
        return res.status(422).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { clinicId } = req.user;
      const { search, status } = req.query;
      
      const patients = await this.patientService.getActivePatients(
        clinicId,
        { search, status }
      );
      
      return res.json({ data: patients });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar pacientes' });
    }
  }
}
```

---

### **Router** (Rotas)
- ✅ Definir rotas e métodos HTTP
- ✅ Aplicar middlewares (auth, validação, etc)
- ✅ Conectar rotas aos controllers
- ❌ Lógica de negócio

**Exemplo:**
```typescript
// src/routes/patientRoutes.ts
import { Router } from 'express';
import { PatientController } from '../controller/patientController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const router = Router();
const patientController = new PatientController(patientService);

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// POST /patients - Criar paciente (Admin ou Recepcionista)
router.post(
  '/',
  roleMiddleware(['ADMIN', 'RECEPTIONIST']),
  (req, res) => patientController.create(req, res)
);

// GET /patients - Listar pacientes
router.get(
  '/',
  roleMiddleware(['ADMIN', 'RECEPTIONIST', 'PROFESSIONAL']),
  (req, res) => patientController.list(req, res)
);

// GET /patients/:id - Buscar paciente específico
router.get('/:id', (req, res) => patientController.getById(req, res));

// PUT /patients/:id - Atualizar paciente
router.put(
  '/:id',
  roleMiddleware(['ADMIN', 'RECEPTIONIST']),
  (req, res) => patientController.update(req, res)
);

// DELETE /patients/:id - Desativar paciente (soft delete)
router.delete(
  '/:id',
  roleMiddleware(['ADMIN']),
  (req, res) => patientController.delete(req, res)
);

export default router;
```

---

## 📝 Ordem de Implementação {#ordem-de-implementação}

### **Fase 1: Fundação (Semana 1-2)**

#### 1. **Auth Module** (Primeiro!)
- **Por quê primeiro?** Autenticação é necessária para todas as outras rotas
- **Repository:** `authRepository.ts`
- **Service:** `authService.ts`
- **Controller:** `authController.ts`
- **Routes:** `authRoutes.ts`
- **Funcionalidades:**
  - ✅ POST `/auth/login` - Login
  - ✅ POST `/auth/register` - Primeiro cadastro (Admin)
  - ✅ POST `/auth/refresh` - Refresh token
  - ✅ POST `/auth/forgot-password` - Esqueci senha
  - ✅ POST `/auth/reset-password` - Resetar senha
  - ✅ GET `/auth/me` - Dados do usuário logado

#### 2. **User Module**
- **Por quê?** Base para Professional e Patient
- **Repository:** `userRepository.ts`
- **Service:** `userService.ts`
- **Controller:** `userController.ts`
- **Routes:** `userRoutes.ts`
- **Funcionalidades:**
  - ✅ GET `/users` - Listar usuários
  - ✅ GET `/users/:id` - Buscar usuário
  - ✅ PUT `/users/:id` - Atualizar usuário
  - ✅ PATCH `/users/:id/status` - Mudar status
  - ✅ PATCH `/users/:id/password` - Trocar senha

---

### **Fase 2: Recursos Base (Semana 3-4)**

#### 3. **Specialty Module**
- **Por quê?** Simples e necessário para Professional
- **Repository:** `specialtyRepository.ts`
- **Service:** `specialtyService.ts`
- **Controller:** `specialtyController.ts`
- **Routes:** `specialtyRoutes.ts`
- **Funcionalidades:**
  - ✅ POST `/specialties` - Criar especialidade
  - ✅ GET `/specialties` - Listar especialidades
  - ✅ GET `/specialties/:id` - Buscar especialidade
  - ✅ PUT `/specialties/:id` - Atualizar especialidade
  - ✅ DELETE `/specialties/:id` - Desativar especialidade

#### 4. **Procedure Module**
- **Por quê?** Simples e necessário para Appointments
- **Repository:** `procedureRepository.ts`
- **Service:** `procedureService.ts`
- **Controller:** `procedureController.ts`
- **Routes:** `procedureRoutes.ts`
- **Funcionalidades:**
  - ✅ POST `/procedures` - Criar procedimento
  - ✅ GET `/procedures` - Listar procedimentos
  - ✅ GET `/procedures/:id` - Buscar procedimento
  - ✅ PUT `/procedures/:id` - Atualizar procedimento
  - ✅ DELETE `/procedures/:id` - Desativar procedimento

---

### **Fase 3: Atores Principais (Semana 5-6)**

#### 5. **Professional Module**
- **Dependências:** User, Specialty
- **Repository:** `professionalRepository.ts`
- **Service:** `professionalService.ts`
- **Controller:** `professionalController.ts`
- **Routes:** `professionalRoutes.ts`
- **Funcionalidades:**
  - ✅ POST `/professionals` - Criar profissional
  - ✅ GET `/professionals` - Listar profissionais
  - ✅ GET `/professionals/:id` - Buscar profissional
  - ✅ PUT `/professionals/:id` - Atualizar profissional
  - ✅ POST `/professionals/:id/specialties` - Vincular especialidade
  - ✅ DELETE `/professionals/:id/specialties/:specialtyId` - Remover especialidade
  - ✅ POST `/professionals/:id/working-hours` - Definir horário
  - ✅ POST `/professionals/:id/procedures` - Vincular procedimentos
  - ✅ POST `/professionals/:id/schedule-blocks` - Bloquear agenda

#### 6. **Patient Module**
- **Dependências:** User
- **Repository:** `patientRepository.ts`
- **Service:** `patientService.ts`
- **Controller:** `patientController.ts`
- **Routes:** `patientRoutes.ts`
- **Funcionalidades:**
  - ✅ POST `/patients` - Criar paciente
  - ✅ GET `/patients` - Listar pacientes
  - ✅ GET `/patients/:id` - Buscar paciente
  - ✅ PUT `/patients/:id` - Atualizar paciente
  - ✅ DELETE `/patients/:id` - Desativar paciente
  - ✅ GET `/patients/search` - Buscar por CPF/nome/telefone

---

### **Fase 4: Agendamentos (Semana 7-8)**

#### 7. **Appointment Module** (COMPLEXO!)
- **Dependências:** Patient, Professional, Procedure
- **Repository:** `appointmentRepository.ts`
- **Service:** `appointmentService.ts`
- **Controller:** `appointmentController.ts`
- **Routes:** `appointmentRoutes.ts`
- **Funcionalidades:**
  - ✅ POST `/appointments` - Criar agendamento
  - ✅ GET `/appointments` - Listar agendamentos (com filtros)
  - ✅ GET `/appointments/:id` - Buscar agendamento
  - ✅ PUT `/appointments/:id` - Atualizar agendamento
  - ✅ PATCH `/appointments/:id/status` - Mudar status
  - ✅ PATCH `/appointments/:id/confirm` - Confirmar agendamento
  - ✅ PATCH `/appointments/:id/cancel` - Cancelar agendamento
  - ✅ GET `/appointments/available-slots` - Horários disponíveis
  - ✅ GET `/appointments/calendar` - Visão de calendário

**⚠️ Regras de Negócio Importantes:**
- Validar conflito de horários
- Validar horário de trabalho do profissional
- Validar antecedência mínima/máxima
- Validar bloqueios de agenda
- Validar feriados
- Incrementar noShowCount se status = NO_SHOW
- Criar financial record automaticamente

---

### **Fase 5: Atendimento (Semana 9-10)**

#### 8. **MedicalRecord Module**
- **Dependências:** Appointment, Patient, Professional
- **Repository:** `medicalRecordRepository.ts`
- **Service:** `medicalRecordService.ts`
- **Controller:** `medicalRecordController.ts`
- **Routes:** `medicalRecordRoutes.ts`
- **Funcionalidades:**
  - ✅ POST `/medical-records` - Criar prontuário
  - ✅ GET `/medical-records/patient/:patientId` - Histórico do paciente
  - ✅ GET `/medical-records/:id` - Buscar prontuário
  - ✅ PUT `/medical-records/:id` - Atualizar prontuário
  - ✅ GET `/medical-records/:id/attachments` - Anexos

---

### **Fase 6: Financeiro (Semana 11)**

#### 9. **FinancialRecord Module**
- **Dependências:** Appointment, Patient
- **Repository:** `financialRecordRepository.ts`
- **Service:** `financialRecordService.ts`
- **Controller:** `financialRecordController.ts`
- **Routes:** `financialRecordRoutes.ts`
- **Funcionalidades:**
  - ✅ POST `/financial-records` - Criar registro financeiro
  - ✅ GET `/financial-records` - Listar registros (com filtros)
  - ✅ GET `/financial-records/:id` - Buscar registro
  - ✅ PATCH `/financial-records/:id/status` - Marcar como pago
  - ✅ GET `/financial-records/reports` - Relatórios financeiros

---

### **Fase 7: Suporte (Semana 12)**

#### 10. **Notification Module**
- **Repository:** `notificationRepository.ts`
- **Service:** `notificationService.ts`
- **Controller:** `notificationController.ts`
- **Routes:** `notificationRoutes.ts`
- **Funcionalidades:**
  - ✅ GET `/notifications` - Listar notificações do usuário
  - ✅ PATCH `/notifications/:id/read` - Marcar como lida
  - ✅ PATCH `/notifications/read-all` - Marcar todas como lidas

#### 11. **Clinic Module**
- **Repository:** `clinicRepository.ts`
- **Service:** `clinicService.ts`
- **Controller:** `clinicController.ts`
- **Routes:** `clinicRoutes.ts`
- **Funcionalidades:**
  - ✅ GET `/clinic` - Dados da clínica
  - ✅ PUT `/clinic` - Atualizar dados
  - ✅ PUT `/clinic/settings` - Atualizar configurações
  - ✅ POST `/clinic/working-hours` - Definir horário
  - ✅ POST `/clinic/holidays` - Cadastrar feriados

---

## 📦 Templates de Código {#templates}

### Template: Repository

```typescript
// src/repository/[MODULE]Repository.ts
import { prisma } from '../database/prisma';

export class [Module]Repository {
  async create(data: Create[Module]Data) {
    return prisma.[module].create({ data });
  }

  async findById(id: string) {
    return prisma.[module].findUnique({ 
      where: { id },
      include: {
        // relacionamentos necessários
      }
    });
  }

  async findMany(clinicId: string, filters?: Filters) {
    return prisma.[module].findMany({
      where: {
        clinicId,
        ...filters
      },
      include: {
        // relacionamentos necessários
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, data: Update[Module]Data) {
    return prisma.[module].update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    // Soft delete
    return prisma.[module].update({
      where: { id },
      data: { isActive: false }
    });
  }

  async count(clinicId: string, filters?: Filters) {
    return prisma.[module].count({
      where: {
        clinicId,
        ...filters
      }
    });
  }
}
```

### Template: Service

```typescript
// src/service/[MODULE]Service.ts
import { [Module]Repository } from '../repository/[module]Repository';

export class [Module]Service {
  constructor(
    private [module]Repository: [Module]Repository
    // outros repositories necessários
  ) {}

  async create[Module](clinicId: string, data: Create[Module]DTO) {
    // 1. Validações de negócio
    // 2. Verificações de duplicidade
    // 3. Transformações de dados
    // 4. Interação com outros services/repositories
    // 5. Criar registro
    // 6. Retornar resultado
  }

  async get[Module]s(clinicId: string, filters?: Filters) {
    // 1. Aplicar filtros
    // 2. Buscar dados
    // 3. Transformar se necessário
    // 4. Retornar
  }

  async get[Module]ById(id: string, clinicId: string) {
    const [module] = await this.[module]Repository.findById(id);
    
    if (!x) {
      throw new NotFoundError('[Module] não encontrado');
    }
    
    // Verificar se pertence à clínica
    if ([module].clinicId !== clinicId) {
      throw new UnauthorizedError('Acesso negado');
    }
    
    return [module];
  }

  async update[Module](id: string, clinicId: string, data: Update[Module]DTO) {
    // 1. Verificar se existe
    // 2. Verificar permissões
    // 3. Validar dados
    // 4. Atualizar
    // 5. Retornar
  }

  async delete[Module](id: string, clinicId: string) {
    // 1. Verificar se existe
    // 2. Verificar permissões
    // 3. Verificar dependências
    // 4. Soft delete
  }
}
```

### Template: Controller

```typescript
// src/controller/[MODULE]Controller.ts
import { Request, Response } from 'express';
import { [Module]Service } from '../service/[module]Service';
import * as yup from 'yup';

export class [Module]Controller {
  constructor(private [module]Service: [Module]Service) {}

  async create(req: Request, res: Response) {
    try {
      const { clinicId } = req.user;
      
      const schema = yup.object({
        // campos de validação
      });
      
      const validatedData = await schema.validate(req.body);
      
      const result = await this.[module]Service.create[Module](
        clinicId,
        validatedData
      );
      
      return res.status(201).json({
        message: '[Module] criado com sucesso',
        data: result
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { clinicId } = req.user;
      const { page = 1, limit = 10, ...filters } = req.query;
      
      const result = await this.[module]Service.get[Module]s(
        clinicId,
        { page, limit, ...filters }
      );
      
      return res.json(result);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { clinicId } = req.user;
      const { id } = req.params;
      
      const result = await this.[module]Service.get[Module]ById(id, clinicId);
      
      return res.json({ data: result });
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { clinicId } = req.user;
      const { id } = req.params;
      
      const schema = yup.object({
        // campos de validação
      });
      
      const validatedData = await schema.validate(req.body);
      
      const result = await this.[module]Service.update[Module](
        id,
        clinicId,
        validatedData
      );
      
      return res.json({
        message: '[Module] atualizado com sucesso',
        data: result
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { clinicId } = req.user;
      const { id } = req.params;
      
      await this.[module]Service.delete[Module](id, clinicId);
      
      return res.json({ message: '[Module] excluído com sucesso' });
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  private handleError(error: any, res: Response) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof BusinessError) {
      return res.status(422).json({ error: error.message });
    }
    if (error instanceof UnauthorizedError) {
      return res.status(403).json({ error: error.message });
    }
    
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
```

### Template: Routes

```typescript
// src/routes/[MODULE]Routes.ts
import { Router } from 'express';
import { [Module]Controller } from '../controller/[module]Controller';
import { [Module]Service } from '../service/[module]Service';
import { [Module]Repository } from '../repository/[module]Repository';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const router = Router();

// Instanciar dependências
const [module]Repository = new [Module]Repository();
const [module]Service = new [Module]Service([module]Repository);
const [module]Controller = new [Module]Controller([module]Service);

// Aplicar auth em todas as rotas
router.use(authMiddleware);

// Rotas CRUD
router.post(
  '/',
  roleMiddleware(['ADMIN', 'RECEPTIONIST']),
  (req, res) => [module]Controller.create(req, res)
);

router.get(
  '/',
  (req, res) => [module]Controller.list(req, res)
);

router.get(
  '/:id',
  (req, res) => [module]Controller.getById(req, res)
);

router.put(
  '/:id',
  roleMiddleware(['ADMIN', 'RECEPTIONIST']),
  (req, res) => [module]Controller.update(req, res)
);

router.delete(
  '/:id',
  roleMiddleware(['ADMIN']),
  (req, res) => [module]Controller.delete(req, res)
);

export default router;
```

---

## ✅ Checklist Completo de Módulos {#checklist}

### **Fase 1: Fundação**
- [ ] **Auth Module**
  - [ ] Repository (authRepository.ts)
  - [ ] Service (authService.ts)
  - [ ] Controller (authController.ts)
  - [ ] Routes (authRoutes.ts)
  - [ ] Middlewares (authMiddleware.ts, roleMiddleware.ts)
  - [ ] Utils (jwt.ts, password.ts)

- [ ] **User Module**
  - [ ] Repository (userRepository.ts)
  - [ ] Service (userService.ts)
  - [ ] Controller (userController.ts)
  - [ ] Routes (userRoutes.ts)
  - [ ] DTOs (createUserDTO.ts, updateUserDTO.ts)

### **Fase 2: Recursos Base**
- [ ] **Specialty Module**
  - [ ] Repository (specialtyRepository.ts)
  - [ ] Service (specialtyService.ts)
  - [ ] Controller (specialtyController.ts)
  - [ ] Routes (specialtyRoutes.ts)

- [ ] **Procedure Module**
  - [ ] Repository (procedureRepository.ts)
  - [ ] Service (procedureService.ts)
  - [ ] Controller (procedureController.ts)
  - [ ] Routes (procedureRoutes.ts)

### **Fase 3: Atores Principais**
- [ ] **Professional Module**
  - [ ] Repository (professionalRepository.ts)
  - [ ] Service (professionalService.ts)
  - [ ] Controller (professionalController.ts)
  - [ ] Routes (professionalRoutes.ts)
  - [ ] Sub-módulos:
    - [ ] ProfessionalSpecialty (vincular especialidades)
    - [ ] ProfessionalWorkingHours (horários)
    - [ ] ProfessionalScheduleBlock (bloqueios)
    - [ ] ProfessionalProcedure (procedimentos)

- [ ] **Patient Module**
  - [ ] Repository (patientRepository.ts)
  - [ ] Service (patientService.ts)
  - [ ] Controller (patientController.ts)
  - [ ] Routes (patientRoutes.ts)

### **Fase 4: Agendamentos**
- [ ] **Appointment Module** ⚠️ COMPLEXO
  - [ ] Repository (appointmentRepository.ts)
  - [ ] Service (appointmentService.ts)
  - [ ] Controller (appointmentController.ts)
  - [ ] Routes (appointmentRoutes.ts)
  - [ ] Utils:
    - [ ] availableSlotsService.ts
    - [ ] appointmentValidation.ts

### **Fase 5: Atendimento**
- [ ] **MedicalRecord Module**
  - [ ] Repository (medicalRecordRepository.ts)
  - [ ] Service (medicalRecordService.ts)
  - [ ] Controller (medicalRecordController.ts)
  - [ ] Routes (medicalRecordRoutes.ts)

### **Fase 6: Financeiro**
- [ ] **FinancialRecord Module**
  - [ ] Repository (financialRecordRepository.ts)
  - [ ] Service (financialRecordService.ts)
  - [ ] Controller (financialRecordController.ts)
  - [ ] Routes (financialRecordRoutes.ts)
  - [ ] Utils:
    - [ ] financialReportsService.ts

### **Fase 7: Suporte**
- [ ] **Notification Module**
  - [ ] Repository (notificationRepository.ts)
  - [ ] Service (notificationService.ts)
  - [ ] Controller (notificationController.ts)
  - [ ] Routes (notificationRoutes.ts)

- [ ] **Clinic Module**
  - [ ] Repository (clinicRepository.ts)
  - [ ] Service (clinicService.ts)
  - [ ] Controller (clinicController.ts)
  - [ ] Routes (clinicRoutes.ts)
  - [ ] Sub-módulos:
    - [ ] ClinicSettings
    - [ ] ClinicWorkingHours
    - [ ] ClinicHoliday

- [ ] **AuditLog Module** (Opcional)
  - [ ] Repository (auditLogRepository.ts)
  - [ ] Service (auditLogService.ts)
  - [ ] Middleware (auditMiddleware.ts)

---

## 📐 Padrões e Convenções {#padrões}

### **Nomenclatura**
- **Arquivos:** camelCase (userService.ts, patientRepository.ts)
- **Classes:** PascalCase (UserService, PatientRepository)
- **Métodos:** camelCase (createUser, findById)
- **Constantes:** UPPER_SNAKE_CASE (MAX_LOGIN_ATTEMPTS)

### **Estrutura de Pastas**
```
src/
├── controller/
│   ├── authController.ts
│   ├── userController.ts
│   ├── patientController.ts
│   └── ...
├── service/
│   ├── authService.ts
│   ├── userService.ts
│   ├── patientService.ts
│   └── ...
├── repository/
│   ├── authRepository.ts
│   ├── userRepository.ts
│   ├── patientRepository.ts
│   └── ...
├── routes/
│   ├── index.ts (agrupa todas as rotas)
│   ├── authRoutes.ts
│   ├── userRoutes.ts
│   ├── patientRoutes.ts
│   └── ...
├── middlewares/
│   ├── authMiddleware.ts
│   ├── roleMiddleware.ts
│   ├── validationMiddleware.ts
│   └── errorMiddleware.ts
├── utils/
│   ├── jwt.ts
│   ├── password.ts
│   ├── validators.ts
│   └── errors.ts
├── @types/
│   ├── express.d.ts
│   ├── dtos.ts
│   └── ...
├── database/
│   ├── prisma.ts
│   └── seed.ts
└── server.ts (ponto de entrada)
```

### **Padrão de Resposta da API**

**Sucesso:**
```json
{
  "message": "Operação realizada com sucesso",
  "data": { ... }
}
```

**Erro:**
```json
{
  "error": "Descrição do erro"
}
```

**Lista com paginação:**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

### **Códigos HTTP**
- `200 OK` - Sucesso em GET, PUT, PATCH
- `201 Created` - Sucesso em POST
- `204 No Content` - Sucesso em DELETE
- `400 Bad Request` - Erro de validação
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `422 Unprocessable Entity` - Erro de regra de negócio
- `500 Internal Server Error` - Erro interno

### **Classes de Erro Personalizadas**

```typescript
// src/utils/errors.ts
export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

---

## 🚀 Próximos Passos

1. **Criar estrutura de pastas** (controller, service, repository, routes)
2. **Criar classes de erro** (utils/errors.ts)
3. **Implementar Auth Module** (fundamental!)
4. **Seguir ordem do checklist** fase por fase
5. **Testar cada módulo** antes de avançar
6. **Documentar endpoints** (Postman/Swagger)

---

## 💡 Dicas Importantes

### **Multi-tenant**
- ✅ SEMPRE filtrar por `clinicId`
- ✅ Pegar `clinicId` do token JWT no middleware
- ✅ Validar que o recurso pertence à clínica do usuário

### **Soft Delete**
- ✅ Usar `isActive: false` ao invés de deletar
- ✅ Filtrar apenas registros ativos por padrão
- ✅ Ter rota/flag especial para ver inativos

### **Validação**
- ✅ Validar na entrada (Controller) com Yup
- ✅ Validar regras de negócio (Service)
- ✅ Sempre retornar mensagens claras

### **Segurança**
- ✅ NUNCA retornar senha no response
- ✅ Sempre validar permissões
- ✅ Logar todas as operações sensíveis (AuditLog)

### **Performance**
- ✅ Usar `include` do Prisma para evitar N+1
- ✅ Implementar paginação em todas as listagens
- ✅ Criar índices no banco para campos de busca

---

**Boa codificação! 🚀**
