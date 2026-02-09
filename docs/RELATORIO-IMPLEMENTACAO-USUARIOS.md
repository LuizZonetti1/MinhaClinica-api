# 📋 Relatório de Implementação - Sistema de Usuários

## 🎯 Objetivo Geral

Criar um sistema de cadastro de usuários com **3 tipos diferentes**, onde cada tipo tem seu próprio fluxo de registro baseado em quem pode se cadastrar:

- **PACIENTE**: Pode se cadastrar sozinho (público)
- **PROFISSIONAL**: Apenas admin pode convidar
- **STAFF** (Recepcionista/Admin): Apenas admin pode convidar

## 🏗️ Arquitetura do Sistema

### Fluxo em 3 Etapas

Todos os tipos de usuário seguem o mesmo padrão de 3 etapas:

```
ETAPA 1: Registro/Convite
    ↓
ETAPA 2: Verificação de Email
    ↓
ETAPA 3: Completar Cadastro
```

**Por que 3 etapas?**
- **Segurança**: Confirmamos que o email é válido antes de criar o cadastro completo
- **Experiência**: Usuário não perde tempo preenchendo tudo se o email for inválido
- **Separação de responsabilidades**: Dados sensíveis (CPF, senha) só são salvos após confirmar email

---

## 📂 Arquivos Criados e Seus Propósitos

### 1️⃣ SCHEMAS (Validação de Dados)

#### `src/schemas/patientSchema.ts`

**O que faz:** Define quais dados são obrigatórios e válidos para pacientes

**Por que existe:**
- Protege a API de dados inválidos (ex: CPF com letras, email sem @)
- Valida ANTES de chegar no serviço, economizando processamento
- Retorna erros claros para o frontend

**Estrutura:**

```typescript
registerPatientSchema → Validação da ETAPA 1
    - clinicId (UUID obrigatório)
    - name (mínimo 3 caracteres)
    - email (formato válido)

completePatientSchema → Validação da ETAPA 3
    - cpf (exatamente 11 dígitos)
    - phone (10-11 dígitos)
    - password (mínimo 6 caracteres)
    - dateOfBirth (não pode ser futura)
    - gender (MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY)
    - Campos opcionais: endereço, RG, alergias, etc.
```

**Por que dividir em dois schemas?**
- ETAPA 1 é rápida: só nome e email
- ETAPA 3 tem tudo: só pedimos depois que confirmamos o email

---

#### `src/schemas/professionalSchema.ts`

**O que faz:** Validação para médicos/dentistas/fisioterapeutas

**Diferenças do paciente:**
- Tem `professionalCouncil` (ex: CRM, CRO)
- Tem `registrationNumber` (número do conselho)
- Tem `registrationState` (UF do registro)
- Tem `defaultAppointmentDuration` (duração padrão da consulta)

**Por que esses campos?**
- Todo profissional da saúde precisa ter registro em conselho
- A duração de consulta varia: dentista demora mais que clínico geral
- Precisamos dessas informações para criar a agenda do profissional

---

#### `src/schemas/staffSchema.ts`

**O que faz:** Validação para recepcionistas e admins

**Por que é mais simples?**
- Staff não tem registros profissionais
- Não precisa de campos médicos
- Basta CPF, telefone e senha

**Campo especial:**
- `role`: Define se é "RECEPTIONIST" ou "ADMIN"
- Só admin pode criar outros admins

---

### 2️⃣ SERVICES (Lógica de Negócio)

#### `src/services/email/emailService.ts`

**O que faz:** Abstração para envio de emails

**Por que abstração (interface)?**
```typescript
export interface EmailProvider {
    sendEmail(options: {...}): Promise<void>;
}
```

**Motivo:** Podemos trocar o provedor de email sem mudar nada no código!

**Provedores disponíveis:**
- **ConsoleEmailProvider** (atual): Imprime email no console para testes
- **Futuros**: Nodemailer, SendGrid, Resend, AWS SES

**Templates de Email:**

1. **sendPatientVerificationEmail**
   - Cor: Azul (#3B82F6)
   - Título: "🏥 Bem-vindo à Minha Clínica"
   - Link expira em 24 horas
   - URL: `/verify-email?token=XXX&type=patient`

2. **sendProfessionalInviteEmail**
   - Cor: Verde (#10B981)
   - Título: "👨‍⚕️ Convite Profissional"
   - Link expira em 48 horas
   - URL: `/verify-email?token=XXX&type=professional`

3. **sendStaffInviteEmail**
   - Cor: Roxo (#8B5CF6)
   - Título: "👥 Convite Equipe"
   - Link expira em 48 horas
   - URL: `/verify-email?token=XXX&type=staff`

**Por que cores diferentes?**
- Usuário identifica visualmente qual tipo de convite recebeu
- Branding consistente (paciente=azul em todo sistema)

---

#### `src/services/patients/patientRegistrationService.ts`

**Classes:**

##### `RegisterPatientService` (ETAPA 1)

**Fluxo:**
```
1. Recebe: clinicId, name, email
    ↓
2. Verifica se email já existe
    ↓
3. Cria token de verificação (24h)
    ↓
4. Cria User com dados temporários:
   - cpf: "00000000000"
   - phone: "00000000000"
   - password: "temp"
   - status: PENDING_ACTIVATION
    ↓
5. Salva token criptografado no banco
    ↓
6. Envia email com link
    ↓
7. Retorna: "Verifique seu email"
```

**Por que dados temporários?**
- Não queremos CPF/senha antes de confirmar email
- Se email for falso, não criamos dados reais no banco
- Economiza espaço e mantém banco limpo

**Segurança do token:**
```typescript
// Token gerado: "abc123xyz..."
// Token salvo no banco: hash(abc123xyz) 
// Se alguém invadir banco, não consegue usar o token!
```

##### `CompletePatientService` (ETAPA 3)

**Fluxo:**
```
1. Recebe: userId (da ETAPA 2) + dados completos
    ↓
2. Busca User por ID
    ↓
3. Verifica se status = PENDING_ACTIVATION
    ↓
4. Criptografa senha (bcrypt)
    ↓
5. Atualiza User:
   - cpf, phone, password reais
   - status: ACTIVE
   - verificationToken: null (limpa)
    ↓
6. Cria registro na tabela Patient
    ↓
7. Retorna: Usuário completo
```

**Por que limpar verificationToken?**
- Token usado não pode ser reutilizado (segurança)
- Libera espaço no banco
- Indica que verificação foi concluída

---

#### `src/services/professionals/professionalRegistrationService.ts`

Similar ao paciente, mas com **validações ADMIN**:

##### `InviteProfessionalService` (ETAPA 1)

**Diferenças do paciente:**
```typescript
// Recebe adminId no construtor
async execute(adminId: string, data: {...})

// Valida se quem está convidando é ADMIN
const admin = await prisma.user.findUnique({
    where: { id: adminId }
});

if (admin.role !== "ADMIN") {
    throw new Error("Apenas admins podem convidar");
}
```

**Por que validar role?**
- Paciente não pode convidar médico
- Recepcionista não pode convidar médico
- Só admin tem essa permissão

**Token expira em 48h** (não 24h como paciente)
- Profissional pode demorar mais para aceitar convite
- Pode estar ocupado atendendo

##### `CompleteProfessionalService` (ETAPA 3)

**Campos adicionais salvos:**
```typescript
await prisma.professional.create({
    data: {
        userId: user.id,
        professionalCouncil: data.professionalCouncil,    // "CRM"
        registrationNumber: data.registrationNumber,       // "12345"
        registrationState: data.registrationState,         // "SP"
        defaultAppointmentDuration: data.defaultAppointmentDuration, // 30min
    }
});
```

**Por que tabela Professional separada?**
- User = dados comuns a todos (nome, email, senha)
- Professional = dados específicos de médicos (CRM, duração consulta)
- Normalização de banco de dados

---

#### `src/services/staff/staffRegistrationService.ts`

Similar ao profissional, mas:
- Aceita role="RECEPTIONIST" ou "ADMIN"
- Não cria tabela adicional (Staff não tem dados extras)
- Validação: Só admin pode convidar

---

#### `src/services/auth/verifyEmailService.ts`

**O que faz:** ETAPA 2 - Valida o token do email

**Classe:** `VerifyEmailService`

**Fluxo:**
```
1. Recebe: token (da URL do email)
    ↓
2. Criptografa token (hash)
    ↓
3. Busca User com:
   - verificationToken = hash(token)
   - status = PENDING_ACTIVATION
    ↓
4. Verifica se token expirou
    ↓
5. Retorna: { userId, name, email, role }
```

**Por que retornar role?**
Frontend precisa saber qual formulário mostrar:
- role=PATIENT → formulário com alergias
- role=PROFESSIONAL → formulário com CRM
- role=RECEPTIONIST → formulário simples

**Por que não ativar já aqui?**
- Ainda faltam dados obrigatórios (CPF, senha)
- Só ativamos quando tudo estiver completo (ETAPA 3)

---

### 3️⃣ CONTROLLERS (Recebem Requisições HTTP)

#### `src/controller/patientController.ts`

**Métodos:**

##### `register(req, res)`
```typescript
POST /api/patients/register
Body: { clinicId, name, email }
Retorna: { message: "Verifique seu email" }
```

**Tratamento de erros:**
- Captura exceção do service
- Retorna status 400 com mensagem de erro
- Logs para debug

##### `complete(req, res)`
```typescript
POST /api/patients/complete
Body: { userId, cpf, phone, password, dateOfBirth, gender, ... }
Retorna: { user completo }
```

**Por que userId no body?**
- Frontend salvou userId da ETAPA 2
- Não vem no token JWT (usuário ainda não está autenticado)

---

#### `src/controller/professionalController.ts`

**Diferença:** Método `invite` precisa de admin autenticado

```typescript
// authMiddleware coloca req.user no request
const adminId = req.user.userId;

await service.execute(adminId, req.body);
```

---

#### `src/controller/authController.ts`

**Método único:** `verifyEmail(req, res)`

```typescript
GET /api/auth/verify-email/:token
Params: { token }
Retorna: { userId, name, email, role }
```

**Usado por todos os tipos** (paciente, profissional, staff)

**Fluxo no frontend:**
```javascript
// Usuário clica no link do email
GET /verify-email?token=abc123

// Frontend chama API
const response = await fetch('/api/auth/verify-email/abc123')
const { userId, role } = response.data

// Redireciona baseado no role
if (role === 'PATIENT') {
    navigate(`/patients/complete?userId=${userId}`)
} else if (role === 'PROFESSIONAL') {
    navigate(`/professionals/complete?userId=${userId}`)
}
```

---

### 4️⃣ ROUTES (Mapeamento de URLs)

#### `src/routes/patient.routes.ts`

**Rotas públicas:**
```typescript
POST /api/patients/register → patientController.register
```
**Por que pública?** Qualquer pessoa pode se cadastrar como paciente

**Rotas "semi-públicas":**
```typescript
POST /api/patients/complete → patientController.complete
```
**Por que "semi"?** 
- Não precisa estar autenticado (ainda não tem conta completa)
- Mas precisa ter userId (que vem da verificação de email)

---

#### `src/routes/professional.routes.ts`

**Rotas protegidas (ADMIN):**
```typescript
POST /api/professionals/invite
Middlewares: authMiddleware + checkRole("ADMIN")
```

**Ordem dos middlewares:**
```
authMiddleware → Valida JWT, coloca req.user
    ↓
checkRole("ADMIN") → Verifica se req.user.role === "ADMIN"
    ↓
validate(schema) → Valida dados do body
    ↓
controller.invite → Executa lógica
```

**Rotas semi-públicas:**
```typescript
POST /api/professionals/complete → professionalController.complete
```

---

#### `src/routes/staff.routes.ts`

Mesma estrutura de professional.routes.ts

---

#### `src/routes/auth.routes.ts`

**Rota pública:**
```typescript
GET /api/auth/verify-email/:token → authController.verifyEmail
```

**Por que pública?**
- Usuário ainda não está autenticado
- Token no email é a autenticação temporária

---

#### `src/routes/index.ts`

**Arquivo principal que monta todas as rotas:**

```typescript
import patientRoutes from "./patient.routes";
import professionalRoutes from "./professional.routes";
import staffRoutes from "./staff.routes";
import authRoutes from "./auth.routes";

routes.use("/patients", patientRoutes);
routes.use("/professionals", professionalRoutes);
routes.use("/staff", staffRoutes);
routes.use("/auth", authRoutes);
```

**URLs finais:**
- `/api/patients/register`
- `/api/patients/complete`
- `/api/professionals/invite`
- `/api/professionals/complete`
- `/api/staff/invite`
- `/api/staff/complete`
- `/api/auth/verify-email/:token`

---

## 🗄️ Mudanças no Banco de Dados

### Migration: `20260209031526_add_user_verification_fields`

**Campos adicionados na tabela `User`:**

```sql
ALTER TABLE "User" ADD COLUMN "verificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationExpires" TIMESTAMP(3);
```

**Por que esses campos?**

**verificationToken (String opcional):**
- Armazena hash do token enviado por email
- Usado para validar se link do email é válido
- Fica NULL após usuário completar cadastro

**verificationExpires (DateTime opcional):**
- Data/hora que token expira
- Paciente: 24h
- Profissional/Staff: 48h
- Previne uso de links antigos

**Por que no User e não tabela separada?**
- Simplicidade: Menos joins no banco
- Performance: 1 query ao invés de 2
- Consistência: Mesmo padrão usado em Clinic
- Limpeza automática: Token é limpo quando user fica ACTIVE

---

## 🔒 Segurança Implementada

### 1. Hashing de Tokens

**Arquivo:** `src/utils/verificationTokenUtils.ts`

```typescript
function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}
```

**Fluxo:**
```
Token gerado: "abc123xyz"
    ↓
Token enviado no email: "abc123xyz"
    ↓
Token salvo no banco: hash("abc123xyz") = "f4d3b2c1a..."
    ↓
Usuário clica no link com "abc123xyz"
    ↓
API faz hash("abc123xyz") e compara com banco
```

**Por que?**
- Se banco vazar, hacker não tem acesso aos tokens válidos
- Não consegue usar tokens para ativar contas

### 2. Hashing de Senhas

```typescript
const hashedPassword = await bcrypt.hash(data.password, 10);
```

**Por que bcrypt?**
- Lento de propósito (dificulta força bruta)
- Salt automático (mesmo password = hash diferente)
- Padrão da indústria

### 3. Verificação de Expiração

```typescript
function isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
}
```

**Evita:**
- Uso de links antigos
- Reutilização de tokens vazados

### 4. Validação de Role

```typescript
if (admin.role !== "ADMIN") {
    throw new Error("Apenas admins podem convidar");
}
```

**Evita:**
- Escalação de privilégios
- Paciente convidar médicos

### 5. Limpeza de Token Usado

```typescript
await prisma.user.update({
    data: {
        verificationToken: null,
        verificationExpires: null
    }
});
```

**Evita:**
- Reutilização de tokens
- Poluição de banco

---

## 🎨 UX - Experiência do Usuário

### Fluxo Paciente (Público)

```
1. Página de Cadastro
   └─ Formulário: Nome, Email
   └─ Botão: "Cadastrar"
        ↓
2. Página de Confirmação
   └─ "Enviamos um email para você@email.com"
   └─ "Verifique sua caixa de entrada"
        ↓
3. Email Recebido (azul)
   └─ "🏥 Bem-vindo à Minha Clínica"
   └─ Botão: "Verificar Email"
        ↓
4. Clica no botão
   └─ Redireciona: /patients/complete?userId=123
        ↓
5. Formulário Completo
   └─ CPF, Telefone, Senha, Data Nascimento, Gênero
   └─ Endereço (opcional)
   └─ Alergias (opcional)
   └─ Botão: "Concluir Cadastro"
        ↓
6. Conta Ativada!
   └─ Login automático ou redireciona para login
```

### Fluxo Profissional (Admin Convida)

```
1. Admin logado → Painel Admin
   └─ Botão: "Convidar Profissional"
        ↓
2. Formulário de Convite
   └─ Nome, Email
   └─ Botão: "Enviar Convite"
        ↓
3. Email Enviado ao Profissional (verde)
   └─ "👨‍⚕️ Você foi convidado"
   └─ "Dr. João convidou você para a Clínica XYZ"
        ↓
4. Profissional clica no link
   └─ Redireciona: /professionals/complete?userId=456
        ↓
5. Formulário Profissional
   └─ CPF, Telefone, Senha
   └─ Conselho (CRM, CRO, etc)
   └─ Número de Registro
   └─ Estado do Registro
   └─ Duração da Consulta
   └─ Botão: "Aceitar Convite"
        ↓
6. Conta Ativada!
```

### Fluxo Staff (Admin Convida)

Similar ao profissional, mas formulário final é mais simples (sem CRM).

---

## 🔧 Como Trocar Provedor de Email

**Atualmente:** ConsoleEmailProvider (imprime no console)

**Para usar SendGrid:**

```typescript
// Criar novo provider
export class SendGridEmailProvider implements EmailProvider {
    async sendEmail(options: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void> {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        await sgMail.send({
            from: process.env.EMAIL_FROM,
            to: options.to,
            subject: options.subject,
            html: options.html
        });
    }
}

// Trocar no service
const emailService = new EmailService(new SendGridEmailProvider());
```

**Para usar Nodemailer:**

```typescript
export class NodemailerEmailProvider implements EmailProvider {
    private transporter;
    
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    
    async sendEmail(options: {...}): Promise<void> {
        await this.transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: options.to,
            subject: options.subject,
            html: options.html
        });
    }
}
```

**Vantagem da abstração:**
- Troca provider sem mudar NADA nos services!
- Testa com console, depois usa real

---

## 🐛 Erros Encontrados e Corrigidos

### Erro 1: TypeScript não reconhecia verificationToken

**Mensagem:**
```
'verificationToken' não existe no tipo UserUpdateInput
```

**Causa:**
- Migração aplicada no banco
- Prisma Client não regenerado
- TypeScript usava tipos antigos

**Solução:**
```bash
npx prisma generate
```

**O que isso faz:**
- Lê schema.prisma
- Gera tipos TypeScript em generated/prisma
- Atualiza interface User com novos campos

---

## ✅ Checklist de Conclusão

- [x] Schemas de validação (patient, professional, staff)
- [x] Services de registro (3 etapas para cada tipo)
- [x] Email service com templates HTML
- [x] Controllers HTTP
- [x] Routes configuradas
- [x] Migration aplicada
- [x] Prisma Client regenerado
- [x] Erros TypeScript corrigidos
- [x] Segurança: hashing de tokens e senhas
- [x] Validação de roles (admin only para convites)

---

## 🚀 Próximos Passos

### 1. Endpoint de Login

```typescript
POST /api/auth/login
Body: { email, password, clinicId }

// Validar:
- Email existe?
- Senha correta?
- Status = ACTIVE? (não pode ser PENDING)

// Retornar:
{
    token: "JWT com userId, clinicId, role",
    user: { id, name, email, role }
}
```

### 2. Cadastro do Dono da Clínica

Quando clínica é verificada, criar automaticamente um User com role=ADMIN.

```typescript
POST /api/clinics/complete-owner
Body: { clinicId, cpf, phone, password }

// Similar ao CompletePatientService
// Mas cria ADMIN ao invés de criar nova clínica
```

### 3. Implementar Provider de Email Real

- Escolher: SendGrid (100/dia grátis) ou Nodemailer
- Criar implementação do EmailProvider
- Trocar no construtor dos services

### 4. Testes

- Testar fluxo completo de paciente
- Testar convite de profissional
- Testar validações de role
- Testar expiração de tokens

---

## 📚 Conceitos Aprendidos

### 1. Repository Pattern
Separa acesso ao banco (repository) da lógica (service)

### 2. Service Layer
Contém regras de negócio isoladas dos controllers

### 3. Validation Layer
Valida dados antes de chegar ao service

### 4. Abstraction (Interface)
EmailProvider permite trocar implementação sem quebrar código

### 5. Token Security
Hash antes de salvar, compara hash ao validar

### 6. Multi-step Registration
Divide cadastro em etapas para melhor UX e segurança

### 7. Role-based Access Control (RBAC)
Diferentes permissões baseadas em role

### 8. Status-based Flow
Status PENDING_ACTIVATION → ACTIVE controla fluxo

---

## 🎓 Dicas de Estudo

1. **Siga os fluxos desenhados** - Desenhe no papel as 3 etapas
2. **Teste cada endpoint** - Use Postman/Insomnia
3. **Leia os erros** - TypeScript te guia com mensagens claras
4. **Debug com console.log** - Veja o que está acontecendo
5. **Entenda o "porquê"** - Não decore, entenda a razão de cada decisão

---

**Desenvolvido em:** Fevereiro 2026  
**Stack:** Node.js + TypeScript + Prisma + PostgreSQL  
**Padrões:** Repository + Service + Controller  
**Segurança:** JWT + bcrypt + token hashing + RBAC
