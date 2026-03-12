import type { Request, Response } from "express";
import {
  DeactivateProfessionalService,
  GetProfessionalByIdService,
  UpdateProfessionalService,
} from "../services/professionals/professionalManagementService";
import { GetProfessionalsService } from "../services/professionals/getProfessionalsService";
import {
  CompleteProfessionalService,
  InviteProfessionalService,
} from "../services/professionals/professionalRegistrationService";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const resolveStatusCode = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes("nao encontrado")) {
    return 404;
  }

  if (normalized.includes("agendamentos ativos") || normalized.includes("nao e possivel")) {
    return 409;
  }

  return 400;
};

export class ProfessionalController {
  /**
   * POST /api/professionals/invite
   * Admin convida profissional
   */
  async invite(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.userId;

      if (!adminId) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      const { name, email, specialty } = req.body;

      const service = new InviteProfessionalService();
      const result = await service.execute(adminId, { name, email, specialty });

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
   * Completar cadastro de profissional (apos verificar email)
   */
  async complete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId; // Vem do token de verificacao

      if (!userId) {
        res.status(401).json({ error: "Nao autenticado" });
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

  /**
   * GET /api/professionals
   * Lista profissionais da clinica do usuario autenticado
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;

      if (!clinicId) {
        res.status(400).json({ error: "Clinica nao identificada no token" });
        return;
      }

      const service = new GetProfessionalsService();
      const professionals = await service.execute(clinicId);

      res.status(200).json({
        count: professionals.length,
        items: professionals,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar profissionais" });
      }
    }
  }

  /**
   * GET /api/professionals/:id
   * Visualiza detalhes de um profissional
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      const professionalId = req.params.id as string;

      if (!clinicId) {
        res.status(400).json({ error: "Clinica nao identificada no token" });
        return;
      }

      if (!UUID_REGEX.test(professionalId)) {
        res.status(400).json({ error: "ID do profissional invalido" });
        return;
      }

      const service = new GetProfessionalByIdService();
      const professional = await service.execute(clinicId, professionalId);

      res.status(200).json(professional);
    } catch (error) {
      if (error instanceof Error) {
        res.status(resolveStatusCode(error.message)).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao buscar profissional" });
      }
    }
  }

  /**
   * PATCH /api/professionals/:id
   * Atualiza dados do profissional
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.userId;
      const professionalId = req.params.id as string;

      if (!adminId) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      if (!UUID_REGEX.test(professionalId)) {
        res.status(400).json({ error: "ID do profissional invalido" });
        return;
      }

      const service = new UpdateProfessionalService();
      const result = await service.execute(adminId, professionalId, req.body);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(resolveStatusCode(error.message)).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao atualizar profissional" });
      }
    }
  }

  /**
   * DELETE /api/professionals/:id
   * Desativa profissional (soft delete)
   */
  async remove(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.userId;
      const professionalId = req.params.id as string;

      if (!adminId) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      if (!UUID_REGEX.test(professionalId)) {
        res.status(400).json({ error: "ID do profissional invalido" });
        return;
      }

      const service = new DeactivateProfessionalService();
      const result = await service.execute(adminId, professionalId);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(resolveStatusCode(error.message)).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao desativar profissional" });
      }
    }
  }
}
