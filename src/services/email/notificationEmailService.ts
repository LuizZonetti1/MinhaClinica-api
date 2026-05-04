import type { EmailProvider } from "./emailProvider";

/**
 * Emails relacionados a notificações e eventos de agendamento.
 * - Confirmação de agendamento
 * - Lembrete de consulta
 * - Cancelamento de consulta (NOVO)
 * - Reagendamento de consulta (NOVO)
 * - Comunicado da clínica
 * - Mensagem direta
 */
export class NotificationEmailService {
    protected provider: EmailProvider;

    constructor(provider: EmailProvider) {
        this.provider = provider;
    }

    /** Confirmação de agendamento criado */
    async sendAppointmentConfirmationEmail(
        email: string,
        name: string,
        appointmentDate: string,
        startTime: string,
        professionalName: string,
        clinicName: string,
    ): Promise<void> {
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background-color:#3B82F6;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
.content{background-color:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
.info-box{background:#EFF6FF;border-left:4px solid #3B82F6;padding:12px 16px;border-radius:4px;margin:16px 0}
.footer{text-align:center;margin-top:20px;font-size:12px;color:#666}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>✅ Agendamento Confirmado</h1></div>
  <div class="content">
    <h2>Olá, ${name}!</h2>
    <p>Seu agendamento foi confirmado com sucesso.</p>
    <div class="info-box">
      <p><strong>📅 Data:</strong> ${appointmentDate}</p>
      <p><strong>🕐 Horário:</strong> ${startTime}</p>
      <p><strong>👨‍⚕️ Profissional:</strong> ${professionalName}</p>
      <p><strong>🏥 Clínica:</strong> ${clinicName}</p>
    </div>
    <p>Chegue com 10 minutos de antecedência. Qualquer dúvida, entre em contato com a clínica.</p>
  </div>
  <div class="footer"><p>Minha Clínica — Este é um email automático, não responda.</p></div>
</div>
</body>
</html>`;

        await this.provider.sendEmail({
            to: email,
            subject: `Agendamento confirmado — ${appointmentDate} às ${startTime}`,
            html,
            text: `Olá ${name}, seu agendamento foi confirmado para ${appointmentDate} às ${startTime} com ${professionalName} na ${clinicName}.`,
        });
    }

    /** Lembrete de consulta para o paciente */
    async sendAppointmentReminderEmail(
        email: string,
        name: string,
        appointmentDate: string,
        startTime: string,
        professionalName: string,
        windowLabel?: string,
    ): Promise<void> {
        const when = windowLabel ? `em ${windowLabel}` : `no dia ${appointmentDate}`;
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background-color:#F59E0B;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
.content{background-color:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
.info-box{background:#FFFBEB;border-left:4px solid #F59E0B;padding:12px 16px;border-radius:4px;margin:16px 0}
.footer{text-align:center;margin-top:20px;font-size:12px;color:#666}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>🔔 Lembrete de Consulta</h1></div>
  <div class="content">
    <h2>Olá, ${name}!</h2>
    <p>Você tem uma consulta agendada <strong>${when}</strong>.</p>
    <div class="info-box">
      <p><strong>📅 Data:</strong> ${appointmentDate}</p>
      <p><strong>🕐 Horário:</strong> ${startTime}</p>
      <p><strong>👨‍⚕️ Profissional:</strong> ${professionalName}</p>
    </div>
    <p>Não esqueça de comparecer. Em caso de impossibilidade, avise a clínica com antecedência.</p>
  </div>
  <div class="footer"><p>Minha Clínica — Este é um email automático, não responda.</p></div>
</div>
</body>
</html>`;

        await this.provider.sendEmail({
            to: email,
            subject: `Lembrete: consulta ${when} às ${startTime}`,
            html,
            text: `Olá ${name}, lembrete: você tem consulta ${when} às ${startTime} com ${professionalName}.`,
        });
    }

    /**
     * Aviso de cancelamento de consulta.
     * Enviado imediatamente após o agendamento ser cancelado (pelo paciente ou pela clínica).
     */
    async sendAppointmentCancellationEmail(
        email: string,
        name: string,
        appointmentDate: string,
        startTime: string,
        professionalName: string,
        clinicName: string,
    ): Promise<void> {
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background-color:#EF4444;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
.content{background-color:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
.info-box{background:#FEF2F2;border-left:4px solid #EF4444;padding:12px 16px;border-radius:4px;margin:16px 0}
.button{display:inline-block;padding:12px 30px;background-color:#3B82F6;color:white;text-decoration:none;border-radius:5px;margin:20px 0}
.footer{text-align:center;margin-top:20px;font-size:12px;color:#666}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>❌ Consulta Cancelada</h1></div>
  <div class="content">
    <h2>Olá, ${name}!</h2>
    <p>Informamos que a sua consulta foi <strong>cancelada</strong>.</p>
    <div class="info-box">
      <p><strong>📅 Data:</strong> ${appointmentDate}</p>
      <p><strong>🕐 Horário:</strong> ${startTime}</p>
      <p><strong>👨‍⚕️ Profissional:</strong> ${professionalName}</p>
      <p><strong>🏥 Clínica:</strong> ${clinicName}</p>
    </div>
    <p>Se desejar, você pode agendar uma nova consulta diretamente pelo portal do paciente.</p>
    <center>
      <a href="${process.env.FRONTEND_URL ?? "#"}/portal/agendamentos/novo" class="button">Reagendar Consulta</a>
    </center>
    <p style="font-size:14px;color:#666;margin-top:16px;">
      Caso não tenha solicitado este cancelamento, entre em contato com a clínica.
    </p>
  </div>
  <div class="footer"><p>Minha Clínica — Este é um email automático, não responda.</p></div>
</div>
</body>
</html>`;

        await this.provider.sendEmail({
            to: email,
            subject: `Consulta cancelada — ${appointmentDate} às ${startTime}`,
            html,
            text: `Olá ${name}, sua consulta do dia ${appointmentDate} às ${startTime} com ${professionalName} na ${clinicName} foi cancelada. Acesse o portal para reagendar.`,
        });
    }

    /**
     * Aviso de reagendamento de consulta.
     * Enviado após alteração de data e/ou horário do agendamento.
     */
    async sendAppointmentRescheduledEmail(
        email: string,
        name: string,
        oldDate: string,
        oldTime: string,
        newDate: string,
        newTime: string,
        professionalName: string,
        clinicName: string,
    ): Promise<void> {
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background-color:#0D9488;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
.content{background-color:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
.info-box{background:#F0FDFA;border-left:4px solid #0D9488;padding:12px 16px;border-radius:4px;margin:16px 0}
.old-info{background:#F3F4F6;border-left:4px solid #9CA3AF;padding:10px 16px;border-radius:4px;margin:8px 0;color:#6B7280}
.footer{text-align:center;margin-top:20px;font-size:12px;color:#666}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>🔄 Consulta Reagendada</h1></div>
  <div class="content">
    <h2>Olá, ${name}!</h2>
    <p>Sua consulta foi <strong>reagendada</strong>. Confira os novos dados:</p>
    <div class="info-box">
      <p><strong>📅 Nova data:</strong> ${newDate}</p>
      <p><strong>🕐 Novo horário:</strong> ${newTime}</p>
      <p><strong>👨‍⚕️ Profissional:</strong> ${professionalName}</p>
      <p><strong>🏥 Clínica:</strong> ${clinicName}</p>
    </div>
    <p style="font-size:14px;color:#6B7280;">Horário anterior:</p>
    <div class="old-info">
      <p>📅 ${oldDate} às 🕐 ${oldTime}</p>
    </div>
    <p style="margin-top:16px;">Chegue com 10 minutos de antecedência. Em caso de dúvida, entre em contato com a clínica.</p>
  </div>
  <div class="footer"><p>Minha Clínica — Este é um email automático, não responda.</p></div>
</div>
</body>
</html>`;

        await this.provider.sendEmail({
            to: email,
            subject: `Consulta reagendada — nova data: ${newDate} às ${newTime}`,
            html,
            text: `Olá ${name}, sua consulta foi reagendada. Nova data: ${newDate} às ${newTime} com ${professionalName} na ${clinicName}. (Anterior: ${oldDate} às ${oldTime})`,
        });
    }

    /** Comunicado geral da clínica */
    async sendAnnouncementEmail(
        email: string,
        recipientName: string,
        subject: string,
        message: string,
        clinicName: string,
    ): Promise<void> {
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background-color:#8B5CF6;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
.content{background-color:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
.footer{text-align:center;margin-top:20px;font-size:12px;color:#666}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>📢 Comunicado — ${clinicName}</h1></div>
  <div class="content">
    <h2>Olá, ${recipientName}!</h2>
    <h3>${subject}</h3>
    <p>${message.replace(/\n/g, "<br>")}</p>
  </div>
  <div class="footer"><p>${clinicName} — Este é um email automático, não responda.</p></div>
</div>
</body>
</html>`;

        await this.provider.sendEmail({
            to: email,
            subject: `${subject} — ${clinicName}`,
            html,
            text: `Olá ${recipientName},\n\n${subject}\n\n${message}\n\n${clinicName}`,
        });
    }

    /** Mensagem direta entre usuários da clínica */
    async sendDirectMessageEmail(
        email: string,
        recipientName: string,
        senderName: string,
        subject: string,
        message: string,
    ): Promise<void> {
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background-color:#0EA5E9;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
.content{background-color:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
.msg-box{background:#F0F9FF;border-left:4px solid #0EA5E9;padding:12px 16px;border-radius:4px;margin:16px 0}
.footer{text-align:center;margin-top:20px;font-size:12px;color:#666}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>💬 Nova Mensagem</h1></div>
  <div class="content">
    <h2>Olá, ${recipientName}!</h2>
    <p><strong>${senderName}</strong> enviou uma mensagem para você:</p>
    <div class="msg-box">
      <p><strong>${subject}</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    </div>
    <p>Acesse o sistema para responder.</p>
  </div>
  <div class="footer"><p>Minha Clínica — Este é um email automático, não responda.</p></div>
</div>
</body>
</html>`;

        await this.provider.sendEmail({
            to: email,
            subject: `Nova mensagem de ${senderName}: ${subject}`,
            html,
            text: `Olá ${recipientName}, ${senderName} enviou uma mensagem:\n\n${subject}\n${message}`,
        });
    }
}
