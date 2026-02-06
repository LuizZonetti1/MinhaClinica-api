# 📦 Dependências do Projeto

Lista completa de dependências organizadas por fase de implementação.

---

## 🚀 Instalação Imediata (Auth Module)

Execute estes comandos AGORA para começar a desenvolver o Auth Module:

```bash
# Dependências de produção
yarn add jsonwebtoken bcryptjs yup cors express dotenv

# Dependências de desenvolvimento (types)
yarn add -D @types/jsonwebtoken @types/bcryptjs @types/cors @types/node
```

---

## 📋 Dependências por Módulo

### **Auth Module** (Fase 1)
```bash
yarn add jsonwebtoken bcryptjs yup
yarn add -D @types/jsonwebtoken @types/bcryptjs
```

**O que faz cada uma:**
- `jsonwebtoken` - Criar e validar tokens JWT
- `bcryptjs` - Hash de senhas
- `yup` - Validação de dados (schemas)

---

### **User Module** (Fase 1)
```bash
# Nenhuma dependência adicional
# Usa as mesmas do Auth Module
```

---

### **Specialty & Procedure Modules** (Fase 2)
```bash
# Nenhuma dependência adicional
# Usa as mesmas do Auth Module
```

---

### **Professional & Patient Modules** (Fase 3)
```bash
# Nenhuma dependência adicional
# Usa as mesmas do Auth Module
```

---

### **Appointment Module** (Fase 4) ⚠️
```bash
# Biblioteca para manipulação de datas
yarn add date-fns

# Biblioteca para validação de datas
yarn add -D @types/date-fns
```

**O que faz:**
- `date-fns` - Manipulação de datas (calcular horários disponíveis, validar conflitos, etc)

---

### **MedicalRecord Module** (Fase 5)
```bash
# Para upload de arquivos/anexos
yarn add multer
yarn add -D @types/multer
```

**O que faz:**
- `multer` - Upload de arquivos (para anexos do prontuário)

---

### **FinancialRecord Module** (Fase 6)
```bash
# Para geração de relatórios em PDF
yarn add pdfkit
yarn add -D @types/pdfkit

# Para formatação de valores monetários
yarn add currency.js
```

**O que faz:**
- `pdfkit` - Gerar PDFs de relatórios financeiros
- `currency.js` - Lidar com valores monetários (evita problemas de arredondamento)

---

### **Notification Module** (Fase 7)
```bash
# Para envio de emails
yarn add nodemailer
yarn add -D @types/nodemailer

# Template engine para emails
yarn add handlebars
```

**O que faz:**
- `nodemailer` - Enviar emails
- `handlebars` - Templates de emails bonitos

---

## 🛠️ Dependências Opcionais (Futuro)

### **Para WhatsApp API**
```bash
yarn add axios
```

### **Para SMS**
```bash
yarn add twilio
```

### **Para logs estruturados**
```bash
yarn add winston
yarn add -D @types/winston
```

### **Para validação adicional**
```bash
yarn add validator
yarn add -D @types/validator
```

### **Para geração de relatórios Excel**
```bash
yarn add exceljs
```

### **Para cache (Redis)**
```bash
yarn add ioredis
yarn add -D @types/ioredis
```

### **Para filas de background jobs**
```bash
yarn add bull
yarn add -D @types/bull
```

---

## ✅ Dependências Já Instaladas

Estas já estão no seu `package.json`:

- ✅ `express` - Framework web
- ✅ `@prisma/client` - ORM para banco de dados
- ✅ `prisma` - CLI do Prisma
- ✅ `typescript` - Linguagem
- ✅ `tsx` - Executar TypeScript
- ✅ `dotenv` - Variáveis de ambiente
- ✅ `@biomejs/biome` - Linter/Formatter
- ✅ `@types/express` - Types do Express
- ✅ `@types/node` - Types do Node.js

---

## 📦 package.json Completo (Referência)

```json
{
  "name": "minhaclinica-api",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "biome lint src/",
    "format": "biome format --write src/",
    "check": "biome check --apply src/",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:seed": "tsx src/database/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/adapter-pg": "^7.3.0",
    "@prisma/client": "^7.3.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "currency.js": "^2.0.4",
    "date-fns": "^3.0.0",
    "dotenv": "^16.4.5",
    "express": "^4.21.2",
    "handlebars": "^4.7.8",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.15",
    "pdfkit": "^0.15.0",
    "pg": "^8.13.1",
    "yup": "^1.4.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.10.2",
    "@types/nodemailer": "^6.4.16",
    "@types/pdfkit": "^0.13.5",
    "prisma": "^7.3.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  },
  "prisma": {
    "seed": "tsx src/database/seed.ts"
  }
}
```

---

## 🎯 Ordem de Instalação Recomendada

### **Agora (Semana 1-2):**
```bash
yarn add jsonwebtoken bcryptjs yup cors
yarn add -D @types/jsonwebtoken @types/bcryptjs @types/cors
```

### **Semana 7-8 (Appointments):**
```bash
yarn add date-fns
```

### **Semana 9 (MedicalRecord):**
```bash
yarn add multer
yarn add -D @types/multer
```

### **Semana 11 (Financial):**
```bash
yarn add pdfkit currency.js
yarn add -D @types/pdfkit
```

### **Semana 12 (Notifications):**
```bash
yarn add nodemailer handlebars
yarn add -D @types/nodemailer
```

---

## ⚡ Instalação Completa (Tudo de Uma Vez)

Se preferir instalar TUDO de uma vez:

```bash
# Produção
yarn add jsonwebtoken bcryptjs yup cors date-fns multer pdfkit currency.js nodemailer handlebars

# Desenvolvimento
yarn add -D @types/jsonwebtoken @types/bcryptjs @types/cors @types/multer @types/pdfkit @types/nodemailer
```

---

## 🔍 Verificar Dependências Instaladas

Para ver todas as dependências instaladas:

```bash
yarn list --depth=0
```

---

## 🧹 Limpar node_modules (Se necessário)

Se tiver problemas de dependências:

```bash
# Deletar node_modules e yarn.lock
Remove-Item -Recurse -Force node_modules, yarn.lock

# Reinstalar tudo
yarn install
```

---

## 📚 Documentação das Bibliotecas

- **Express:** https://expressjs.com/
- **Prisma:** https://www.prisma.io/docs
- **Yup:** https://github.com/jquense/yup
- **JWT:** https://jwt.io/
- **bcrypt:** https://github.com/kelektiv/node.bcrypt.js
- **date-fns:** https://date-fns.org/
- **Multer:** https://github.com/expressjs/multer
- **Nodemailer:** https://nodemailer.com/
- **PDFKit:** https://pdfkit.org/

---

**Última atualização:** 05/02/2026
