import type { Request, Response } from "express";
import { ConcludeAppointmentService } from "../services/documents/concludeAppointmentService";
import { CreateAddendumService } from "../services/documents/createAddendumService";
import { CreateDocumentService } from "../services/documents/createDocumentService";
import { DeleteDocumentService } from "../services/documents/deleteDocumentService";
import { FinalizeDocumentService } from "../services/documents/finalizeDocumentService";
import { ListDocumentsService } from "../services/documents/listDocumentsService";
import { PrintDocumentService } from "../services/documents/printDocumentService";
import { UpdateDocumentService } from "../services/documents/updateDocumentService";
import { ViewDocumentService } from "../services/documents/viewDocumentService";
import type { AuditContext } from "../types/document";

function buildAuditContext(req: Request): AuditContext {
  return {
    userId: req.userId!,
    userName: req.userName ?? "Desconhecido",
    clinicId: req.clinicId!,
    ipAddress: req.ip ?? req.socket?.remoteAddress ?? null,
    userAgent: req.headers["user-agent"] ?? null,
  };
}

export class DocumentController {
  async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const appointmentId = req.params.id as string;
      const service = new CreateDocumentService();
      const result = await service.execute(appointmentId, req.body, context);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao criar documento" });
      }
    }
  }

  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const appointmentId = req.params.id as string;
      const docId = req.params.docId as string;
      const service = new UpdateDocumentService();
      const result = await service.execute(appointmentId, docId, req.body, context);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao atualizar documento" });
      }
    }
  }

  async finalizeDocument(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const appointmentId = req.params.id as string;
      const docId = req.params.docId as string;
      const service = new FinalizeDocumentService();
      const result = await service.execute(appointmentId, docId, context);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao finalizar documento" });
      }
    }
  }

  async concludeAppointment(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const appointmentId = req.params.id as string;
      const service = new ConcludeAppointmentService();
      const result = await service.execute(appointmentId, context);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao concluir consulta" });
      }
    }
  }

  async createAddendum(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const appointmentId = req.params.id as string;
      const service = new CreateAddendumService();
      const result = await service.execute(appointmentId, req.body, context);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao criar adendo" });
      }
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const appointmentId = req.params.id as string;
      const docId = req.params.docId as string;
      const service = new DeleteDocumentService();
      const result = await service.execute(appointmentId, docId, context);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao excluir documento" });
      }
    }
  }

  async listDocuments(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId && req.userRole !== "PATIENT") {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const appointmentId = req.params.id as string;
      const service = new ListDocumentsService();
      const result = await service.execute(appointmentId, {
        ...context,
        userRole: req.userRole!,
      });
      res.status(200).json({ documents: result });
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar documentos" });
      }
    }
  }

  async viewDocument(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId && req.userRole !== "PATIENT") {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const appointmentId = req.params.id as string;
      const docId = req.params.docId as string;
      const service = new ViewDocumentService();
      const result = await service.execute(appointmentId, docId, {
        ...context,
        userRole: req.userRole!,
      });
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao visualizar documento" });
      }
    }
  }

  async printDocument(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const appointmentId = req.params.id as string;
      const docId = req.params.docId as string;
      const service = new PrintDocumentService();
      const result = await service.execute(appointmentId, docId, {
        ...context,
        userRole: req.userRole!,
      });
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao imprimir documento" });
      }
    }
  }
}
