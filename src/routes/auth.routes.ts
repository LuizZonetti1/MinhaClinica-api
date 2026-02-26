import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "../controller/authController";
import { tempRegistrationAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  loginSchema,
  registerStartSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from "../schemas/authSchema";
import { completePatientSchema } from "../schemas/patientSchema";

/**
 * Converte o payload aninhado do frontend para o formato plano esperado pelo backend.
 * Aceita tanto formato plano quanto aninhado.
 *
 * Frontend envia:  { birthDate, address: { cep, ... }, medicalInfo: { emergencyName, ... } }
 * Backend espera:  { dateOfBirth, zipCode, street, ..., emergencyContactName, ... }
 */
function flattenPatientBody(req: Request, _res: Response, next: NextFunction): void {
  const b = req.body;

  const address = b.address ?? {};
  const medicalInfo = b.medicalInfo ?? {};

  req.body = {
    // Campos diretos (passa-through se já vier plano)
    cpf: b.cpf,
    phone: b.phone,
    password: b.password,
    gender: b.gender,
    rg: b.rg,

    // Data de nascimento: aceita birthDate (frontend) ou dateOfBirth (plano)
    dateOfBirth: b.dateOfBirth ?? b.birthDate,

    // Endereço: aceita aninhado em address.* ou plano
    zipCode: b.zipCode ?? address.cep ?? address.zipCode,
    street: b.street ?? address.street,
    number: b.number ?? address.number,
    complement: b.complement ?? address.complement,
    neighborhood: b.neighborhood ?? address.neighborhood ?? address.bairro,
    city: b.city ?? address.city ?? address.cidade,
    state: b.state ?? address.state ?? address.estado,

    // Telefone alternativo
    alternativePhone: b.alternativePhone ?? address.alternativePhone,

    // Dados médicos: aceita aninhado em medicalInfo.* ou plano
    bloodType: b.bloodType ?? medicalInfo.bloodType ?? medicalInfo.tipoSanguineo,
    allergies: b.allergies ?? medicalInfo.allergies ?? medicalInfo.alergias,
    medications: b.medications ?? medicalInfo.medications ?? medicalInfo.medicamentos,
    conditions: b.conditions ?? medicalInfo.conditions ?? medicalInfo.condicoes,
    observations: b.observations ?? medicalInfo.observations ?? medicalInfo.observacoes,

    // Contato de emergência: aceita variantes de nome
    emergencyContactName:
      b.emergencyContactName ??
      medicalInfo.emergencyContactName ??
      medicalInfo.emergencyName ??
      medicalInfo.nomeEmergencia,
    emergencyContactPhone:
      b.emergencyContactPhone ??
      medicalInfo.emergencyContactPhone ??
      medicalInfo.emergencyPhone ??
      medicalInfo.telefoneEmergencia,
  };

  next();
}

const router = Router();
const authController = new AuthController();

// Rate limit geral para endpoints de auth (10 req/min por IP)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Muitas requisições. Tente novamente em 1 minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit mais restritivo para envio de email (5 req/15min por IP)
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Limite de envio de emails atingido. Aguarde 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * PÚBLICO — Login
 */
router.post("/login", authLimiter, validate(loginSchema), (req, res) =>
  authController.login(req, res),
);

/**
 * PÚBLICO — Etapa 1: Início do cadastro
 * POST /api/auth/register/start
 */
router.post("/register/start", emailLimiter, validate(registerStartSchema), (req, res) =>
  authController.registerStart(req, res),
);

/**
 * PÚBLICO — Etapa 2: Verificar token de email
 * POST /api/auth/register/verify
 */
router.post("/register/verify", authLimiter, validate(verifyEmailSchema), (req, res) =>
  authController.registerVerify(req, res),
);

/**
 * PÚBLICO — Etapa 2: Reenviar email de verificação
 * POST /api/auth/register/resend-verification
 */
router.post(
  "/register/resend-verification",
  emailLimiter,
  validate(resendVerificationSchema),
  (req, res) => authController.resendVerification(req, res),
);

/**
 * PROTEGIDO — Etapa 3: Completar cadastro
 * POST /api/auth/register/complete
 * Requer: Authorization: Bearer <tempToken da Etapa 2>
 */
router.post(
  "/register/complete",
  authLimiter,
  tempRegistrationAuth,
  flattenPatientBody,
  validate(completePatientSchema),
  (req, res) => authController.registerComplete(req, res),
);

/**
 * PÚBLICO — Link do email (redireciona para o frontend)
 * GET /api/auth/verify-email/:token
 */
router.get("/verify-email/:token", (req, res) => authController.verifyEmailLink(req, res));

export default router;
