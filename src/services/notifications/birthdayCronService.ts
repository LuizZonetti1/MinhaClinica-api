import cron from "node-cron";
import { NotificationRepository } from "../../repository/notificationRepository";

const repo = new NotificationRepository();

async function sendBirthdayNotifications() {
    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();

    const patients = await repo.findPatientsByBirthday(month, day);

    for (const patient of patients) {
        const user = patient.user;
        const n = await repo.create({
            clinicId: patient.clinicId ?? "",
            recipientEmail: user.email,
            recipientPhone: user.phone ?? undefined,
            recipientName: user.name,
            recipientUserId: user.id,
            type: "BIRTHDAY",
            channel: "IN_APP",
            subject: "Feliz Aniversário!",
            message: `Feliz aniversário, ${user.name}! Toda a equipe da clínica deseja um dia muito especial para você!`,
        });
        await repo.markAsSent(n.id);
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
