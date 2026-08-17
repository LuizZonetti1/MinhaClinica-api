import type { Request, Response } from "express";
import { AcceptTermsService } from "../services/auth/acceptTermsService";
import { ActivateReceptionPatientService } from "../services/auth/activateReceptionPatientService";
import { ConfirmEmailChangeService } from "../services/auth/emailChangeService";
import { LoginService } from "../services/auth/loginService";
import { ForgotPasswordService, ResetPasswordService } from "../services/auth/passwordResetService";
import { ResendVerificationService } from "../services/auth/resendVerificationService";
import { VerifyEmailService } from "../services/auth/verifyEmailService";
import {
  CompletePatientService,
  RegisterPatientService,
} from "../services/patients/patientRegistrationService";
import { handleControllerError } from "../utils/controllerUtils";
import { resolveVerifyRedirect } from "../utils/verifyRedirectUtils";

export class AuthController {
  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const service = new LoginService();
      const result = await service.execute({
        ...req.body,
        ipAddress: req.ip ?? req.socket?.remoteAddress ?? null,
        userAgent: req.headers["user-agent"] ?? null,
      });
      res.status(200).json(result);
    } catch (error) {
      // LoginService lança Error puro (sem statusCode) para credenciais
      // inválidas, conta inativa/bloqueada ou papel sem acesso — sempre foi
      // 401, mensagem sempre genérica (evita enumeração do estado da conta).
      if (error instanceof Error) {
        res.status(401).json({ error: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao fazer login");
    }
  }

  /**
   * POST /api/auth/register/start — Etapa 1
   */
  async registerStart(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;
      const service = new RegisterPatientService();
      const result = await service.execute({ name, email });
      res.status(201).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao iniciar cadastro");
    }
  }

  /**
   * POST /api/auth/register/verify — Etapa 2
   * Verifica token do email e retorna JWT temporário
   */
  async registerVerify(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ error: "Token não fornecido" });
        return;
      }
      const service = new VerifyEmailService();
      const result = await service.execute(token);
      res.status(200).json(result);
    } catch (error) {
      // VerifyEmailService lança Error puro (sem statusCode) para token
      // inválido/expirado — sempre foi 400, preserva o status.
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao verificar email");
    }
  }

  /**
   * POST /api/auth/register/resend-verification
   * Reenvia o email de verificação
   */
  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const service = new ResendVerificationService();
      const result = await service.execute({ email });
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao reenviar verificação");
    }
  }

  /**
   * POST /api/auth/register/complete — Etapa 3
   * Protegido pelo tempRegistrationAuth middleware
   */
  async registerComplete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }
      const service = new CompletePatientService();
      const result = await service.execute(userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao completar cadastro");
    }
  }

  /**
   * GET /api/auth/verify-email/:token — link clicado no email
   * Detecta a role do usuário e redireciona para a tela correta no frontend.
   * Suporta PATIENT, PROFESSIONAL e RECEPTIONIST.
   */
  async verifyEmailLink(req: Request, res: Response): Promise<void> {
    return resolveVerifyRedirect(req, res);
  }

  /**
   * GET /api/auth/activate-account/:token
   * Valida o token de ativação sem consumi-lo — usado pela página ao carregar,
   * antes de exibir o formulário de senha.
   */
  async checkActivationToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string;
      const service = new ActivateReceptionPatientService();
      const result = await service.validateToken(token);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao validar token de ativação");
    }
  }

  /**
   * POST /api/auth/activate-account
   * Ativa conta de paciente cadastrado pela recepção e define a senha de acesso
   */
  async activateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      const service = new ActivateReceptionPatientService();
      const result = await service.execute(token, password);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao ativar conta");
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Envia email com link de redefinição de senha.
   * Resposta sempre genérica para evitar user enumeration.
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const service = new ForgotPasswordService();
      await service.execute(email);
      res.status(200).json({
        message: "Se o email estiver cadastrado, você receberá as instruções em breve.",
      });
    } catch (error) {
      handleControllerError(res, error, "Erro ao processar solicitação");
    }
  }

  /**
   * POST /api/auth/reset-password
   * Define a nova senha com base no token recebido por email.
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      const service = new ResetPasswordService();
      await service.execute(token, password);
      res.status(200).json({ message: "Senha redefinida com sucesso." });
    } catch (error) {
      handleControllerError(res, error, "Erro ao redefinir senha");
    }
  }

  /**
   * POST /api/auth/confirm-email-change
   * Efetiva a troca de e-mail. Público: autenticado pelo token que foi
   * enviado à caixa NOVA — é justamente essa posse que autoriza a troca.
   */
  async confirmEmailChange(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body as { token?: string };
      const service = new ConfirmEmailChangeService();
      const result = await service.execute(token ?? "");
      res.status(200).json({
        message: "E-mail alterado com sucesso. Use o novo e-mail para entrar.",
        email: result.email,
      });
    } catch (error) {
      handleControllerError(res, error, "Erro ao confirmar troca de e-mail");
    }
  }

  /**
   * POST /api/auth/accept-terms
   * Registra o aceite de Termos/Privacidade para o usuário logado — usado
   * pelo banner de pendência de contas criadas antes deste recurso existir.
   */
  async acceptTerms(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;
      const service = new AcceptTermsService();
      const result = await service.execute(userId);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao registrar aceite");
    }
  }
}
