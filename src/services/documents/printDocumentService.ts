import { prisma } from "../../database/prisma";
import { DocumentRepository } from "../../repository/documentRepository";
import type { AuditContext } from "../../types/document";
import { DocumentStatus, UserRole } from "../../types/enums";
import { AuditService } from "../audit/auditService";

const documentRepository = new DocumentRepository();
const auditService = new AuditService();

export class PrintDocumentService {
  async execute(
    appointmentId: string,
    docId: string,
    context: AuditContext & { userRole: string },
  ) {
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

    // DRAFT não pode ser impresso; FINALIZED, SENT e ADDENDUM podem
    if (document.status === DocumentStatus.DRAFT) {
      throw Object.assign(new Error("Rascunhos não podem ser impressos"), {
        statusCode: 403,
      });
    }

    // Validar permissão: PROFESSIONAL (dono), ADMIN, RECEPTIONIST
    const role = context.userRole;

    if (role === UserRole.PROFESSIONAL) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { professional: { select: { userId: true } } },
      });
      if (!appointment || appointment.professional.userId !== context.userId) {
        throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
      }
    } else if (role !== UserRole.ADMIN && role !== UserRole.RECEPTIONIST) {
      throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
    }

    // Registrar impressão no audit
    await auditService.log({
      context,
      action: "PRINTED",
      entity: "Document",
      entityId: docId,
    });

    return document;
  }
}
