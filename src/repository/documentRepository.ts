import type { Prisma } from "../../generated/prisma";
import { prisma } from "../database/prisma";
import type { DocumentStatus, DocumentType } from "../types/enums";

export class DocumentRepository {
  async create(data: {
    clinicId: string;
    appointmentId: string;
    type: DocumentType;
    status: string;
    content: Prisma.InputJsonValue;
    documentNumber: string;
    version: number;
    originalDocumentId?: string | null;
    integrityHash?: string | null;
    createdBy: string;
  }) {
    return prisma.document.create({
      data: {
        clinicId: data.clinicId,
        appointmentId: data.appointmentId,
        type: data.type as any,
        status: data.status as any,
        content: data.content,
        documentNumber: data.documentNumber,
        version: data.version,
        originalDocumentId: data.originalDocumentId ?? null,
        integrityHash: data.integrityHash ?? null,
        createdBy: data.createdBy,
      },
    });
  }

  async findById(id: string) {
    return prisma.document.findFirst({
      where: { id, deletedAt: null },
      include: {
        appointment: {
          select: {
            id: true,
            clinicId: true,
            patientId: true,
            professionalId: true,
            status: true,
          },
        },
      },
    });
  }

  async findByIdIncludeDeleted(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: {
        appointment: {
          select: {
            id: true,
            clinicId: true,
            patientId: true,
            professionalId: true,
            status: true,
          },
        },
      },
    });
  }

  async findByAppointmentId(appointmentId: string, includeDeleted = false) {
    return prisma.document.findMany({
      where: {
        appointmentId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findFinalizedByAppointmentId(appointmentId: string) {
    return prisma.document.findMany({
      where: {
        appointmentId,
        status: "FINALIZED",
        deletedAt: null,
      },
    });
  }

  async findDraftsByAppointmentId(appointmentId: string) {
    return prisma.document.findMany({
      where: {
        appointmentId,
        status: "DRAFT",
        deletedAt: null,
      },
    });
  }

  async update(
    id: string,
    data: {
      content?: Prisma.InputJsonValue;
      status?: string;
      version?: number;
      integrityHash?: string | null;
      updatedBy: string;
    },
  ) {
    return prisma.document.update({
      where: { id },
      data: {
        ...(data.content !== undefined && { content: data.content }),
        ...(data.status !== undefined && { status: data.status as any }),
        ...(data.version !== undefined && { version: data.version }),
        ...(data.integrityHash !== undefined && { integrityHash: data.integrityHash }),
        updatedBy: data.updatedBy,
      },
    });
  }

  async softDelete(id: string, userId: string) {
    return prisma.document.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  /**
   * Gera número sequencial do documento com lock por transação.
   * Formato: DOC-{year}-{sequence padded to 5 digits}
   * Deve ser chamado DENTRO de uma transação Prisma ($transaction interactive).
   */
  async generateDocumentNumber(clinicId: string, tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();

    // Upsert + increment em uma única operação atômica
    const counter = await tx.documentCounter.upsert({
      where: {
        clinicId_year: { clinicId, year },
      },
      create: {
        clinicId,
        year,
        lastSequence: 1,
      },
      update: {
        lastSequence: { increment: 1 },
      },
    });

    const sequence = counter.lastSequence.toString().padStart(5, "0");
    return `DOC-${year}-${sequence}`;
  }

  /**
   * Atualiza status e hash de múltiplos documentos dentro de uma transação.
   */
  async updateManyInTransaction(
    updates: Array<{ id: string; status: string; integrityHash?: string; updatedBy: string }>,
    tx: Prisma.TransactionClient,
  ) {
    const promises = updates.map((u) =>
      tx.document.update({
        where: { id: u.id },
        data: {
          status: u.status as any,
          ...(u.integrityHash && { integrityHash: u.integrityHash }),
          updatedBy: u.updatedBy,
        },
      }),
    );
    return Promise.all(promises);
  }
}
