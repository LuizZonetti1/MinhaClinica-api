# 🚀 INÍCIO RÁPIDO - MinhaClínica API

Guia para começar a desenvolver AGORA!

---

## ⚡ 5 Minutos para Começar

### 1. Instale as dependências necessárias
```bash
yarn add jsonwebtoken bcryptjs yup cors
yarn add -D @types/jsonwebtoken @types/bcryptjs @types/cors
```

### 2. Estrutura de pastas já criada ✅
```
src/
├── @types/
├── controller/
├── service/
├── repository/
├── routes/
├── middlewares/
└── utils/
```

### 3. Comece pelo Auth Module
Abra o arquivo: **[docs/exemplo-auth-module.md](exemplo-auth-module.md)**

---

## 📋 Ordem de Criação dos Arquivos

Siga EXATAMENTE esta ordem:

### **Passo 1: Utils** (Fundação)
1. ✅ `src/utils/errors.ts` - Classes de erro
2. ✅ `src/utils/jwt.ts` - Funções JWT
3. ✅ `src/utils/password.ts` - Hash de senhas

### **Passo 2: Types**
4. ✅ `src/@types/express.d.ts` - Tipagem do Express

### **Passo 3: Middlewares**
5. ✅ `src/middlewares/authMiddleware.ts` - Verificar token
6. ✅ `src/middlewares/roleMiddleware.ts` - Verificar permissões
7. ✅ `src/middlewares/errorMiddleware.ts` - Tratamento de erros

### **Passo 4: Auth Module**
8. ✅ `src/repository/authRepository.ts` - Acesso ao banco
9. ✅ `src/service/authService.ts` - Lógica de negócio
10. ✅ `src/controller/authController.ts` - Camada HTTP
11. ✅ `src/routes/authRoutes.ts` - Rotas

### **Passo 5: Integração**
12. ✅ `src/routes/index.ts` - Agregar todas as rotas
13. ✅ `src/server.ts` - Iniciar servidor

---

## 📝 Checklist Diário

### Hoje (Dia 1):
- [ ] Instalar dependências
- [ ] Criar `utils/errors.ts`
- [ ] Criar `utils/jwt.ts`
- [ ] Criar `utils/password.ts`
- [ ] Criar `@types/express.d.ts`

### Amanhã (Dia 2):
- [ ] Criar `middlewares/authMiddleware.ts`
- [ ] Criar `middlewares/roleMiddleware.ts`
- [ ] Criar `middlewares/errorMiddleware.ts`

### Dia 3:
- [ ] Criar `repository/authRepository.ts`
- [ ] Criar `service/authService.ts`

### Dia 4:
- [ ] Criar `controller/authController.ts`
- [ ] Criar `routes/authRoutes.ts`

### Dia 5:
- [ ] Criar `routes/index.ts`
- [ ] Atualizar `server.ts`
- [ ] Testar endpoints

---

## 🎯 Seu Primeiro Endpoint

Depois de implementar o Auth Module, teste:

```bash
# Iniciar servidor
yarn dev
```

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@saudemais.com.br",
  "password": "Senha123!",
  "subdomain": "exemplo"
}
```

---

## 📚 Documentação de Referência

### Leitura Obrigatória (HOJE):
1. **[exemplo-auth-module.md](exemplo-auth-module.md)** ⭐ COMECE AQUI
   - Código completo do Auth Module

2. **[guia-desenvolvimento-backend.md](guia-desenvolvimento-backend.md)** ⭐
   - Arquitetura completa

### Consulta Constante:
3. **[checklist-desenvolvimento.md](checklist-desenvolvimento.md)**
   - Para marcar progresso

4. **[database-schema-explanation.md](database-schema-explanation.md)**
   - Para entender modelos

### Quando Precisar:
5. **[dependencias.md](dependencias.md)**
   - Lista de todas as dependências

6. **[requisitos-sistema.md](requisitos-sistema.md)**
   - Regras de negócio

---

## 💻 Código do server.ts

```typescript
// src/server.ts
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import routes from './routes';
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/v1', routes);

// Tratamento de erros (sempre por último!)
app.use(errorMiddleware);

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/v1`);
});
```

---

## 🔗 Arquivo routes/index.ts

```typescript
// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './authRoutes';

const router = Router();

router.use('/auth', authRoutes);

// Adicione outras rotas conforme implementa:
// router.use('/users', userRoutes);
// router.use('/patients', patientRoutes);
// etc...

export default router;
```

---

## ⚙️ Variáveis de Ambiente

Certifique-se de ter no `.env`:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/minhaclinica"

# JWT
JWT_SECRET="seu_secret_super_seguro_aqui_mude_em_producao"

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

---

## 🧪 Testando os Endpoints

Use uma destas ferramentas:
- **Insomnia** (recomendado)
- **Postman**
- **Thunder Client** (extensão VS Code)
- **cURL** (linha de comando)

### Exemplo com cURL:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@saudemais.com.br",
    "password": "Senha123!",
    "subdomain": "exemplo"
  }'
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
yarn install
```

### Erro: "Port 3000 already in use"
Mude a porta no `.env`:
```env
PORT=3001
```

### Erro: Prisma Client não encontrado
```bash
yarn db:generate
```

### Erro: Banco de dados vazio
```bash
yarn db:seed
```

---

## 📊 Progresso Esperado

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
