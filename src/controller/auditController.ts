import type { Request, Response } from "express";
import { handleControllerError } from "../utils/controllerUtils";
import { AuditLogRepository } from "../repository/auditLogRepository";
import { VerifyIntegrityService } from "../services/documents/verifyIntegrityService";


const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseQueryDate(value: unknown, field: string): Date | undefined {
  if (!value) return undefined;
  const str = String(value);
  if (!ISO_DATE_RE.test(str)) {
    throw Object.assign(
      new Error(`Par\u00e2metro '${field}' inv\u00e1lido. Use o formato YYYY-MM-DD.`),
      { statusCode: 400 },
    );
  }
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) {
    throw Object.assign(
      new Error(`Par\u00e2metro '${field}' n\u00e3o \u00e9 uma data v\u00e1lida.`),
      { statusCode: 400 },
    );
  }
  return d;
}

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

      const parsedStartDate = parseQueryDate(startDate, "startDate");
      const parsedEndDate = parseQueryDate(endDate, "endDate");

      const result = await auditLogRepository.findAll({
        clinicId,
        entity: entity as string | undefined,
        action: action as string | undefined,
        userId: userId as string | undefined,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json(result);
    } catch (error) {
      const err = error as { statusCode?: number; message?: string };
      if (err.statusCode === 400) {
        res.status(400).json({ error: err.message });
        return;
      }
      handleControllerError(res, error, "Erro ao listar logs de auditoria");
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
      handleControllerError(res, error, "Erro ao verificar integridade do documento");
    }
  }
}
