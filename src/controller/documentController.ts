import type { Request, Response } from "express";
import { handleControllerError } from "../utils/controllerUtils";
import { ConcludeAppointmentService } from "../services/documents/concludeAppointmentService";
import { CreateAddendumService } from "../services/documents/createAddendumService";
import { CreateDocumentService } from "../services/documents/createDocumentService";
import { DeleteAttachmentService } from "../services/documents/deleteAttachmentService";
import { DeleteDocumentService } from "../services/documents/deleteDocumentService";
import { FinalizeDocumentService } from "../services/documents/finalizeDocumentService";
import { ListDocumentsService } from "../services/documents/listDocumentsService";
import { PrintDocumentService } from "../services/documents/printDocumentService";
import { UpdateDocumentService } from "../services/documents/updateDocumentService";
import { UploadAttachmentService } from "../services/documents/uploadAttachmentService";
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
      handleControllerError(res, error, "Erro ao criar documento");
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
      handleControllerError(res, error, "Erro ao atualizar documento");
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
      handleControllerError(res, error, "Erro ao finalizar documento");
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
      handleControllerError(res, error, "Erro ao concluir consulta");
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
      handleControllerError(res, error, "Erro ao criar adendo");
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
      handleControllerError(res, error, "Erro ao excluir documento");
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
      handleControllerError(res, error, "Erro ao listar documentos");
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
      handleControllerError(res, error, "Erro ao visualizar documento");
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
      handleControllerError(res, error, "Erro ao imprimir documento");
    }
  }

  async uploadAttachment(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "Nenhum arquivo enviado." });
        return;
      }

      const appointmentId = req.params.id as string;
      const docId = req.params.docId as string;
      const service = new UploadAttachmentService();
      const result = await service.execute(
        appointmentId,
        docId,
        {
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          documentId: docId,
        },
        context,
      );
      res.status(201).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao fazer upload do anexo");
    }
  }

  async deleteAttachment(req: Request, res: Response): Promise<void> {
    try {
      const context = buildAuditContext(req);
      if (!context.clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const appointmentId = req.params.id as string;
      const docId = req.params.docId as string;
      const attachmentId = req.params.attachmentId as string;
      const service = new DeleteAttachmentService();
      const result = await service.execute(appointmentId, docId, attachmentId, context);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao remover anexo");
    }
  }
}
