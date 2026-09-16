import { prisma } from "../../database/prisma";
import { DocumentRepository } from "../../repository/documentRepository";
import type { AuditContext } from "../../types/document";
import { DocumentStatus, UserRole } from "../../types/enums";
import { resolveAppointmentRole } from "../../utils/appointmentAccess";
import { AuditService } from "../audit/auditService";

const documentRepository = new DocumentRepository();
const auditService = new AuditService();

export class PrintDocumentService {
  async execute(
    appointmentId: string,
    docId: string,
    context: AuditContext & { userRole: string; userRoles?: string[] },
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

    // Validar permissão: PROFESSIONAL (dono), ADMIN, RECEPTIONIST — sempre da
    // clínica ativa (o documento já foi conferido contra ela acima).
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        professional: { select: { userId: true } },
        patient: { select: { userId: true } },
      },
    });
    const role = appointment
      ? resolveAppointmentRole(
          {
            userId: context.userId,
            clinicId: context.clinicId,
            roles: context.userRoles ?? [context.userRole],
          },
          {
            clinicId: appointment.clinicId,
            patientUserId: appointment.patient.userId,
            professionalUserId: appointment.professional.userId,
          },
        )
      : null;

    if (role === UserRole.PROFESSIONAL) {
      if (appointment?.professional.userId !== context.userId) {
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
