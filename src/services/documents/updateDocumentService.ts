import { DocumentRepository } from "../../repository/documentRepository";
import type { AuditContext, UpdateDocumentInput } from "../../types/document";
import { AppointmentStatus, DocumentStatus } from "../../types/enums";
import { AuditService } from "../audit/auditService";

const documentRepository = new DocumentRepository();
const auditService = new AuditService();

export class UpdateDocumentService {
  async execute(
    appointmentId: string,
    docId: string,
    input: UpdateDocumentInput,
    context: AuditContext,
  ) {
    // Buscar documento
    const document = await documentRepository.findById(docId);

    if (!document) {
      throw Object.assign(new Error("Documento não encontrado"), { statusCode: 404 });
    }

    // Validar que o documento pertence à consulta
    if (document.appointmentId !== appointmentId) {
      throw Object.assign(new Error("Documento não pertence a esta consulta"), { statusCode: 404 });
    }

    // Validar clínica
    if (document.clinicId !== context.clinicId) {
      throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
    }

    // Validar que a consulta está em andamento
    if (document.appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw Object.assign(new Error("Documentos só podem ser editados em consultas em andamento"), {
        statusCode: 403,
      });
    }

    // Validar que o documento é editável (DRAFT ou FINALIZED)
    if (document.status !== DocumentStatus.DRAFT && document.status !== DocumentStatus.FINALIZED) {
      throw Object.assign(new Error("Documentos enviados ou adendos não podem ser editados"), {
        statusCode: 403,
      });
    }

    // Validar que o usuário é o criador do documento
    if (document.createdBy !== context.userId) {
      await auditService.log({
        context,
        action: "EDIT_DENIED",
        entity: "Document",
        entityId: docId,
        oldData: { reason: "Tentativa de edição por usuário não autorizado" },
      });
      throw Object.assign(new Error("Apenas o profissional que criou o documento pode editá-lo"), {
        statusCode: 403,
      });
    }

    // Snapshot do estado anterior
    const oldData = {
      content: document.content,
      internalNotes: document.internalNotes,
      version: document.version,
      status: document.status,
    };

    // Atualizar documento
    const updated = await documentRepository.update(docId, {
      content: input.content as any,
      internalNotes: input.internalNotes,
      version: document.version + 1,
      updatedBy: context.userId,
    });

    // Auditoria
    await auditService.log({
      context,
      action: "EDITED",
      entity: "Document",
      entityId: docId,
      oldData,
      newData: {
        content: updated.content,
        version: updated.version,
        status: updated.status,
      },
    });

    return updated;
  }
}
