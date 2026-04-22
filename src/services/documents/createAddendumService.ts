import { prisma } from "../../database/prisma";
import { DocumentRepository } from "../../repository/documentRepository";
import type { AuditContext, CreateAddendumInput } from "../../types/document";
import { AppointmentStatus, DocumentStatus } from "../../types/enums";
import { generateIntegrityHash } from "../../utils/hashUtils";
import { AuditService } from "../audit/auditService";

const documentRepository = new DocumentRepository();
const auditService = new AuditService();

export class CreateAddendumService {
  async execute(appointmentId: string, input: CreateAddendumInput, context: AuditContext) {
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

    // Adendo só pode ser criado em consulta concluída ou concluída com adendo
    if (
      appointment.status !== AppointmentStatus.COMPLETED &&
      appointment.status !== AppointmentStatus.COMPLETED_WITH_ADDENDUM
    ) {
      throw Object.assign(new Error("Adendos só podem ser criados em consultas concluídas"), {
        statusCode: 403,
      });
    }

    if (appointment.professional.userId !== context.userId) {
      throw Object.assign(new Error("Apenas o profissional da consulta pode criar adendos"), {
        statusCode: 403,
      });
    }

    // Se originalDocumentId fornecido, validar que existe e pertence à mesma consulta
    if (input.originalDocumentId) {
      const originalDoc = await documentRepository.findById(input.originalDocumentId);
      if (!originalDoc) {
        throw Object.assign(new Error("Documento original não encontrado"), { statusCode: 404 });
      }
      if (originalDoc.appointmentId !== appointmentId) {
        throw Object.assign(new Error("Documento original não pertence a esta consulta"), {
          statusCode: 400,
        });
      }
    }

    // Criar adendo com hash (imutável após criação) em transação
    const addendum = await prisma.$transaction(async (tx) => {
      const documentNumber = await documentRepository.generateDocumentNumber(context.clinicId, tx);

      const integrityHash = generateIntegrityHash(input.content);

      const doc = await tx.document.create({
        data: {
          clinicId: context.clinicId,
          appointmentId,
          type: input.type as any,
          status: "ADDENDUM",
          content: input.content as any,
          documentNumber,
          version: 1,
          originalDocumentId: input.originalDocumentId ?? null,
          integrityHash,
          createdBy: context.userId,
        },
      });

      // Atualizar status da consulta para COMPLETED_WITH_ADDENDUM
      if (appointment.status !== AppointmentStatus.COMPLETED_WITH_ADDENDUM) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: "COMPLETED_WITH_ADDENDUM" },
        });
      }

      return doc;
    });

    // Auditoria
    await auditService.log({
      context,
      action: "ADDENDUM_CREATED",
      entity: "Document",
      entityId: addendum.id,
      newData: addendum,
    });

    if (appointment.status !== AppointmentStatus.COMPLETED_WITH_ADDENDUM) {
      await auditService.log({
        context,
        action: "REOPENED_WITH_ADDENDUM",
        entity: "Appointment",
        entityId: appointmentId,
        oldData: { status: appointment.status },
        newData: { status: AppointmentStatus.COMPLETED_WITH_ADDENDUM },
      });
    }

    return addendum;
  }
}
