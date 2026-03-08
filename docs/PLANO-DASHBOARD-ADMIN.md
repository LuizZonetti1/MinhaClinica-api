# Plano de Implementação — Dashboard do Admin

## 1. O que o frontend precisa

Com base na tela enviada, o dashboard precisa de **4 cards** e **1 gráfico**:

| Card                 | Dado                                          | Origem                                               |
| -------------------- | --------------------------------------------- | ---------------------------------------------------- |
| Total de Pacientes   | Pacientes com ao menos 1 consulta na clínica | `Appointment` → `patientId` distintos           |
| Consultas Hoje       | Agendamentos com `appointmentDate` = hoje   | `Appointment.appointmentDate`                      |
| Profissionais Ativos | Profissionais que trabalham hoje              | `ProfessionalWorkingHours` + bloqueios             |
| Receita Mensal       | Soma das receitas pagas no mês atual         | `FinancialRecord` (`type: INCOME, status: PAID`) |

Mais **1 endpoint de histórico** para o gráfico de linha (receitas mês a mês).

---

## 2. O banco de dados precisa mudar?

**Não.** O schema atual já tem tudo necessário. Abaixo está o mapeamento de cada dado:

### Card 1 — Total de Pacientes

```
Tabela: appointments
Lógica: SELECT COUNT(DISTINCT patientId)
        WHERE clinicId = :id
        AND status NOT IN ('CANCELLED')
```

> **Por quê appointments e não patients?**
> Um `Patient` pode existir no sistema sem nunca ter consultado nessa clínica
> (o `clinicId` do paciente pode ser nulo no registro). A consulta é o vínculo real
> com a clínica.

### Card 2 — Consultas Hoje

```
Tabela: appointments
Lógica: SELECT COUNT(*)
        WHERE clinicId = :id
        AND appointmentDate >= início_do_dia
        AND appointmentDate <= fim_do_dia
        AND status NOT IN ('CANCELLED')
```

> **Por quê usar range de datas e não igualdade?**
> O campo `appointmentDate` é `DateTime` no PostgreSQL. Dependendo do timezone,
> meia-noite pode virar o dia anterior em UTC. Usar `gte` / `lte` com
> `startOf('day')` e `endOf('day')` via dayjs resolve isso de forma segura.

### Card 3 — Profissionais Ativos Hoje

```
Tabelas: professionals + professional_working_hours + professional_schedule_blocks
Lógica:
  1. Pegar o dia da semana atual (ex: "WEDNESDAY")
  2. Buscar professionals WHERE isActive = true AND clinicId = :id
     que possuem professional_working_hours com dayOfWeek = hoje AND isWorking = true
  3. Subtrair os que têm professional_schedule_blocks cobrindo hoje (férias/bloqueio)
```

### Card 4 — Receita Mensal + Histórico

```
Tabela: financial_records
Lógica card:    SUM(amount) WHERE type = 'INCOME' AND paymentStatus = 'PAID'
                AND referenceDate entre início e fim do mês atual
Lógica gráfico: GROUP BY mês/ano, SUM(amount) para os últimos N meses
                (ex: últimos 6 meses)
```

---

## 3. Dependência nova: dayjs

O projeto **não usa timezone** atualmente. Receitas e agendamentos são gravados
sem ajuste, mas ao **ler** a data de hoje para comparar com o banco, precisamos
garantir que estamos comparando no fuso correto (`America/Sao_Paulo`).

### Instalação

```bash
npm install dayjs
npm install dayjs-plugin-utc  # não precisa — dayjs tem timezone nativo
```

O dayjs **já tem seus próprios tipos TypeScript** — não precisa de `@types/dayjs`.

### Uso necessário

```typescript
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

// Hoje no timezone da clínica
const start = dayjs().tz("America/Sao_Paulo").startOf("day").toDate();
const end   = dayjs().tz("America/Sao_Paulo").endOf("day").toDate();

// Dia da semana para profissionais ativos
// dayjs retorna: "Monday", "Tuesday"... → uppercase → bate com o enum DayOfWeek
const dow = dayjs().tz("America/Sao_Paulo").format("dddd").toUpperCase();
// Ex: "WEDNESDAY"
```

---

## 4. Arquitetura — Camadas

O projeto segue o padrão `Route → Controller → Service → Repository → Prisma`.
Cada funcionalidade **nova** deve respeitar essa sequência. Nada pula camada.

```
Cliente (frontend)
      │
      ▼
[ Route ]  ← define o verbo HTTP, path e middlewares (auth, checkRole, validate)
      │
      ▼
[ Controller ]  ← recebe req/res, extrai dados, chama Service, devolve JSON
      │
      ▼
[ Service ]  ← regra de negócio, validações, orquestra chamadas
      │
      ▼
[ Repository ]  ← única camada que fala com o Prisma
      │
      ▼
[ Prisma / PostgreSQL ]
```

---

## 5. Arquivos a criar

### 5.1 Repositories

#### `src/repository/appointmentRepository.ts`

```typescript
// Métodos:
countTodayByClinic(clinicId: string): Promise<number>
  // WHERE clinicId = X AND appointmentDate BETWEEN startOfDay AND endOfDay
  // AND status NOT IN [CANCELLED]

countUniquePatientsWithAppointments(clinicId: string): Promise<number>
  // SELECT COUNT(DISTINCT patientId) WHERE clinicId = X AND status != CANCELLED

listByClinic(clinicId: string, filters: AppointmentFilters): Promise<Appointment[]>
  // Listagem paginada com filtros opcionais (data, status, professionalId, patientId)
  // Usado pelas telas de agenda e recepção — não só pelo dashboard

findById(clinicId: string, appointmentId: string): Promise<Appointment | null>
  // Busca um agendamento garantindo que pertence à clínica (segurança multi-tenant)
```

#### `src/repository/revenueRepository.ts`

```typescript
// Métodos:
create(data: CreateRevenueData): Promise<FinancialRecord>
  // Cria um FinancialRecord com type = INCOME

listByClinic(clinicId: string, filters: RevenueFilters): Promise<FinancialRecord[]>
  // Listagem paginada: filtros de data, paymentStatus, categoria

sumCurrentMonth(clinicId: string): Promise<number>
  // SUM(amount) WHERE type=INCOME AND paymentStatus=PAID
  // AND referenceDate BETWEEN início e fim do mês atual

getHistorical(clinicId: string, months: number): Promise<MonthlyRevenue[]>
  // Retorna array de { year, month, label, total }
  // para os últimos `months` meses (ex: 6)
  // Usa Prisma groupBy ou query raw

findById(clinicId: string, id: string): Promise<FinancialRecord | null>
```

#### Extensão de `src/repository/clinicRepository.ts` (ou novo `professionalRepository.ts`)

```typescript
// Método a adicionar:
countActiveProfessionalsToday(clinicId: string): Promise<number>
  // 1. Pega dayOfWeek de hoje
  // 2. COUNT professionals WHERE isActive=true AND clinicId=X
  //    E tem working_hours com dayOfWeek=hoje AND isWorking=true
  //    E NÃO tem schedule_block cobrindo hoje (NOT EXISTS)
```

### 5.2 Services

#### `src/services/appointments/appointmentService.ts`

```typescript
// Regras de negócio ao criar um agendamento:
// - Verificar se professionalId pertence à clínica
// - Verificar se patientId pertence à clínica
// - Verificar conflito de horário (não deixar dois no mesmo slot)
// - Verificar se o profissional trabalha no dia escolhido
// - Verificar se não há schedule_block no dia
// - Definir createdBy = userId do token

class CreateAppointmentService { execute(clinicId, userId, data) }
class ListAppointmentsService  { execute(clinicId, role, userId, filters) }
class GetAppointmentService    { execute(clinicId, appointmentId) }
```

#### `src/services/revenues/revenueService.ts`

```typescript
// Regras de negócio:
// - type é sempre INCOME (despesas ficam para outro service)
// - Se vier appointmentId, verificar que pertence à clínica
// - Se vier patientId, verificar que pertence à clínica
// - amount deve ser > 0

class CreateRevenueService      { execute(clinicId, userId, data) }
class ListRevenuesService       { execute(clinicId, filters) }
class GetRevenueHistoricalService { execute(clinicId, months: number) }
```

#### `src/services/dashboard/dashboardService.ts`

```typescript
// Orquestra tudo em paralelo:
class GetDashboardSummaryService {
  async execute(clinicId: string) {
    const [totalPatients, todayAppointments, activeProfessionals, monthRevenue] =
      await Promise.all([
        appointmentRepo.countUniquePatientsWithAppointments(clinicId),
        appointmentRepo.countTodayByClinic(clinicId),
        professionalRepo.countActiveProfessionalsToday(clinicId),
        revenueRepo.sumCurrentMonth(clinicId),
      ]);

    return { totalPatients, todayAppointments, activeProfessionals, monthRevenue };
  }
}
```

### 5.3 Controllers

#### `src/controller/appointmentController.ts`

```typescript
class AppointmentController {
  async create(req, res)  // POST /api/appointments
  async list(req, res)    // GET  /api/appointments
  async getById(req, res) // GET  /api/appointments/:id
}
```

#### `src/controller/revenueController.ts`

```typescript
class RevenueController {
  async create(req, res)          // POST /api/revenues
  async list(req, res)            // GET  /api/revenues
  async getHistorical(req, res)   // GET  /api/revenues/historical
}
```

#### `src/controller/dashboardController.ts`

```typescript
class DashboardController {
  async getSummary(req, res)  // GET /api/dashboard/summary
}
```

### 5.4 Schemas Yup (validação do body)

#### `src/schemas/appointmentSchema.ts`

```typescript
// createAppointmentSchema:
// - patientId: string uuid, obrigatório
// - professionalId: string uuid, obrigatório
// - procedureId: string uuid, obrigatório
// - appointmentDate: date, obrigatório, >= hoje
// - startTime: string HH:MM, obrigatório
// - channel: enum AppointmentChannel, obrigatório
// - notes: string, opcional
```

#### `src/schemas/revenueSchema.ts`

```typescript
// createRevenueSchema:
// - amount: number, obrigatório, > 0
// - description: string, obrigatório
// - category: string, opcional
// - paymentMethod: enum PaymentMethod, opcional
// - paymentStatus: enum PaymentStatus, default PENDING
// - referenceDate: date, obrigatório
// - dueDate: date, opcional
// - appointmentId: string uuid, opcional
// - patientId: string uuid, opcional
// - notes: string, opcional
```

### 5.5 Routes

#### `src/routes/appointment.routes.ts`

```typescript
POST  /api/appointments          authMiddleware + checkRole(ADMIN, RECEPTIONIST)
GET   /api/appointments          authMiddleware + checkRole(ADMIN, RECEPTIONIST, PROFESSIONAL)
GET   /api/appointments/:id      authMiddleware + checkRole(ADMIN, RECEPTIONIST, PROFESSIONAL)
```

#### `src/routes/revenue.routes.ts`

```typescript
POST  /api/revenues              authMiddleware + checkRole(ADMIN, RECEPTIONIST)
GET   /api/revenues              authMiddleware + checkRole(ADMIN, RECEPTIONIST)
GET   /api/revenues/historical   authMiddleware + checkRole(ADMIN)
//    ↑ Atenção: /historical ANTES de /:id para não ser capturado como parâmetro
```

#### `src/routes/dashboard.routes.ts`

```typescript
GET   /api/dashboard/summary     authMiddleware + checkRole(ADMIN, RECEPTIONIST)
```

#### Atualizar `src/routes/index.ts`

```typescript
import appointmentRoutes from "./appointment.routes";
import dashboardRoutes   from "./dashboard.routes";
import revenueRoutes     from "./revenue.routes";

routes.use("/appointments", appointmentRoutes);
routes.use("/revenues",     revenueRoutes);
routes.use("/dashboard",    dashboardRoutes);
```

---

## 6. Resposta esperada dos endpoints

### `GET /api/dashboard/summary`

```json
{
  "totalPatients": 247,
  "todayAppointments": 32,
  "activeProfessionals": 15,
  "monthRevenue": 42350.00
}
```

### `POST /api/revenues`

**Body:**

```json
{
  "amount": 350.00,
  "description": "Consulta Cardiológica — Pedro Almeida",
  "category": "Consulta",
  "paymentMethod": "PIX",
  "paymentStatus": "PAID",
  "referenceDate": "2026-03-04",
  "appointmentId": "uuid-opcional",
  "patientId": "uuid-opcional"
}
```

**Resposta 201:**

```json
{
  "id": "uuid",
  "clinicId": "uuid",
  "type": "INCOME",
  "amount": "350.00",
  "description": "Consulta Cardiológica — Pedro Almeida",
  "paymentStatus": "PAID",
  "createdAt": "2026-03-04T10:00:00.000Z"
}
```

### `GET /api/revenues/historical?months=6`

```json
{
  "historical": [
    { "year": 2025, "month": 9,  "label": "Set/25", "total": 28400.00 },
    { "year": 2025, "month": 10, "label": "Out/25", "total": 31200.00 },
    { "year": 2025, "month": 11, "label": "Nov/25", "total": 29800.00 },
    { "year": 2025, "month": 12, "label": "Dez/25", "total": 35600.00 },
    { "year": 2026, "month": 1,  "label": "Jan/26", "total": 38900.00 },
    { "year": 2026, "month": 2,  "label": "Fev/26", "total": 42350.00 }
  ]
}
```

---

## 7. Fluxo de implementação (ordem recomendada)

```
Passo 1 — AppointmentRepository
  ↳ Testar as queries no Prisma Studio antes de qualquer código

Passo 2 — RevenueRepository
  ↳ Focar primeiro no create() e sumCurrentMonth()
  ↳ getHistorical() por último (mais complexo, usa groupBy)

Passo 3 — Extensão do ProfessionalRepository
  ↳ countActiveProfessionalsToday() com a lógica de dayjs

Passo 4 — DashboardService
  ↳ Apenas instancia os repositories e chama Promise.all
  ↳ Nenhuma regra de negócio aqui

Passo 5 — DashboardController + dashboard.routes.ts
  ↳ Testar: GET /api/dashboard/summary com token de admin no Insomnia

Passo 6 — AppointmentSchema + AppointmentService + AppointmentController
  ↳ Implementar na ordem: schema → service → controller

Passo 7 — appointment.routes.ts
  ↳ Testar: POST + GET no Insomnia

Passo 8 — RevenueSchema + RevenueService + RevenueController
  ↳ Implementar: POST /revenues → GET /revenues → GET /revenues/historical

Passo 9 — revenue.routes.ts
  ↳ Atenção: registrar /historical ANTES de /:id no mesmo router

Passo 10 — Atualizar src/routes/index.ts
  ↳ Registrar as 3 novas rotas

Passo 11 — Reexecutar seed e validar todos os endpoints
```

---

## 8. Armadilhas comuns a evitar

| Situação                            | Problema                                               | Solução                                                                |
| ------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Busca de "hoje" sem timezone          | Meia-noite UTC ≠ meia-noite BRT, dados do dia errados | `dayjs().tz("America/Sao_Paulo").startOf("day")`                       |
| Rota `/historical` após `/:id`   | Express interpreta "historical" como um id             | Declarar `/historical` primeiro no router                              |
| Receita sem `clinicId`              | Vazamento entre tenants                                | Sempre pegar `clinicId` do token JWT (`req.clinicId`), nunca do body |
| `groupBy` do Prisma com `Decimal` | `sum` retorna `Prisma.Decimal`, não `number`    | Converter com `Number(result._sum.amount ?? 0)`                        |
| Profissional com bloqueio de agenda   | `countActiveProfessionalsToday` ignora férias       | Adicionar `NOT EXISTS` na query de schedule_blocks                     |
| Múltiplas queries no dashboard       | Tempo de resposta alto se feitas em série             | Usar `Promise.all` no DashboardService                                 |
