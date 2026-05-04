import type { EmailProvider } from "./emailProvider";
import { UserRole } from "../../types/enums";

/**
 * Emails relacionados à autenticação e registro de usuários.
 * - Verificação de email do paciente
 * - Verificação de email do responsável/proprietário da clínica
 * - Convite para profissional
 * - Convite para recepcionista/admin
 * - Boas-vindas para paciente cadastrado pela recepção
 */
export class AuthEmailService {
    protected provider: EmailProvider;

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
        const apiUrl = process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;
        const verificationUrl = `${apiUrl}/api/clinics/verify-email/${verificationToken}`;

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
     * Envia convite para recepcionista ou admin
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

    /**
     * Envia email de boas-vindas para paciente cadastrado pela recepção.
     * Contém: email de login, senha temporária gerada e botão "Ativar Conta"
     */
    async sendReceptionWelcomeEmail(
        email: string,
        name: string,
        temporaryPassword: string,
        activationToken: string,
        clinicName: string,
    ): Promise<void> {
        const activationUrl = `${process.env.FRONTEND_URL}/ativar-conta?token=${activationToken}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0EA5E9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #0EA5E9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .credentials { background: #E0F2FE; border-left: 4px solid #0EA5E9; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
        .credentials p { margin: 6px 0; font-size: 15px; }
        .credentials strong { font-family: monospace; font-size: 16px; color: #0369A1; }
        .clinic-box { background: #F0F9FF; border-left: 4px solid #0EA5E9; padding: 10px 16px; border-radius: 4px; margin: 12px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Bem-vindo(a) à Minha Clínica</h1>
        </div>
        <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Sua conta foi criada pela equipe da:</p>
            <div class="clinic-box">${clinicName}</div>
            <p>Abaixo estão suas credenciais de acesso ao portal do paciente:</p>
            <div class="credentials">
                <p>📧 <strong>E-mail:</strong> ${email}</p>
                <p>🔑 <strong>Senha temporária:</strong> <strong>${temporaryPassword}</strong></p>
            </div>
            <p>Para ativar sua conta, clique no botão abaixo:</p>
            <center>
                <a href="${activationUrl}" class="button">Ativar Conta</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${activationUrl}</p>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                Este link de ativação expira em <strong>48 horas</strong>.<br>
                Você pode trocar sua senha a qualquer momento após fazer login.
            </p>
        </div>
        <div class="footer">
            <p>Se você não esperava este email, entre em contato com a clínica.</p>
        </div>
    </div>
</body>
</html>
    `;

        await this.provider.sendEmail({
            to: email,
            subject: `Sua conta foi criada pela ${clinicName} — Ative agora | Minha Clínica`,
            html,
            text: `Olá ${name}, sua conta foi criada pela recepção da ${clinicName}. E-mail: ${email} | Senha: ${temporaryPassword} | Ative sua conta: ${activationUrl}`,
        });
    }

    /**
     * Envia email com link para redefinição de senha.
     * O link expira em 15 minutos.
     */
    async sendForgotPasswordEmail(
        email: string,
        name: string,
        resetToken: string,
    ): Promise<void> {
        const resetUrl = `${process.env.FRONTEND_URL}/redefinir-senha?token=${resetToken}`;

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
        .button { display: inline-block; padding: 12px 30px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .warning { background: #FFF7ED; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #92400E; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 Redefinição de Senha</h1>
        </div>
        <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Minha Clínica</strong>.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <center>
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <div class="warning">
                ⚠️ Este link é válido por apenas <strong>15 minutos</strong> e pode ser usado uma única vez.
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 16px;">
                Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanece a mesma.
            </p>
        </div>
        <div class="footer">
            <p>Minha Clínica — Este é um email automático, não responda.</p>
        </div>
    </div>
</body>
</html>
        `;

        await this.provider.sendEmail({
            to: email,
            subject: "Redefinição de senha — Minha Clínica",
            html,
            text: `Olá ${name}, acesse o link para redefinir sua senha (válido por 15 minutos): ${resetUrl}`,
        });
    }
}
