import nodemailer from "nodemailer";
import { Resend } from "resend";

/**
 * Interface base para todos os provedores de email.
 * Implementada por Console, Gmail, Mailtrap e Resend.
 */
export interface EmailProvider {
    sendEmail(options: { to: string; subject: string; html: string; text?: string }): Promise<void>;
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
 * Retorna o provider correto baseado nas variáveis de ambiente:
 *
 * GMAIL_USER definido → GmailEmailProvider (entrega para qualquer email real ✅)
 * MAILTRAP_USER definido → MailtrapEmailProvider (captura emails sem entregar — só para testes)
 * Nenhum → ConsoleEmailProvider (imprime no terminal — fallback de desenvolvimento)
 *
 * Nota: ResendEmailProvider não está ativo. Para usá-lo, adicione a lógica aqui
 * com RESEND_API_KEY e descomente a importação de ResendEmailProvider.
 */
export function createEmailProvider(): EmailProvider {
    if (process.env.GMAIL_USER) {
        return new GmailEmailProvider();
    }

    if (process.env.MAILTRAP_USER) {
        return new MailtrapEmailProvider();
    }

    return new ConsoleEmailProvider();
}
