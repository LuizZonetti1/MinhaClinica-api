import { prisma } from "../../database/prisma";
import { NotificationRepository } from "../../repository/notificationRepository";
import { EmailService, createEmailProvider } from "../email/emailService";

interface SendDirectInput {
    recipientUserId: string;
    senderId: string;
    clinicId: string;
    subject: string;
    message: string;
}

export class SendDirectService {
    async execute(input: SendDirectInput) {
        const recipient = await prisma.user.findFirst({
            where: {
                id: input.recipientUserId,
                clinicId: input.clinicId,
                status: "ACTIVE",
            },
            select: { id: true, name: true, email: true, phone: true },
        });

        if (!recipient) {
            throw Object.assign(new Error("Destinatário não encontrado ou inativo"), {
                statusCode: 404,
            });
        }

        const notifRepo = new NotificationRepository();
        const n = await notifRepo.create({
            clinicId: input.clinicId,
            recipientEmail: recipient.email,
            recipientPhone: recipient.phone ?? undefined,
            recipientName: recipient.name,
            recipientUserId: recipient.id,
            senderId: input.senderId,
            type: "DIRECT_MESSAGE",
            channel: "IN_APP",
            subject: input.subject,
            message: input.message,
        });

        await notifRepo.markAsSent(n.id);
        // Email de mensagem direta (fire-and-forget)
        try {
            const sender = await prisma.user.findUnique({
                where: { id: input.senderId },
                select: { name: true },
            });
            const emailSvc = new EmailService(createEmailProvider());
            await emailSvc.sendDirectMessageEmail(
                recipient.email,
                recipient.name,
                sender?.name ?? "Sistema",
                input.subject,
                input.message,
            );
        } catch {}
        return { id: n.id };
    }
}
