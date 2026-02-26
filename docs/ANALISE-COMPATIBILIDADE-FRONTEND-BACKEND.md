# 🔍 Análise de Compatibilidade: Frontend (Figma) vs Backend

**Data:** 17 de fevereiro de 2026  
**Objetivo:** Verificar se o backend suporta as telas implementadas no Figma

---

## ✅ RESUMO EXECUTIVO

### Status Geral: 🟡 **PARCIALMENTE COMPATÍVEL**

O backend possui a estrutura necessária, mas **FALTAM implementações importantes**:

1. ✅ Sistema de verificação de email está implementado
2. ✅ Endpoints de registro de paciente (etapa 1 e 3) existem
3. ✅ **CONCLUÍDO: Campos do schema de paciente adicionados**
4. ❌ **FALTA: Endpoint para REENVIAR token de verificação**
5. ❌ **FALTA: Endpoints completos de cadastro de CLÍNICA (owner)**

---

## 📊 ANÁLISE POR MÓDULO

### 🔓 1. TELAS PÚBLICAS / AUTH (5 rotas)

#### ✅ Home (/)
- **Status:** ✅ Não depende de backend
- **Landing page estática**

#### ✅ Login (/login)
- **Status:** ✅ **COMPATÍVEL**
- **Backend:** `POST /api/auth/login`
- **Controller:** `authController.login()`
- **Service:** `LoginService`
- **Schema:** `loginSchema`
- **Campos esperados:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Resposta:**
  ```json
  {
    "token": "jwt...",
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "PATIENT|PROFESSIONAL|RECEPTIONIST|ADMIN",
      "clinicId": "uuid",
      "clinicName": "string"
    }
  }
  ```

#### ⚠️ RegisterStep1 (/register)
- **Status:** ⚠️ **PARCIALMENTE COMPATÍVEL**
- **Figma mostra:** Apenas Nome completo + Email
- **Backend implementado:** 
  - Para PACIENTE: `POST /api/patients/register`
  - Para CLÍNICA: ❌ **NÃO IMPLEMENTADO**

**❗ PROBLEMA IDENTIFICADO:**

O Figma não especifica se o cadastro inicial é para:
1. Paciente se cadastrando OU
2. Dono da clínica se cadastrando

**Decisão necessária:** O frontend precisa definir qual fluxo será usado em `/register`

**Opção A - Cadastro de Paciente (já implementado):**
```http
POST /api/patients/register
{
  "clinicId": "uuid-da-clinica", // ⚠️ Precisa selecionar clínica antes
  "name": "João Silva",
  "email": "joao@email.com"
}
```

**Opção B - Cadastro de Clínica + Owner (NÃO implementado):**
```http
POST /api/clinics/register  # ❌ ENDPOINT NÃO EXISTE
{
  "ownerName": "Dr. Roberto",
  "ownerEmail": "roberto@email.com",
  "clinicName": "Clínica Exemplo"
}
```

#### ❌ VerifyEmail (/verify-email)
- **Status:** 🟡 **PARCIALMENTE IMPLEMENTADO**
- **Backend:** `GET /api/auth/verify-email/:token`
- **Service:** `VerifyEmailService`

**✅ O que está implementado:**
```http
GET /api/auth/verify-email/abc123token
```

**Resposta:**
```json
{
  "userId": "uuid",
  "name": "João Silva",
  "email": "joao@email.com",
  "role": "PATIENT",
  "message": "Email verificado com sucesso. Complete seu cadastro."
}
```

**❌ O que FALTA (Figma pede):**

1. **Endpoint para REENVIAR email:**
   ```http
   POST /api/auth/resend-verification  # ❌ NÃO EXISTE
   {
     "email": "joao@email.com"
   }
   ```
   
   **Comportamento esperado:**
   - Buscar usuário com status PENDING_ACTIVATION
   - Gerar novo token (invalidar anterior)
   - Enviar novo email
   - Retornar sucesso
   
2. **Rate limiting:** Prevenir spam (máximo 3 reenvios por hora)

#### ⚠️ CompleteData (/complete-data)
- **Status:** ⚠️ **ESTRUTURA DIFERENTE**
- **Figma mostra:** 3 abas em uma única tela
- **Backend implementado:** Endpoint único que recebe tudo

**Backend:**
```http
POST /api/patients/complete
{
  "userId": "uuid",  // ⚠️ ATENÇÃO: precisa vir do token de verificação
  
  // Dados Pessoais (Aba 1)
  "cpf": "12345678901",
  "phone": "11999999999",
  "password": "senha123",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE",
  
  // Endereço (Aba 2)
  "zipCode": "01310100",
  "street": "Av Paulista",
  "number": "1000",
  "complement": "Apto 101",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  
  // Info Médicas (Aba 3)
  "bloodType": "A+",
  "allergies": "Penicilina",
  "medications": "Losartana 50mg",
  "conditions": "Hipertensão",
  "observations": "Paciente controlado",
  "emergencyContactName": "Maria Silva",
  "emergencyContactPhone": "11988888888"
}
```

**✅ STATUS: TOTALMENTE COMPATÍVEL**

Todos os campos mostrados no Figma agora estão implementados no backend.

---

### 🏢 2. CADASTRO DE CLÍNICA + OWNER

**Status:** ❌ **IMPLEMENTAÇÃO INCOMPLETA**

#### O que o Figma mostra:

**Fluxo "Cadastrar Minha Clínica" (da Home):**
1. Registro Inicial → Dados da clínica + email do dono
2. Verificação de Email → Link enviado para email do dono
3. Completar Dados → Dados completos da clínica + senha do dono
4. ✅ Pronto → Acessa área de Owner

#### O que o Backend tem:

**✅ CRUD de Clínica existe:**
```http
POST /api/clinics/create    # Cria clínica
GET /api/clinics/:id        # Busca clínica
PUT /api/clinics/:id        # Atualiza clínica
DELETE /api/clinics/:id     # Deleta clínica
```

**❌ MAS NÃO TEM o fluxo em etapas:**

O endpoint atual `POST /api/clinics/create` espera TODOS os dados de uma vez:
```json
{
  "legalName": "Clínica Exemplo LTDA",
  "tradeName": "Clínica Exemplo",
  "cnpj": "12345678000190",
  "email": "contato@clinica.com",
  "phone": "11999999999",
  "zipCode": "01310100",
  "street": "Av Paulista",
  "number": "1000",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP"
  // ... muitos outros campos
}
```

**❌ E NÃO cria o usuário OWNER automaticamente!**

#### O que PRECISA SER IMPLEMENTADO:

1. **Endpoint de Registro Inicial de Clínica:**
```http
POST /api/clinics/register
{
  "ownerName": "Dr. Roberto Silva",
  "ownerEmail": "roberto@email.com",
  "clinicName": "Clínica Exemplo"
}
```

**Comportamento:**
- Criar registro temporário na tabela `Clinic` (status PENDING_VERIFICATION)
- Gerar token de verificação
- Enviar email para o owner
- Retornar mensagem de sucesso

2. **Verificação de Email (já existe, mas precisa suportar clínica):**
```http
GET /api/auth/verify-email/:token?type=clinic
```

3. **Endpoint para Completar Dados da Clínica:**
```http
POST /api/clinics/complete
{
  "clinicId": "uuid",  // do token de verificação
  
  // Dados da Clínica
  "legalName": "Clínica Exemplo LTDA",
  "cnpj": "12345678000190",
  "phone": "11999999999",
  "zipCode": "01310100",
  "street": "Av Paulista",
  "number": "1000",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  
  // Dados do Owner
  "ownerCpf": "12345678901",
  "ownerPhone": "11999999999",
  "ownerPassword": "senha123"
}
```

**Comportamento:**
- Atualizar dados da clínica (status = ACTIVE)
- Criar usuário com role=ADMIN
- Vincular usuário à clínica
- Retornar token de autenticação (auto-login)

---

### 👤 3. ÁREA DO PACIENTE (7 rotas)

#### Status Geral: ❌ **NÃO IMPLEMENTADO**

**Rotas necessárias:**
```
GET /api/patient/home              # ❌ Dashboard do paciente
GET /api/patient/appointments      # ❌ Listar agendamentos
POST /api/patient/appointments     # ❌ Criar agendamento
PUT /api/patient/appointments/:id  # ❌ Editar agendamento
DELETE /api/patient/appointments/:id # ❌ Cancelar agendamento
GET /api/patient/history           # ❌ Histórico de consultas
GET /api/patient/profile           # ❌ Perfil do paciente
PUT /api/patient/profile           # ❌ Editar perfil
GET /api/patient/notifications     # ❌ Notificações
POST /api/patient/appointments/:id/confirm # ❌ Confirmar presença
```

**Observação:** O módulo de agendamentos (Appointment) é complexo e ainda não foi implementado.

---

### 👨‍⚕️ 4. ÁREA DO PROFISSIONAL (5 rotas)

#### Status Geral: ❌ **NÃO IMPLEMENTADO**

**Rotas necessárias:**
```
GET /api/professional/home           # ❌ Dashboard
GET /api/professional/schedule       # ❌ Agenda (lista/semana)
GET /api/professional/profile        # ❌ Perfil
PUT /api/professional/profile        # ❌ Editar perfil
GET /api/professional/comments       # ❌ Comentários sobre pacientes
POST /api/professional/comments      # ❌ Adicionar comentário
PUT /api/professional/comments/:id   # ❌ Editar comentário
DELETE /api/professional/comments/:id # ❌ Excluir comentário
POST /api/professional/reports       # ❌ Gerar laudo
```

---

### 🏥 5. ÁREA DO OWNER (7 rotas)

#### Status Geral: ❌ **PARCIALMENTE IMPLEMENTADO**

**✅ O que existe:**
- Login (pode usar endpoint genérico)
- CRUD de clínicas (mas não no formato esperado pelo Figma)

**❌ O que falta:**
```
GET /api/owner/home                         # ❌ Dashboard com stats
GET /api/owner/professionals                # ❌ Listar profissionais
POST /api/owner/professionals               # ❌ Adicionar profissional
PUT /api/owner/professionals/:id            # ❌ Editar profissional
DELETE /api/owner/professionals/:id         # ❌ Excluir profissional
GET /api/owner/patients                     # ❌ Listar pacientes
PUT /api/owner/patients/:id/toggle-status   # ❌ Ativar/desativar paciente
GET /api/owner/reports                      # ❌ Relatórios com filtros
GET /api/owner/settings                     # ❌ Configurações da clínica
PUT /api/owner/settings                     # ❌ Salvar configurações
GET /api/owner/profile                      # ❌ Perfil do owner
PUT /api/owner/profile                      # ❌ Editar perfil
```

**Observação sobre convites:**
O endpoint `POST /api/professionals/invite` existe, mas é chamado pelo ADMIN.
No Figma, na área do Owner, é `/api/owner/professionals` que deve chamar este serviço por baixo dos panos.

---

### 🎫 6. ÁREA DA RECEPÇÃO (7 rotas)

#### Status Geral: ❌ **NÃO IMPLEMENTADO**

Todas as rotas da recepção dependem do módulo de agendamentos que ainda não foi criado.

---

## 📋 CHECKLIST DE PENDÊNCIAS CRÍTICAS

### ✅ CONCLUÍDO

- [x] **Adicionar campos faltantes no schema de paciente**
  - ✅ `bloodType` (String, opcional)
  - ✅ `medications` (String, opcional)
  - ✅ `conditions` (String, opcional)
  - ✅ `emergencyContactName` (String, opcional)
  - ✅ `emergencyContactPhone` (String, opcional)
  - ✅ Migration criada e aplicada
  - ✅ Schema Yup atualizado
  - ✅ Service e Repository atualizados

### 🔴 ALTA PRIORIDADE (Bloqueiam frontend)

- [ ] **Criar endpoint de REENVIO de token de verificação**
  - `POST /api/auth/resend-verification`
  - Rate limiting (máximo 3 por hora)
  
- [ ] **Implementar fluxo de cadastro de CLÍNICA em 3 etapas**
  - `POST /api/clinics/register` - Registro inicial
  - Suportar type=clinic no `/api/auth/verify-email/:token`
  - `POST /api/clinics/complete` - Completar dados + criar owner
  
- [ ] **Adicionar campos faltantes no schema de paciente**
  - `bloodType` (String, opcional)
  - `medications` (String, opcional)
  - `conditions` (String, opcional)
  - `emergencyContactName` (String, opcional)
  - `emergencyContactPhone` (String, opcional)

### 🟡 MÉDIA PRIORIDADE (Podem ser mockados temporariamente)

- [ ] **Módulo de Agendamentos (Appointment)**
  - CRUD completo
  - Check-in
  - Confirmação
  - Reagendamento
  - Cancelamento
  
- [ ] **Endpoints de Dashboard**
  - Stats para paciente
  - Stats para profissional
  - Stats para owner
  - Stats para recepção
  
- [ ] **Módulo de Relatórios**
  - Relatórios do owner
  - Exportação PDF

### 🟢 BAIXA PRIORIDADE (Features secundárias)

- [ ] **Sistema de Notificações completo**
- [ ] **Sistema de Comentários (profissional sobre paciente)**
- [ ] **Gestão de Especialidades e Procedimentos**
- [ ] **Configurações avançadas da clínica**

---

## 🎯 RECOMENDAÇÕES PARA CONTINUAR

### Para o Frontend:

1. **Deixar claro na tela /register se é:**
   - Cadastro de Paciente (já funciona) OU
   - Cadastro de Clínica (precisa implementar)
   - Sugestão: Criar 2 botões distintos: "Sou Paciente" e "Cadastrar Minha Clínica"

2. **Implementar o botão "Reenviar Email" mas avisar que:**
   - Backend ainda não tem o endpoint
   - Pode mockar temporariamente com timer de 60s

3. **Usar dados mockados para:**
   - Dashboards (stats)
   - Agendamentos
   - Histórico
   - Relatórios
   
   *Depois o backend vai prover endpoints reais*

### Para o Backend:

1. **URGENTE: Implementar HOJE**
   ```
   ✅ POST /api/auth/resend-verification  (2-3 horas)
   ✅ POST /api/clinics/register          (3-4 horas)
   ✅ POST /api/clinics/complete          (3-4 horas)
   ✅ Adicionar campos no patientSchema   (30 min)
   ```

2. **Semana que vem:**
   - Módulo de Agendamentos (complexo - 1 semana)
   - Endpoints de Dashboard (2-3 dias)

3. **Próximas 2 semanas:**
   - Módulo de Relatórios
   - Sistema de Notificações
   - Gestão de Especialidades

---

## 💡 SOLUÇÃO RÁPIDA PARA DESBLOQUEAR FRONTEND

### Opção 1: Backend implementa os 3 endpoints críticos (1 dia)

**Vantagem:** Frontend pode prosseguir com fluxo real  
**Desvantagem:** Backend precisa parar outras tasks

### Opção 2: Frontend mockea temporariamente (algumas horas)

**Vantagem:** Frontend não fica bloqueado  
**Desvantagem:** Precisará refatorar depois para chamar API real

**Sugestão de mock para reenviar email:**

```typescript
// frontend/services/auth.ts
async resendVerificationEmail(email: string) {
  // TODO: Substituir por chamada real quando backend implementar
  console.warn('⚠️ MOCK: Reenviar email não implementado no backend ainda');
  
  // Simula delay de API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: 'Email reenviado com sucesso (MOCK)'
  };
}
```

---

## 📞 PRÓXIMOS PASSOS

### Reunião de Alinhamento Necessária

**Participantes:** Frontend Lead + Backend Lead  
**Duração:** 30 minutos  
**Agenda:**

1. Definir fluxo de cadastro inicial: Paciente vs Clínica
2. Priorizar endpoints críticos
3. Decidir: Mock ou Wait?
4. Definir cronograma do módulo de Agendamentos

### Perguntas para o Frontend:

1. A tela `/register` é para paciente ou para clínica?
2. Podem trabalhar com mocks de dashboard/agendamentos por enquanto?
3. Qual módulo é mais crítico: Agendamentos ou Relatórios?

### Perguntas para o Backend:

1. Quantas horas para implementar os 3 endpoints críticos?
2. Quando pode iniciar o módulo de Agendamentos?
3. Precisa de ajuda com alguma parte?

---

## 📄 ANEXOS

### A. Estrutura de Resposta Esperada (Padronização)

Todas as respostas devem seguir este formato:

**Sucesso:**
```json
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "data": { ... }
}
```

**Erro:**
```json
{
  "success": false,
  "message": "Descrição do erro",
  "errors": ["Detalhe 1", "Detalhe 2"]
}
```

### B. ✅ Campos do Schema Patient - CONCLUÍDO

**Status:** Todos os campos foram adicionados com sucesso!

**Arquivos atualizados:**
- ✅ `prisma/schema.prisma` - Model Patient
- ✅ `src/schemas/patientSchema.ts` - Schema de validação
- ✅ `src/services/patients/patientRegistrationService.ts` - Service
- ✅ `src/repository/patientRepository.ts` - Repository
- ✅ Migration criada e aplicada

**Campos adicionados:**
- `bloodType` - Tipo sanguíneo (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `medications` - Medicamentos em uso
- `conditions` - Condições de saúde
- `emergencyContactName` - Nome do contato de emergência
- `emergencyContactPhone` - Telefone do contato de emergência

---

**Documento criado por:** GitHub Copilot  
**Última atualização:** 17 de fevereiro de 2026
