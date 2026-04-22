import { prisma } from "../../database/prisma";
import { DocumentRepository } from "../../repository/documentRepository";
import type { AuditContext } from "../../types/document";
import { AppointmentStatus, DocumentStatus } from "../../types/enums";
import { generateIntegrityHash } from "../../utils/hashUtils";
import { AuditService } from "../audit/auditService";

const documentRepository = new DocumentRepository();
const auditService = new AuditService();

export class ConcludeAppointmentService {
  async execute(appointmentId: string, context: AuditContext) {
    // Buscar consulta
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        professional: { select: { userId: true } },
      },
    });

    if (!appointment) {
      throw Object.assign(new Error("Consulta não encontrada"), { statusCode: 404 });
    }

    if (appointment.clinicId !== context.clinicId) {
      throw Object.assign(new Error("Acesso negado a esta consulta"), { statusCode: 403 });
    }

    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw Object.assign(new Error("Apenas consultas em andamento podem ser concluídas"), {
        statusCode: 403,
      });
    }

    if (appointment.professional.userId !== context.userId) {
      throw Object.assign(new Error("Apenas o profissional da consulta pode concluí-la"), {
        statusCode: 403,
      });
    }

    // Buscar documentos finalizados e rascunhos
    const [finalizedDocs, draftDocs] = await Promise.all([
      documentRepository.findFinalizedByAppointmentId(appointmentId),
      documentRepository.findDraftsByAppointmentId(appointmentId),
    ]);

    // Transação atômica: enviar todos finalizados + concluir consulta
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualizar cada documento finalizado para SENT com hash de integridade
      const sentUpdates = finalizedDocs.map((doc) => ({
        id: doc.id,
        status: DocumentStatus.SENT,
        integrityHash: generateIntegrityHash(doc.content),
        updatedBy: context.userId,
      }));

      if (sentUpdates.length > 0) {
        await documentRepository.updateManyInTransaction(sentUpdates, tx);
      }

      // 2. Concluir consulta
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          completedBy: context.userId,
        },
      });

      return {
        appointment: updatedAppointment,
        sentDocumentIds: sentUpdates.map((u) => u.id),
      };
    });

    // Auditoria: conclusão da consulta
    await auditService.log({
      context,
      action: "CONCLUDED",
      entity: "Appointment",
      entityId: appointmentId,
      oldData: { status: AppointmentStatus.IN_PROGRESS },
      newData: { status: AppointmentStatus.COMPLETED },
    });

    // Auditoria: cada documento enviado
    for (const doc of finalizedDocs) {
      await auditService.log({
        context,
        action: "SENT",
        entity: "Document",
        entityId: doc.id,
        oldData: { status: DocumentStatus.FINALIZED },
        newData: { status: DocumentStatus.SENT },
      });
    }

    return {
      appointment: result.appointment,
      sentDocuments: finalizedDocs.map((d) => ({
        id: d.id,
        documentNumber: d.documentNumber,
        type: d.type,
      })),
      draftDocuments: draftDocs.map((d) => ({
        id: d.id,
        documentNumber: d.documentNumber,
        type: d.type,
      })),
    };
  }
}
