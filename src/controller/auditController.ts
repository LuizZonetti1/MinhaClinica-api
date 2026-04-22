import type { Request, Response } from "express";
import { AuditLogRepository } from "../repository/auditLogRepository";
import { VerifyIntegrityService } from "../services/documents/verifyIntegrityService";

const auditLogRepository = new AuditLogRepository();

export class AuditController {
  async listAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const { entity, action, userId, startDate, endDate, page, limit } = req.query;

      const result = await auditLogRepository.findAll({
        clinicId,
        entity: entity as string | undefined,
        action: action as string | undefined,
        userId: userId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar logs de auditoria" });
      }
    }
  }

  async verifyDocumentIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const docId = req.params.docId as string;
      const service = new VerifyIntegrityService();
      const result = await service.execute(docId, clinicId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao verificar integridade do documento" });
      }
    }
  }
}
