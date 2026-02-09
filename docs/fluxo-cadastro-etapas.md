# Fluxo de Cadastro em Etapas

Sistema de pré-cadastro onde o usuário não escolhe seu papel (role) ao se cadastrar. Um administrador define posteriormente qual será a função do usuário.

## 📋 Visão Geral

### Fluxo Tradicional ❌
```
Frontend → Escolhe "Sou Paciente" → Cadastro completo
Frontend → Escolhe "Sou Profissional" → Cadastro completo
```

### Novo Fluxo ✅
```
1. Frontend → Pré-cadastro (sem escolher tipo)
2. Admin → Define papel do usuário
3. Admin → Completa dados específicos
```

---

## 🔄 Fluxo Detalhado

### Etapa 1: Pré-Cadastro (Público)

**Endpoint:** `POST /api/users/pre-register`

**Dados necessários:**
```json
{
  "clinicId": "uuid-da-clinica",
  "name": "João Silva",
  "cpf": "12345678901",
  "email": "joao@email.com",
  "phone": "11999999999",
  "password": "senha123"
}
```

**O que acontece:**
- Cria registro na tabela `users`
- Status: `PENDING_ACTIVATION`
- Role temporário: `PATIENT` (será alterado depois)
- Usuário **não pode fazer login** neste estado

**Resposta:**
```json
{
  "id": "user-uuid",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "status": "PENDING_ACTIVATION",
  "message": "Pré-cadastro realizado. Aguardando aprovação do administrador."
}
```

---

### Etapa 2: Admin Visualiza Pendentes

**Endpoint:** `GET /api/users/pending`

**Autenticação:** Bearer Token (apenas ADMIN)

**Resposta:**
```json
{
  "total": 3,
  "data": [
    {
      "id": "user-uuid-1",
      "name": "João Silva",
      "cpf": "12345678901",
      "email": "joao@email.com",
      "phone": "11999999999",
      "createdAt": "2026-02-08T12:00:00.000Z"
    },
    {
      "id": "user-uuid-2",
      "name": "Maria Souza",
      "cpf": "98765432109",
      "email": "maria@email.com",
      "phone": "11988888888",
      "createdAt": "2026-02-07T15:30:00.000Z"
    }
  ]
}
```

---

### Etapa 3: Admin Define Papel

**Endpoint:** `POST /api/users/:userId/define-role`

**Autenticação:** Bearer Token (apenas ADMIN)

#### 3A. Definir como ADMIN ou RECEPTIONIST

```json
{
  "role": "RECEPTIONIST"
}
```

**O que acontece:**
- Atualiza `role` para `RECEPTIONIST`
- Atualiza `status` para `ACTIVE`
- Define `mustChangePassword: true` (deve trocar senha no primeiro login)
- Usuário pode fazer login

---

#### 3B. Definir como PATIENT

```json
{
  "role": "PATIENT",
  "patientData": {
    "dateOfBirth": "1990-05-15",
    "gender": "MALE",
    "rg": "123456789",
    "zipCode": "01310100",
    "street": "Avenida Paulista",
    "number": "1000",
    "complement": "Apto 101",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "alternativePhone": "11977777777",
    "allergies": "Penicilina",
    "observations": "Hipertenso"
  }
}
```

**O que acontece:**
- Atualiza `role` para `PATIENT`
- Atualiza `status` para `ACTIVE`
- **Cria registro na tabela `patients`** com dados adicionais
- Define `mustChangePassword: false`
- Usuário pode fazer login

---

#### 3C. Definir como PROFESSIONAL

```json
{
  "role": "PROFESSIONAL",
  "professionalData": {
    "professionalCouncil": "CRM",
    "registrationNumber": "123456",
    "registrationState": "SP",
    "defaultAppointmentDuration": 30
  }
}
```

**O que acontece:**
- Atualiza `role` para `PROFESSIONAL`
- Atualiza `status` para `ACTIVE`
- **Cria registro na tabela `professionals`**
- Define `mustChangePassword: true`
- Usuário pode fazer login
- Depois o admin pode vincular especialidades, horários, etc.

**Resposta:**
```json
{
  "userId": "user-uuid",
  "name": "João Silva",
  "email": "joao@email.com",
  "role": "PATIENT",
  "status": "ACTIVE",
  "additionalData": {
    "id": "patient-uuid",
    "cpf": "12345678901",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "gender": "MALE",
    "city": "São Paulo",
    "state": "SP"
  },
  "message": "Usuário ativado como PATIENT"
}
```

---

## 🎯 Vantagens deste Fluxo

1. **Segurança**: Admin controla quem pode acessar o sistema
2. **Flexibilidade**: Admin decide qual papel cada usuário terá
3. **UX Simples**: Usuário não precisa escolher tipo ao se cadastrar
4. **Validação**: Admin pode validar CPF, email, etc antes de ativar
5. **Anti-spam**: Previne cadastros automáticos/bots

---

## 📊 Estados do Usuário

| Status | Pode Login? | Descrição |
|--------|-------------|-----------|
| `PENDING_ACTIVATION` | ❌ | Pré-cadastro, aguardando definição de papel |
| `ACTIVE` | ✅ | Ativo, pode usar o sistema |
| `INACTIVE` | ❌ | Desativado pelo admin |
| `BLOCKED` | ❌ | Bloqueado (ex: muitas tentativas de login) |

---

## 🔐 Permissões

| Ação | Quem Pode |
|------|-----------|
| Pré-cadastro | Qualquer pessoa (público) |
| Visualizar pendentes | Apenas ADMIN |
| Definir papel | Apenas ADMIN |
| Login | Apenas usuários com `status = ACTIVE` |

---

## 🧪 Testando no Insomnia/Postman

### 1. Pré-cadastro
```http
POST http://localhost:3001/api/users/pre-register
Content-Type: application/json

{
  "clinicId": "clinica-uuid",
  "name": "Teste Silva",
  "cpf": "12345678901",
  "email": "teste@email.com",
  "phone": "11999999999",
  "password": "senha123"
}
```

### 2. Listar pendentes (com token do admin)
```http
GET http://localhost:3001/api/users/pending
Authorization: Bearer {{adminToken}}
```

### 3. Definir como paciente (com token do admin)
```http
POST http://localhost:3001/api/users/{{userId}}/define-role
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "role": "PATIENT",
  "patientData": {
    "dateOfBirth": "1990-05-15",
    "gender": "MALE"
  }
}
```

---

## 📁 Arquivos Criados

1. **Services**:
   - `src/services/users/preRegisterUserService.ts` - Pré-cadastro
   - `src/services/users/defineUserRoleService.ts` - Definir papel
   - `src/services/users/listPendingUsersService.ts` - Listar pendentes

2. **Controller**:
   - `src/controller/userController.ts` - Endpoints de usuário

3. **Routes**:
   - `src/routes/user.routes.ts` - Rotas de usuário

4. **Schemas**:
   - `src/schemas/userSchema.ts` - Validação Yup

5. **Middleware**:
   - `src/middlewares/validation.ts` - Validação genérica

6. **Repository** (atualizado):
   - `src/repository/userRepository.ts` - Métodos adicionados

---

## ⚠️ Considerações

1. **Email de Confirmação**: Pode adicionar envio de email quando admin ativa o usuário
2. **Notificações**: Notificar admin quando há novos pré-cadastros
3. **Rejeitar Cadastro**: Adicionar endpoint para admin rejeitar/excluir pré-cadastro
4. **Dashboard Admin**: Mostrar contador de usuários pendentes
5. **Logs**: Registrar quem ativou qual usuário e quando

---

## 🚀 Próximos Passos

1. ✅ Estrutura de pré-cadastro implementada
2. ✅ Sistema de definição de papéis implementado
3. ⬜ Endpoint de login (verificar status ACTIVE)
4. ⬜ Endpoint para rejeitar pré-cadastro
5. ⬜ Sistema de notificações (email/push)
6. ⬜ Dashboard admin com estatísticas
