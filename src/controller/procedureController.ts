import type { Request, Response } from "express";
import { CreateProcedureService } from "../services/procedures/createProcedureService";
import { DeleteProcedureService } from "../services/procedures/deleteProcedureService";
import { ListMyProceduresService } from "../services/procedures/listMyProceduresService";
import { ListProceduresService } from "../services/procedures/listProceduresService";
import { ListProfessionalProceduresService } from "../services/procedures/listProfessionalProceduresService";
import { SetMyProceduresService } from "../services/procedures/setMyProceduresService";
import { UpdateProcedureService } from "../services/procedures/updateProcedureService";
import type { AuditContext } from "../types/document";
import { handleControllerError } from "../utils/controllerUtils";

function buildAuditContext(req: Request): AuditContext {
  return {
    userId: req.userId!,
    userName: req.userName ?? "Desconhecido",
    clinicId: req.clinicId!,
    ipAddress: req.ip ?? req.socket?.remoteAddress ?? null,
    userAgent: req.headers["user-agent"] ?? null,
  };
}

export class ProcedureController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const includeInactive = req.query.includeInactive === "true";
      const service = new ListProceduresService();
      const procedures = await service.execute(clinicId, includeInactive);
      res.status(200).json(procedures);
    } catch (error) {
      handleControllerError(res, error, "Erro ao listar procedimentos");
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const service = new CreateProcedureService();
      const procedure = await service.execute(req.body, context);
      res.status(201).json(procedure);
    } catch (error) {
      handleControllerError(res, error, "Erro ao criar procedimento");
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const id = req.params.id as string;
      const service = new UpdateProcedureService();
      const procedure = await service.execute(id, req.body, context);
      res.status(200).json(procedure);
    } catch (error) {
      handleControllerError(res, error, "Erro ao atualizar procedimento");
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const id = req.params.id as string;
      const service = new DeleteProcedureService();
      const result = await service.execute(id, context);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao excluir procedimento");
    }
  }

  async listMine(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const clinicId = req.clinicId;
      if (!userId || !clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const service = new ListMyProceduresService();
      const procedures = await service.execute(userId, clinicId);
      res.status(200).json(procedures);
    } catch (error) {
      handleControllerError(res, error, "Erro ao listar meus procedimentos");
    }
  }

  async setMine(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const clinicId = req.clinicId;
      if (!userId || !clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const { procedureIds } = req.body as { procedureIds: string[] };
      const service = new SetMyProceduresService();
      const result = await service.execute(userId, clinicId, procedureIds);
      res.status(200).json(result);
    } catch (error: any) {
      if (error?.statusCode === 409 && error?.blockedProcedures) {
        res.status(409).json({ error: error.message, blockedProcedures: error.blockedProcedures });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar meus procedimentos");
    }
  }

  async listForProfessional(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const professionalId = req.params.id as string;
      const service = new ListProfessionalProceduresService();
      const procedures = await service.execute(professionalId, clinicId);
      res.status(200).json(procedures);
    } catch (error) {
      handleControllerError(res, error, "Erro ao listar procedimentos do profissional");
    }
  }
}
