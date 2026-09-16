import { prisma } from "../../database/prisma";
import { DocumentRepository } from "../../repository/documentRepository";
import type { AuditContext } from "../../types/document";
import { DocumentStatus, UserRole } from "../../types/enums";
import { resolveAppointmentRole } from "../../utils/appointmentAccess";
import { AuditService } from "../audit/auditService";

const documentRepository = new DocumentRepository();
const auditService = new AuditService();

export class ViewDocumentService {
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

    // Buscar dados da consulta para validar propriedade
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        professional: {
          select: {
            userId: true,
            professionalCouncil: true,
            registrationNumber: true,
            registrationState: true,
            user: { select: { name: true } },
          },
        },
        patient: {
          select: {
            userId: true,
            user: { select: { name: true } },
          },
        },
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

    const role = resolveAppointmentRole(
      {
        userId: context.userId,
        clinicId: context.clinicId,
        roles: context.userRoles ?? [context.userRole],
      },
      {
        clinicId: document.clinicId,
        patientUserId: appointment.patient.userId,
        professionalUserId: appointment.professional.userId,
      },
    );
    if (!role) {
      throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
    }

    // Auditoria vai para a clínica da consulta (quem acessa como paciente pode
    // estar sem clínica ativa, ou com outra clínica ativa)
    const enrichedContext = { ...context, clinicId: appointment.clinicId };

    if (role === UserRole.PATIENT) {
      if (appointment.patient.userId !== context.userId) {
        await auditService.log({
          context: enrichedContext,
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
          context: enrichedContext,
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
      context: enrichedContext,
      action: "VIEWED",
      entity: "Document",
      entityId: docId,
    });

    const councilRegistration = [
      appointment.professional.professionalCouncil,
      appointment.professional.registrationNumber,
      appointment.professional.registrationState,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      ...document,
      attachments: document.attachments.map((att) => ({
        ...att,
        url: `/appointments/${appointmentId}/documents/${docId}/attachments/${att.id}/file`,
      })),
      councilRegistration,
      clinic: appointment.clinic,
      appointmentContext: {
        appointmentId: appointment.id,
        patientName: appointment.patient.user.name,
        professionalName: appointment.professional.user.name,
        councilRegistration,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        appointmentStatus: appointment.status,
      },
    };
  }
}
