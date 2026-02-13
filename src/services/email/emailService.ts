/**
 * Interface para provedor de email
 * Implementar com Nodemailer, SendGrid, Resend, etc.
 */
export interface EmailProvider {
  sendEmail(options: { to: string; subject: string; html: string; text?: string }): Promise<void>;
}

/**
 * Serviço de Email
 * Abstração para envio de emails
 */
export class EmailService {
  private provider: EmailProvider;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  /**
   * Envia email de verificação para paciente
   */
  async sendPatientVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&type=patient`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Bem-vindo à Minha Clínica</h1>
        </div>
        <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Obrigado por se cadastrar como paciente.</p>
            <p>Para ativar sua conta, clique no botão abaixo:</p>
            <center>
                <a href="${verificationUrl}" class="button">Verificar Email</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Este link expira em 24 horas.
            </p>
        </div>
        <div class="footer">
            <p>Se você não solicitou este cadastro, por favor ignore este email.</p>
        </div>
    </div>
</body>
</html>
        `;

    await this.provider.sendEmail({
      to: email,
      subject: "Verifique seu email - Minha Clínica",
      html,
      text: `Olá ${name}, clique no link para verificar seu email: ${verificationUrl}`,
    });
  }

  /**
   * Envia convite para profissional
   */
  async sendProfessionalInviteEmail(
    email: string,
    name: string,
    clinicName: string,
    verificationToken: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&type=professional`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👨‍⚕️ Convite para Profissional</h1>
        </div>
        <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Você foi convidado para trabalhar na clínica <strong>${clinicName}</strong>.</p>
            <p>Para aceitar o convite e completar seu cadastro, clique no botão abaixo:</p>
            <center>
                <a href="${verificationUrl}" class="button">Aceitar Convite</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Este link expira em 48 horas.
            </p>
        </div>
        <div class="footer">
            <p>Se você não esperava este convite, por favor ignore este email.</p>
        </div>
    </div>
</body>
</html>
        `;

    await this.provider.sendEmail({
      to: email,
      subject: `Convite para trabalhar na ${clinicName}`,
      html,
      text: `Olá ${name}, você foi convidado para trabalhar na ${clinicName}. Clique no link: ${verificationUrl}`,
    });
  }

  /**
   * Envia convite para recepcionista/admin
   */
  async sendStaffInviteEmail(
    email: string,
    name: string,
    clinicName: string,
    role: "RECEPTIONIST" | "ADMIN",
    verificationToken: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&type=staff`;
    const roleText = role === "ADMIN" ? "Administrador" : "Recepcionista";

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #8B5CF6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💼 Convite - ${roleText}</h1>
        </div>
        <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Você foi convidado para ser <strong>${roleText}</strong> na <strong>${clinicName}</strong>.</p>
            <p>Para aceitar o convite e completar seu cadastro, clique no botão abaixo:</p>
            <center>
                <a href="${verificationUrl}" class="button">Aceitar Convite</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Este link expira em 48 horas.
            </p>
        </div>
        <div class="footer">
            <p>Se você não esperava este convite, por favor ignore este email.</p>
        </div>
    </div>
</body>
</html>
        `;

    await this.provider.sendEmail({
      to: email,
      subject: `Convite para ${roleText} - ${clinicName}`,
      html,
      text: `Olá ${name}, você foi convidado para ser ${roleText} na ${clinicName}. Clique no link: ${verificationUrl}`,
    });
  }
}

/**
 * EXEMPLO: Provider usando console.log
 * Use em desenvolvimento ou substitua por Nodemailer/SendGrid
 */
export class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    console.log("\n========== EMAIL ENVIADO ==========");
    console.log("Para:", options.to);
    console.log("Assunto:", options.subject);
    console.log("Texto:", options.text);
    console.log("===================================\n");
  }
}
