import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import cron from "node-cron";
import { prisma } from "../../database/prisma";
import { NotificationRepository } from "../../repository/notificationRepository";
import { AppointmentStatus } from "../../types/enums";
import { createEmailProvider, EmailService } from "../email/emailService";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const notifRepo = new NotificationRepository();

/**
 * ClinicSettings.sendDailyReport (default false) tinha tela real (GET+PATCH)
 * mas não existia nenhum cron de relatório diário em todo o código — o
 * toggle nunca teve efeito algum. Roda uma vez ao fim do dia, só para
 * clínicas que ativaram o envio.
 */
async function sendDailyReports() {
  const today = dayjs().tz(DEFAULT_TIMEZONE);
  const startOfDay = dayjs.utc(today.format("YYYY-MM-DD")).startOf("day").toDate();
  const endOfDay = dayjs.utc(today.format("YYYY-MM-DD")).endOf("day").toDate();
  const dateLabel = today.format("DD/MM/YYYY");

  const clinics = await prisma.clinic.findMany({
    where: { isActive: true, settings: { sendDailyReport: true } },
    select: { id: true, tradeName: true },
  });

  for (const clinic of clinics) {
    const counts = await prisma.appointment.groupBy({
      by: ["status"],
      where: { clinicId: clinic.id, appointmentDate: { gte: startOfDay, lte: endOfDay } },
      _count: { _all: true },
    });

    const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]));
    const total = counts.reduce((sum, c) => sum + c._count._all, 0);
    const completed = countByStatus.get(AppointmentStatus.COMPLETED) ?? 0;
    const cancelled = countByStatus.get(AppointmentStatus.CANCELLED) ?? 0;
    const noShow = countByStatus.get(AppointmentStatus.NO_SHOW) ?? 0;

    if (total === 0) continue; // sem movimento hoje — não vale poluir a caixa de entrada

    const admins = await notifRepo.findActiveClinicUsers(clinic.id, ["ADMIN"]);

    for (const admin of admins) {
      const notification = await notifRepo.create({
        clinicId: clinic.id,
        recipientEmail: admin.email,
        recipientPhone: admin.phone ?? undefined,
        recipientName: admin.name,
        recipientUserId: admin.id,
        type: "REPORT_READY",
        channel: "IN_APP",
        subject: `Relatório do dia ${dateLabel}`,
        message: `Hoje: ${total} agendamento(s), ${completed} concluído(s), ${cancelled} cancelado(s), ${noShow} falta(s).`,
      });
      await notifRepo.markAsSent(notification.id);

      try {
        const emailSvc = new EmailService(createEmailProvider());
        await emailSvc.sendDailyReportEmail(admin.email, admin.name, clinic.tradeName, dateLabel, {
          total,
          completed,
          cancelled,
          noShow,
        });
      } catch (err) {
        console.error("[dailyReportCronService] Falha ao enviar email:", err);
      }
    }
  }
}

/** Registra o cron de relatório diário. Chamar uma única vez na inicialização do servidor. */
export function registerDailyReportCron() {
  // Roda todo dia às 20:00 (horário de São Paulo, via schedule do cron do processo)
  cron.schedule("0 20 * * *", () => {
    sendDailyReports().catch((err) =>
      console.error("[Cron] Erro ao enviar relatórios diários:", err),
    );
  });

  console.log("[Cron] Job de relatório diário registrado.");
}
