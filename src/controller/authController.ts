import { Request, Response } from "express";
import { VerifyEmailService } from "../services/auth/verifyEmailService";

export class AuthController {

    /**
     * GET /api/auth/verify-email/:token
     * Verifica token de email (público)
     */
    async verifyEmail(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.params;

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
}
