import { prisma } from "../../database/prisma";
import { DocumentRepository } from "../../repository/documentRepository";
import type { AuditContext, CreateDocumentInput } from "../../types/document";
import { AppointmentStatus } from "../../types/enums";
import { AuditService } from "../audit/auditService";

const documentRepository = new DocumentRepository();
const auditService = new AuditService();

export class CreateDocumentService {
  async execute(appointmentId: string, input: CreateDocumentInput, context: AuditContext) {
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

    // Validar clínica
    if (appointment.clinicId !== context.clinicId) {
      throw Object.assign(new Error("Acesso negado a esta consulta"), { statusCode: 403 });
    }

    // Validar que a consulta está em andamento
    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw Object.assign(new Error("Documentos só podem ser criados em consultas em andamento"), {
        statusCode: 403,
      });
    }

    // Validar que o usuário é o profissional da consulta
    if (appointment.professional.userId !== context.userId) {
      throw Object.assign(new Error("Apenas o profissional da consulta pode criar documentos"), {
        statusCode: 403,
      });
    }

    // Gerar número do documento com lock
    const document = await prisma.$transaction(async (tx) => {
      const documentNumber = await documentRepository.generateDocumentNumber(context.clinicId, tx);

      return tx.document.create({
        data: {
          clinicId: context.clinicId,
          appointmentId,
          type: input.type as any,
          status: "DRAFT",
          content: input.content as any,
          documentNumber,
          version: 1,
          createdBy: context.userId,
        },
      });
    });

    // Auditoria
    await auditService.log({
      context,
      action: "CREATED",
      entity: "Document",
      entityId: document.id,
      newData: document,
    });

    return document;
  }
}
