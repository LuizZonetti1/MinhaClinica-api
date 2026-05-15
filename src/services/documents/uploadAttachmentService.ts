import path from "node:path";
import { prisma } from "../../database/prisma";
import type { AuditContext } from "../../types/document";

interface UploadAttachmentInput {
    documentId: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    sizeBytes: number;
}

export class UploadAttachmentService {
    async execute(
        appointmentId: string,
        docId: string,
        file: UploadAttachmentInput,
        context: AuditContext,
    ) {
        // Verifica que o documento pertence à consulta e à clínica do usuário
        const document = await prisma.document.findFirst({
            where: {
                id: docId,
                appointmentId,
                clinicId: context.clinicId,
                deletedAt: null,
            },
        });

        if (!document) {
            throw Object.assign(new Error("Documento não encontrado."), { statusCode: 404 });
        }

        const attachment = await prisma.documentAttachment.create({
            data: {
                documentId: docId,
                fileName: file.originalName,
                storedName: file.storedName,
                mimeType: file.mimeType,
                sizeBytes: file.sizeBytes,
                uploadedBy: context.userId,
            },
        });

        return {
            id: attachment.id,
            documentId: attachment.documentId,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            caption: attachment.caption ?? null,
            uploadedAt: attachment.uploadedAt.toISOString(),
            url: `/appointments/${appointmentId}/documents/${docId}/attachments/${attachment.id}/file`,
        };
    }
}
