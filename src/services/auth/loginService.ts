import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { UserStatus } from "../../types/enums";
import { generateAuthToken, generateTwoFactorPendingToken } from "../../utils/jwtUtils";
import { SendOtpService } from "./twoFactorService";

/**
 * LOGIN - Autenticar usuário
 * Apenas email e senha (usuário já está vinculado à clínica)
 */
export class LoginService {
  async execute(data: { email: string; password: string; deviceToken?: string }) {
    // Buscar usuário por email
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
      include: {
        clinic: true,
      },
    });
    if (!user) {
      throw new Error("Email ou senha incorretos");
    }

    // Verificar se conta está ativa
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error("Conta não está ativa. Complete seu cadastro ou aguarde aprovação.");
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      throw new Error("Email ou senha incorretos");
    }

    // Se 2FA estiver ativo, verificar se o dispositivo é confiável
    if (user.twoFactorEnabled) {
      let deviceTrusted = false;

      if (data.deviceToken) {
        const trusted = await prisma.trustedDevice.findFirst({
          where: {
            userId: user.id,
            deviceToken: data.deviceToken,
            expiresAt: { gt: new Date() },
          },
        });
        deviceTrusted = !!trusted;
      }

      if (!deviceTrusted) {
        // Envia OTP por email e retorna token temporário
        const otpService = new SendOtpService();
        await otpService.execute(user.id);

        const tempToken = generateTwoFactorPendingToken(
          user.id,
          user.clinicId,
          user.role,
          user.name,
          user.roles,
        );
        return { requires2FA: true, tempToken };
      }
    }

    // Gerar token JWT (inclui todos os roles ativos)
    const token = generateAuthToken(user.id, user.clinicId, user.role, user.name, {}, user.roles);

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      requires2FA: false,
      token,
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

