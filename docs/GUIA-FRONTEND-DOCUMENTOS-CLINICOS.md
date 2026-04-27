# Guia de Integração Frontend — Módulo de Documentos Clínicos

> **Base URL:** `https://sua-api.com/api`  
> Todos os endpoints exigem o header `Authorization: Bearer <token>` obtido no login.

---

## Índice

1. [Visão Geral do Módulo](#1-visão-geral-do-módulo)
2. [Tipos e Enums](#2-tipos-e-enums)
3. [Estrutura dos Documentos (content)](#3-estrutura-dos-documentos-content)
4. [Fluxo Principal — Do Atendimento à Conclusão](#4-fluxo-principal--do-atendimento-à-conclusão)
5. [Fluxo de Adendo](#5-fluxo-de-adendo)
6. [Permissões por Papel](#6-permissões-por-papel)
7. [Referência de Endpoints](#7-referência-de-endpoints)
8. [Formato de Erros](#8-formato-de-erros)
9. [Exemplos Completos por Tipo de Documento](#9-exemplos-completos-por-tipo-de-documento)

---

## 1. Visão Geral do Módulo

### Ciclo de vida de uma consulta com documentos

```
Appointment (IN_PROGRESS)
    │
    ├── POST /appointments/:id/documents   → cria documento (DRAFT)
    ├── PUT  /appointments/:id/documents/:docId   → edita (DRAFT ou FINALIZED)
    ├── PATCH /appointments/:id/documents/:docId/finalize  → DRAFT → FINALIZED
    │
    └── POST /appointments/:id/conclude   → transação atômica:
            ├── FINALIZED → SENT (com hash SHA-256)
            ├── DRAFTs permanecem como DRAFT ⚠️ alertar profissional
            └── Appointment → COMPLETED

Appointment (COMPLETED / COMPLETED_WITH_ADDENDUM)
    │
    └── POST /appointments/:id/addendum   → cria adendo (ADDENDUM, imutável)
            └── Appointment → COMPLETED_WITH_ADDENDUM
```

### Regras críticas (validadas pelo backend, não apenas pelo front)

| Situação | Comportamento |
|---|---|
| Criar/editar doc em consulta COMPLETED | Retorna `403` |
| Editar doc com status SENT ou ADDENDUM | Retorna `403` |
| Criar adendo em consulta IN_PROGRESS | Retorna `403` |
| Editar doc de outro profissional | Retorna `403` + log de auditoria |
| PATIENT tentar ver doc em DRAFT/FINALIZED | Retorna `403` |

---

## 2. Tipos e Enums

### `DocumentType` — Tipo do documento

| Valor | Descrição |
|---|---|
| `CLINICAL_REPORT` | Relatório clínico |
| `EXAM` | Exame |
| `CERTIFICATE` | Atestado |
| `DECLARATION` | Declaração |
| `PRESCRIPTION` | Receita |
| `CONTROLLED_PRESCRIPTION` | Receita de controle especial |
| `REFERRAL` | Encaminhamento |
| `REPORT` | Laudo |
| `CONSENT_FORM` | Termo de consentimento |
| `TREATMENT_PLAN` | Plano de tratamento |
| `BUDGET` | Orçamento |

### `DocumentStatus` — Status do documento

| Valor | Descrição | Editável? |
|---|---|---|
| `DRAFT` | Rascunho | ✅ Sim |
| `FINALIZED` | Finalizado (pronto para enviar) | ✅ Sim¹ |
| `SENT` | Enviado ao paciente | ❌ Imutável |
| `ADDENDUM` | Adendo (pós-conclusão) | ❌ Imutável |

> ¹ Documentos `FINALIZED` ainda podem ser editados enquanto a consulta estiver `IN_PROGRESS`.

### `AppointmentStatus` — Status da consulta (valores novos relevantes)

| Valor | Descrição |
|---|---|
| `IN_PROGRESS` | Consulta em andamento — documentos podem ser criados/editados |
| `COMPLETED` | Consulta concluída — apenas adendos permitidos |
| `COMPLETED_WITH_ADDENDUM` | Consulta concluída com adendo(s) |

---

## 3. Estrutura dos Documentos (content)

O campo `content` é um **objeto JSON livre**. O backend armazena qualquer estrutura.  
Abaixo estão os modelos sugeridos para cada tipo. O frontend pode adotar esses campos para renderizar formulários e para geração de PDF.

### `CERTIFICATE` — Atestado

```json
{
  "patientName": "João Silva",
  "cpf": "123.456.789-00",
  "cid": "J06.9",
  "diagnosisDescription": "Infecção das vias aéreas superiores",
  "daysOfRest": 3,
  "startDate": "2026-04-16",
  "endDate": "2026-04-19",
  "observations": "Repouso e hidratação.",
  "professionalName": "Dra. Ana Lima",
  "professionalCouncil": "CRM-SP 123456",
  "issuedAt": "2026-04-16"
}
```

### `PRESCRIPTION` — Receita

```json
{
  "patientName": "João Silva",
  "cpf": "123.456.789-00",
  "medications": [
    {
      "name": "Amoxicilina 500mg",
      "dosage": "1 cápsula",
      "frequency": "a cada 8 horas",
      "duration": "7 dias",
      "instructions": "Tomar durante as refeições"
    },
    {
      "name": "Dipirona 500mg",
      "dosage": "1 comprimido",
      "frequency": "a cada 6 horas (se dor ou febre)",
      "duration": "5 dias",
      "instructions": null
    }
  ],
  "professionalName": "Dra. Ana Lima",
  "professionalCouncil": "CRM-SP 123456",
  "issuedAt": "2026-04-16"
}
```

### `CONTROLLED_PRESCRIPTION` — Receita de Controle Especial

```json
{
  "patientName": "João Silva",
  "cpf": "123.456.789-00",
  "patientAddress": "Rua das Flores, 123 – São Paulo/SP",
  "medications": [
    {
      "name": "Clonazepam 0,5mg",
      "dosage": "1 comprimido",
      "frequency": "à noite",
      "duration": "30 dias",
      "quantity": "30 comprimidos"
    }
  ],
  "notificationNumber": "A-SP-0012345",
  "professionalName": "Dr. Carlos Melo",
  "professionalCouncil": "CRM-SP 654321",
  "issuedAt": "2026-04-16"
}
```

### `REFERRAL` — Encaminhamento

```json
{
  "patientName": "João Silva",
  "cpf": "123.456.789-00",
  "referredTo": "Cardiologia",
  "targetProfessional": null,
  "reason": "Avaliação de sopro cardíaco identificado em ausculta.",
  "urgency": "ELECTIVE",
  "cid": "R01.1",
  "clinicalHistory": "Paciente de 45 anos, HAS em tratamento.",
  "professionalName": "Dra. Ana Lima",
  "professionalCouncil": "CRM-SP 123456",
  "issuedAt": "2026-04-16"
}
```

> `urgency`: `"ELECTIVE"` | `"URGENT"` | `"EMERGENCY"`

### `EXAM` — Pedido de Exame

```json
{
  "patientName": "João Silva",
  "cpf": "123.456.789-00",
  "exams": [
    {
      "code": "HEMOGRAMA",
      "name": "Hemograma completo",
      "instructions": "Jejum de 4 horas"
    },
    {
      "code": "GLICEMIA",
      "name": "Glicemia em jejum",
      "instructions": "Jejum de 8 horas"
    }
  ],
  "clinicalIndication": "Investigação de anemia e controle glicêmico.",
  "cid": "D50.9",
  "urgency": "ROUTINE",
  "professionalName": "Dra. Ana Lima",
  "professionalCouncil": "CRM-SP 123456",
  "issuedAt": "2026-04-16"
}
```

### `REPORT` — Laudo

```json
{
  "patientName": "João Silva",
  "cpf": "123.456.789-00",
  "examType": "Eletrocardiograma",
  "examDate": "2026-04-15",
  "findings": "Ritmo sinusal, FC 72 bpm. Sem alterações isquêmicas.",
  "conclusion": "Eletrocardiograma dentro dos limites da normalidade.",
  "cid": null,
  "professionalName": "Dr. Carlos Melo",
  "professionalCouncil": "CRM-SP 654321",
  "issuedAt": "2026-04-16"
}
```

### `CLINICAL_REPORT` — Relatório Clínico

```json
{
  "patientName": "João Silva",
  "cpf": "123.456.789-00",
  "purpose": "Relatório para fins previdenciários",
  "anamnesis": "Paciente refere dor lombar há 6 meses com irradiação para MIE.",
  "physicalExam": "Lasègue positivo à direita. Força muscular preservada.",
  "complementaryExams": "RNM de coluna lombar: protrusão discal L4-L5.",
  "cid": "M51.1",
  "treatment": "Fisioterapia e AINE.",
  "prognosis": "Favorável com adesão ao tratamento.",
  "professionalName": "Dr. Carlos Melo",
  "professionalCouncil": "CRM-SP 654321",
  "issuedAt": "2026-04-16"
}
```

### `DECLARATION` — Declaração de Comparecimento

```json
{
  "patientName": "João Silva",
  "cpf": "123.456.789-00",
  "declarationType": "ATTENDANCE",
  "attendanceDate": "2026-04-16",
  "arrivalTime": "09:30",
  "departureTime": "10:15",
  "purpose": "Consulta médica",
  "professionalName": "Dra. Ana Lima",
  "professionalCouncil": "CRM-SP 123456",
  "issuedAt": "2026-04-16"
}
```

> `declarationType`: `"ATTENDANCE"` | `"INCAPACITY"` | `"MEDICAL_FOLLOW_UP"`

### `CONSENT_FORM` — Termo de Consentimento

```json
{
  "patientName": "João Silva",
  "cpf": "123.456.789-00",
  "procedureName": "Biópsia excisional",
  "procedureDescription": "Remoção de lesão pigmentada em dorso para análise histopatológica.",
  "risks": "Infecção, cicatriz, sangramento, reação anestésica.",
  "benefits": "Diagnóstico preciso e tratamento adequado.",
  "alternatives": "Acompanhamento clínico sem intervenção.",
  "patientAcknowledged": true,
  "witnessName": null,
  "professionalName": "Dra. Ana Lima",
  "professionalCouncil": "CRM-SP 123456",
  "issuedAt": "2026-04-16"
}
```

### `TREATMENT_PLAN` — Plano de Tratamento

```json
{
  "patientName": "João Silva",
  "cpf": "123.456.789-00",
  "diagnosis": "Diabetes Mellitus tipo 2 (E11)",
  "cid": "E11",
  "goals": [
    "Controle glicêmico (HbA1c < 7%)",
    "Redução de peso corporal em 5% em 6 meses"
  ],
  "interventions": [
    {
      "type": "MEDICATION",
      "description": "Metformina 850mg 2x ao dia"
    },
    {
      "type": "LIFESTYLE",
      "description": "Dieta hipocalórica e atividade física 150 min/semana"
    },
    {
      "type": "MONITORING",
      "description": "Glicemia capilar em jejum diariamente"
    }
  ],
  "followUpIntervalDays": 90,
  "professionalName": "Dra. Ana Lima",
  "professionalCouncil": "CRM-SP 123456",
  "issuedAt": "2026-04-16"
}
```

### `BUDGET` — Orçamento

```json
{
  "patientName": "João Silva",
  "cpf": "123.456.789-00",
  "items": [
    {
      "description": "Consulta de retorno",
      "quantity": 1,
      "unitPrice": 250.00,
      "total": 250.00
    },
    {
      "description": "Aplicação de toxina botulínica",
      "quantity": 1,
      "unitPrice": 800.00,
      "total": 800.00
    }
  ],
  "subtotal": 1050.00,
  "discount": 0,
  "total": 1050.00,
  "validityDays": 30,
  "paymentMethods": ["PIX", "CREDIT_CARD"],
  "observations": "Orçamento válido por 30 dias.",
  "professionalName": "Dra. Ana Lima",
  "professionalCouncil": "CRM-SP 123456",
  "issuedAt": "2026-04-16"
}
```

---

## 4. Fluxo Principal — Do Atendimento à Conclusão

### Etapa 1 — Criar documento (rascunho)

**Pré-requisito:** `appointment.status === "IN_PROGRESS"` e usuário é o profissional da consulta.

```
POST /api/appointments/{appointmentId}/documents
Authorization: Bearer {token_profissional}
Content-Type: application/json
```

**Body:**
```json
{
  "type": "PRESCRIPTION",
  "content": {
    "patientName": "João Silva",
    "cpf": "123.456.789-00",
    "medications": [
      {
        "name": "Amoxicilina 500mg",
        "dosage": "1 cápsula",
        "frequency": "a cada 8 horas",
        "duration": "7 dias",
        "instructions": "Tomar durante as refeições"
      }
    ],
    "professionalName": "Dra. Ana Lima",
    "professionalCouncil": "CRM-SP 123456",
    "issuedAt": "2026-04-16"
  }
}
```

**Resposta `201 Created`:**
```json
{
  "id": "uuid-do-documento",
  "clinicId": "uuid-da-clinica",
  "appointmentId": "uuid-da-consulta",
  "type": "PRESCRIPTION",
  "status": "DRAFT",
  "content": { ... },
  "documentNumber": "DOC-2026-00001",
  "version": 1,
  "originalDocumentId": null,
  "integrityHash": null,
  "createdBy": "uuid-do-profissional",
  "createdAt": "2026-04-16T10:30:00.000Z",
  "updatedBy": null,
  "updatedAt": "2026-04-16T10:30:00.000Z",
  "deletedAt": null
}
```

---

### Etapa 2 — Editar documento

Pode ser chamado quantas vezes necessário enquanto o documento for `DRAFT` ou `FINALIZED` e a consulta `IN_PROGRESS`.  
Cada chamada **incrementa a `version`** e salva o snapshot anterior no log de auditoria.

```
PUT /api/appointments/{appointmentId}/documents/{docId}
Authorization: Bearer {token_profissional}
Content-Type: application/json
```

**Body:**
```json
{
  "content": {
    "patientName": "João Silva",
    "cpf": "123.456.789-00",
    "medications": [
      {
        "name": "Amoxicilina 500mg",
        "dosage": "1 cápsula",
        "frequency": "a cada 8 horas",
        "duration": "7 dias",
        "instructions": "Tomar durante as refeições"
      },
      {
        "name": "Ibuprofeno 400mg",
        "dosage": "1 comprimido",
        "frequency": "a cada 8 horas se dor",
        "duration": "3 dias",
        "instructions": null
      }
    ],
    "professionalName": "Dra. Ana Lima",
    "professionalCouncil": "CRM-SP 123456",
    "issuedAt": "2026-04-16"
  }
}
```

**Resposta `200 OK`:** documento atualizado (mesma estrutura do `POST`, com `version: 2`).

---

### Etapa 3 — Finalizar documento

Marca o documento como pronto para envio. Ainda editável até concluir a consulta.

```
PATCH /api/appointments/{appointmentId}/documents/{docId}/finalize
Authorization: Bearer {token_profissional}
```

> Sem body necessário.

**Resposta `200 OK`:** documento com `"status": "FINALIZED"`.

---

### Etapa 4 — Concluir consulta

⚠️ **Ação irreversível.** Antes de chamar este endpoint:
- Verifique se há documentos em `DRAFT` e alerte o profissional: *"Há X documento(s) em rascunho que NÃO serão enviados ao paciente. Deseja continuar?"*

```
POST /api/appointments/{appointmentId}/conclude
Authorization: Bearer {token_profissional}
```

> Sem body necessário.

**Resposta `200 OK`:**
```json
{
  "appointment": {
    "id": "uuid-da-consulta",
    "status": "COMPLETED",
    "completedAt": "2026-04-16T11:00:00.000Z",
    "completedBy": "uuid-do-profissional",
    ...
  },
  "sentDocuments": [
    {
      "id": "uuid-doc-1",
      "documentNumber": "DOC-2026-00001",
      "type": "PRESCRIPTION"
    }
  ],
  "draftDocuments": [
    {
      "id": "uuid-doc-2",
      "documentNumber": "DOC-2026-00002",
      "type": "CERTIFICATE"
    }
  ]
}
```

> `draftDocuments` são os documentos que **não foram enviados**. Use essa lista para mostrar o alerta pós-conclusão, se necessário.

---

### Etapa 5 — Excluir documento (soft delete)

Apenas documentos em `DRAFT`, apenas pelo profissional criador, enquanto a consulta está `IN_PROGRESS`.

```
DELETE /api/appointments/{appointmentId}/documents/{docId}
Authorization: Bearer {token_profissional}
```

**Resposta `200 OK`:**
```json
{
  "message": "Documento excluído com sucesso"
}
```

> O documento **não é removido do banco**. Ele desaparece das listagens normais mas permanece auditável.

---

## 5. Fluxo de Adendo

Adendos são documentos criados **após** a conclusão da consulta. São **imutáveis desde a criação** (não passam por rascunho).

**Pré-requisito:** `appointment.status === "COMPLETED"` ou `"COMPLETED_WITH_ADDENDUM"`.

```
POST /api/appointments/{appointmentId}/addendum
Authorization: Bearer {token_profissional}
Content-Type: application/json
```

**Body — adendo vinculado a um documento existente (correção):**
```json
{
  "type": "PRESCRIPTION",
  "content": {
    "note": "ADENDO: Corrijo a posologia da Amoxicilina para 500mg a cada 12 horas.",
    "patientName": "João Silva",
    "medications": [
      {
        "name": "Amoxicilina 500mg",
        "dosage": "1 cápsula",
        "frequency": "a cada 12 horas",
        "duration": "7 dias",
        "instructions": "Corrigido em adendo"
      }
    ],
    "professionalName": "Dra. Ana Lima",
    "professionalCouncil": "CRM-SP 123456",
    "issuedAt": "2026-04-16"
  },
  "originalDocumentId": "uuid-do-documento-original"
}
```

**Body — adendo como novo documento (não corrige um existente):**
```json
{
  "type": "REFERRAL",
  "content": { ... },
  "originalDocumentId": null
}
```

**Resposta `201 Created`:**
```json
{
  "id": "uuid-do-adendo",
  "status": "ADDENDUM",
  "documentNumber": "DOC-2026-00003",
  "originalDocumentId": "uuid-do-documento-original",
  "integrityHash": "sha256hashaqui...",
  "version": 1,
  ...
}
```

> Após o adendo, `appointment.status` muda automaticamente para `"COMPLETED_WITH_ADDENDUM"`.

---

## 6. Permissões por Papel

| Ação | PROFESSIONAL | ADMIN | RECEPTIONIST | PATIENT |
|---|:---:|:---:|:---:|:---:|
| Criar documento | ✅ (própria consulta) | ❌ | ❌ | ❌ |
| Editar documento | ✅ (própria consulta) | ❌ | ❌ | ❌ |
| Finalizar documento | ✅ (própria consulta) | ❌ | ❌ | ❌ |
| Concluir consulta | ✅ (própria consulta) | ❌ | ❌ | ❌ |
| Criar adendo | ✅ (própria consulta) | ❌ | ❌ | ❌ |
| Excluir documento | ✅ (própria consulta) | ❌ | ❌ | ❌ |
| Listar documentos | ✅ (todos os status) | ✅ (SENT/ADDENDUM) | ✅ (SENT/ADDENDUM) | ✅ (SENT/ADDENDUM) |
| Visualizar documento | ✅ (todos os status) | ✅ (SENT/ADDENDUM) | ✅ (SENT/ADDENDUM) | ✅ (próprio registro) |
| Imprimir documento | ✅ | ✅ | ✅ | ❌ |
| Logs de auditoria | ❌ | ✅ | ❌ | ❌ |
| Verificar integridade | ❌ | ✅ | ❌ | ❌ |

---

## 7. Referência de Endpoints

### Listagem de documentos

```
GET /api/appointments/{appointmentId}/documents
Authorization: Bearer {token}
```

**Resposta `200 OK`:**
```json
[
  {
    "id": "uuid",
    "type": "PRESCRIPTION",
    "status": "SENT",
    "documentNumber": "DOC-2026-00001",
    "version": 2,
    "originalDocumentId": null,
    "createdBy": "uuid-profissional",
    "createdAt": "2026-04-16T10:30:00.000Z",
    "updatedAt": "2026-04-16T10:55:00.000Z"
  }
]
```

> O backend filtra automaticamente por papel — PATIENT e RECEPTIONIST só recebem `SENT` e `ADDENDUM`.

---

### Visualizar documento completo

```
GET /api/appointments/{appointmentId}/documents/{docId}
Authorization: Bearer {token}
```

> Gera automaticamente um log de auditoria `VIEWED`.

**Resposta `200 OK`:** objeto completo `DocumentResponse`.

---

### Imprimir documento

```
GET /api/appointments/{appointmentId}/documents/{docId}/print
Authorization: Bearer {token}  (PROFESSIONAL, ADMIN ou RECEPTIONIST)
```

> Gera automaticamente um log de auditoria `PRINTED`. Retorna os dados do documento — o **frontend é responsável por gerar o PDF**.

---

### Logs de auditoria (ADMIN)

```
GET /api/admin/audit
Authorization: Bearer {token_admin}

Query params (todos opcionais):
  entity     — ex: "Document" | "Appointment"
  action     — ex: "CREATED" | "EDITED" | "SENT" | "VIEWED" | "PRINTED" | "DELETED" | "FINALIZED" | "CONCLUDED" | "ADDENDUM_CREATED" | "EDIT_DENIED" | "VIEW_DENIED"
  userId     — UUID do usuário
  startDate  — ISO 8601 ex: "2026-04-01T00:00:00.000Z"
  endDate    — ISO 8601 ex: "2026-04-30T23:59:59.000Z"
  page       — número da página (padrão: 1)
  limit      — itens por página (padrão: 50)
```

**Resposta `200 OK`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "clinicId": "uuid",
      "userId": "uuid",
      "userName": "Dra. Ana Lima",
      "action": "CREATED",
      "entity": "Document",
      "entityId": "uuid-do-documento",
      "oldData": null,
      "newData": { ... },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0 ...",
      "createdAt": "2026-04-16T10:30:00.000Z",
      "user": {
        "id": "uuid",
        "name": "Dra. Ana Lima",
        "email": "ana@clinica.com",
        "role": "PROFESSIONAL"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "totalPages": 3
  }
}
```

---

### Verificar integridade (ADMIN)

```
GET /api/admin/documents/{docId}/verify
Authorization: Bearer {token_admin}
```

**Resposta `200 OK`:**
```json
{
  "documentId": "uuid",
  "documentNumber": "DOC-2026-00001",
  "isIntact": true,
  "storedHash": "abc123...",
  "computedHash": "abc123..."
}
```

> Se `isIntact === false`, o conteúdo do documento foi alterado diretamente no banco, o que é uma violação de integridade.

---

## 8. Formato de Erros

Todos os erros retornam no formato:

```json
{
  "error": "Mensagem descritiva do erro"
}
```

Erros de validação de campo (400):
```json
{
  "error": "Erro de validação",
  "details": [
    { "field": "type", "message": "Tipo do documento é obrigatório" },
    { "field": "content", "message": "Conteúdo do documento é obrigatório" }
  ]
}
```

### Códigos HTTP usados

| Código | Situação |
|---|---|
| `200` | Sucesso (edição, finalização, listagem, visualização) |
| `201` | Criado com sucesso (novo documento, adendo) |
| `400` | Dados inválidos / regra de negócio inviável |
| `401` | Token ausente ou expirado |
| `403` | Sem permissão (papel incorreto, doc de outro profissional, consulta encerrada) |
| `404` | Consulta ou documento não encontrado |
| `500` | Erro interno do servidor |

---

## 9. Exemplos Completos por Tipo de Documento

### Fluxo completo em TypeScript (exemplo para o front)

```typescript
const API_BASE = "https://sua-api.com/api";

// 1. Criar documento
async function createDocument(appointmentId: string, token: string) {
  const response = await fetch(`${API_BASE}/appointments/${appointmentId}/documents`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "CERTIFICATE",
      content: {
        patientName: "João Silva",
        cpf: "123.456.789-00",
        cid: "J06.9",
        diagnosisDescription: "Infecção das vias aéreas superiores",
        daysOfRest: 3,
        startDate: "2026-04-16",
        endDate: "2026-04-19",
        observations: "Repouso e hidratação.",
        professionalName: "Dra. Ana Lima",
        professionalCouncil: "CRM-SP 123456",
        issuedAt: new Date().toISOString().split("T")[0],
      },
    }),
  });
  return response.json(); // { id, status: "DRAFT", documentNumber: "DOC-2026-00001", ... }
}

// 2. Finalizar documento
async function finalizeDocument(appointmentId: string, docId: string, token: string) {
  const response = await fetch(
    `${API_BASE}/appointments/${appointmentId}/documents/${docId}/finalize`,
    {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${token}` },
    },
  );
  return response.json(); // { status: "FINALIZED", ... }
}

// 3. Concluir consulta (com alerta de rascunhos)
async function concludeAppointment(appointmentId: string, token: string) {
  // Primeiro, listar documentos para verificar se há rascunhos
  const listRes = await fetch(`${API_BASE}/appointments/${appointmentId}/documents`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  const documents = await listRes.json();
  const drafts = documents.filter((d: any) => d.status === "DRAFT");

  if (drafts.length > 0) {
    const confirmado = window.confirm(
      `Há ${drafts.length} documento(s) em rascunho que NÃO serão enviados ao paciente. Deseja continuar?`,
    );
    if (!confirmado) return null;
  }

  const response = await fetch(`${API_BASE}/appointments/${appointmentId}/conclude`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
  });
  return response.json();
  // { appointment: { status: "COMPLETED" }, sentDocuments: [...], draftDocuments: [...] }
}

// 4. Criar adendo
async function createAddendum(
  appointmentId: string,
  token: string,
  originalDocumentId?: string,
) {
  const response = await fetch(`${API_BASE}/appointments/${appointmentId}/addendum`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "CLINICAL_REPORT",
      content: {
        note: "ADENDO: Inclusão de informação omitida no relatório original.",
        patientName: "João Silva",
        anamnesis: "Complemento: paciente relatou episódio de tonturas na semana anterior.",
        professionalName: "Dra. Ana Lima",
        professionalCouncil: "CRM-SP 123456",
        issuedAt: new Date().toISOString().split("T")[0],
      },
      originalDocumentId: originalDocumentId ?? null,
    }),
  });
  return response.json(); // { status: "ADDENDUM", integrityHash: "sha256..." }
}
```

---

## Observações Finais

- **Timestamps:** todos os campos de data/hora retornados pela API estão em **UTC (ISO 8601)**. Converta para o fuso do usuário no frontend.
- **Numeração de documentos:** gerada automaticamente pelo servidor no formato `DOC-{ANO}-{SEQUENCIAL-5-DÍGITOS}`. Não envie esse campo na criação.
- **`createdBy` / `createdAt`:** nunca envie esses campos no body — o servidor os preenche com os dados do token autenticado.
- **Geração de PDF:** o backend não gera PDF. Use os dados do campo `content` + as informações do documento para renderizar o layout no frontend (ex: `react-pdf`, `jspdf`, `html2pdf`).
- **Impressão:** chame `GET .../print` antes de abrir a janela de impressão do browser para que o evento fique registrado na auditoria.
