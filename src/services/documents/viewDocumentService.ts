import { prisma } from "../../database/prisma";
import { DocumentRepository } from "../../repository/documentRepository";
import type { AuditContext } from "../../types/document";
import { DocumentStatus, UserRole } from "../../types/enums";
import { AuditService } from "../audit/auditService";

const documentRepository = new DocumentRepository();
const auditService = new AuditService();

export class ViewDocumentService {
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

    // Buscar dados da consulta para validar propriedade
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        professional: {
          select: {
            userId: true,
            professionalCouncil: true,
            registrationNumber: true,
          },
        },
        patient: { select: { userId: true } },
        clinic: {
          select: {
            tradeName: true,
            legalName: true,
            cnpj: true,
            phone: true,
            logoUrl: true,
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
      },
    });

    if (!appointment) {
      throw Object.assign(new Error("Consulta não encontrada"), { statusCode: 404 });
    }

    const role = context.userRole;

    if (role === UserRole.PATIENT) {
      if (appointment.patient.userId !== context.userId) {
        await auditService.log({
          context,
          action: "VIEW_DENIED",
          entity: "Document",
          entityId: docId,
          oldData: { reason: "Paciente tentou visualizar documento de outra consulta" },
        });
        throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
      }
      // Paciente só vê SENT e ADDENDUM
      if (document.status !== DocumentStatus.SENT && document.status !== DocumentStatus.ADDENDUM) {
        throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
      }
    } else if (role === UserRole.PROFESSIONAL) {
      if (appointment.professional.userId !== context.userId) {
        await auditService.log({
          context,
          action: "VIEW_DENIED",
          entity: "Document",
          entityId: docId,
          oldData: { reason: "Profissional tentou visualizar documento de outra consulta" },
        });
        throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
      }
    } else if (role === UserRole.ADMIN || role === UserRole.RECEPTIONIST) {
      // Admin e recepção: apenas SENT e ADDENDUM
      if (document.status !== DocumentStatus.SENT && document.status !== DocumentStatus.ADDENDUM) {
        throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
      }
    }

    // Registrar visualização
    await auditService.log({
      context,
      action: "VIEWED",
      entity: "Document",
      entityId: docId,
    });

    return {
      ...document,
      councilRegistration: `${appointment.professional.professionalCouncil} ${appointment.professional.registrationNumber}`,
      clinic: appointment.clinic,
    };
  }
}
