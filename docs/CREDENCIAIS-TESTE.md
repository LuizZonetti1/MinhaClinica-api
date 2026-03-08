# Credenciais de Teste — MinhaClinica API

> **Senha padrão de todos os usuários:** `Senha123!`
>
> Banco populado via `npm run db:seed` ou `npx prisma migrate reset --force`

---

## 🏥 Clínica 1 — Saúde Mais (São Paulo / SP)

**Subdomínio:** `saudemais`
**CNPJ:** `12.345.678/0001-90`
**E-mail institucional:** `contato@saudemais.com.br`

### 👤 Usuários Internos

| Perfil | Nome | E-mail | Senha |
|---|---|---|---|
| `ADMIN` | Dr. Carlos Silva | `admin@saudemais.com.br` | `Senha123!` |
| `RECEPTIONIST` | Ana Paula Santos | `recepcao@saudemais.com.br` | `Senha123!` |
| `RECEPTIONIST` | Marcos Ferreira | `recepcao2@saudemais.com.br` | `Senha123!` |
| `PROFESSIONAL` | Dra. Maria Oliveira | `maria.oliveira@saudemais.com.br` | `Senha123!` |
| `PROFESSIONAL` | Dr. João Mendes | `joao.mendes@saudemais.com.br` | `Senha123!` |
| `PROFESSIONAL` | Dra. Fernanda Lima | `fernanda.lima@saudemais.com.br` | `Senha123!` |

### 🧑‍⚕️ Pacientes

| Nome | E-mail | Senha | Observações clínicas |
|---|---|---|---|
| Pedro Almeida | `pedro.almeida@email.com` | `Senha123!` | Hipertensão arterial leve. Tipo sanguíneo: O+ |
| Juliana Costa | `juliana.costa@email.com` | `Senha123!` | Alergia a penicilina. Tipo sanguíneo: A+ |
| Roberto Ferreira | `roberto.ferreira@email.com` | `Senha123!` | Diabetes tipo 2. 1 no-show registrado. Tipo: B− |
| Amanda Lima | `amanda.lima@email.com` | `Senha123!` | Sem condições. Tipo sanguíneo: AB+ |
| Fernando Souza | `fernando.souza@email.com` | `Senha123!` | Colesterol alto. 2 no-shows registrados. Tipo: A− |
| Cláudia Mendes | `claudia.mendes@email.com` | `Senha123!` | Alergia a dipirona. Tipo sanguíneo: O− |

### 🩺 Profissionais — Detalhes

| Profissional | Conselho | Registro | Especialidade | Procedimentos |
|---|---|---|---|---|
| Dra. Maria Oliveira | CRM 123456 / SP | Cardiologia | Consulta Cardiológica · Eletrocardiograma |
| Dr. João Mendes | CRO 654321 / SP | Ortodontia | Avaliação Ortodôntica · Manutenção de Aparelho |
| Dra. Fernanda Lima | CREFITO 789012 / SP | Fisioterapia | Sessão de Fisioterapia · Avaliação Fisioterapêutica |

> **Obs.:** Dra. Fernanda Lima tem **bloqueio de agenda** (férias) de D+10 a D+17.

---

## 🏥 Clínica 2 — OdontoPrime (Rio de Janeiro / RJ)

> Ambiente isolado para testes de **multi-tenant**. Os dados desta clínica não aparecem nas queries da Clínica 1.

**Subdomínio:** `odontoprime`
**CNPJ:** `98.765.432/0001-10`
**E-mail institucional:** `contato@odontoprime.com.br`

### 👤 Usuários Internos

| Perfil | Nome | E-mail | Senha |
|---|---|---|---|
| `ADMIN` | Dr. Ricardo Alves | `admin@odontoprime.com.br` | `Senha123!` |
| `PROFESSIONAL` | Dra. Beatriz Nunes | `beatriz.nunes@odontoprime.com.br` | `Senha123!` |

### 🧑‍⚕️ Pacientes

| Nome | E-mail | Senha |
|---|---|---|
| Gustavo Ribeiro | `gustavo.ribeiro@email.com` | `Senha123!` |
| Sofia Martins | `sofia.martins@email.com` | `Senha123!` |

---

## 📅 Agendamentos — Clínica 1 (status variados para teste)

| Status | Paciente | Profissional | Procedimento | Data |
|---|---|---|---|---|
| `COMPLETED` | Pedro Almeida | Dra. Maria Oliveira | Consulta Cardiológica | D−30 |
| `COMPLETED` | Roberto Ferreira | Dra. Maria Oliveira | Consulta Cardiológica | D−21 |
| `COMPLETED` | Fernando Souza | Dra. Maria Oliveira | Eletrocardiograma | D−14 |
| `COMPLETED` | Juliana Costa | Dr. João Mendes | Avaliação Ortodôntica | D−25 |
| `COMPLETED` | Amanda Lima | Dr. João Mendes | Manutenção de Aparelho | D−7 |
| `COMPLETED` | Pedro Almeida | Dra. Fernanda Lima | Avaliação Fisioterapêutica | D−60 |
| `COMPLETED` | Roberto Ferreira | Dra. Fernanda Lima | Sessão de Fisioterapia | D−10 |
| `NO_SHOW` | Fernando Souza | Dra. Maria Oliveira | Consulta Cardiológica | D−45 |
| `CANCELLED` | Cláudia Mendes | Dr. João Mendes | Avaliação Ortodôntica | D−5 |
| `CONFIRMED` ⬅ hoje | Pedro Almeida | Dra. Maria Oliveira | Consulta Cardiológica | **Hoje 09:00** |
| `WAITING` ⬅ hoje | Roberto Ferreira | Dra. Maria Oliveira | Eletrocardiograma | **Hoje 10:00** |
| `IN_PROGRESS` ⬅ hoje | Juliana Costa | Dra. Fernanda Lima | Sessão de Fisioterapia | **Hoje 07:30** |
| `CONFIRMED` | Juliana Costa | Dr. João Mendes | Manutenção de Aparelho | D+2 |
| `SCHEDULED` | Amanda Lima | Dr. João Mendes | Avaliação Ortodôntica | D+4 |
| `SCHEDULED` | Fernando Souza | Dra. Maria Oliveira | Consulta Cardiológica | D+7 |
| `CONFIRMED` | Cláudia Mendes | Dra. Fernanda Lima | Avaliação Fisioterapêutica | D+3 |
| `SCHEDULED` | Pedro Almeida | Dra. Fernanda Lima | Sessão de Fisioterapia | D+14 |

---

## 💰 Financeiro — Clínica 1

| Tipo | Descrição | Valor | Status | Data |
|---|---|---|---|---|
| Receita | Consulta Cardiológica — Pedro Almeida | R$ 350,00 | `PAID` (PIX) | D−30 |
| Receita | Consulta Cardiológica — Roberto Ferreira | R$ 350,00 | `PAID` (Crédito) | D−21 |
| Receita | Eletrocardiograma — Fernando Souza | R$ 150,00 | `PAID` (Débito) | D−14 |
| Receita | Avaliação Ortodôntica — Juliana Costa | R$ 250,00 | `PAID` (Dinheiro) | D−25 |
| Receita | Manutenção de Aparelho — Amanda Lima | R$ 180,00 | `PAID` (PIX) | D−7 |
| Receita | Avaliação Fisioterapêutica — Pedro Almeida | R$ 280,00 | `PAID` (PIX) | D−60 |
| Receita | Sessão de Fisioterapia — Roberto Ferreira | R$ 200,00 | `PAID` (Débito) | D−10 |
| Receita | Manutenção de Aparelho — Juliana Costa | R$ 180,00 | `PENDING` | D+2 |
| Despesa | Aluguel — fevereiro/2026 | R$ 3.500,00 | `PAID` (TED) | D−28 |
| Despesa | Conta de energia elétrica — fevereiro/2026 | R$ 850,00 | `PAID` (PIX) | D−15 |
| Despesa | Material de escritório e consumíveis | R$ 1.200,00 | `PAID` (Crédito) | D−10 |
| Despesa | Aluguel — março/2026 | R$ 3.500,00 | `PENDING` | D+5 |

---

## 🔑 Permissões por Perfil

| Perfil | Acesso esperado |
|---|---|
| `ADMIN` | Gestão completa da clínica, usuários, financeiro, relatórios e configurações |
| `RECEPTIONIST` | Agenda, agendamentos, cadastro de pacientes, financeiro básico |
| `PROFESSIONAL` | Própria agenda, prontuários dos seus pacientes, bloqueios de agenda |
| `PATIENT` | Portal do paciente: ver e agendar próprias consultas, histórico |

---

## 🚀 Comandos Úteis

```bash
# Resetar banco e popular novamente
npm run db:reset

# Rodar apenas o seed (sem reset de migrations)
npm run db:seed

# Visualizar dados no Prisma Studio
npm run db:studio

# Iniciar API em modo dev
npm run dev
```
