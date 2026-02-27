import { Router } from "express";
import rateLimit from "express-rate-limit";
import { ClinicController } from "../controller/clinicController";
import { tempRegistrationAuth } from "../middlewares/auth";

const clinicRoutes = Router();
const clinicController = new ClinicController();

// Rate limits
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Muitas requisições. Tente novamente em 1 minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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

// ── Gestão de clínicas (admin/autenticado) ──────────────────────────────────

// Rota para listar todas as clínicas
clinicRoutes.get("/list", (req, res) => clinicController.listClinics(req, res));

// Rota para buscar clínica por ID
clinicRoutes.get("/:id", (req, res) => clinicController.getClinicById(req, res));

// Rota para atualizar uma clínica
clinicRoutes.put("/:id", (req, res) => clinicController.updateClinic(req, res));

// Rota para deletar uma clínica
clinicRoutes.delete("/:id", (req, res) => clinicController.deleteClinic(req, res));

export default clinicRoutes;
