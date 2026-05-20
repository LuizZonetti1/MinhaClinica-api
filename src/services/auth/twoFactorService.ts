import crypto from "crypto";
import { prisma } from "../../database/prisma";
import { AuthEmailService, createEmailProvider } from "../email/emailService";
import { generateAuthToken, verifyTwoFactorPendingToken } from "../../utils/jwtUtils";

const OTP_EXPIRES_MINUTES = 10;
const DEVICE_TRUSTED_DAYS = 7;

function hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

// â”€â”€ 1. Enviar OTP por email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export class SendOtpService {
    async execute(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, twoFactorEnabled: true },
        });

        if (!user) throw new Error("Usuário não encontrado");
        if (!user.twoFactorEnabled) throw new Error("Autenticação em dois fatores não está ativa");

        // Gera OTP de 6 dígitos
        const otp = crypto.randomInt(100000, 1000000).toString();
        const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorOtp: hashOtp(otp),
                twoFactorOtpExpires: expiresAt,
            },
        });

        const emailSvc = new AuthEmailService(createEmailProvider());
        await emailSvc.send2FAOtpEmail(user.email, user.name, otp, OTP_EXPIRES_MINUTES);

        return { message: "Código enviado para seu email" };
    }
}

//2. Validar OTP e registrar dispositivo confiável â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export class ValidateOtpService {
    async execute(pendingToken: string, code: string, userAgent?: string) {
        const payload = verifyTwoFactorPendingToken(pendingToken);

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                twoFactorOtp: true,
                twoFactorOtpExpires: true,
                twoFactorEnabled: true,
                status: true,
                clinic: { select: { tradeName: true } },
                clinicId: true,
                role: true,
                roles: true,
                name: true,
                email: true,
            },
        });

        if (!user) throw new Error("Usuário não encontrado");
        if (!user.twoFactorEnabled) throw new Error("Autenticação em dois fatores não está configurada");
        if (!user.twoFactorOtp || !user.twoFactorOtpExpires) {
            throw new Error("Nenhum código foi solicitado. Tente fazer login novamente.");
        }
        if (new Date() > user.twoFactorOtpExpires) {
            throw new Error("Código expirado. Tente fazer login novamente.");
        }
        if (hashOtp(code) !== user.twoFactorOtp) {
            throw new Error("Código inválido.");
        }

        // Gera token de dispositivo confiável (7 dias)
        const deviceToken = crypto.randomUUID();
        const deviceExpiresAt = new Date(Date.now() + DEVICE_TRUSTED_DAYS * 24 * 60 * 60 * 1000);

        await prisma.$transaction([
            // Limpa OTP
            prisma.user.update({
                where: { id: user.id },
                data: {
                    twoFactorOtp: null,
                    twoFactorOtpExpires: null,
                    lastLoginAt: new Date(),
                },
            }),
            // Cria dispositivo confiável
            prisma.trustedDevice.create({
                data: {
                    userId: user.id,
                    deviceToken,
                    userAgent: userAgent ?? null,
                    expiresAt: deviceExpiresAt,
                },
            }),
        ]);

        const token = generateAuthToken(user.id, user.clinicId, user.role, user.name, {}, user.roles);

        return {
            token,
            deviceToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                roles: user.roles.length > 0 ? user.roles : [user.role],
                clinicId: user.clinicId,
                clinicName: user.clinic?.tradeName ?? null,
            },
        };
    }
}

//3. Consultar status 
export class Get2FAStatusService {
    async execute(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                twoFactorEnabled: true,
                _count: { select: { trustedDevices: true } },
            },
        });

        if (!user) throw new Error("Usuário não encontrado");

        return {
            enabled: user.twoFactorEnabled,
            trustedDeviceCount: user._count.trustedDevices,
        };
    }
}

// â”€â”€ 4. Ativar 2FA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export class Enable2FAService {
    async execute(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorEnabled: true },
        });

        if (!user) throw new Error("Usuário não encontrado");
        if (user.twoFactorEnabled) throw new Error("Autenticação em dois fatores já está ativa");

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true },
        });

        return { message: "Autenticação em dois fatores ativada com sucesso" };
    }
}

// â”€â”€ 5. Desativar 2FA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export class Disable2FAService {
    async execute(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorEnabled: true },
        });

        if (!user) throw new Error("Usuário não encontrado");
        if (!user.twoFactorEnabled) throw new Error("Autenticação em dois fatores não está ativa");

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: false,
                    twoFactorOtp: null,
                    twoFactorOtpExpires: null,
                },
            }),
            prisma.trustedDevice.deleteMany({ where: { userId } }),
        ]);

        return { message: "Autenticação em dois fatores desativada" };
    }
}
