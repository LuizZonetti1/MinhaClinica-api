# 📋 Guia de Uso dos Schemas com Yup

## 📁 Estrutura de Pastas

```
src/
├── schemas/
│   ├── clinicSchema.ts       # Validações de clínica
│   ├── userSchema.ts         # Validações de usuário
│   ├── patientSchema.ts      # Validações de paciente
│   └── appointmentSchema.ts  # Validações de agendamentos
```

---

## 🎯 Como Usar nos Controllers

### Exemplo 1: Validação Simples

```typescript
import { ClinicSchema } from "../schemas/clinicSchema";

export class ClinicController {
    async create(req: Request, res: Response) {
        try {
            // Valida e transforma os dados
            const validatedData = await ClinicSchema.create.validate(req.body, {
                abortEarly: false,    // Retorna TODOS os erros
                stripUnknown: true,   // Remove campos extras
            });

            // Usa os dados validados
            const clinic = await createClinicService.execute(validatedData);
            
            res.status(201).json({ data: clinic });
        } catch (error: any) {
            // Trata erros de validação
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    message: "Dados inválidos",
                    errors: error.errors, // ["CNPJ é obrigatório", "Email inválido"]
                });
            }
            
            res.status(500).json({ message: error.message });
        }
    }
}
```

---

### Exemplo 2: Validação com Middleware

```typescript
// src/middlewares/validation.ts
import { Request, Response, NextFunction } from "express";
import { Schema } from "yup";

export const validate = (schema: Schema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = await schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });
            
            // Substitui req.body pelos dados validados
            req.body = validatedData;
            next();
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    message: "Erro de validação",
                    errors: error.errors,
                });
            }
            next(error);
        }
    };
};
```

```typescript
// Uso no router
import { validate } from "./middlewares/validation";
import { ClinicSchema } from "./schemas/clinicSchema";

router.post(
    "/clinics",
    validate(ClinicSchema.create), // Middleware de validação
    clinicController.create
);
```

---

## 🔧 Funcionalidades dos Schemas

### 1. **Transformações Automáticas**
```typescript
// Input do usuário:
{ email: "USUARIO@EMAIL.COM" }

// Após validação:
{ email: "usuario@email.com" } // ✅ lowercase automático
```

### 2. **Valores Padrão**
```typescript
timezone: yup.string().default('America/Sao_Paulo')
isActive: yup.boolean().default(true)

// Se não fornecido, usa o valor padrão
```

### 3. **Validações Condicionais**
```typescript
cancellationReason: yup.string()
    .when('status', {
        is: 'CANCELLED',
        then: (schema) => schema.required(), // Obrigatório se status = CANCELLED
        otherwise: (schema) => schema.optional(),
    })
```

### 4. **Validações Customizadas**
```typescript
birthDate: yup.date()
    .test('age', 'Deve ter no mínimo 18 anos', function(value) {
        if (!value) return false;
        const age = new Date().getFullYear() - value.getFullYear();
        return age >= 18;
    })
```

---

## ✅ Validações Implementadas

### 📌 ClinicSchema
- ✓ CNPJ (14 dígitos)
- ✓ Email válido
- ✓ CEP (8 dígitos)
- ✓ UF (2 letras maiúsculas)
- ✓ Subdomain opcional (lowercase + números + hífens)
- ✓ URLs válidas (website, logoUrl, customDomain)

### 👤 UserSchema
- ✓ Senha forte (8+ caracteres, maiúscula, minúscula, número)
- ✓ Confirmação de senha
- ✓ Roles válidas (ADMIN, RECEPTIONIST, PROFESSIONAL, PATIENT)
- ✓ CPF (11 dígitos)
- ✓ Login separado

### 🏥 PatientSchema
- ✓ CPF único (11 dígitos)
- ✓ Data de nascimento (mínimo 1 ano)
- ✓ Gênero válido
- ✓ Histórico médico (limite de caracteres)
- ✓ Telefone de emergência

### 📅 AppointmentSchema
- ✓ Data não pode ser no passado
- ✓ Horário no formato HH:MM
- ✓ Duração entre 15min e 8h
- ✓ Status e canais válidos
- ✓ Motivo obrigatório ao cancelar
- ✓ Busca de disponibilidade

---

## 🚨 Tratamento de Erros

### Erro de Validação (400)
```json
{
  "message": "Erro de validação",
  "errors": [
    "CNPJ deve conter exatamente 14 dígitos",
    "E-mail inválido",
    "Senha deve ter no mínimo 8 caracteres"
  ]
}
```

### Erro de Negócio (400)
```json
{
  "message": "Já existe uma clínica com o nome 'Clínica ABC' neste endereço"
}
```

---

## 📝 Boas Práticas

1. **Sempre use `abortEarly: false`** para retornar todos os erros de uma vez
2. **Use `stripUnknown: true`** para segurança (remove campos não esperados)
3. **Crie schemas separados** para create/update/search
4. **Mensagens de erro claras** e em português
5. **Validações no frontend E backend** (nunca confie apenas no cliente)

---

## 🎨 Exemplo Completo de Fluxo

```typescript
// 1. Cliente envia requisição
POST /api/clinics
{
  "tradeName": "Clínica ABC",
  "cnpj": "12345678000190",
  "email": "CONTATO@CLINICA.COM",
  "phone": "11987654321",
  // ... outros campos
}

// 2. Schema valida e transforma
{
  "tradeName": "Clínica ABC",
  "cnpj": "12345678000190",
  "email": "contato@clinica.com", // ✅ lowercase
  "phone": "11987654321",
  "timezone": "America/Sao_Paulo", // ✅ valor padrão
  "isActive": true // ✅ valor padrão
}

// 3. Service executa lógica de negócio
// - Verifica duplicação por nome + endereço
// - Cria no banco

// 4. Resposta de sucesso (201)
{
  "message": "Clínica criada com sucesso",
  "data": { /* dados da clínica */ }
}
```

---

**Todos os schemas estão prontos para uso!** 🎉
