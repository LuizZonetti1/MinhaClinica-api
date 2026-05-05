import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../database/prisma";
import type { AuditContext } from "../../types/document";

export class DeleteAttachmentService {
    async execute(
        appointmentId: string,
        docId: string,
        attachmentId: string,
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

        // Remove o arquivo do disco
        const filePath = path.join(
            process.cwd(),
            "src",
            "uploads",
            "documents",
            attachment.storedName,
        );
        try {
            fs.unlinkSync(filePath);
        } catch {
            // Arquivo já removido — continua com a remoção do registro
        }

        await prisma.documentAttachment.delete({ where: { id: attachmentId } });

        return { message: "Anexo removido com sucesso." };
    }
}
