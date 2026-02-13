import type { Request, Response } from "express";
import {
  CompleteStaffService,
  InviteStaffService,
} from "../services/staff/staffRegistrationService";

export class StaffController {
  /**
   * POST /api/staff/invite
   * Admin convida staff (recepcionista/admin)
   */
  async invite(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.userId;

      if (!adminId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const { name, email, role } = req.body;

      const service = new InviteStaffService();
      const result = await service.execute(adminId, { name, email, role });

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
   * POST /api/staff/complete
   * Completar cadastro de staff (após verificar email)
   */
  async complete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId; // Vem do token de verificação

      if (!userId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const service = new CompleteStaffService();
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
