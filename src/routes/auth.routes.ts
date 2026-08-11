import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { AuthController } from "../controller/authController";
import { authMiddleware, tempRegistrationAuth } from "../middlewares/auth";
import { authLimiter, emailLimiter, tokenLimiter } from "../middlewares/rateLimiters";
import { validate } from "../middlewares/validation";
import {
  activateAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  registerStartSchema,
  resendVerificationSchema,
  resetPasswordSchema,
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

    termsAccepted: b.termsAccepted,
  };

  next();
}

const router = Router();
const authController = new AuthController();

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
router.post("/register/start", authLimiter, validate(registerStartSchema), (req, res) =>
  authController.registerStart(req, res),
);

/**
 * PÚBLICO — Etapa 2: Verificar token de email
 * POST /api/auth/register/verify
 */
router.post("/register/verify", tokenLimiter, validate(verifyEmailSchema), (req, res) =>
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
  tempRegistrationAuth,
  flattenPatientBody,
  validate(completePatientSchema),
  (req, res) => authController.registerComplete(req, res),
);

/**
 * PÚBLICO — Validar token de ativação sem consumi-lo (carregamento da página)
 * GET /api/auth/activate-account/:token
 */
router.get("/activate-account/:token", tokenLimiter, (req, res) =>
  authController.checkActivationToken(req, res),
);

/**
 * PÚBLICO — Ativar conta de paciente cadastrado pela recepção e definir a senha
 * POST /api/auth/activate-account
 */
router.post(
  "/activate-account",
  tokenLimiter,
  validate(activateAccountSchema),
  (req, res) => authController.activateAccount(req, res),
);

/**
 * PÚBLICO — Link do email (redireciona para o frontend)
 * GET /api/auth/verify-email/:token
 */
router.get("/verify-email/:token", (req, res) => authController.verifyEmailLink(req, res));

/**
 * PÚBLICO — Solicitar link de redefinição de senha
 * POST /api/auth/forgot-password
 */
router.post("/forgot-password", emailLimiter, validate(forgotPasswordSchema), (req, res) =>
  authController.forgotPassword(req, res),
);

/**
 * PÚBLICO — Confirmar nova senha com o token recebido por email
 * POST /api/auth/reset-password
 */
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), (req, res) =>
  authController.resetPassword(req, res),
);

/**
 * PROTEGIDO — Registrar aceite de Termos/Privacidade (contas anteriores a este recurso)
 * POST /api/auth/accept-terms
 */
router.post("/accept-terms", authMiddleware, (req, res) =>
  authController.acceptTerms(req, res),
);

export default router;
