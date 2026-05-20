import type { Request, Response } from "express";
import { handleControllerError } from "../utils/controllerUtils";
import {
    ValidateOtpService,
    Disable2FAService,
    Get2FAStatusService,
    Enable2FAService,
    ResendOtpService,
} from "../services/auth/twoFactorService";

export class TwoFactorController {
    /**
     * GET /api/auth/2fa/status
     * Retorna se o 2FA está ativo e quantos dispositivos confiáveis existem.
     */
    async status(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const service = new Get2FAStatusService();
            const result = await service.execute(userId);
            res.status(200).json(result);
        } catch (error) {
            handleControllerError(res, error, "Erro ao obter status do 2FA");
        }
    }

    /**
     * POST /api/auth/2fa/enable
     * Ativa o 2FA por email para o usuário autenticado.
     */
    async enable(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const service = new Enable2FAService();
            const result = await service.execute(userId);
            res.status(200).json(result);
        } catch (error) {
            handleControllerError(res, error, "Erro ao ativar 2FA");
        }
    }

    /**
     * POST /api/auth/2fa/validate
     * Valida o OTP durante o login (usuário ainda não tem token de acesso).
     * Body: { tempToken, code }
     */
    async validate(req: Request, res: Response): Promise<void> {
        try {
            const { tempToken, code } = req.body as { tempToken: string; code: string };
            if (!tempToken || !code) {
                res.status(400).json({ error: "tempToken e código são obrigatórios" });
                return;
            }
            const userAgent = req.headers["user-agent"];
            const service = new ValidateOtpService();
            const result = await service.execute(tempToken, code, userAgent);
            res.status(200).json(result);
        } catch (error) {
            if (error instanceof Error) {
                res.status(401).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Erro ao validar código 2FA" });
            }
        }
    }

    /**
     * DELETE /api/auth/2fa
     * Desativa o 2FA e revoga todos os dispositivos confiáveis.
     */
    async disable(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId!;
            const service = new Disable2FAService();
            const result = await service.execute(userId);
            res.status(200).json(result);
        } catch (error) {
            handleControllerError(res, error, "Erro ao desativar 2FA");
        }
    }

    /**
     * POST /api/auth/2fa/resend
     * Reenvia o OTP por email. Aceita tempToken no body (usuário ainda não tem token de acesso).
     */
    async resend(req: Request, res: Response): Promise<void> {
        try {
            const { tempToken } = req.body as { tempToken?: string };
            if (!tempToken) {
                res.status(400).json({ error: "tempToken é obrigatório" });
                return;
            }
            const service = new ResendOtpService();
            const result = await service.execute(tempToken);
            res.status(200).json(result);
        } catch (error) {
            handleControllerError(res, error, "Erro ao reenviar código 2FA");
        }
    }
}
