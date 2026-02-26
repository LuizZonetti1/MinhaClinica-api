# 🚀 INÍCIO RÁPIDO - MinhaClínica API

Guia para configurar ambiente e começar a desenvolver!

---

## ✅ O QUE JÁ ESTÁ PRONTO

O projeto já possui:

- ✅ Banco de dados configurado (PostgreSQL via Neon)
- ✅ Prisma ORM configurado com todas as models
- ✅ Sistema completo de usuários (3 tipos: paciente, profissional, staff)
- ✅ Autenticação JWT
- ✅ Middlewares de validação
- ✅ Email service (abstração pronta)

---

## ⚡ Setup em 5 Minutos

### 1. Clone e instale dependências

```bash
git clone <url-do-repositorio>
cd MinhaClinica-api
yarn install
```

### 2. Configure as variáveis de ambiente

Crie arquivo `.env` na raiz:

```env
# Database (PostgreSQL Neon)
DATABASE_URL="postgresql://usuario:senha@host.neon.tech/minhaclinica?sslmode=require"

# JWT
JWT_SECRET="seu_secret_super_seguro_aqui_mude_em_producao"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="outro_secret_diferente_para_refresh"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Frontend URL (para links de verificação)
FRONTEND_URL="http://localhost:3000"

# Email (quando implementar provider real)
EMAIL_FROM="noreply@minhaclinica.com.br"
# SENDGRID_API_KEY="sua_chave_aqui"
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="seu_email@gmail.com"
# SMTP_PASS="sua_senha"
```

### 3. Rode as migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Inicie o servidor

```bash
yarn dev
```

Servidor rodando em: `http://localhost:3000`

---

## 🧪 Teste a API

### Usando Insomnia

1. Importe a collection: `docs/insomnia-users-cadastro-etapas.json`
2. Configure as variáveis de ambiente no Insomnia
3. Teste os fluxos de cadastro

### Endpoints Disponíveis

#### Pacientes (Público)

```http
POST /api/patients/register
POST /api/patients/complete
```

#### Profissionais (Admin Only)

```http
POST /api/professionals/invite
POST /api/professionals/complete
```

#### Staff (Admin Only)

```http
POST /api/staff/invite
POST /api/staff/complete
```

#### Autenticação

```http
GET /api/auth/verify-email/:token
```

#### Clínicas

```http
POST /api/clinics
GET /api/clinics/:id
PUT /api/clinics/:id
DELETE /api/clinics/:id
```

---

## 📂 Estrutura Atual do Projeto

```
MinhaClinica-api/
├── prisma/
│   ├── schema.prisma              # Schema do banco (19 models)
│   └── migrations/                # Histórico de migrations
│       └── 20260209031526_.../   # Migration de verificação
├── src/
│   ├── @types/                    # Tipagens TypeScript
│   ├── controller/                # Controllers HTTP
│   │   ├── authController.ts     ✅
│   │   ├── clinicController.ts   ✅
│   │   ├── patientController.ts  ✅
│   │   ├── professionalController.ts ✅
│   │   └── staffController.ts    ✅
│   ├── database/
│   │   ├── prisma.ts             # Cliente Prisma
│   │   └── seed.ts               # Seed de dados
│   ├── middlewares/
│   │   ├── auth.ts               ✅ JWT + role check
│   │   └── validation.ts         ✅ Validação Yup
│   ├── repository/
│   │   ├── clinicRepository.ts   ✅
│   │   ├── patientRepository.ts  ✅
│   │   └── userRepository.ts     ✅
│   ├── routes/
│   │   ├── auth.routes.ts        ✅
│   │   ├── clinic.routes.ts      ✅
│   │   ├── patient.routes.ts     ✅
│   │   ├── professional.routes.ts ✅
│   │   ├── staff.routes.ts       ✅
│   │   └── index.ts              ✅ Monta todas as rotas
│   ├── schemas/                   # Validações Yup
│   │   ├── clinicSchema.ts       ✅
│   │   ├── patientSchema.ts      ✅
│   │   ├── professionalSchema.ts ✅
│   │   └── staffSchema.ts        ✅
│   ├── services/
│   │   ├── auth/
│   │   │   └── verifyEmailService.ts ✅
│   │   ├── clinic/
│   │   │   └── clinicService.ts  ✅
│   │   ├── email/
│   │   │   └── emailService.ts   ✅
│   │   ├── patients/
│   │   │   └── patientRegistrationService.ts ✅
│   │   ├── professionals/
│   │   │   └── professionalRegistrationService.ts ✅
│   │   └── staff/
│   │       └── staffRegistrationService.ts ✅
│   ├── utils/
│   │   ├── jwtUtils.ts           ✅
│   │   └── verificationTokenUtils.ts ✅
│   ├── app.ts                    # Configuração Express
│   └── server.ts                 # Inicia servidor
├── docs/                         # Documentação completa
└── package.json
```

---

## 📚 Próximos Passos de Desenvolvimento

### 1. Implementar Login

- [ ] Criar `LoginService`
- [ ] Validar status = ACTIVE
- [ ] Retornar JWT com userId, clinicId, role
- [ ] Endpoint: `POST /api/auth/login`

### 2. Completar Fluxo do Dono da Clínica

- [ ] Criar endpoint para owner completar cadastro após verificar clínica
- [ ] Criar User com role=ADMIN automaticamente

### 3. Implementar Email Provider Real

- [ ] Escolher: SendGrid, Nodemailer, ou Resend
- [ ] Criar implementação do EmailProvider
- [ ] Trocar ConsoleEmailProvider

### 4. Próximos Módulos

- [ ] CRUD de Especialidades (Specialty)
- [ ] CRUD de Procedimentos (Procedure)
- [ ] Sistema de Agendamentos (Appointment)

---

## 📖 Documentação Essencial

### Comece por aqui:

1. **[RELATORIO-IMPLEMENTACAO-USUARIOS.md](RELATORIO-IMPLEMENTACAO-USUARIOS.md)** ⭐

   - Entenda TUDO que já foi implementado
   - Explicação detalhada de cada arquivo
   - Conceitos e decisões técnicas
2. **[fluxo-cadastro-etapas.md](fluxo-cadastro-etapas.md)**

   - Diagramas visuais dos fluxos

### Para desenvolver:

3. **[guia-desenvolvimento-backend.md](guia-desenvolvimento-backend.md)**

   - Padrão Repository + Service + Controller
4. **[database-schema-explanation.md](database-schema-explanation.md)**

   - Todos os models e enums explicados

### Referências:

5. **[requisitos-sistema.md](requisitos-sistema.md)**

   - Requisitos funcionais e regras de negócio
6. **[documentacao-funcional.md](documentacao-funcional.md)**

   - Visão de produto

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
yarn dev                          # Iniciar servidor (modo watch)

# Prisma
npx prisma studio                 # Abrir Prisma Studio
npx prisma migrate dev            # Criar nova migration
npx prisma migrate deploy         # Aplicar migrations em produção
npx prisma generate               # Regenerar Prisma Client
npx prisma db seed                # Rodar seeds

# Git
git log --oneline                 # Ver histórico de commits
git status                        # Ver status
```

---

## 🐛 Troubleshooting

### Erro: "verificationToken não existe no tipo"

```bash
npx prisma generate
```

### Banco desatualizado após migration

```bash
npx prisma migrate reset  # ⚠️ APENAS EM DEV!
npx prisma migrate dev
npx prisma generate
```

### Porta 3000 já em uso

```bash
# Mudar no .env
PORT=3001
```

---

## 🎯 Fluxo de Desenvolvimento Recomendado

1. **Leia a documentação** (RELATORIO-IMPLEMENTACAO-USUARIOS.md)
2. **Teste a API existente** (Insomnia collection)
3. **Entenda o código existente** (veja services, controllers, routes)
4. **Implemente nova funcionalidade** seguindo o padrão:
   - Schema Yup → Service → Controller → Route
5. **Teste** seu código
6. **Commit** com mensagem descritiva
7. **Documente** se necessário

---

## 🎓 Dicas para Iniciantes

1. **Sempre gere o Prisma Client** após mudar o schema:

   ```bash
   npx prisma generate
   ```
2. **Use o Prisma Studio** para ver dados no banco:

   ```bash
   npx prisma studio
   ```
3. **Siga o padrão Repository + Service + Controller**

   - Repository: Acesso ao banco (Prisma)
   - Service: Lógica de negócio
   - Controller: Recebe HTTP requests
4. **Valide sempre com Yup** antes de chamar o service
5. **Trate erros** com try/catch nos controllers
6. **Use os tipos do Prisma** para TypeScript safety

---

## 🔗 Links Rápidos

- 📖 [Documentação Completa](README.md)
- ⭐ [Relatório de Implementação](RELATORIO-IMPLEMENTACAO-USUARIOS.md)
- 🔄 [Fluxos de Cadastro](fluxo-cadastro-etapas.md)
- 🗄️ [Schema do Banco](database-schema-explanation.md)
- 📋 [Checklist](checklist-desenvolvimento.md)

---

**Pronto para começar! 🚀**

### Semana 1:

- ✅ Auth Module completo
- ✅ Middlewares funcionando
- ✅ Login/Register testados

### Semana 2:

- ✅ User Module completo
- ✅ Gestão de usuários funcionando

### Semana 3-4:

- ✅ Specialty Module
- ✅ Procedure Module

### Semana 5-6:

- ✅ Professional Module
- ✅ Patient Module

### Semana 7-8:

- ✅ Appointment Module (COMPLEXO!)

---

## 🎓 Próximos Módulos (Após Auth)

1. **User Module** - Gestão de usuários
2. **Specialty Module** - Especialidades médicas
3. **Procedure Module** - Procedimentos/exames
4. **Professional Module** - Profissionais de saúde
5. **Patient Module** - Pacientes
6. **Appointment Module** - Agendamentos

---

## 💡 Dicas Finais

✅ **FAÇA:**

- Clone o código do exemplo exatamente como está
- Teste cada arquivo após criar
- Use o checklist para não se perder
- Commit após cada módulo concluído

❌ **NÃO FAÇA:**

- Não pule o Auth Module!
- Não tente criar tudo de uma vez
- Não ignore os middlewares
- Não esqueça de testar

---

## 🚀 Comece AGORA!

1. Abra: **[docs/exemplo-auth-module.md](exemplo-auth-module.md)**
2. Copie o código de `utils/errors.ts`
3. Cole em `src/utils/errors.ts`
4. Continue arquivo por arquivo

**Boa sorte! 🎉**

---

## 📞 Documentação Adicional

- [README.md](README.md) - Visão geral da documentação
- [guia-desenvolvimento-backend.md](guia-desenvolvimento-backend.md) - Arquitetura completa
- [checklist-desenvolvimento.md](checklist-desenvolvimento.md) - Acompanhamento
- [exemplo-auth-module.md](exemplo-auth-module.md) - Exemplo completo

---

**Última atualização:** 05/02/2026
