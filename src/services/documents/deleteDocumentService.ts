import { DocumentRepository } from "../../repository/documentRepository";
import type { AuditContext } from "../../types/document";
import { AppointmentStatus, DocumentStatus } from "../../types/enums";
import { AuditService } from "../audit/auditService";

const documentRepository = new DocumentRepository();
const auditService = new AuditService();

export class DeleteDocumentService {
  async execute(appointmentId: string, docId: string, context: AuditContext) {
    const document = await documentRepository.findById(docId);

    if (!document) {
      throw Object.assign(new Error("Documento não encontrado"), { statusCode: 404 });
    }

    if (document.appointmentId !== appointmentId) {
      throw Object.assign(new Error("Documento não pertence a esta consulta"), { statusCode: 404 });
    }

    if (document.clinicId !== context.clinicId) {
      throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
    }

    if (document.appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw Object.assign(
        new Error("Documentos só podem ser excluídos em consultas em andamento"),
        { statusCode: 403 },
      );
    }

    if (document.status !== DocumentStatus.DRAFT && document.status !== DocumentStatus.FINALIZED) {
      throw Object.assign(new Error("Apenas documentos em rascunho ou finalizados podem ser excluídos"), {
        statusCode: 403,
      });
    }

    if (document.createdBy !== context.userId) {
      await auditService.log({
        context,
        action: "DELETE_DENIED",
        entity: "Document",
        entityId: docId,
        oldData: { reason: "Tentativa de exclusão por usuário não autorizado" },
      });
      throw Object.assign(new Error("Apenas o profissional que criou o documento pode excluí-lo"), {
        statusCode: 403,
      });
    }

    await documentRepository.softDelete(docId, context.userId);

    await auditService.log({
      context,
      action: "DELETED",
      entity: "Document",
      entityId: docId,
      oldData: {
        id: document.id,
        type: document.type,
        status: document.status,
        documentNumber: document.documentNumber,
        content: document.content,
      },
    });

    return { message: "Documento excluído com sucesso" };
  }
}
