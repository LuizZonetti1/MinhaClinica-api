# Minha Clínica - Guia Técnico de Implementação

## 🎯 Stack do Projeto (Desenvolvedor Solo)

**Contexto:** Projeto pessoal, desenvolvedor full-stack solo, foco em MVP funcional e aprendizado progressivo.

---

## 📦 STACK CORE

### Backend

- **Runtime:** Node.js (v20+ LTS)
- **Linguagem:** TypeScript
- **Framework:** Express.js (simples e direto)
- **Package Manager:** Yarn (v1.22+ ou Yarn Berry)

### Frontend

- **Framework:** React 18+
- **Build Tool:** Vite
- **Linguagem:** TypeScript
- **Package Manager:** Yarn

### Banco de Dados

- **Principal:** PostgreSQL 15+
- **ORM:** Prisma (type-safe, migrations automáticas)

### Code Quality

- **Linter + Formatter:** Biome (substitui ESLint + Prettier)
- ✅ Extremamente rápido (escrito em Rust)
- ✅ Zero configuração
- ✅ Compatível com ESLint/Prettier configs

---

## 🔧 BIBLIOTECAS POR FASE E FUNCIONALIDADE

### FASE 1 - MVP (Essencial para Começar)

#### 🔹 Backend - API REST

##### **Setup Inicial**

```bash
# Inicializar projeto
yarn init -y

# Instalar TypeScript e ferramentas
yarn add -D typescript @types/node ts-node-dev
npx tsc --init
```

##### **Biome - Linter e Formatter**

```bash
# Instalar Biome
yarn add -D @biomejs/biome

# Criar configuração
npx @biomejs/biome init
```

**biome.json** (gerado automaticamente):

```json
{
  "$schema": "https://biomejs.dev/schemas/1.5.3/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

**Adicionar scripts no package.json:**

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "biome lint src/",
    "format": "biome format --write src/",
    "check": "biome check --apply src/"
  }
}
```

##### **Framework Base**

```bash
yarn add express
yarn add -D @types/express
```

- **express**: Framework web minimalista e flexível
- **typescript**: Tipagem estática
- **ts-node-dev**: Desenvolvimento com hot-reload

##### **Validação de Dados**

```bash
yarn add yup
```

- **yup**: Validação de schemas com suporte completo a TypeScript
- ✅ API intuitiva e familiar
- ✅ Validação assíncrona
- ✅ Mensagens de erro customizáveis

**Exemplo:**

```typescript
import * as yup from 'yup';

const createPatientSchema = yup.object({
  name: yup.string().required('Nome é obrigatório').min(3, 'Mínimo 3 caracteres'),
  cpf: yup.string().required('CPF é obrigatório').length(11, 'CPF deve ter 11 dígitos'),
  email: yup.string().required('E-mail é obrigatório').email('E-mail inválido'),
});

// Validar
try {
  const validData = await createPatientSchema.validate(data);
} catch (error) {
  console.log(error.message);
}
```

##### **Banco de Dados**

```bash
npm install @prisma/client
yarn add @prisma/client
yarn add
- **Prisma**: ORM moderno com excelente DX
- ✅ Migrations automáticas
- ✅ Type-safe
- ✅ Studio visual para ver dados

**Comandos importantes:**
```bash
npx prisma init              # Inicializar Prisma
npx prisma migrate dev       # Criar migrations
npx prisma studio            # Interface visual
npx prisma generate          # Gerar types
```

##### **Autenticação**

```bash
yarn add jsonwebtoken bcryptjs
yarn add -D @types/jsonwebtoken @types/bcryptjs
```

- **jsonwebtoken**: Gerar e validar JWT tokens
- **bcryptjs**: Hash de senhas

**Exemplo básico:**

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Hash senha
const hashedPassword = await bcrypt.hash(password, 10);

// Comparar senha
const isValid = await bcrypt.compare(password, hashedPassword);

// Gerar token
const token = jwt.sign({ userId: user.id }, 'SECRET_KEY', { expiresIn: '15m' });

// Validar token
const decoded = jwt.verify(token, 'SECRET_KEY');
```

##### **Variáveis de Ambiente**

```bash
yarn add dotenv
```

- **dotenv**: Carregar variáveis de ambiente do .env

**.env**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/minhaclinica"
JWT_SECRET="seu-secret-super-secreto-aqui"
PORT=3000
```

##### **CORS (importante!)**

```bash
yarn add cors
yarn add -D @types/cors
```

- **cors**: Permitir requisições do frontend (domínio diferente)

```typescript
import cors from 'cors';
app.use(cors({
  origin: 'http://localhost:5173' // URL do Vite
}));
```

##### **Date/Time**

```bash
yarn add date-fns
```

- **date-fns**: Manipulação de datas moderna
- ✅ Mais leve que moment.js
- ✅ Tree-shakeable
- ✅ Imutável

**Exemplo:**

```typescript
import { format, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const hoje = new Date();
const amanha = addDays(hoje, 1);
const dataFormatada = format(hoje, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
```

##### **Utilitários**

```bash
yarn add uuid
yarn add -D @types/uuid
```

- **uuid**: Gerar IDs únicos

---

#### 🔹 Frontend - React + Vite

##### **Setup Inicial**

```bash
# Criar projeto com Vite
yarn create vite minhaclinica-web --template react-ts
cd minhaclinica-web
yarn install

# Instalar Biome
yarn add -D @biomejs/biome
yarn adds/biome init
```

**Adicionar scripts no package.json:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "biome lint src/",
    "format": "biome format --write src/",
    "check": "biome check --apply src/"
  }
}
```

##### **Roteamento**

```bash
npm install react-router-dom
```

- **react-router-dom**: Navegação entre páginas

**Estrutura básica:**
yarn addpt
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    `<BrowserRouter>`
      `<Routes>`
        <Route path="/" element={`<Home />`} />
        <Route path="/login" element={`<Login />`} />
        <Route path="/dashboard" element={`<Dashboard />`} />
        <Route path="/agendamentos" element={`<Agendamentos />`} />
      `</Routes>`
    `</BrowserRouter>`
  );
}

```

##### **Requisições HTTP**
```bash
npm install axios
```

- **axios**: Cliente HTTP mais completo que fetch

**Setup com interceptors:**

```typescript
import axios from 'axios';
yarn add
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

##### **Estado Global (simples)**

```bash
npm install zustand
```

- **zustand**: State management minimalista
- ✅ Mais simples que Redux
- ✅ Menos boilerplate
- ✅ Hooks nativos

**Exemplo:**

```typescript
import { create } from 'zustand';

interface AuthState {
yarn addr | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    set({ user: response.data.user, token: response.data.token });
  },
  logout: () => set({ user: null, token: null }),
}));
```

##### **Formulários**

```bash
npm install react-hook-form yup @hookform/resolvers
```

- **react-hook-form**: Gerenciamento de formulários performático
- **@hookform/resolvers**: Integração com Yup

**Exemplo:**

```typescript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().required('E-mail obrigatório').email('E-mail inválido'),
  password: yup.string().required('Senha obrigatória').min(8, 'Mínimo 8 caracteres'),
});

type FormData = yup.InferType<typeof schema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };
yarn dl
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
    
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
    
      <button type="submit">Entrar</button>
    </form>
  );
}
```

##### **UI Components (Escolha UMA opção)**

**OPÇÃO 1: shadcn/ui (Recomendado para aprendizado)**

```bash
npx shadcn-ui@latest init
```

- ✅ Componentes copiados para seu projeto (você é dono do código)
- ✅ Baseado em Radix UI (acessível)
- ✅ Tailwind CSS
- ✅ Customizável
- ✅ Sem vendor lock-in

**Instalar componentes conforme precisa:**

```bash
yarn dlx shadcn-ui@latest add button
yarn dlx shadcn-ui@latest add input
yarn dlx shadcn-ui@latest add dialog
yarn dlx shadcn-ui@latest add calendar
yarn dlx shadcn-ui@latest add table
```

**OPÇÃO 2: Material-UI (MUI)**

```bash
yarn add @mui/material @emotion/react @emotion/styled
yarn add @mui/x-date-pickers dayjs
```

- ✅ Completo, pronto para usar
- ✅ Bem documentado
- ❌ Bundle maior
- ❌ Menos customizável

**OPÇÃO 3: Ant Design**

```bash
yarn add antd
```

- ✅ Ótimo para dashboards
- ✅ Muitos componentes prontos
- ❌ Design opinativo

**💡 Recomendação para você: shadcn/ui + Tailwind**

- Você aprende mais
- Controle total
- Moderno

##### **Estilização**

```bash
yarn add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js:**

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

##### **Ícones**

```bash
yarn add lucide-react
```

- **lucide-react**: Ícones modernos e leves

**Uso:**

```typescript
import { Calendar, User, Settings } from 'lucide-react';

<Calendar className="w-5 h-5" />
```

##### **Notificações/Toast**

```bash
yarn add react-hot-toast
```

- **react-hot-toast**: Notificações simples e bonitas

**Uso:**

```typescript
import toast from 'react-hot-toast';

toast.success('Agendamento criado!');
toast.error('Erro ao salvar');
toast.loading('Salvando...');
```

##### **Date Picker**

```bash
yarn add react-day-picker date-fns
```

- **react-day-picker**: Calendário/Date picker customizável

---

### FASE 2 - Melhorias e Features Extras

#### Backend

##### **Cache**

```bash
npm install ioredis
npm install -D @types/ioredis
```

- **ioredis**: Cliente Redis performático

##### **Upload de Arquivos**

```bash
npm install multer
npm install -D @types/multer
```

- **multer**: Upload de arquivos (logo, anexos)

##### **E-mail**

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

- **nodemailer**: Envio de e-mails

**Configuração básica (Gmail):**

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'seu-email@gmail.com',
    pass: 'sua-senha-app', // Use App Password do Google
  },
});

await transporter.sendMail({
  from: 'clinica@example.com',
  to: 'paciente@email.com',
  subject: 'Agendamento Confirmado',
  html: '<h1>Sua consulta foi agendada!</h1>',
});
```

##### **Validação de CPF/CNPJ**

```bash
npm install @fnando/cpf @fnando/cnpj
```

**Uso:**

```typescript
import { cpf } from '@fnando/cpf';

cpf.isValid('12345678900'); // false
cpf.format('12345678900'); // 123.456.789-00
```

##### **Geração de PDF**

```bash
npm install pdfkit
npm install -D @types/pdfkit
```

- **pdfkit**: Gerar PDFs (receitas, atestados, relatórios)

##### **Documentação API**

```bash
npm install swagger-ui-express swagger-jsdoc
npm install -D @types/swagger-ui-express @types/swagger-jsdoc
```

- Gera documentação automática da API

---

#### Frontend

##### **Data Fetching Avançado**

```bash
npm install @tanstack/react-query
```

- **react-query**: Cache automático, refetch, loading states
- ✅ Elimina muito código boilerplate

**Exemplo:**

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Buscar dados
const { data, isLoading, error } = useQuery({
  queryKey: ['patients'],
  queryFn: () => api.get('/patients').then(res => res.data),
});

// Criar dado
const mutation = useMutation({
  mutationFn: (newPatient) => api.post('/patients', newPatient),
  onSuccess: () => {
    queryClient.invalidateQueries(['patients']); // Atualiza lista
    toast.success('Paciente cadastrado!');
  },
});
```

##### **Gráficos**

```bash
npm install recharts
```

- **recharts**: Gráficos para dashboard
- ✅ Baseado em React
- ✅ Responsivo

##### **Tabelas Avançadas**

```bash
npm install @tanstack/react-table
```

- **react-table**: Tabelas com sort, filter, pagination

##### **Skeleton Loading**

```bash
# Já vem com shadcn/ui
npx shadcn-ui@latest add skeleton
```

---

### FASE 3 - Avançado

#### Backend

##### **Jobs/Filas**

```bash
npm install bull
npm install -D @types/bull
```

- **bull**: Filas para envio de e-mails, notificações

##### **Rate Limiting**

```bash
npm install express-rate-limit
```

- Prevenir abuso da API

##### **Logging**

```bash
npm install winston
```

- Logs estruturados e profissionais

##### **Monitoramento de Erros**

```bash
npm install @sentry/node
```

- **Sentry**: Tracking de erros em produção

---

#### Frontend

##### **PWA (Progressive Web App)**

```bash
npm install vite-plugin-pwa -D
```

- App instalável no mobile

##### **Internacionalização**

```bash
npm install react-i18next i18next
```

- Suporte a múltiplos idiomas

---

## 📁 ESTRUTURA DE PASTAS - SUA CONFIGURAÇÃO

### Backend (Node + Express + TypeScript)

```
minhaclinica-api/
├── src/
│   ├── @types/
│   │   └── express/
│   │       └── index.d.ts        # Extend tipos do Express (req.user, req.tenantId)
│   ├── controller/                # Controllers (recebem requisições)
│   │   ├── auth.controller.ts
│   │   ├── patients.controller.ts
│   │   ├── appointments.controller.ts
│   │   ├── professionals.controller.ts
│   │   └── procedures.controller.ts
│   ├── database/                  # Configuração do banco
│   │   ├── prisma.ts              # Cliente Prisma
│   │   └── migrations/            # Gerado pelo Prisma
│   ├── middlewares/               # Middlewares customizados
│   │   ├── auth.middleware.ts     # Verificar JWT
│   │   ├── tenant.middleware.ts   # Verificar tenant
│   │   ├── error.middleware.ts    # Tratamento de erros
│   │   └── validation.middleware.ts  # Validação com Yup
│   ├── repository/                # Acesso ao banco (Prisma)
│   │   ├── patients.repository.ts
│   │   ├── appointments.repository.ts
│   │   ├── professionals.repository.ts
│   │   └── users.repository.ts
│   ├── routes/                    # Rotas do Express
│   │   ├── index.ts               # Agrupa todas as rotas
│   │   ├── auth.routes.ts
│   │   ├── patients.routes.ts
│   │   ├── appointments.routes.ts
│   │   ├── professionals.routes.ts
│   │   └── procedures.routes.ts
│   ├── services/                  # Regras de negócio
│   │   ├── auth.service.ts
│   │   ├── patients.service.ts
│   │   ├── appointments.service.ts
│   │   ├── professionals.service.ts
│   │   └── email.service.ts
│   ├── utils/                     # Funções utilitárias
│   │   ├── cpf.util.ts
│   │   ├── date.util.ts
│   │   ├── jwt.util.ts
│   │   └── crypto.util.ts
│   ├── app.ts                     # Configuração do Express
│   └── server.ts                  # Entry point (inicia servidor)
├── prisma/
│   └── schema.prisma              # Schema do Prisma
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### **Fluxo de Requisição:**

```
Request → Routes → Middleware → Controller → Service → Repository → Database
                                    ↓
                                Response ← Controller ← Service ← Repository
```

**Exemplo prático de um endpoint:**

1. **Route** (`routes/patients.routes.ts`):

```typescript
import { Router } from 'express';
import { PatientsController } from '../controller/patients.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const controller = new PatientsController();

router.post('/', authMiddleware, controller.create);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.getById);

export default router;
```

2. **Controller** (`controller/patients.controller.ts`):

```typescript
import { Request, Response } from 'express';
import { PatientsService } from '../services/patients.service';

export class PatientsController {
  private service = new PatientsService();

  create = async (req: Request, res: Response) => {
    try {
      const patient = await this.service.create(req.body, req.user.clinicId);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      const patients = await this.service.findAll(req.user.clinicId);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}
```

3. **Service** (`services/patients.service.ts`):

```typescript
import { PatientsRepository } from '../repository/patients.repository';
import * as yup from 'yup';

const createPatientSchema = yup.object({
  name: yup.string().required().min(3),
  cpf: yup.string().required().length(11),
  email: yup.string().required().email(),
});

export class PatientsService {
  private repository = new PatientsRepository();

  async create(data: any, clinicId: string) {
    // Validar
    const validData = await createPatientSchema.validate(data);
  
    // Regra de negócio: verificar CPF duplicado
    const exists = await this.repository.findByCpf(validData.cpf, clinicId);
    if (exists) {
      throw new Error('CPF já cadastrado');
    }

    // Criar
    return this.repository.create({ ...validData, clinicId });
  }

  async findAll(clinicId: string) {
    return this.repository.findAll(clinicId);
  }
}
```

4. **Repository** (`repository/patients.repository.ts`):

```typescript
import { prisma } from '../database/prisma';

export class PatientsRepository {
  async create(data: any) {
    return prisma.patient.create({ data });
  }

  async findAll(clinicId: string) {
    return prisma.patient.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });
  }

  async findByCpf(cpf: string, clinicId: string) {
    return prisma.patient.findFirst({
      where: { cpf, clinicId },
    });
  }

  async findById(id: string, clinicId: string) {
    return prisma.patient.findFirst({
      where: { id, clinicId },
    });
  }
}
```

### Frontend (React + Vite + TypeScript)

```
minhaclinica-web/
├── src/
│   ├── assets/              # Imagens, fontes, etc
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── dialog.tsx
│   │   ├── layouts/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   └── Sidebar.tsx
│   │   └── shared/
│   │       ├── Loading.tsx
│   │       └── ErrorMessage.tsx
│   ├── features/            # Features por módulo
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── pages/
│   │   │   │   └── LoginPage.tsx
│   │   │   └── hooks/
│   │   │       └── useAuth.ts
│   │   ├── patients/
│   │   │   ├── components/
│   │   │   │   ├── PatientList.tsx
│   │   │   │   ├── PatientForm.tsx
│   │   │   │   └── PatientCard.tsx
│   │   │   ├── pages/
│   │   │   │   ├── PatientsPage.tsx
│   │   │   │   └── PatientDetailsPage.tsx
│   │   │   └── hooks/
│   │   │       └── usePatients.ts
│   │   ├── appointments/
│   │   └── dashboard/
│   ├── lib/                 # Configurações de libs
│   │   ├── api.ts           # Axios setup
│   │   ├── queryClient.ts   # React Query setup
│   │   └── utils.ts         # Funções utilitárias
│   ├── stores/              # Zustand stores
│   │   ├── authStore.ts
│   │   └── tenantStore.ts
│   ├── types/               # TypeScript types
│   │   ├── patient.ts
│   │   ├── appointment.ts
│   │   └── user.ts
│   ├── routes/              # Configuração de rotas
│   │   ├── AppRoutes.tsx
│   │   └── PrivateRoute.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 🎓 ORDEM DE APRENDIZADO (Passo a Passo)

### 1️⃣ Semana 1-2: Setup e Fundamentos

- [ ] Configurar ambiente (Node, Yarn, PostgreSQL)
- [ ] Instalar Yarn globalmente: `npm install -g yarn`
- [ ] Criar projeto backend com Express + TypeScript
- [ ] Configurar Biome (linter + formatter)
- [ ] Configurar Prisma e criar primeiro schema
- [ ] Criar projeto frontend com Vite + React + TypeScript
- [ ] Instalar Tailwind CSS
- [ ] Fazer primeira requisição (backend → frontend)

### 2️⃣ Semana 3-4: Autenticação

- [ ] Implementar registro de usuário (hash senha)
- [ ] Implementar login (JWT)
- [ ] Criar middleware de autenticação
- [ ] Proteger rotas no backend
- [ ] Criar LoginForm no frontend
- [ ] Armazenar token (localStorage)
- [ ] Criar PrivateRoute no frontend

### 3️⃣ Semana 5-6: CRUD de Pacientes

- [ ] Schema Prisma de Patient
- [ ] Criar endpoints: GET, POST, PUT, DELETE
- [ ] Validação com Zod
- [ ] Listar pacientes no frontend
- [ ] Criar formulário de cadastro
- [ ] Editar paciente
- [ ] Buscar paciente

### 4️⃣ Semana 7-8: CRUD de Profissionais e Procedimentos

- [ ] Mesma lógica dos pacientes
- [ ] Relacionamentos no Prisma

### 5️⃣ Semana 9-12: Agendamentos (Core do sistema)

- [ ] Schema complexo com relações
- [ ] Lógica de cálculo de horários disponíveis
- [ ] Criar agendamento
- [ ] Visualizar agenda
- [ ] Calendário no frontend (react-day-picker)

### 6️⃣ Semana 13+: Features Avançadas

- [ ] Dashboard com métricas
- [ ] Notificações por e-mail
- [ ] Upload de logo/anexos
- [ ] Relatórios
- [ ] Multi-tenant

---

## 🚀 COMANDOS ÚTEIS

### Backend

```bash
# Desenvolvimento com hot-reload
yarn dev

# Build para produção
yarn build

# Rodar produção
yarn start

# Biome - Lint e Format
yarn lint          # Verificar problemas
yarn format        # Formatar código
yarn check         # Lint + Format + Fix

# Prisma
yarn prisma migrate dev --name nome_migration
yarn prisma studio
yarn prisma generate
```

### Frontend

```bash
# Desenvolvimento
yarn dev

# Build
yarn build

# Preview build
yarn preview

# Biome - Lint e Format
yarn lint          # Verificar problemas
yarn format        # Formatar código
yarn check         # Lint + Format + Fix
```

### Yarn - Comandos Principais

```bash
# Instalar dependências
yarn install
yarn                  # Atalho

# Adicionar pacote
yarn add <package>             # Produção
yarn add -D <package>          # Desenvolvimento

# Remover pacote
yarn remove <package>

# Atualizar pacotes
yarn upgrade
yarn upgrade <package>

# Executar script
yarn <script-name>

# Limpar cache
yarn cache clean
```

---

## 📚 RECURSOS DE APRENDIZADO

### Documentações Oficiais

- **Node.js:** https://nodejs.org/docs
- **TypeScript:** https://www.typescriptlang.org/docs
- **Express:** https://expressjs.com

## ⚙️ SETUP INICIAL COMPLETO

### Backend

```bash
# 1. Criar pasta e inicializar
mkdir minhaclinica-api
cd minhaclinica-api
yarn init -y

# 2. Instalar TypeScript
yarn add -D typescript @types/node ts-node-dev
npx tsc --init

# 3. Instalar Biome
yarn add -D @biomejs/biome
npx @biomejs/biome init

# 4. Instalar dependências principais
yarn add express cors dotenv
yarn add -D @types/express @types/cors

# 5. Instalar Prisma
yarn add @prisma/client
yarn add -D prisma
npx prisma init

# 6. Criar estrutura de pastas
mkdir -p src/@types/express src/controller src/database src/middlewares src/repository src/routes src/services src/utils

# 7. Adicionar scripts no package.json
```

### Frontend

```bash
# 1. Criar projeto com Vite
yarn create vite minhaclinica-web --template react-ts
cd minhaclinica-web
yarn install

# 2. Instalar Biome
yarn add -D @biomejs/biome
npx @biomejs/biome init

# 3. Instalar Tailwind
yarn add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Instalar dependências principais
yarn add react-router-dom axios zustand
```

---

**Pronto para começar? Me diga:**

- ✅ Você já tem Node.js, Yarn e PostgreSQL instalados?
- ✅ Quer começar pelo backend ou frontend?
- ✅ Precisa de ajuda com alguma configuração específica
- **React Hook Form:** https://react-hook-form.com
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com

### Tutoriais Recomendados

- **Prisma Crash Course:** https://www.youtube.com/watch?v=RebA5J-rlwg
- **JWT Authentication:** https://www.youtube.com/watch?v=mbsmsi7l3r4
- **React + TypeScript:** https://www.youtube.com/watch?v=TPACABQTHvM

---

## 💡 DICAS IMPORTANTES

### ✅ Fazer

- Começar simples, adicionar complexidade depois
- Testar cada funcionalidade antes de avançar
- Commitar código frequentemente
- Ler erros com calma (90% das respostas estão nas mensagens de erro)
- Usar console.log para debugar (no início está OK)

### ❌ Evitar

- Tentar usar todas as bibliotecas de uma vez
- Over-engineering (começar com microservices, clean architecture, etc)
- Copiar código sem entender
- Ignorar TypeScript errors
- Não fazer backup/git

---

## 🎯 PRÓXIMOS PASSOS

1. **Agora:** Revisar este guia e anotar dúvidas
2. **Depois:** Começar pelo setup do backend
3. **Comigo:** Vou guiar você passo a passo em cada implementação

**Pronto para começar? Me diga:**

- ✅ Você já tem Node.js e PostgreSQL instalados?
- ✅ Quer começar pelo backend ou frontend?
- ✅ Alguma biblioteca específica que quer trocar ou adicionar?

Vou ser seu professor/mentor nessa jornada! 🚀
