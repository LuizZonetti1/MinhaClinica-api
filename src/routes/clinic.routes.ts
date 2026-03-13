import { Router } from "express";
import rateLimit from "express-rate-limit";
import { ClinicController } from "../controller/clinicController";
import { authMiddleware, checkRole, tempRegistrationAuth } from "../middlewares/auth";
import { UserRole } from "../types/enums";

const clinicRoutes = Router();
const clinicController = new ClinicController();

const isDev = process.env.NODE_ENV !== "production";

// Rate limits
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 1000 : 10,
  message: { error: "Muitas requisições. Tente novamente em 1 minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 5,
  message: { error: "Limite de envio de e-mails atingido. Aguarde 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Cadastro de clínica em etapas (público) ─────────────────────────────────

/**
 * PÚBLICO — Etapa 1: dados da clínica + nome/e-mail do dono
 * POST /api/clinics/register/start
 */
clinicRoutes.post("/register/start", emailLimiter, (req, res) =>
  clinicController.registerStart(req, res),
);

/**
 * PÚBLICO — Etapa 2: verificar token de e-mail
 * POST /api/clinics/register/verify
 */
clinicRoutes.post("/register/verify", authLimiter, (req, res) =>
  clinicController.registerVerify(req, res),
);

/**
 * PÚBLICO — Etapa 2: reenviar e-mail de verificação
 * POST /api/clinics/register/resend-verification
 */
clinicRoutes.post("/register/resend-verification", emailLimiter, (req, res) =>
  clinicController.resendVerification(req, res),
);

/**
 * PROTEGIDO — Etapa 3: completar dados do dono e ativar clínica
 * POST /api/clinics/register/complete
 * Requer: Authorization: Bearer <tempToken da Etapa 2>
 */
clinicRoutes.post("/register/complete", authLimiter, tempRegistrationAuth, (req, res) =>
  clinicController.registerComplete(req, res),
);

/**
 * PÚBLICO — Link clicado no e-mail pelo responsável da clínica
 * GET /api/clinics/verify-email/:token
 * Verifica o token, gera tempToken JWT e redireciona para o frontend completar cadastro
 */
clinicRoutes.get("/verify-email/:token", (req, res) => clinicController.verifyEmailLink(req, res));

// ── Gestão de clínicas (autenticado) ────────────────────────────────────────

// Rota para listar todas as clínicas
clinicRoutes.get("/list", (req, res) => clinicController.listClinics(req, res));

// ── Configurações da clínica (página de Configurações — apenas ADMIN) ─────────
// IMPORTANTE: estas rotas devem ficar antes de /:id para não serem capturadas como parâmetro

/**
 * GET /api/clinics/settings
 * Retorna todas as configurações da clínica do admin autenticado
 */
clinicRoutes.get("/settings", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  clinicController.getSettings(req, res),
);

/**
 * PATCH /api/clinics/settings/info
 * Atualiza dados básicos: nome, CNPJ, telefone, e-mail, endereço
 */
clinicRoutes.patch("/settings/info", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  clinicController.updateInfo(req, res),
);

/**
 * PATCH /api/clinics/settings/schedule
 * Atualiza configurações de horário: abertura, fechamento, intervalo, dias
 */
clinicRoutes.patch("/settings/schedule", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  clinicController.updateSchedule(req, res),
);

/**
 * PATCH /api/clinics/settings/notifications
 * Atualiza preferências de notificações (toggles)
 */
clinicRoutes.patch(
  "/settings/notifications",
  authMiddleware,
  checkRole(UserRole.ADMIN),
  (req, res) => clinicController.updateNotifications(req, res),
);

/**
 * PATCH /api/clinics/settings/security
 * Atualiza configurações de segurança: 2FA, log de acessos, timeout de sessão
 */
clinicRoutes.patch("/settings/security", authMiddleware, checkRole(UserRole.ADMIN), (req, res) =>
  clinicController.updateSecurity(req, res),
);

// ── Consulta/atualização genérica por ID ─────────────────────────────────────

// Rota para buscar clínica por ID
clinicRoutes.get("/:id", (req, res) => clinicController.getClinicById(req, res));

// Rota para atualizar uma clínica
clinicRoutes.put("/:id", (req, res) => clinicController.updateClinic(req, res));

// Rota para deletar uma clínica
clinicRoutes.delete("/:id", (req, res) => clinicController.deleteClinic(req, res));

export default clinicRoutes;
