import { prisma } from "../../database/prisma";
import type { AuditContext } from "../../types/document";

export class UpdateAttachmentCaptionService {
    async execute(
        appointmentId: string,
        docId: string,
        attachmentId: string,
        caption: string | null,
        context: AuditContext,
    ) {
        // Verifica que o documento pertence à consulta e à clínica
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

        const attachment = await prisma.documentAttachment.findFirst({
            where: { id: attachmentId, documentId: docId },
        });

        if (!attachment) {
            throw Object.assign(new Error("Anexo não encontrado."), { statusCode: 404 });
        }

        const updated = await prisma.documentAttachment.update({
            where: { id: attachmentId },
            data: { caption: caption ?? null },
        });

        return {
            id: updated.id,
            documentId: updated.documentId,
            fileName: updated.fileName,
            mimeType: updated.mimeType,
            sizeBytes: updated.sizeBytes,
            caption: updated.caption ?? null,
            uploadedAt: updated.uploadedAt.toISOString(),
            url: `/appointments/${appointmentId}/documents/${docId}/attachments/${updated.id}/file`,
        };
    }
}
