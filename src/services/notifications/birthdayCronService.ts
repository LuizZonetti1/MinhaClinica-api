import cron from "node-cron";
import { NotificationRepository } from "../../repository/notificationRepository";

const repo = new NotificationRepository();

async function sendBirthdayNotifications() {
    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();

    const recipients = await repo.findBirthdayRecipients(month, day);

    for (const item of recipients) {
        const user = item.patient.user;
        const clinicName = item.clinic.tradeName ?? item.clinic.legalName;

        try {
            const n = await repo.create({
                clinicId: item.clinicId,
                recipientEmail: user.email,
                recipientPhone: user.phone ?? undefined,
                recipientName: user.name,
                recipientUserId: user.id,
                type: "BIRTHDAY",
                channel: "IN_APP",
                subject: "Feliz Aniversário!",
                message: `Feliz aniversário, ${user.name}! Toda a equipe da ${clinicName} deseja um dia muito especial para você!`,
            });
            // IN_APP: o registro criado já É a entrega, não há envio externo a
            // confirmar depois — por isso markAsSent roda direto após o create.
            // Se o canal virar EMAIL/SMS no futuro, isso precisa mudar para
            // marcar como enviado só após confirmação real do provedor.
            await repo.markAsSent(n.id);
        } catch (err) {
            // Uma falha isolada (ex: e-mail inválido, erro transitório de DB)
            // não pode derrubar o lote inteiro — antes derrubava, e por isso
            // a funcionalidade nunca funcionou de fato: o primeiro erro do dia
            // abortava a função e cancelava todos os demais aniversariantes.
            console.error(
                `[Cron] Falha ao notificar aniversário de ${user.id} na clínica ${item.clinicId}:`,
                err,
            );
        }
    }
}

/**
 * Registra o cron job de aniversário.
 * Roda todo dia às 09:00 e envia parabéns para pacientes aniversariantes.
 */
export function registerBirthdayCron() {
    cron.schedule("0 9 * * *", () => {
        sendBirthdayNotifications().catch((err) =>
            console.error("[Cron] Erro ao enviar notificações de aniversário:", err),
        );
    });

    console.log("[Cron] Job de aniversário registrado.");
}
