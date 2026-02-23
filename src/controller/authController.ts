import type { Request, Response } from "express";
import { LoginService } from "../services/auth/loginService";
import { ResendVerificationService } from "../services/auth/resendVerificationService";
import { VerifyEmailService } from "../services/auth/verifyEmailService";
import {
  CompletePatientService,
  RegisterPatientService,
} from "../services/patients/patientRegistrationService";

export class AuthController {
  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const service = new LoginService();
      const result = await service.execute(req.body);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao fazer login" });
      }
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
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao iniciar cadastro" });
      }
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
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao verificar email" });
      }
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
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao reenviar verificação" });
      }
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
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao completar cadastro" });
      }
    }
  }

  /**
   * GET /api/auth/verify-email/:token — link clicado no email
   * Verifica o token, gera o JWT temporário e redireciona direto para completar cadastro
   */
  async verifyEmailLink(req: Request, res: Response): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const { token } = req.params;

    if (!token) {
      res.redirect(`${frontendUrl}/cadastro?erro=token_invalido`);
      return;
    }

    try {
      const service = new VerifyEmailService();
      const result = await service.execute(String(token));

      // Redireciona para a tela de completar cadastro já com o JWT temporário
      const params = new URLSearchParams({
        tempToken: result.tempToken,
        name: result.name,
        email: result.email,
      });

      res.redirect(`${frontendUrl}/completar-cadastro?${params.toString()}`);
    } catch (error) {
      const isExpired =
        error instanceof Error && error.message.toLowerCase().includes("expirado");

      const errorCode = isExpired ? "token_expirado" : "token_invalido";
      res.redirect(`${frontendUrl}/cadastro?erro=${errorCode}`);
    }
  }
}
