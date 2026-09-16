import type { EmailProvider } from "./emailProvider";
import { UserRole } from "../../types/enums";
import { escapeHtml } from "../../utils/escapeHtml";

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
        const safeName = escapeHtml(name);

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
            <h2>Olá, ${safeName}!</h2><p>Seja bem-vindo(a) ao Minha Clínica.</p>
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
        const safeOwnerName = escapeHtml(ownerName);
        const safeClinicTradeName = escapeHtml(clinicTradeName);

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
            <h2>Olá, ${safeOwnerName}!</h2>
            <p>Recebemos a solicitação de cadastro da clínica:</p>
            <div class="clinic-box">
                <strong>${safeClinicTradeName}</strong>
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
     * Envia convite para profissional. O link abre a página do convite, que
     * serve tanto a quem já tem conta (entra e aceita) quanto a quem não tem.
     */
    async sendProfessionalInviteEmail(
        email: string,
        name: string,
        clinicName: string,
        verificationToken: string,
    ): Promise<void> {
        const verificationUrl = `${process.env.FRONTEND_URL}/convite?token=${verificationToken}`;
        const safeName = escapeHtml(name);
        const safeClinicName = escapeHtml(clinicName);

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
            <h2>Olá, ${safeName}!</h2>
            <p>Você foi convidado para trabalhar na clínica <strong>${safeClinicName}</strong>.</p>
            <p>Para aceitar o convite, clique no botão abaixo:</p>
            <center>
                <a href="${verificationUrl}" class="button">Aceitar Convite</a>
            </center>
            <p style="font-size: 14px; color: #555;">
                Já usa o Minha Clínica com este e-mail (por exemplo, como paciente)? Basta entrar com a sua conta e aceitar.
                Ainda não tem conta? Você cria na mesma página.
            </p>
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
        const verificationUrl = `${process.env.FRONTEND_URL}/convite?token=${verificationToken}`;
        const roleText = role === UserRole.ADMIN ? "Administrador" : "Recepcionista";
        const safeName = escapeHtml(name);
        const safeClinicName = escapeHtml(clinicName);

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
            <h2>Olá, ${safeName}!</h2>
            <p>Você foi convidado para ser <strong>${roleText}</strong> na <strong>${safeClinicName}</strong>.</p>
            <p>Para aceitar o convite, clique no botão abaixo:</p>
            <center>
                <a href="${verificationUrl}" class="button">Aceitar Convite</a>
            </center>
            <p style="font-size: 14px; color: #555;">
                Já usa o Minha Clínica com este e-mail (por exemplo, como paciente)? Basta entrar com a sua conta e aceitar.
                Ainda não tem conta? Você cria na mesma página.
            </p>
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
     * Cadastro de clínica feito com o e-mail de uma conta que JÁ existe (ex.: um
     * paciente abrindo a própria clínica). Não cria conta nova: o link leva à
     * página de confirmação, onde a pessoa entra com a senha que já tem e só
     * aceita os termos da clínica.
     */
    async sendClinicExistingAccountEmail(
        email: string,
        name: string,
        clinicTradeName: string,
        confirmationToken: string,
        expiresInHours: number,
    ): Promise<void> {
        const confirmationUrl = `${process.env.FRONTEND_URL}/clinica/registro/confirmar?token=${confirmationToken}`;
        const safeName = escapeHtml(name);
        const safeClinicTradeName = escapeHtml(clinicTradeName);

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
            <h2>Olá, ${safeName}!</h2>
            <p>Recebemos o cadastro da clínica abaixo usando o e-mail da sua conta no Minha Clínica:</p>
            <div class="clinic-box">
                <strong>${safeClinicTradeName}</strong>
            </div>
            <p>Você não precisa criar outra conta. Clique no botão, entre com a senha que você já usa e confirme o cadastro da clínica:</p>
            <center>
                <a href="${confirmationUrl}" class="button">Confirmar cadastro da clínica</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${confirmationUrl}</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Este link expira em <strong>${expiresInHours} horas</strong>. Sua conta continua funcionando normalmente enquanto isso.
            </p>
        </div>
        <div class="footer">
            <p>Se você não solicitou este cadastro, ignore este e-mail — nada será criado sem a sua confirmação.</p>
        </div>
    </div>
</body>
</html>
    `;

        await this.provider.sendEmail({
            to: email,
            subject: `Confirme o cadastro da ${clinicTradeName}`,
            html,
            text: `Olá ${name}, recebemos o cadastro da ${clinicTradeName} com o e-mail da sua conta. Entre com a sua senha e confirme em: ${confirmationUrl}`,
        });
    }

    /**
     * Cadastro de clínica com o e-mail de uma conta que não está ativa
     * (bloqueada, desativada ou com o cadastro inicial pela metade). Nada é
     * criado; a resposta da API é a mesma de sempre para não revelar o estado
     * da conta — só o dono do e-mail fica sabendo o que fazer.
     */
    async sendClinicRegistrationAccountInactiveEmail(
        email: string,
        name: string,
        clinicTradeName: string,
    ): Promise<void> {
        const loginUrl = `${process.env.FRONTEND_URL}/login`;
        const forgotUrl = `${process.env.FRONTEND_URL}/forgot-password`;
        const safeName = escapeHtml(name);
        const safeClinicTradeName = escapeHtml(clinicTradeName);

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
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Cadastro de Clínica — Minha Clínica</h1>
        </div>
        <div class="content">
            <h2>Olá, ${safeName}!</h2>
            <p>Recebemos o cadastro da clínica <strong>${safeClinicTradeName}</strong> com o seu e-mail, mas a sua conta no Minha Clínica ainda não está ativa.</p>
            <p>Conclua a ativação da sua conta (ou <a href="${forgotUrl}">recupere a senha</a>) e depois envie o cadastro da clínica novamente.</p>
            <p><a href="${loginUrl}">Ir para o login</a></p>
        </div>
        <div class="footer">
            <p>Se você não solicitou este cadastro, por favor ignore este e-mail.</p>
        </div>
    </div>
</body>
</html>
    `;

        await this.provider.sendEmail({
            to: email,
            subject: `Cadastro da ${clinicTradeName} — ative sua conta primeiro`,
            html,
            text: `Olá ${name}, recebemos o cadastro da ${clinicTradeName}, mas sua conta ainda não está ativa. Ative ou recupere o acesso em ${loginUrl} e envie o cadastro novamente.`,
        });
    }

    /**
     * Envia email de boas-vindas para paciente cadastrado pela recepção.
     * Contém: email de login e botão "Ativar Conta" — a senha é definida
     * pelo próprio paciente no ato da ativação, nunca trafega por e-mail.
     */
    async sendReceptionWelcomeEmail(
        email: string,
        name: string,
        activationToken: string,
        clinicName: string,
    ): Promise<void> {
        const activationUrl = `${process.env.FRONTEND_URL}/ativar-conta?token=${activationToken}`;
        const safeName = escapeHtml(name);
        const safeClinicName = escapeHtml(clinicName);
        const safeEmail = escapeHtml(email);

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
            <h2>Olá, ${safeName}!</h2>
            <p>Sua conta foi criada pela equipe da:</p>
            <div class="clinic-box">${safeClinicName}</div>
            <p>Seu e-mail de login é <strong>${safeEmail}</strong>. Para acessar o portal do paciente, clique no botão abaixo e defina sua própria senha:</p>
            <center>
                <a href="${activationUrl}" class="button">Ativar Conta</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${activationUrl}</p>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                Este link de ativação expira em <strong>48 horas</strong>.
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
            text: `Olá ${name}, sua conta foi criada pela recepção da ${clinicName}. E-mail: ${email} | Ative sua conta e defina sua senha: ${activationUrl}`,
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
        const safeName = escapeHtml(name);

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
            <h2>Olá, ${safeName}!</h2>
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

    /**
     * Envia código OTP de verificação em dois fatores por email
     */
    async send2FAOtpEmail(
        email: string,
        name: string,
        otp: string,
        expiresMinutes = 10,
    ): Promise<void> {
        const safeName = escapeHtml(name);
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
        .otp-box { background: #EFF6FF; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1D4ED8; font-family: monospace; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Verificação de Acesso — Minha Clínica</h1>
        </div>
        <div class="content">
            <h2>Olá, ${safeName}!</h2>
            <p>Detectamos um acesso de um dispositivo não reconhecido. Use o código abaixo para confirmar seu login:</p>
            <div class="otp-box">
                <div class="otp-code">${otp}</div>
            </div>
            <p style="margin-top: 8px; font-size: 14px; color: #666;">
                ⏱️ Este código expira em <strong>${expiresMinutes} minutos</strong>.
            </p>
            <p style="margin-top: 16px; font-size: 14px; color: #666;">
                Após confirmar, este dispositivo será lembrado por <strong>7 dias</strong>.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="font-size: 13px; color: #9CA3AF;">
                Se você não tentou fazer login, sua senha pode ter sido comprometida. Recomendamos alterá-la imediatamente.
            </p>
        </div>
        <div class="footer">
            <p>Não compartilhe este código com ninguém — a equipe do Minha Clínica nunca solicita seu código.</p>
        </div>
    </div>
</body>
</html>
        `;

        await this.provider.sendEmail({
            to: email,
            subject: "Código de verificação — Minha Clínica",
            html,
            text: `Olá ${name}, seu código de verificação é: ${otp} (válido por ${expiresMinutes} minutos).`,
        });
    }

    /**
     * Confirmação de troca de e-mail — enviado para o e-mail NOVO.
     * Só quem controla a nova caixa consegue efetivar a troca; até lá o
     * e-mail antigo continua sendo o login válido.
     */
    async sendEmailChangeConfirmationEmail(
        newEmail: string,
        name: string,
        requestedByName: string,
        currentEmail: string,
        confirmationToken: string,
    ): Promise<void> {
        const confirmUrl = `${process.env.FRONTEND_URL}/confirmar-email?token=${confirmationToken}`;
        const safeName = escapeHtml(name);
        const safeRequestedBy = escapeHtml(requestedByName);
        const safeCurrentEmail = escapeHtml(currentEmail);
        const safeNewEmail = escapeHtml(newEmail);

        const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background-color:#3B82F6;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}
.content{background-color:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
.button{display:inline-block;padding:12px 30px;background-color:#3B82F6;color:white;text-decoration:none;border-radius:5px;margin:20px 0;font-weight:bold}
.info-box{background:#EFF6FF;border-left:4px solid #3B82F6;padding:12px 16px;border-radius:4px;margin:16px 0}
.warning{background:#FFF7ED;border-left:4px solid #F59E0B;padding:12px 16px;border-radius:4px;margin:20px 0;font-size:14px;color:#92400E}
.footer{text-align:center;margin-top:20px;font-size:12px;color:#666}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>✉️ Confirme seu novo e-mail</h1></div>
  <div class="content">
    <h2>Olá, ${safeName}!</h2>
    <p><strong>${safeRequestedBy}</strong> solicitou a troca do e-mail de acesso da sua conta.</p>
    <div class="info-box">
      <p><strong>E-mail atual:</strong> ${safeCurrentEmail}</p>
      <p><strong>Novo e-mail:</strong> ${safeNewEmail}</p>
    </div>
    <p>Enquanto você não confirmar, o acesso continua pelo e-mail atual — nada muda na sua conta.</p>
    <center><a href="${confirmUrl}" class="button">Confirmar novo e-mail</a></center>
    <div class="warning">
      Não reconhece esta solicitação? Ignore este e-mail e avise a clínica: sem a confirmação
      deste link, a troca não acontece. O link expira em 24 horas.
    </div>
  </div>
  <div class="footer"><p>Minha Clínica — Este é um email automático, não responda.</p></div>
</div>
</body>
</html>`;

        await this.provider.sendEmail({
            to: newEmail,
            subject: "Confirme seu novo e-mail — Minha Clínica",
            html,
            text: `Olá ${name}, ${requestedByName} solicitou trocar o e-mail de acesso de ${currentEmail} para ${newEmail}. Confirme em: ${confirmUrl} (expira em 24h). Enquanto não confirmar, o e-mail atual continua valendo.`,
        });
    }
}
