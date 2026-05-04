import * as BrevoSdk from "@getbrevo/brevo";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
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
 * Provider de produção usando Brevo (https://brevo.com)
 * Usa HTTP API — funciona no Render Free (sem bloqueio de SMTP).
 * Gratuito: 300 emails/dia, 9.000/mês.
 * Não precisa de domínio próprio — basta verificar o email remetente.
 *
 * Como configurar:
 * 1. Crie conta em brevo.com
 * 2. Settings → Senders & IP → Senders → Add a sender → verifique o email
 * 3. Account → SMTP & API → API Keys → crie uma chave
 * 4. Adicione no .env (e nas env vars do Render):
 *      BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxx
 *      EMAIL_FROM=Minha Clínica <minhaclinica.suporte@gmail.com>
 */
export class BrevoEmailProvider implements EmailProvider {
    private client: BrevoSdk.BrevoClient;
    private from: string;

    constructor() {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            throw new Error("BREVO_API_KEY não configurada nas variáveis de ambiente");
        }
        this.client = new BrevoSdk.BrevoClient({ apiKey });
        this.from = process.env.EMAIL_FROM ?? "Minha Clínica <noreply@minhaclinica.dev>";
    }

    async sendEmail(options: {
        to: string;
        subject: string;
        html: string;
        text?: string;
    }): Promise<void> {
        // Extrair nome e email do formato "Nome <email@dominio.com>"
        const fromMatch = this.from.match(/^(.+?)\s*<(.+)>$/);
        const senderName = fromMatch ? fromMatch[1].trim() : "Minha Clínica";
        const senderEmail = fromMatch ? fromMatch[2].trim() : this.from;

        await this.client.transactionalEmails.sendTransacEmail({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: options.to }],
            subject: options.subject,
            htmlContent: options.html,
            textContent: options.text,
        });
    }
}

/**
 * Provider de produção usando Resend (https://resend.com)
 * Usa HTTP API — funciona no Render Free (sem bloqueio de SMTP).
 * Gratuito até 3.000 emails/mês.
 *
 * Como configurar:
 * 1. Crie conta em resend.com
 * 2. Vá em "API Keys" → crie uma chave
 * 3. Em "Domains" → adicione seu domínio OU use o domínio padrão do Resend para testes
 * 4. Adicione no .env (e nas env vars do Render):
 *      RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
 *      EMAIL_FROM=Minha Clínica <onboarding@resend.dev>   ← domínio padrão para testes
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
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
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
        const gmailOptions: SMTPTransport.Options & { family?: number } = {
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // STARTTLS
            family: 4,     // força IPv4 — evita ENETUNREACH no Render (sem suporte a IPv6)
            auth: { user, pass },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        };
        this.transporter = nodemailer.createTransport(gmailOptions);
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
 * BREVO_API_KEY definido   → BrevoEmailProvider  (HTTP API — funciona no Render Free ✅, envia para qualquer email sem domínio)
 * RESEND_API_KEY definido  → ResendEmailProvider (HTTP API — funciona no Render Free ✅, exige domínio verificado para enviar a terceiros)
 * GMAIL_USER definido      → GmailEmailProvider  (SMTP    — NÃO funciona no Render Free ❌)
 * MAILTRAP_USER definido   → MailtrapEmailProvider (captura emails sem entregar — só para testes locais)
 * Nenhum                   → ConsoleEmailProvider (imprime no terminal — fallback de desenvolvimento)
 */
export function createEmailProvider(): EmailProvider {
    if (process.env.BREVO_API_KEY) {
        return new BrevoEmailProvider();
    }

    if (process.env.RESEND_API_KEY) {
        return new ResendEmailProvider();
    }

    if (process.env.GMAIL_USER) {
        return new GmailEmailProvider();
    }

    if (process.env.MAILTRAP_USER) {
        return new MailtrapEmailProvider();
    }

    return new ConsoleEmailProvider();
}
