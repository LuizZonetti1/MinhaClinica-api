# 📱 Guia de Integração Frontend - Minha Clínica

**Versão:** 1.0  
**Data:** 9 de fevereiro de 2026  
**URL Base API:** `http://localhost:3000/api`

---

## 🎯 Objetivo deste Documento

Este documento orienta a equipe de frontend sobre:
- ✅ O que está pronto no backend
- 🔧 Como integrar com os endpoints disponíveis
- 📋 O que precisa ser implementado no frontend
- 🚀 Funcionalidades futuras planejadas

---

## ✅ O QUE JÁ ESTÁ PRONTO NO BACKEND

### 1. Sistema de Cadastro de Usuários (3 tipos)

#### 1.1. Cadastro Público de Paciente (3 Etapas)

**Endpoint:** `POST /api/users/register/patient`

**Fluxo:**
1. **Etapa 1:** Usuário preenche dados iniciais (clínica, nome, email)
2. **Etapa 2:** Sistema envia email de verificação
3. **Etapa 3:** Usuário clica no link do email e completa cadastro (CPF, telefone, senha, etc)

**Request Body - Etapa 1:**
```json
{
  "clinicId": "uuid-da-clinica",
  "name": "Maria Silva",
  "email": "maria@email.com"
}
```

**Response:**
```json
{
  "message": "Cadastro iniciado. Verifique seu email.",
  "userId": "uuid-do-usuario",
  "verificationSent": true
}
```

**Validações:**
- Email único no sistema
- Nome mínimo 3 caracteres
- Clinic ID deve existir

---

**Endpoint:** `GET /api/auth/verify-email/:token`

**Uso:** Link enviado por email, redireciona usuário para completar cadastro

**Response (HTML):** Página de sucesso ou erro

---

**Endpoint:** `POST /api/users/complete-registration/:token`

**Request Body - Etapa 3:**
```json
{
  "cpf": "12345678900",
  "phone": "11999999999",
  "birthDate": "1990-01-15",
  "gender": "FEMALE",
  "password": "senhaSegura123",
  "address": {
    "zipCode": "01310100",
    "street": "Rua Exemplo",
    "number": "123",
    "complement": "Apto 45",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP"
  }
}
```

**Response:**
```json
{
  "message": "Cadastro concluído com sucesso!",
  "user": {
    "id": "uuid",
    "name": "Maria Silva",
    "email": "maria@email.com",
    "role": "PATIENT",
    "status": "ACTIVE",
    "clinicId": "uuid-clinica"
  }
}
```

**Validações:**
- CPF válido e único
- Telefone formato brasileiro
- Senha mínimo 6 caracteres
- Gender: MALE | FEMALE | OTHER | PREFER_NOT_SAY

---

#### 1.2. Convite de Profissional (Admin)

**Endpoint:** `POST /api/users/invite/professional`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Dr. João Santos",
  "email": "joao@clinica.com",
  "specialtyId": "uuid-especialidade" // opcional
}
```

**Response:**
```json
{
  "message": "Convite enviado com sucesso",
  "userId": "uuid",
  "invitationSent": true
}
```

**Permissões:** Somente ADMIN ou OWNER

---

#### 1.3. Convite de Recepcionista (Admin)

**Endpoint:** `POST /api/users/invite/receptionist`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Ana Costa",
  "email": "ana@clinica.com"
}
```

**Permissões:** Somente ADMIN ou OWNER

---

### 2. Sistema de Login e Autenticação

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senhaSegura123"
}
```

**Response (Sucesso):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Maria Silva",
    "email": "maria@email.com",
    "role": "PATIENT",
    "clinicId": "uuid-clinica",
    "clinicName": "Clínica Exemplo"
  }
}
```

**Response (Erro):**
```json
{
  "error": "Email ou senha incorretos"
}
```

**Validações:**
- Email obrigatório e válido
- Senha obrigatória (mínimo 6 caracteres)
- Usuário deve ter status ACTIVE

**Token JWT:**
- Payload: `{ userId, clinicId, role }`
- Validade: Não expira (implementar refresh token no futuro)
- Usar em todas requisições autenticadas: `Authorization: Bearer <token>`

---

### 3. Estrutura de Dados (Models)

#### User
```typescript
{
  id: string (UUID)
  name: string
  email: string (único)
  password: string (hash bcrypt)
  cpf?: string (único)
  phone?: string
  birthDate?: Date
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_SAY"
  role: "ADMIN" | "PROFESSIONAL" | "RECEPTIONIST" | "PATIENT"
  status: "ACTIVE" | "INACTIVE" | "PENDING_ACTIVATION"
  clinicId: string
  specialtyId?: string (apenas Professional)
  verificationToken?: string
  verificationTokenExpiry?: Date
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

#### Clinic
```typescript
{
  id: string (UUID)
  tradeName: string
  legalName: string
  cnpj: string (único)
  phone: string
  email: string
  createdAt: Date
  updatedAt: Date
}
```

#### Address
```typescript
{
  id: string (UUID)
  userId: string
  zipCode: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string (2 letras)
  createdAt: Date
  updatedAt: Date
}
```

---

## 🔧 COMO O FRONTEND DEVE INTEGRAR

### 1. Fluxo de Cadastro de Paciente (Público)

**Tela 1: Etapa 1 - Dados Iniciais**
```typescript
// Buscar lista de clínicas (endpoint futuro)
// Por enquanto, usar clinicId fixo para testes

const response = await fetch('http://localhost:3000/api/users/register/patient', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinicId: 'uuid-clinica-teste',
    name: formData.name,
    email: formData.email
  })
});

if (response.ok) {
  // Redirecionar para tela de "Verifique seu email"
  navigate('/register/verify-email', { state: { email: formData.email } });
}
```

**Tela 2: Aguardando Verificação**
- Mostrar mensagem: "Enviamos um email para [email]"
- Botão "Reenviar email" (chamar mesmo endpoint novamente)
- Instruções para verificar spam

**Tela 3: Completar Cadastro**
- Acessada via link do email: `/complete-registration/:token`
- Formulário com CPF, telefone, data nascimento, gênero, senha, endereço

```typescript
const response = await fetch(`http://localhost:3000/api/users/complete-registration/${token}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cpf: formData.cpf,
    phone: formData.phone,
    birthDate: formData.birthDate,
    gender: formData.gender,
    password: formData.password,
    address: formData.address
  })
});

if (response.ok) {
  // Redirecionar para login ou dashboard
  navigate('/login');
}
```

---

### 2. Fluxo de Login

**Tela: Login**
```typescript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: formData.email,
    password: formData.password
  })
});

const data = await response.json();

if (response.ok) {
  // Salvar token no localStorage ou contexto
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  // Redirecionar baseado no role
  if (data.user.role === 'PATIENT') {
    navigate('/patient/dashboard');
  } else {
    navigate('/admin/dashboard');
  }
} else {
  // Mostrar erro
  showError(data.error);
}
```

---

### 3. Requisições Autenticadas

**Sempre incluir header Authorization:**
```typescript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/endpoint', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

### 4. Tratamento de Erros

**Códigos HTTP:**
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação (verificar `response.error`)
- `401` - Não autenticado (redirecionar para login)
- `403` - Sem permissão
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

**Exemplo de tratamento:**
```typescript
try {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token inválido ou expirado
      localStorage.clear();
      navigate('/login');
      return;
    }
    
    throw new Error(data.error || 'Erro desconhecido');
  }
  
  return data;
} catch (error) {
  console.error(error);
  showToast('Erro ao processar requisição', 'error');
}
```

---

## 📋 O QUE PRECISA SER IMPLEMENTADO NO FRONTEND

### Prioridade Alta (MVP)

#### 1. Sistema de Autenticação
- [x] Tela de Login
- [x] Tela de Registro Paciente (3 etapas)
- [ ] Proteção de rotas (PrivateRoute)
- [ ] Context de autenticação (AuthContext)
- [ ] Logout
- [ ] Persistência do token
- [ ] Validação de token expirado

#### 2. Dashboard por Role
- [ ] Dashboard Admin
  - Cards com estatísticas (mock inicial)
  - Menu lateral com navegação
  - Listagem de usuários
- [ ] Dashboard Paciente
  - Cards de ações (Meus Agendamentos, Novo Agendamento, etc)
  - Perfil simplificado

#### 3. Gestão de Usuários (Admin)
- [ ] Listagem de usuários
  - Filtros por role e status
  - Busca por nome/email
  - Paginação
- [ ] Modal de convite Profissional
- [ ] Modal de convite Recepcionista
- [ ] Visualizar detalhes do usuário
- [ ] Editar usuário (futuro)
- [ ] Desativar/Ativar usuário (futuro)

#### 4. Notificações (Toasts)
- [ ] Sistema de notificações
  - Sucesso (verde)
  - Erro (vermelho)
  - Aviso (amarelo)
  - Info (azul)

#### 5. Componentes Reutilizáveis
- [ ] Input com validação
- [ ] Select/Dropdown
- [ ] Button (variantes: primary, secondary, outline)
- [ ] Card
- [ ] Modal
- [ ] Badge (status, roles)
- [ ] Loading spinner
- [ ] Stepper (progresso de cadastro)

---

### Prioridade Média

#### 6. Perfil do Usuário
- [ ] Visualizar perfil
- [ ] Editar dados pessoais
- [ ] Alterar senha
- [ ] Upload de foto (futuro)

#### 7. Validações e Máscaras
- [ ] CPF (000.000.000-00)
- [ ] Telefone ((00) 00000-0000)
- [ ] CEP (00000-000)
- [ ] Data (DD/MM/AAAA)
- [ ] Força da senha (indicador visual)

#### 8. Responsividade
- [ ] Layout mobile para todas as telas
- [ ] Menu hamburguer no mobile
- [ ] Cards adaptativos

---

### Prioridade Baixa (Melhorias)

- [ ] Modo escuro (dark mode)
- [ ] Animações de transição
- [ ] Testes unitários
- [ ] Testes E2E
- [ ] Acessibilidade (ARIA labels)
- [ ] Internacionalização (i18n)

---

## 🚀 FUNCIONALIDADES FUTURAS NO BACKEND

### Em Planejamento

#### 1. Endpoints de Usuário
- `GET /api/users` - Listar usuários (com filtros)
- `GET /api/users/:id` - Buscar usuário específico
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário (soft delete)
- `PATCH /api/users/:id/status` - Ativar/Desativar usuário
- `PATCH /api/users/:id/password` - Alterar senha
- `GET /api/users/me` - Dados do usuário logado

#### 2. Endpoints de Clínica
- `POST /api/clinics` - Cadastrar clínica (registro de dono)
- `GET /api/clinics` - Listar clínicas (público, para dropdown)
- `GET /api/clinics/:id` - Buscar clínica específica
- `PUT /api/clinics/:id` - Atualizar clínica
- `DELETE /api/clinics/:id` - Deletar clínica

#### 3. Especialidades (Specialty)
- `POST /api/specialties` - Criar especialidade
- `GET /api/specialties` - Listar especialidades
- `PUT /api/specialties/:id` - Atualizar especialidade
- `DELETE /api/specialties/:id` - Deletar especialidade

#### 4. Procedimentos (Procedure)
- `POST /api/procedures` - Criar procedimento
- `GET /api/procedures` - Listar procedimentos
- `PUT /api/procedures/:id` - Atualizar procedimento
- `DELETE /api/procedures/:id` - Deletar procedimento

#### 5. Agendamentos (Appointment)
- `POST /api/appointments` - Criar agendamento
- `GET /api/appointments` - Listar agendamentos (filtros: data, profissional, status)
- `GET /api/appointments/:id` - Buscar agendamento específico
- `PUT /api/appointments/:id` - Atualizar agendamento
- `PATCH /api/appointments/:id/status` - Confirmar/Cancelar/Finalizar
- `GET /api/professionals/:id/availability` - Horários disponíveis

#### 6. Autenticação Avançada
- `POST /api/auth/refresh-token` - Renovar token
- `POST /api/auth/logout` - Logout (invalidar token)
- `POST /api/auth/forgot-password` - Recuperar senha
- `POST /api/auth/reset-password/:token` - Redefinir senha

#### 7. Upload de Arquivos
- `POST /api/upload/avatar` - Upload de foto de perfil
- `POST /api/upload/document` - Upload de documentos

---

## 🎨 DESIGN

Os prompts para geração das telas estão no arquivo:
📄 [PROMPTS-DESIGN-TELAS.md](./PROMPTS-DESIGN-TELAS.md)

**Principais características do design:**
- **Cores:**
  - Primário: `#3B82F6` (Azul)
  - Secundário: `#10B981` (Verde)
  - Fundo: `#F9FAFB` (Cinza claro)
  - Texto: `#111827` (Cinza escuro)
- **Tipografia:** Inter ou SF Pro
- **Estilo:** Moderno, clean, minimalista, profissional para área da saúde

---

## 🛠️ TECNOLOGIAS RECOMENDADAS

### Frontend Stack Sugerido
- **Framework:** React 18+ com TypeScript
- **Estilização:** Styled Components (conforme requisitos)
- **Roteamento:** React Router v6
- **Estado Global:** Context API + useReducer (ou Zustand/Redux se preferir)
- **Requisições HTTP:** Axios ou Fetch API
- **Validação de Forms:** Yup + React Hook Form
- **Máscaras:** react-input-mask
- **Datas:** date-fns
- **Notificações:** react-toastify ou sonner
- **Ícones:** lucide-react ou react-icons

### Estrutura de Pastas Sugerida
```
src/
├── components/          # Componentes reutilizáveis
│   ├── Button/
│   │   ├── index.tsx
│   │   └── styles.ts
│   ├── Input/
│   ├── Modal/
│   └── ...
├── pages/              # Páginas/Rotas
│   ├── Login/
│   ├── Register/
│   ├── Dashboard/
│   └── ...
├── contexts/           # Contexts (Auth, Theme, etc)
├── services/           # Integração com API
│   └── api.ts
├── hooks/              # Custom hooks
├── utils/              # Funções utilitárias
├── types/              # TypeScript types
├── routes/             # Configuração de rotas
└── styles/             # Tema global, cores, etc
```

---

## 📞 CONTATO E DÚVIDAS

**Backend:**
- Repositório: MinhaClinica-api
- Porta: `3000`
- Documentação completa: [docs/README.md](./README.md)

**Para dúvidas sobre:**
- Endpoints: Ver [INICIO-RAPIDO.md](./INICIO-RAPIDO.md)
- Implementação backend: Ver [RELATORIO-IMPLEMENTACAO-USUARIOS.md](./RELATORIO-IMPLEMENTACAO-USUARIOS.md)

---

## ✅ CHECKLIST DE INTEGRAÇÃO

### Antes de Começar
- [ ] Ler este documento completo
- [ ] Verificar os prompts de design
- [ ] Configurar ambiente de desenvolvimento
- [ ] Testar endpoints no Postman/Insomnia

### Durante Desenvolvimento
- [ ] Implementar AuthContext primeiro
- [ ] Criar serviço de API centralizado
- [ ] Implementar proteção de rotas
- [ ] Testar fluxos completos (cadastro → login → dashboard)
- [ ] Validar tratamento de erros
- [ ] Implementar loading states

### Antes de Entregar
- [ ] Testar todos os fluxos de usuário
- [ ] Validar responsividade mobile
- [ ] Verificar acessibilidade básica
- [ ] Testar em diferentes navegadores
- [ ] Documentar componentes principais

---

**Última atualização:** 9 de fevereiro de 2026  
**Versão da API:** 1.0.0
