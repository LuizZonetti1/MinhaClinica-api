import { DocumentRepository } from "../../repository/documentRepository";
import type { AuditContext } from "../../types/document";
import { AppointmentStatus, DocumentStatus } from "../../types/enums";
import { AuditService } from "../audit/auditService";

const documentRepository = new DocumentRepository();
const auditService = new AuditService();

export class FinalizeDocumentService {
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
        new Error("Documentos só podem ser finalizados em consultas em andamento"),
        { statusCode: 403 },
      );
    }

    if (document.status !== DocumentStatus.DRAFT) {
      throw Object.assign(new Error("Apenas documentos em rascunho podem ser finalizados"), {
        statusCode: 400,
      });
    }

    if (document.createdBy !== context.userId) {
      throw Object.assign(
        new Error("Apenas o profissional que criou o documento pode finalizá-lo"),
        { statusCode: 403 },
      );
    }

    const updated = await documentRepository.update(docId, {
      status: DocumentStatus.FINALIZED,
      updatedBy: context.userId,
    });

    await auditService.log({
      context,
      action: "FINALIZED",
      entity: "Document",
      entityId: docId,
      oldData: { status: DocumentStatus.DRAFT },
      newData: { status: DocumentStatus.FINALIZED },
    });

    return updated;
  }
}
