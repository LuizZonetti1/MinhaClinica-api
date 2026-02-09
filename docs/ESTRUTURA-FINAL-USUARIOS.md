# ✅ Arquivos Verificados - Sistema de Cadastro de Usuários

## 📁 Estrutura Final (Necessária)

```
src/
├── controller/
│   └── userController.ts          ✅ Controllers dos endpoints
│
├── middlewares/
│   ├── auth.ts                    ✅ Autenticação JWT + verificação de role
│   └── validation.ts              ✅ Validação genérica com Yup
│
├── repository/
│   ├── userRepository.ts          ✅ CRUD de usuários
│   └── patientRepository.ts       ✅ CRUD específico de pacientes
│
├── routes/
│   ├── index.ts                   ✅ Rotas principais
│   ├── user.routes.ts             ✅ Rotas de usuário
│   └── clinic.routes.ts           ✅ Rotas de clínica
│
├── schemas/
│   ├── userSchema.ts              ✅ Validação de usuários (pré-cadastro e definir papel)
│   └── clinicSchema.ts            ✅ Validação de clínicas
│
├── services/
│   ├── users/
│   │   ├── preRegisterUserService.ts      ✅ Pré-cadastro (PÚBLICO - sem escolher role)
│   │   ├── defineUserRoleService.ts       ✅ Admin define papel + completa dados
│   │   └── listPendingUsersService.ts     ✅ Lista usuários aguardando definição
│   │
│   └── auth/
│       └── authExampleService.ts          ✅ Exemplos de login e registro (opcional)
│
└── utils/
    ├── jwtUtils.ts                ✅ Funções para tokens JWT (autenticação)
    └── verificationTokenUtils.ts  ✅ Funções para tokens de verificação (email)
```

---

## ❌ Arquivos Removidos (Desnecessários)

```
❌ src/services/users/createUserService.ts    [REMOVIDO]
   Motivo: Criava usuário direto com papel definido. 
   Agora usa fluxo de etapas (pré-cadastro → admin define papel)

❌ src/services/patients/createPatientService.ts    [REMOVIDO]
   Motivo: Criava paciente completo direto.
   Agora usa defineUserRoleService que cria User + Patient
```

---

## 🎯 Fluxo de Cadastro - Resumo

### Para o Usuário (Frontend)

```
┌─────────────────────────────────────┐
│  Página de Cadastro                 │
│                                     │
│  Nome: [____________]               │
│  CPF: [____________]                │
│  Email: [____________]              │
│  Telefone: [____________]           │
│  Senha: [____________]              │
│                                     │
│  [ Cadastrar ]                      │
│                                     │
│  ❌ NÃO MOSTRA: Sou paciente,       │
│     Sou profissional, etc.          │
└─────────────────────────────────────┘
         │
         ▼
    POST /api/users/pre-register
         │
         ▼
┌─────────────────────────────────────┐
│  ✅ Cadastro realizado!              │
│  Aguarde aprovação do               │
│  administrador da clínica           │
└─────────────────────────────────────┘
```

### Para o Admin (Dashboard)

```
┌─────────────────────────────────────────────┐
│  🔔 Novos Cadastros (3)                     │
│                                             │
│  1. João Silva                              │
│     CPF: 123.456.789-01                     │
│     Email: joao@email.com                   │
│     ┌──────────────────────────────┐       │
│     │ Definir como:                │       │
│     │ ○ Paciente                   │       │
│     │ ○ Profissional               │       │
│     │ ○ Recepcionista              │       │
│     │ ○ Administrador              │       │
│     └──────────────────────────────┘       │
│                                             │
│  2. Maria Souza                             │
│     CPF: 987.654.321-09                     │
│     Email: maria@email.com                  │
│     [Definir papel...]                      │
└─────────────────────────────────────────────┘
```

---

## 🔒 Segurança e Controle

### O que o Usuário NÃO Controla

- ❌ Não escolhe o papel (role)
- ❌ Não pode fazer login imediatamente
- ❌ Não pode se auto-promover a admin
- ❌ Não vê opções de tipo de conta

### O que o Admin Controla

- ✅ Quem pode acessar o sistema
- ✅ Qual papel cada usuário terá
- ✅ Quando ativar o cadastro
- ✅ Pode definir dados adicionais

---

## 📊 Status do Usuário

| Status | Pode Login? | Quem Define | Descrição |
|--------|-------------|-------------|-----------|
| `PENDING_ACTIVATION` | ❌ | Sistema (pré-cadastro) | Aguardando admin definir papel |
| `ACTIVE` | ✅ | Admin | Pode usar o sistema |
| `INACTIVE` | ❌ | Admin | Desativado temporariamente |
| `BLOCKED` | ❌ | Sistema/Admin | Bloqueado por segurança |

---

## 🔌 Endpoints - Resumo

### Públicos (Sem Autenticação)

```http
POST /api/users/pre-register
```
- Qualquer pessoa pode se cadastrar
- Não requer token
- Não permite escolher papel

### Protegidos (Apenas ADMIN)

```http
GET /api/users/pending
Authorization: Bearer {adminToken}
```
- Lista usuários aguardando definição

```http
POST /api/users/:userId/define-role
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "role": "PATIENT|PROFESSIONAL|RECEPTIONIST|ADMIN",
  "patientData": { ... },      // se role = PATIENT
  "professionalData": { ... }  // se role = PROFESSIONAL
}
```
- Define papel do usuário
- Completa dados específicos
- Ativa o usuário

---

## ✅ Checklist de Verificação

- [x] preRegisterUserService.ts - NÃO aceita campo `role`
- [x] preRegisterUserSchema - NÃO valida campo `role`
- [x] Status PENDING_ACTIVATION impede login
- [x] Apenas ADMIN pode definir papéis
- [x] Arquivos desnecessários removidos
- [x] Imports limpos (sem dependências não usadas)
- [x] Validação Yup em todas as rotas
- [x] Documentação completa

---

## 🚀 Próximos Passos Sugeridos

1. **Endpoint de Login**
   - Verificar se status = ACTIVE antes de permitir
   - Retornar token JWT com userId, clinicId e role

2. **Notificações**
   - Notificar admin quando houver novo pré-cadastro
   - Enviar email para usuário quando conta for ativada

3. **Rejeitar Cadastro**
   - Endpoint para admin excluir/rejeitar pré-cadastro
   - Enviar motivo da rejeição por email

4. **Dashboard Admin**
   - Contador de cadastros pendentes
   - Filtros por data, nome, CPF

---

## ⚠️ Nota sobre Erro TypeScript

Se o erro de importação do `validation.ts` persistir:

1. Feche e reabra o VS Code
2. Ou execute: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
3. Ou recarregue a janela: `Ctrl+Shift+P` → "Developer: Reload Window"

O arquivo existe e está correto - é apenas um problema de cache do TypeScript.
