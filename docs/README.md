# 📚 Documentação do Projeto MinhaClínica API

Esta pasta contém toda a documentação necessária para desenvolvimento do backend.

---

## � COMECE AQUI

### ⭐ [RELATORIO-IMPLEMENTACAO-USUARIOS.md](RELATORIO-IMPLEMENTACAO-USUARIOS.md) - **LEIA PRIMEIRO!**
**O QUE ESTÁ PRONTO:** Sistema completo de cadastro de usuários em 3 etapas com verificação de email.

**Conteúdo:**
- 📖 Explicação didática de CADA arquivo criado
- 🎯 Por que cada decisão foi tomada
- 🔒 Segurança implementada (hashing, tokens, RBAC)
- 🎨 Fluxos de UX para pacientes, profissionais e staff
- 🔧 Como trocar provedor de email
- ✅ Checklist completo do que foi implementado

**Quando usar:** Para entender TODO o sistema de usuários já implementado.

---

### 🏃 [INICIO-RAPIDO.md](INICIO-RAPIDO.md)
**Descrição:** Guia rápido para configurar ambiente e começar a desenvolver.

**Conteúdo:**
- ⚡ Setup em 5 minutos
- 📦 Instalação de dependências
- 🗄️ Configuração do banco de dados
- 🔑 Variáveis de ambiente
- ▶️ Como rodar o projeto

**Quando usar:** Primeira vez configurando o projeto ou após clonar repositório.

---

## 📖 DOCUMENTAÇÃO DE REFERÊNCIA

### 1. 🗄️ [database-schema-explanation.md](database-schema-explanation.md)
**Descrição:** Explicação detalhada de cada modelo e enum do banco de dados.

**Conteúdo:**
- 19 Enums explicados
- 19 Modelos explicados (incluindo User com verificação de email)
- Relacionamentos entre tabelas
- Multi-tenancy (isolamento por clinicId)

**Quando usar:** Antes de criar repositories ou entender estrutura do banco.

---

### 2. 📋 [requisitos-sistema.md](requisitos-sistema.md)
**Descrição:** Documentação completa de requisitos funcionais e não-funcionais.

**Conteúdo:**
- 46 Requisitos Funcionais (RF001-RF046)
- 30 Requisitos Não-Funcionais (RNF001-RNF030)
- 28 Regras de Negócio (RN001-RN028)
- 18 Requisitos de Segurança (RS001-RS018)

**Quando usar:** Para entender TODAS as funcionalidades que o sistema deve ter.

---

### 3. 🛠️ [guia-tecnico-implementacao.md](guia-tecnico-implementacao.md)
**Descrição:** Guia de tecnologias, bibliotecas e estrutura do projeto.

**Conteúdo:**
- Stack tecnológico (Node.js, TypeScript, PostgreSQL)
- Bibliotecas recomendadas (Prisma, JWT, bcrypt, Yup)
- Estrutura de pastas (Repository + Service + Controller)
- Roadmap de aprendizado

**Quando usar:** Para escolher bibliotecas e entender arquitetura geral.

---

### 4. � [documentacao-funcional.md](documentacao-funcional.md)
**Descrição:** Visão funcional completa do produto para clínicas.

**Conteúdo:**
- Visão geral do produto SaaS
- Arquitetura multi-tenant
- Perfis de usuário e permissões (Admin, Recepcionista, Profissional, Paciente)
- Fluxos de trabalho das funcionalidades

**Quando usar:** Para entender a visão de produto e experiência do usuário.

---

### 5. 🏗️ [guia-desenvolvimento-backend.md](guia-desenvolvimento-backend.md)
**Descrição:** Guia para desenvolvimento com padrão Repository + Service + Controller.

**Conteúdo:**
- Arquitetura da aplicação
- Responsabilidades de cada camada
- Padrões e convenções
- Ordem de implementação sugerida

**Quando usar:** Referência de arquitetura antes de criar novos módulos.

---

### 6. ✅ [checklist-desenvolvimento.md](checklist-desenvolvimento.md)
**Descrição:** Checklist de tarefas para acompanhar progresso.

**Conteúdo:**
- Checklist de módulos divididos em fases
- Auth, User, Clinic, Patient, Professional, etc.
- Marque ✅ conforme conclui

**Quando usar:** Acompanhar progresso do desenvolvimento.

---

## 🎯 DOCUMENTAÇÃO DE IMPLEMENTAÇÕES

### 📘 [ESTRUTURA-FINAL-USUARIOS.md](ESTRUTURA-FINAL-USUARIOS.md)
**Descrição:** Estrutura de arquivos do sistema de usuários implementado.

**Conteúdo:**
- Árvore de arquivos criados
- Schemas, Services, Controllers, Routes
- Documentação técnica básica

---

### 🔄 [fluxo-cadastro-etapas.md](fluxo-cadastro-etapas.md)
**Descrição:** Diagramas dos fluxos de cadastro em 3 etapas.

**Conteúdo:**
- Fluxo visual Paciente (registro público)
- Fluxo visual Profissional (admin convida)
- Fluxo visual Staff (admin convida)
- Endpoints e respostas

---

### 🧪 [insomnia-users-cadastro-etapas.json](insomnia-users-cadastro-etapas.json)
**Descrição:** Collection do Insomnia para testar todos os endpoints.

**Conteúdo:**
- Requisições prontas para todos os fluxos
- Variáveis de ambiente configuradas
- Exemplos de body

**Como usar:** Importe no Insomnia para testar a API.

---

## 🎯 Por Onde Começar?

### ✅ SISTEMA DE USUÁRIOS JÁ IMPLEMENTADO!

O sistema completo de cadastro de usuários em 3 etapas já está funcionando. Veja:

1. **📖 Leia primeiro:** [RELATORIO-IMPLEMENTACAO-USUARIOS.md](RELATORIO-IMPLEMENTACAO-USUARIOS.md)
   - Entenda tudo que foi feito e por quê
   
2. **🧪 Teste a API:** Importe [insomnia-users-cadastro-etapas.json](insomnia-users-cadastro-etapas.json)
   - Teste todos os fluxos (paciente, profissional, staff)
   
3. **🔍 Veja os fluxos:** [fluxo-cadastro-etapas.md](fluxo-cadastro-etapas.md)
   - Diagramas visuais das 3 etapas

### 🚀 Para Desenvolver Novas Funcionalidades

1. **Consulte:** [guia-desenvolvimento-backend.md](guia-desenvolvimento-backend.md)
   - Use o padrão Repository + Service + Controller
   
2. **Acompanhe:** [checklist-desenvolvimento.md](checklist-desenvolvimento.md)
   - Marque ✅ o que você implementar
   
3. **Referência:** Use o código de usuários como modelo
   - Veja como foi feito: schemas, services, controllers, routes

### 📦 Dependências Já Instaladas

```bash
✅ express v5.2.1
✅ prisma v7.3.0
✅ @prisma/client v7.3.0
✅ typescript v5.9.3
✅ jsonwebtoken v9.0.3
✅ bcryptjs v3.0.3
✅ yup v1.7.1
```

---

## 📊 Status Atual do Projeto

### ✅ Implementado

- [x] Configuração do banco de dados (Prisma + PostgreSQL Neon)
- [x] Schema completo do banco (19 models, 19 enums)
- [x] Migrations aplicadas
- [x] Middleware de autenticação JWT
- [x] Middleware de validação Yup
- [x] Sistema de usuários completo:
  - [x] Registro de pacientes (público)
  - [x] Convite de profissionais (admin)
  - [x] Convite de staff (admin)
  - [x] Verificação de email
  - [x] Completar cadastro
- [x] Repositories (User, Patient)
- [x] Email service (abstração pronta)
- [x] Validação com Yup schemas
- [x] Tratamento de erros
- [x] Documentação completa

### 🚧 Próximas Implementações

- [ ] Endpoint de login (com validação de status ACTIVE)
- [ ] Completar cadastro do dono da clínica
- [ ] Sistema de refresh token
- [ ] CRUD de especialidades (Specialty)
- [ ] CRUD de procedimentos (Procedure)
- [ ] Sistema de agendamentos (Appointment)
- [ ] Dashboard e relatórios

---

## 🎓 Ordem de Leitura Recomendada

Para um desenvolvedor **continuando** o projeto:

1. **⭐ COMECE AQUI** → [RELATORIO-IMPLEMENTACAO-USUARIOS.md](RELATORIO-IMPLEMENTACAO-USUARIOS.md)
   - Entenda tudo que já foi implementado
   
2. **📚 REFERÊNCIA** → [database-schema-explanation.md](database-schema-explanation.md)
   - Consulte modelos do banco quando necessário
   
3. **🏗️ ARQUITETURA** → [guia-desenvolvimento-backend.md](guia-desenvolvimento-backend.md)
   - Entenda o padrão usado no projeto

4. **✅ ACOMPANHAMENTO** → [checklist-desenvolvimento.md](checklist-desenvolvimento.md)
   - Veja o que falta fazer e marque o progresso

5. **🎯 REQUISITOS** → [requisitos-sistema.md](requisitos-sistema.md), [documentacao-funcional.md](documentacao-funcional.md)
   - Consulte regras de negócio quando necessário

---

## 💡 Dicas Importantes

### ✅ Faça
- Siga a ordem de implementação definida no guia
- Teste cada módulo antes de avançar
- Marque o checklist conforme progride
- Use o exemplo do Auth como referência
- Consulte a documentação frequentemente

### ❌ Não Faça
- Não pule etapas (especialmente o Auth Module!)
- Não tente implementar tudo de uma vez
- Não ignore os padrões definidos
- Não esqueça de testar cada endpoint

---

## 🚀 Próximos Passos

**Sua próxima tarefa:**
1. Abrir [exemplo-auth-module.md](exemplo-auth-module.md)
2. Criar os arquivos da pasta `utils/` (errors.ts, jwt.ts, password.ts)
3. Criar os middlewares (authMiddleware.ts, roleMiddleware.ts, errorMiddleware.ts)
4. Implementar o Auth Module completo
5. Testar os endpoints de autenticação

**Boa codificação! 🎉**

---

## 📞 Estrutura de Apoio

- **Documentação Prisma:** https://www.prisma.io/docs
- **Documentação Express:** https://expressjs.com
- **Documentação Yup:** https://github.com/jquense/yup
- **Documentação JWT:** https://jwt.io

---

**Última atualização:** 05/02/2026
