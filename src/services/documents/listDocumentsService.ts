import { prisma } from "../../database/prisma";
import { DocumentRepository } from "../../repository/documentRepository";
import type { AuditContext } from "../../types/document";
import { DocumentStatus, UserRole } from "../../types/enums";
import { AuditService } from "../audit/auditService";

const documentRepository = new DocumentRepository();
const auditService = new AuditService();

export class ListDocumentsService {
  async execute(appointmentId: string, context: AuditContext & { userRole: string }) {
    // Buscar consulta para validar acesso
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        professional: { select: { userId: true } },
        patient: { select: { userId: true } },
      },
    });

    if (!appointment) {
      throw Object.assign(new Error("Consulta não encontrada"), { statusCode: 404 });
    }

    if (appointment.clinicId !== context.clinicId) {
      throw Object.assign(new Error("Acesso negado a esta consulta"), { statusCode: 403 });
    }

    // Validar permissões por papel
    const role = context.userRole;

    if (role === UserRole.PATIENT) {
      // Paciente só vê documentos da própria consulta
      if (appointment.patient.userId !== context.userId) {
        await auditService.log({
          context,
          action: "ACCESS_DENIED",
          entity: "Document",
          entityId: appointmentId,
          oldData: { reason: "Paciente tentou acessar documentos de outra consulta" },
        });
        throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
      }
    } else if (role === UserRole.PROFESSIONAL) {
      // Profissional só vê documentos das próprias consultas
      if (appointment.professional.userId !== context.userId) {
        await auditService.log({
          context,
          action: "ACCESS_DENIED",
          entity: "Document",
          entityId: appointmentId,
          oldData: { reason: "Profissional tentou acessar documentos de outra consulta" },
        });
        throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
      }
    }
    // ADMIN e RECEPTIONIST podem visualizar (sem restrição de propriedade)

    // Buscar documentos
    const allDocuments = await documentRepository.findByAppointmentId(appointmentId);

    // Filtrar por papel
    if (role === UserRole.PROFESSIONAL) {
      // Profissional vê todos os documentos (incluindo rascunhos)
      return allDocuments;
    }

    // ADMIN, RECEPTIONIST e PATIENT: apenas SENT e ADDENDUM
    return allDocuments.filter(
      (doc) => doc.status === DocumentStatus.SENT || doc.status === DocumentStatus.ADDENDUM,
    );
  }
}
