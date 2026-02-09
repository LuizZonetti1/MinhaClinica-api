# Guia de Tokens JWT e Verificação de Email

Este guia explica como gerar e utilizar tokens JWT para autenticação e tokens de verificação para confirmação de email.

## 📋 Índice

1. [Tokens JWT (Autenticação)](#tokens-jwt-autenticação)
2. [Tokens de Verificação (Email)](#tokens-de-verificação-email)
3. [Middleware de Autenticação](#middleware-de-autenticação)
4. [Fluxo Completo de Registro](#fluxo-completo-de-registro)
5. [Exemplo de Uso em Controllers](#exemplo-de-uso-em-controllers)

---

## 🔐 Tokens JWT (Autenticação)

### O que é?

JWT (JSON Web Token) é usado para autenticar usuários após o login. Ele contém:
- `userId` - ID do usuário
- `clinicId` - ID da clínica (multi-tenant)
- `role` - Papel do usuário (ADMIN, RECEPTIONIST, PROFESSIONAL, PATIENT)

### Como Gerar

```typescript
import { generateAuthToken } from "../utils/jwtUtils";

// Exemplo: após validar login
const token = generateAuthToken(
    user.id,           // UUID do usuário
    user.clinicId,     // UUID da clínica
    user.role,         // "ADMIN" | "RECEPTIONIST" | "PROFESSIONAL" | "PATIENT"
    { expiresIn: "7d" } // Opcional: padrão é 7 dias
);

// Retornar para o frontend
return {
    accessToken: token,
    user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId
    }
};
```

### Opções de Expiração

```typescript
// 1 hora
generateAuthToken(userId, clinicId, role, { expiresIn: "1h" });

// 24 horas
generateAuthToken(userId, clinicId, role, { expiresIn: "24h" });

// 7 dias (padrão)
generateAuthToken(userId, clinicId, role, { expiresIn: "7d" });

// 30 dias
generateAuthToken(userId, clinicId, role, { expiresIn: "30d" });
```

### Refresh Token (Longa Duração)

```typescript
import { generateRefreshToken } from "../utils/jwtUtils";

// Expira em 30 dias
const refreshToken = generateRefreshToken(user.id, user.clinicId);

// Use para renovar o accessToken sem fazer login novamente
```

### Verificar Token Manualmente

```typescript
import { verifyAuthToken } from "../utils/jwtUtils";

try {
    const payload = verifyAuthToken(token);
    console.log(payload.userId);   // UUID do usuário
    console.log(payload.clinicId); // UUID da clínica
    console.log(payload.role);     // Role do usuário
} catch (error) {
    console.error("Token inválido ou expirado");
}
```

---

## ✉️ Tokens de Verificação (Email)

### O que é?

Token aleatório e seguro usado para verificar emails. Diferente do JWT:
- Não contém dados do usuário
- É um código aleatório hexadecimal
- Deve ser armazenado com hash no banco de dados
- Tem data de expiração manual

### Como Gerar

```typescript
import { createVerificationData } from "../utils/verificationTokenUtils";

// Gera token, hash e data de expiração
const verification = createVerificationData(24); // Expira em 24 horas

console.log(verification);
/*
{
  token: "a1b2c3d4e5f6..." // Enviar por EMAIL
  hashedToken: "7f8g9h..." // Salvar no BANCO
  expiresAt: 2026-02-09T12:00:00.000Z // Data de expiração
}
*/
```

### Salvar no Banco de Dados

**Importante:** Adicione estes campos ao modelo `Clinic` no Prisma:

```prisma
model Clinic {
  // ... campos existentes
  
  verificationToken   String?   // Token hasheado
  verificationExpires DateTime? // Data de expiração
}
```

Depois rode:
```bash
npx prisma migrate dev --name add_verification_fields
```

### Exemplo de Uso Completo

```typescript
import { 
    createVerificationData,
    hashToken,
    isTokenExpired 
} from "../utils/verificationTokenUtils";

// 1. Criar clínica e gerar token
async function createClinic(clinicData: any) {
    const verification = createVerificationData(24); // 24 horas
    
    const clinic = await prisma.clinic.create({
        data: {
            ...clinicData,
            isActive: false, // Inativo até verificar
            verificationToken: verification.hashedToken,
            verificationExpires: verification.expiresAt
        }
    });
    
    // Enviar email (TODO: implementar serviço de email)
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${verification.token}`;
    // await sendEmail(clinic.email, url);
    
    return clinic;
}

// 2. Verificar token do email
async function verifyEmail(token: string) {
    const hashedToken = hashToken(token);
    
    const clinic = await prisma.clinic.findFirst({
        where: {
            verificationToken: hashedToken,
            isActive: false
        }
    });
    
    if (!clinic) {
        throw new Error("Token inválido");
    }
    
    // Verificar expiração
    if (isTokenExpired(clinic.verificationExpires!)) {
        throw new Error("Token expirado");
    }
    
    // Ativar clínica
    await prisma.clinic.update({
        where: { id: clinic.id },
        data: {
            isActive: true,
            verificationToken: null,
            verificationExpires: null
        }
    });
    
    return clinic;
}
```

### Gerar Código Numérico (SMS)

```typescript
import { generateNumericCode } from "../utils/verificationTokenUtils";

// Gera código de 6 dígitos
const code = generateNumericCode(6); // Ex: "123456"

// Enviar por SMS
// await sendSMS(user.phone, `Seu código: ${code}`);
```

---

## 🛡️ Middleware de Autenticação

### Como Usar

O middleware valida o token JWT e adiciona informações ao `req`:

```typescript
import { authMiddleware, checkRole } from "../middlewares/auth";

// Rota protegida (requer token)
router.get("/profile", authMiddleware, (req, res) => {
    // Token válido! req já contém:
    console.log(req.userId);   // UUID do usuário
    console.log(req.clinicId); // UUID da clínica
    console.log(req.userRole); // Role do usuário
    
    res.json({ message: "Acesso autorizado" });
});

// Rota restrita (apenas ADMIN)
router.delete("/clinic/:id", 
    authMiddleware, 
    checkRole("ADMIN"), 
    deleteClinic
);

// Rota para múltiplas roles
router.get("/appointments", 
    authMiddleware,
    checkRole("ADMIN", "RECEPTIONIST", "PROFESSIONAL"),
    listAppointments
);
```

### No Frontend

```javascript
// Fazer requisição com token
fetch("http://localhost:3001/api/profile", {
    headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    }
});
```

---

## 🔄 Fluxo Completo de Registro

### Passo 1: Registrar Clínica

```typescript
// POST /api/clinics/register
async function registerClinic(req, res) {
    const validation = createVerificationData(24);
    
    const clinic = await prisma.clinic.create({
        data: {
            ...req.body,
            isActive: false,
            verificationToken: validation.hashedToken,
            verificationExpires: validation.expiresAt
        }
    });
    
    // Enviar email
    const url = `${process.env.FRONTEND_URL}/verify?token=${validation.token}`;
    // await emailService.send(clinic.email, url);
    
    res.json({ 
        message: "Email de verificação enviado",
        clinicId: clinic.id 
    });
}
```

### Passo 2: Verificar Email

```typescript
// GET /api/clinics/verify/:token
async function verifyClinic(req, res) {
    const { token } = req.params;
    const hashedToken = hashToken(token);
    
    const clinic = await prisma.clinic.findFirst({
        where: { verificationToken: hashedToken }
    });
    
    if (!clinic || isTokenExpired(clinic.verificationExpires!)) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
    }
    
    await prisma.clinic.update({
        where: { id: clinic.id },
        data: {
            isActive: true,
            verificationToken: null,
            verificationExpires: null
        }
    });
    
    res.json({ message: "Email verificado!", clinicId: clinic.id });
}
```

### Passo 3: Criar Conta Admin

```typescript
// POST /api/clinics/:id/owner
async function createOwner(req, res) {
    const { clinicId } = req.params;
    const { name, email, cpf, phone, password } = req.body;
    
    // Verificar se clínica está ativa
    const clinic = await prisma.clinic.findFirst({
        where: { id: clinicId, isActive: true }
    });
    
    if (!clinic) {
        return res.status(400).json({ error: "Clínica não verificada" });
    }
    
    // Hash senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const owner = await prisma.user.create({
        data: {
            clinicId,
            name,
            email,
            cpf,
            phone,
            password: hashedPassword,
            role: "ADMIN",
            status: "ACTIVE"
        }
    });
    
    // Gerar token para login imediato
    const accessToken = generateAuthToken(owner.id, owner.clinicId, owner.role);
    const refreshToken = generateRefreshToken(owner.id, owner.clinicId);
    
    res.json({
        user: {
            id: owner.id,
            name: owner.name,
            email: owner.email,
            role: owner.role
        },
        accessToken,
        refreshToken
    });
}
```

---

## 📝 Exemplo de Controller de Login

```typescript
import { generateAuthToken, generateRefreshToken } from "../utils/jwtUtils";
import bcrypt from "bcryptjs";
import { prisma } from "../database/prisma";

// POST /api/auth/login
export async function login(req, res) {
    const { email, password, clinicId } = req.body;
    
    // Buscar usuário
    const user = await prisma.user.findFirst({
        where: {
            email,
            clinicId,
            status: "ACTIVE"
        }
    });
    
    if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
    }
    
    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ error: "Credenciais inválidas" });
    }
    
    // Gerar tokens
    const accessToken = generateAuthToken(
        user.id,
        user.clinicId,
        user.role,
        { expiresIn: "7d" }
    );
    
    const refreshToken = generateRefreshToken(user.id, user.clinicId);
    
    // Atualizar último login
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });
    
    res.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            clinicId: user.clinicId
        },
        accessToken,
        refreshToken
    });
}
```

---

## 🔑 Variáveis de Ambiente

Certifique-se de ter no `.env`:

```env
JWT_SECRET="sua_chave_secreta_aqui"
FRONTEND_URL="http://localhost:3000"
```

---

## ✅ Checklist de Implementação

- [x] Criar `src/utils/jwtUtils.ts`
- [x] Criar `src/utils/verificationTokenUtils.ts`
- [x] Atualizar `src/middlewares/auth.ts` (incluir clinicId)
- [ ] Adicionar campos `verificationToken` e `verificationExpires` ao schema Prisma
- [ ] Implementar serviço de email
- [ ] Criar rotas de autenticação (/login, /register, /verify)
- [ ] Criar controllers de autenticação
- [ ] Testar fluxo completo com Insomnia/Postman

---

## 🚀 Próximos Passos

1. **Implementar Email Service** - Usar Nodemailer ou SendGrid
2. **Criar Rotas de Autenticação** - Login, registro, verificação
3. **Adicionar Refresh Token** - Renovar accessToken sem novo login
4. **Implementar Recuperação de Senha** - Usar tokens de verificação
5. **Adicionar Rate Limiting** - Prevenir ataques de força bruta
