import cron from "node-cron";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { NotificationRepository } from "../../repository/notificationRepository";
import { prisma } from "../../database/prisma";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const repo = new NotificationRepository();

/**
 * Envia lembretes de consulta para todos os agendamentos confirmados
 * do dia seguinte em todas as clínicas ativas.
 */
async function sendAppointmentReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeClinics = await prisma.clinic.findMany({
        where: { isActive: true },
        select: { id: true },
    });

    for (const clinic of activeClinics) {
        const appointments = await repo.findAppointmentsForReminders(clinic.id, tomorrow);

        for (const appt of appointments) {
            const user = appt.patient?.user;
            if (!user) continue;

            const professionalName = appt.professional?.user?.name ?? "seu profissional";
            const dateStr = appt.appointmentDate.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
            const timeStr = appt.startTime;

            const notification = await repo.create({
                clinicId: clinic.id,
                recipientEmail: user.email,
                recipientPhone: user.phone ?? undefined,
                recipientName: user.name,
                recipientUserId: user.id,
                type: "APPOINTMENT_REMINDER",
                channel: "IN_APP",
                subject: "Lembrete de consulta",
                message: `Olá, ${user.name}! Você tem uma consulta amanhã (${dateStr}) às ${timeStr} com ${professionalName}. Não esqueça de comparecer!`,
                appointmentId: appt.id,
            });

            await repo.markAsSent(notification.id);
        }
    }
}

/**
 * Envia lembretes intradía (1h e 30min antes) para agendamentos de hoje.
 * Roda a cada 30 minutos. Dedup via metadata.window para evitar duplicatas.
 */
async function sendIntradayReminders() {
    const now = dayjs().tz(DEFAULT_TIMEZONE);
    const nowMinutes = now.hour() * 60 + now.minute();
    const today = new Date();

    const activeClinics = await prisma.clinic.findMany({
        where: { isActive: true },
        select: { id: true },
    });

    for (const clinic of activeClinics) {
        const appointments = await repo.findAppointmentsForReminders(clinic.id, today);

        for (const appt of appointments) {
            const user = appt.patient?.user;
            if (!user) continue;

            const [h, m] = appt.startTime.split(":").map(Number);
            const apptMinutes = h * 60 + m;
            const diff = apptMinutes - nowMinutes;

            let window: "1h" | "30m" | null = null;
            if (diff >= 45 && diff <= 75) window = "1h";
            else if (diff >= 15 && diff <= 45) window = "30m";

            if (!window) continue;

            const alreadySent = await repo.hasReminderBeenSent(appt.id, window);
            if (alreadySent) continue;

            const label = window === "1h" ? "1 hora" : "30 minutos";
            const notification = await repo.create({
                clinicId: clinic.id,
                recipientEmail: user.email,
                recipientPhone: user.phone ?? undefined,
                recipientName: user.name,
                recipientUserId: user.id,
                type: "APPOINTMENT_REMINDER",
                channel: "IN_APP",
                subject: `Consulta em ${label}`,
                message: `Olá, ${user.name}! Sua consulta começa em ${label}, às ${appt.startTime}. Não esqueça!`,
                appointmentId: appt.id,
                metadata: { window },
            });

            await repo.markAsSent(notification.id);
        }
    }
}

/**
 * Remove notificações lidas há mais de N dias.
 */
async function cleanOldReadNotifications() {
    await repo.deleteOldRead(3);
}

/**
 * Registra todos os cron jobs de notificações.
 * Deve ser chamado uma única vez na inicialização do servidor.
 */
export function registerNotificationCrons() {
    // Roda todo dia às 08:00 para enviar lembretes do dia seguinte
    cron.schedule("0 8 * * *", () => {
        sendAppointmentReminders().catch((err) =>
            console.error("[Cron] Erro ao enviar lembretes de consultas:", err),
        );
    });

    // Roda a cada 30 minutos para lembretes de 1h e 30min antes da consulta
    cron.schedule("0,30 * * * *", () => {
        sendIntradayReminders().catch((err) =>
            console.error("[Cron] Erro ao enviar lembretes intradía:", err),
        );
    });

    // Roda todo dia às 03:00 para remover notificações lidas há +3 dias
    cron.schedule("0 3 * * *", () => {
        cleanOldReadNotifications().catch((err) =>
            console.error("[Cron] Erro ao limpar notificações antigas:", err),
        );
    });

    console.log("[Cron] Jobs de notificações registrados.");
}
