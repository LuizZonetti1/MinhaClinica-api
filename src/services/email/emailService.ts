import nodemailer from "nodemailer";
import { Resend } from "resend";
import { UserRole } from "../../types/enums";

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
            <h2>Olá, ${name}!</h2><p>Seja bem-vindo(a) ao Minha Clínica.</p>
            <p>Para ativar sua conta, clique no botão abaixo:</p>
            <center>
                <a href="${verificationUrl}" class="button">Verificar Email</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Este link expira em 25 minutos.
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
   * Envia email de verificação para o dono/responsável da clínica (Etapa 1 do cadastro)
   */
  async sendClinicOwnerVerificationEmail(
    email: string,
    ownerName: string,
    clinicTradeName: string,
    verificationToken: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&type=clinic`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6366F1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #6366F1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .clinic-box { background: #EEF2FF; border-left: 4px solid #6366F1; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Cadastro de Clínica — Minha Clínica</h1>
        </div>
        <div class="content">
            <h2>Olá, ${ownerName}!</h2>
            <p>Recebemos a solicitação de cadastro da clínica:</p>
            <div class="clinic-box">
                <strong>${clinicTradeName}</strong>
            </div>
            <p>Para confirmar seu e-mail e continuar o cadastro, clique no botão abaixo:</p>
            <center>
                <a href="${verificationUrl}" class="button">Confirmar E-mail</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Este link expira em <strong>25 minutos</strong>.
                Após confirmar o e-mail, você será redirecionado para completar seus dados de acesso.
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
      subject: `Confirme seu e-mail — Cadastro da ${clinicTradeName}`,
      html,
      text: `Olá ${ownerName}, clique no link para confirmar seu e-mail e continuar o cadastro da ${clinicTradeName}: ${verificationUrl}`,
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
    role: Extract<UserRole, "RECEPTIONIST" | "ADMIN">,
    verificationToken: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&type=staff`;
    const roleText = role === UserRole.ADMIN ? "Administrador" : "Recepcionista";

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
 * Provider de desenvolvimento — imprime no console.
 * Use apenas localmente, nunca em produção.
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

/**
 * Provider de produção usando Resend (https://resend.com)
 * Requer: RESEND_API_KEY e EMAIL_FROM no .env
 *
 * Passos para configurar:
 * 1. Crie uma conta em resend.com (gratuito até 3.000 emails/mês)
 * 2. Vá em "API Keys" e crie uma nova chave
 * 3. Em "Domains", adicione e verifique seu domínio (ou use onboarding@resend.dev para testes)
 * 4. Adicione no .env:
 *      RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
 *      EMAIL_FROM=Minha Clínica <noreply@seudominio.com.br>
 */
export class ResendEmailProvider implements EmailProvider {
  private client: Resend;
  private from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY não configurada nas variáveis de ambiente");
    }
    this.client = new Resend(apiKey);
    this.from = process.env.EMAIL_FROM ?? "Minha Clínica <onboarding@resend.dev>";
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      throw new Error(`Falha ao enviar email via Resend: ${error.message}`);
    }
  }
}

/**
 * Provider de testes usando Mailtrap (https://mailtrap.io)
 * Captura todos os emails em uma caixa de entrada virtual — o destinatário real NUNCA recebe.
 * Ideal para desenvolvimento: funciona com qualquer email sem precisar de domínio.
 *
 * Como configurar (gratuito):
 * 1. Crie conta em mailtrap.io
 * 2. Email Testing → Inboxes → clique na sua inbox → "SMTP Settings" → "Nodemailer"
 * 3. Copie user e pass e adicione no .env:
 *      MAILTRAP_USER=seu_user
 *      MAILTRAP_PASS=sua_senha
 */
export class MailtrapEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor() {
    const user = process.env.MAILTRAP_USER;
    const pass = process.env.MAILTRAP_PASS;
    if (!user || !pass) {
      throw new Error("MAILTRAP_USER e MAILTRAP_PASS não configurados no .env");
    }
    this.transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: { user, pass },
    });
    this.from = process.env.EMAIL_FROM ?? "Minha Clínica <noreply@minhaclinica.dev>";
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}

/**
 * Provider usando Gmail SMTP com Senha de App do Google.
 * Entrega para qualquer email real, gratuitamente (limite ~500/dia).
 *
 * Como configurar:
 * 1. Ative a verificação em 2 etapas na sua conta Google:
 *    https://myaccount.google.com/security
 * 2. Vá em "Senhas de app" (aparece após ativar o 2FA)
 * 3. Selecione "Outro" → coloque "MinhaClinica" → clique em Gerar
 * 4. Copie a senha de 16 caracteres e adicione no .env:
 *      GMAIL_USER=luizfbzonetti@gmail.com
 *      GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 */
export class GmailEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error("GMAIL_USER e GMAIL_APP_PASSWORD não configurados no .env");
    }
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    this.from = `Minha Clínica <${user}>`;
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}

/**
 * Retorna o provider correto baseado no ambiente:
 *
 * GMAIL_USER definido → GmailEmailProvider (entrega para qualquer email real ✅)
 * MAILTRAP_USER definido → MailtrapEmailProvider (captura emails sem entregar — só para testes)
 * NODE_ENV=production ou FORCE_REAL_EMAIL=true → ResendEmailProvider (requer domínio verificado)
 * Nenhum → ConsoleEmailProvider (imprime no terminal)
 */
export function createEmailProvider(): EmailProvider {
  if (process.env.GMAIL_USER) {
    return new GmailEmailProvider();
  }

  if (process.env.NODE_ENV === "production" || process.env.FORCE_REAL_EMAIL === "true") {
    return new ResendEmailProvider();
  }

  if (process.env.MAILTRAP_USER) {
    return new MailtrapEmailProvider();
  }

  return new ConsoleEmailProvider();
}
