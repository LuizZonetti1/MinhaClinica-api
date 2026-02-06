# 🔐 Exemplo Completo: Auth Module

Este documento mostra a implementação completa do módulo de autenticação, servindo como referência para os demais módulos.

---

## 📁 Estrutura de Arquivos

```
src/
├── utils/
│   ├── errors.ts          ✅ Classes de erro personalizadas
│   ├── jwt.ts             ✅ Funções para JWT
│   └── password.ts        ✅ Funções para hash de senha
├── @types/
│   └── express.d.ts       ✅ Tipagem do Express
├── middlewares/
│   ├── authMiddleware.ts  ✅ Verificar autenticação
│   ├── roleMiddleware.ts  ✅ Verificar permissões
│   └── errorMiddleware.ts ✅ Tratamento global de erros
├── repository/
│   └── authRepository.ts  ✅ Acesso ao banco
├── service/
│   └── authService.ts     ✅ Lógica de negócio
├── controller/
│   └── authController.ts  ✅ Camada HTTP
└── routes/
    └── authRoutes.ts      ✅ Rotas da API
```

---

## 1️⃣ Utils - Classes de Erro

```typescript
// src/utils/errors.ts

export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}
```

---

## 2️⃣ Utils - JWT

```typescript
// src/utils/jwt.ts

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '8h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  clinicId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
```

---

## 3️⃣ Utils - Password

```typescript
// src/utils/password.ts

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function validatePasswordStrength(password: string): boolean {
  // Mínimo 8 caracteres, 1 letra maiúscula, 1 minúscula, 1 número
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}
```

---

## 4️⃣ Types - Express

```typescript
// src/@types/express.d.ts

import { JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
```

---

## 5️⃣ Middleware - Auth

```typescript
// src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Token não fornecido');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Formato de token inválido');
    }

    const decoded = verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
```

---

## 6️⃣ Middleware - Role

```typescript
// src/middlewares/roleMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

export function roleMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Usuário não autenticado');
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError('Você não tem permissão para acessar este recurso');
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return res.status(403).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
  };
}
```

---

## 7️⃣ Middleware - Error Handler

```typescript
// src/middlewares/errorMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import {
  BusinessError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError
} from '../utils/errors';

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('❌ Error:', error);

  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }

  if (error instanceof UnauthorizedError) {
    return res.status(401).json({ error: error.message });
  }

  if (error instanceof ForbiddenError) {
    return res.status(403).json({ error: error.message });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  if (error instanceof BusinessError) {
    return res.status(422).json({ error: error.message });
  }

  return res.status(500).json({ error: 'Erro interno do servidor' });
}
```

---

## 8️⃣ Repository - Auth

```typescript
// src/repository/authRepository.ts

import { prisma } from '../database/prisma';

export class AuthRepository {
  async findUserByEmail(email: string, clinicId: string) {
    return prisma.user.findUnique({
      where: {
        clinicId_email: {
          clinicId,
          email
        }
      }
    });
  }

  async findUserByCpf(cpf: string, clinicId: string) {
    return prisma.user.findUnique({
      where: {
        clinicId_cpf: {
          clinicId,
          cpf
        }
      }
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        clinic: {
          select: {
            id: true,
            tradeName: true,
            subdomain: true
          }
        }
      }
    });
  }

  async createUser(data: any) {
    return prisma.user.create({
      data,
      include: {
        clinic: {
          select: {
            id: true,
            tradeName: true,
            subdomain: true
          }
        }
      }
    });
  }

  async updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        loginAttempts: 0
      }
    });
  }

  async incrementLoginAttempts(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loginAttempts: true }
    });

    const attempts = (user?.loginAttempts || 0) + 1;

    return prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: attempts,
        // Bloquear por 30 minutos após 5 tentativas
        blockedUntil: attempts >= 5 
          ? new Date(Date.now() + 30 * 60 * 1000) 
          : null
      }
    });
  }

  async resetLoginAttempts(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: 0,
        blockedUntil: null
      }
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false
      }
    });
  }
}
```

---

## 9️⃣ Service - Auth

```typescript
// src/service/authService.ts

import { AuthRepository } from '../repository/authRepository';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { 
  BusinessError, 
  UnauthorizedError, 
  NotFoundError 
} from '../utils/errors';

export class AuthService {
  constructor(private authRepository: AuthRepository) {}

  async login(email: string, password: string, clinicSubdomain: string) {
    // 1. Buscar clínica pelo subdomain
    const clinic = await prisma.clinic.findUnique({
      where: { subdomain: clinicSubdomain }
    });

    if (!clinic) {
      throw new NotFoundError('Clínica não encontrada');
    }

    // 2. Buscar usuário por email
    const user = await this.authRepository.findUserByEmail(email, clinic.id);

    if (!user) {
      throw new UnauthorizedError('Email ou senha incorretos');
    }

    // 3. Verificar se está bloqueado
    if (user.blockedUntil && user.blockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.blockedUntil.getTime() - Date.now()) / (1000 * 60)
      );
      throw new BusinessError(
        `Usuário bloqueado. Tente novamente em ${minutesLeft} minutos`
      );
    }

    // 4. Verificar senha
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      await this.authRepository.incrementLoginAttempts(user.id);
      throw new UnauthorizedError('Email ou senha incorretos');
    }

    // 5. Verificar status
    if (user.status !== 'ACTIVE') {
      throw new BusinessError('Usuário inativo ou bloqueado');
    }

    // 6. Resetar tentativas e atualizar último login
    await this.authRepository.updateLastLogin(user.id);

    // 7. Gerar tokens
    const payload = {
      userId: user.id,
      clinicId: user.clinicId,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 8. Remover senha do retorno
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      mustChangePassword: user.mustChangePassword
    };
  }

  async register(data: {
    clinicData: any;
    adminData: any;
  }) {
    // Registro do primeiro admin da clínica
    
    // 1. Validar força da senha
    if (!validatePasswordStrength(data.adminData.password)) {
      throw new BusinessError(
        'Senha deve ter no mínimo 8 caracteres, 1 letra maiúscula, 1 minúscula e 1 número'
      );
    }

    // 2. Verificar se subdomain já existe
    const existingClinic = await prisma.clinic.findUnique({
      where: { subdomain: data.clinicData.subdomain }
    });

    if (existingClinic) {
      throw new BusinessError('Este subdomain já está em uso');
    }

    // 3. Criar clínica
    const clinic = await prisma.clinic.create({
      data: data.clinicData
    });

    // 4. Hash da senha
    const hashedPassword = await hashPassword(data.adminData.password);

    // 5. Criar usuário admin
    const admin = await this.authRepository.createUser({
      clinicId: clinic.id,
      name: data.adminData.name,
      cpf: data.adminData.cpf,
      email: data.adminData.email,
      phone: data.adminData.phone,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      mustChangePassword: false,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date()
    });

    // 6. Criar configurações padrão da clínica
    await prisma.clinicSettings.create({
      data: { clinicId: clinic.id }
    });

    return {
      clinic,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyToken(refreshToken);

      // Verificar se usuário ainda existe e está ativo
      const user = await this.authRepository.findUserById(decoded.userId);

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Usuário inválido');
      }

      const payload = {
        userId: user.id,
        clinicId: user.clinicId,
        email: user.email,
        role: user.role
      };

      const newAccessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new UnauthorizedError('Token inválido ou expirado');
    }
  }

  async me(userId: string) {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ) {
    // 1. Buscar usuário
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // 2. Verificar senha antiga
    const isOldPasswordValid = await comparePassword(oldPassword, user.password);

    if (!isOldPasswordValid) {
      throw new BusinessError('Senha atual incorreta');
    }

    // 3. Validar nova senha
    if (!validatePasswordStrength(newPassword)) {
      throw new BusinessError(
        'Senha deve ter no mínimo 8 caracteres, 1 letra maiúscula, 1 minúscula e 1 número'
      );
    }

    // 4. Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // 5. Atualizar
    await this.authRepository.updatePassword(userId, hashedPassword);

    return { message: 'Senha alterada com sucesso' };
  }
}
```

---

## 🔟 Controller - Auth

```typescript
// src/controller/authController.ts

import { Request, Response } from 'express';
import { AuthService } from '../service/authService';
import * as yup from 'yup';
import { ValidationError } from '../utils/errors';

export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response) {
    try {
      const schema = yup.object({
        email: yup.string().email('Email inválido').required('Email é obrigatório'),
        password: yup.string().required('Senha é obrigatória'),
        subdomain: yup.string().required('Subdomain é obrigatório')
      });

      const { email, password, subdomain } = await schema.validate(req.body);

      const result = await this.authService.login(email, password, subdomain);

      return res.json(result);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async register(req: Request, res: Response) {
    try {
      const schema = yup.object({
        clinic: yup.object({
          legalName: yup.string().required(),
          tradeName: yup.string().required(),
          cnpj: yup.string().length(14).required(),
          email: yup.string().email().required(),
          phone: yup.string().required(),
          subdomain: yup.string()
            .matches(/^[a-z0-9-]+$/, 'Subdomain deve conter apenas letras minúsculas, números e hífens')
            .required(),
          zipCode: yup.string().length(8).required(),
          street: yup.string().required(),
          number: yup.string().required(),
          neighborhood: yup.string().required(),
          city: yup.string().required(),
          state: yup.string().length(2).required()
        }),
        admin: yup.object({
          name: yup.string().required(),
          cpf: yup.string().length(11).required(),
          email: yup.string().email().required(),
          phone: yup.string().required(),
          password: yup.string().min(8).required()
        })
      });

      const validatedData = await schema.validate(req.body);

      const result = await this.authService.register({
        clinicData: validatedData.clinic,
        adminData: validatedData.admin
      });

      return res.status(201).json({
        message: 'Clínica e administrador criados com sucesso',
        data: result
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const schema = yup.object({
        refreshToken: yup.string().required('Refresh token é obrigatório')
      });

      const { refreshToken } = await schema.validate(req.body);

      const result = await this.authService.refreshToken(refreshToken);

      return res.json(result);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const user = await this.authService.me(req.user.userId);

      return res.json({ data: user });
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const schema = yup.object({
        oldPassword: yup.string().required('Senha atual é obrigatória'),
        newPassword: yup.string().min(8).required('Nova senha é obrigatória')
      });

      const { oldPassword, newPassword } = await schema.validate(req.body);

      const result = await this.authService.changePassword(
        req.user.userId,
        oldPassword,
        newPassword
      );

      return res.json(result);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  private handleError(error: any, res: Response) {
    console.error('Auth Controller Error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.errors?.[0] || error.message });
    }

    if (error.name === 'BusinessError') {
      return res.status(422).json({ error: error.message });
    }

    if (error.name === 'UnauthorizedError') {
      return res.status(401).json({ error: error.message });
    }

    if (error.name === 'NotFoundError') {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
```

---

## 1️⃣1️⃣ Routes - Auth

```typescript
// src/routes/authRoutes.ts

import { Router } from 'express';
import { AuthController } from '../controller/authController';
import { AuthService } from '../service/authService';
import { AuthRepository } from '../repository/authRepository';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Instanciar dependências
const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

// Rotas públicas
router.post('/login', (req, res) => authController.login(req, res));
router.post('/register', (req, res) => authController.register(req, res));
router.post('/refresh', (req, res) => authController.refreshToken(req, res));

// Rotas protegidas
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));
router.post('/change-password', authMiddleware, (req, res) => 
  authController.changePassword(req, res)
);

export default router;
```

---

## 🎯 Como Usar (Exemplos de Requisições)

### 1. Registro (Criar primeira clínica + admin)

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "clinic": {
    "legalName": "Clínica Exemplo LTDA",
    "tradeName": "Clínica Exemplo",
    "cnpj": "12345678000190",
    "email": "contato@exemplo.com",
    "phone": "11987654321",
    "subdomain": "exemplo",
    "zipCode": "01310100",
    "street": "Avenida Paulista",
    "number": "1000",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP"
  },
  "admin": {
    "name": "Dr. João Silva",
    "cpf": "12345678901",
    "email": "joao@exemplo.com",
    "phone": "11987654321",
    "password": "Senha@123"
  }
}
```

### 2. Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "joao@exemplo.com",
  "password": "Senha@123",
  "subdomain": "exemplo"
}
```

**Resposta:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Dr. João Silva",
    "email": "joao@exemplo.com",
    "role": "ADMIN",
    "status": "ACTIVE"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "mustChangePassword": false
}
```

### 3. Buscar dados do usuário logado

```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGc...
```

### 4. Trocar senha

```http
POST /api/v1/auth/change-password
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "oldPassword": "Senha@123",
  "newPassword": "NovaSenha@456"
}
```

### 5. Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

---

## ✅ Checklist de Implementação

- [ ] Criar `utils/errors.ts`
- [ ] Criar `utils/jwt.ts`
- [ ] Criar `utils/password.ts`
- [ ] Criar `@types/express.d.ts`
- [ ] Criar `middlewares/authMiddleware.ts`
- [ ] Criar `middlewares/roleMiddleware.ts`
- [ ] Criar `middlewares/errorMiddleware.ts`
- [ ] Criar `repository/authRepository.ts`
- [ ] Criar `service/authService.ts`
- [ ] Criar `controller/authController.ts`
- [ ] Criar `routes/authRoutes.ts`
- [ ] Instalar dependências: `yarn add jsonwebtoken bcryptjs yup`
- [ ] Instalar types: `yarn add -D @types/jsonwebtoken @types/bcryptjs`
- [ ] Testar login
- [ ] Testar registro
- [ ] Testar middlewares

---

## 🔄 Próximos Passos

Após concluir o Auth Module, você pode seguir para:
1. **User Module** - Gestão de usuários
2. **Specialty Module** - Especialidades
3. **Procedure Module** - Procedimentos

Use este arquivo como **referência** para implementar os demais módulos! 🚀
