import { Request, Response } from "express";
import { InviteProfessionalService, CompleteProfessionalService } from "../services/professionals/professionalRegistrationService";

export class ProfessionalController {

    /**
     * POST /api/professionals/invite
     * Admin convida profissional
     */
    async invite(req: Request, res: Response): Promise<void> {
        try {
            const adminId = req.userId;

            if (!adminId) {
                res.status(401).json({ error: "Não autenticado" });
                return;
            }

            const { name, email } = req.body;

            const service = new InviteProfessionalService();
            const result = await service.execute(adminId, { name, email });

            res.status(201).json(result);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Erro ao enviar convite" });
            }
        }
    }

    /**
     * POST /api/professionals/complete
     * Completar cadastro de profissional (após verificar email)
     */
    async complete(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId; // Vem do token de verificação

            if (!userId) {
                res.status(401).json({ error: "Não autenticado" });
                return;
            }

            const service = new CompleteProfessionalService();
            const result = await service.execute(userId, req.body);

            res.status(200).json(result);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Erro ao completar cadastro" });
            }
        }
    }
}
