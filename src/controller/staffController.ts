import type { Request, Response } from "express";
import {
  DeactivateReceptionService,
  GetReceptionByIdService,
  UpdateReceptionService,
} from "../services/staff/receptionManagementService";
import { GetReceptionistsService } from "../services/staff/getProfessional";
import {
  CompleteStaffService,
  InviteStaffService,
} from "../services/staff/staffRegistrationService";

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

export class StaffController {
  /**
   * POST /api/staff/invite
   * Admin convida staff (recepcionista/admin)
   */
  async invite(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.userId;

      if (!adminId) {
        res.status(401).json({ error: "Nao autenticado" });
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
   * Completar cadastro de staff (apos verificar email)
   */
  async complete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId; // Vem do token de verificacao

      if (!userId) {
        res.status(401).json({ error: "Nao autenticado" });
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

  /**
   * GET /api/staff/receptionists
   * Lista recepcionistas da clinica do usuario autenticado
   */
  async getAllReceptionists(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;

      if (!clinicId) {
        res.status(400).json({ error: "Clinica nao identificada no token" });
        return;
      }

      const service = new GetReceptionistsService();
      const receptionists = await service.execute(clinicId);

      res.status(200).json({
        count: receptionists.length,
        items: receptionists,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar recepcionistas" });
      }
    }
  }

  /**
   * GET /api/reception/:id
   * Visualiza detalhes de uma recepcionista
   */
  async getReceptionById(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      const receptionistId = req.params.id as string;

      if (!clinicId) {
        res.status(400).json({ error: "Clinica nao identificada no token" });
        return;
      }

      if (!UUID_REGEX.test(receptionistId)) {
        res.status(400).json({ error: "ID da recepcionista invalido" });
        return;
      }

      const service = new GetReceptionByIdService();
      const receptionist = await service.execute(clinicId, receptionistId);

      res.status(200).json(receptionist);
    } catch (error) {
      if (error instanceof Error) {
        res.status(resolveStatusCode(error.message)).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao buscar recepcionista" });
      }
    }
  }

  /**
   * PATCH /api/reception/:id
   * Atualiza dados da recepcionista
   */
  async updateReception(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.userId;
      const receptionistId = req.params.id as string;

      if (!adminId) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      if (!UUID_REGEX.test(receptionistId)) {
        res.status(400).json({ error: "ID da recepcionista invalido" });
        return;
      }

      const service = new UpdateReceptionService();
      const result = await service.execute(adminId, receptionistId, req.body);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(resolveStatusCode(error.message)).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao atualizar recepcionista" });
      }
    }
  }

  /**
   * DELETE /api/reception/:id
   * Desativa recepcionista (soft delete)
   */
  async removeReception(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.userId;
      const receptionistId = req.params.id as string;

      if (!adminId) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      if (!UUID_REGEX.test(receptionistId)) {
        res.status(400).json({ error: "ID da recepcionista invalido" });
        return;
      }

      const service = new DeactivateReceptionService();
      const result = await service.execute(adminId, receptionistId);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(resolveStatusCode(error.message)).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao desativar recepcionista" });
      }
    }
  }
}
