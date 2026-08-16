import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import { UserRole, UserStatus } from "../../types/enums";
import { generateAuthToken, generateTwoFactorPendingToken } from "../../utils/jwtUtils";
import { SendOtpService } from "./twoFactorService";

const auditLogRepository = new AuditLogRepository();

/**
 * LOGIN - Autenticar usuário
 * Apenas email e senha (usuário já está vinculado à clínica)
 */
export class LoginService {
  async execute(data: {
    email: string;
    password: string;
    deviceToken?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    // Buscar usuário por email
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
      include: {
        clinic: { include: { settings: true } },
        professional: true,
        patient: true,
      },
    });
    if (!user) {
      throw new Error("Email ou senha incorretos");
    }

    // Verificar se conta está ativa
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error("Email ou senha incorretos");
    }

    // ADMIN/RECEPTIONIST não têm registro próprio de isActive (só User.status
    // controla o acesso); PROFESSIONAL/PATIENT usam o isActive do registro
    // vinculado (ver comentário em Professional.isActive/Patient.isActive no
    // schema). Login só falha aqui se NENHUM papel do usuário estiver usável —
    // com multi-papel, basta um papel ativo para entrar.
    const isRoleUsable = (role: UserRole): boolean => {
      if (role === UserRole.PROFESSIONAL) return user.professional?.isActive === true;
      if (role === UserRole.PATIENT) return user.patient?.isActive === true;
      return true;
    };
    const rolesToCheck = user.roles.length > 0 ? user.roles : [user.role];
    if (!rolesToCheck.some(isRoleUsable)) {
      throw new Error("Email ou senha incorretos");
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      throw new Error("Email ou senha incorretos");
    }

    // ClinicSettings.twoFactorEnabled é uma política de clínica: quando
    // ligada, exige 2FA de todo mundo, mesmo quem não ligou o próprio
    // User.twoFactorEnabled individualmente. Antes desse gate, o campo
    // existia só no JSON de configurações, sem nenhum efeito.
    const clinicRequires2FA = user.clinic?.settings?.twoFactorEnabled === true;

    // Se 2FA estiver ativo (individual ou por política da clínica), verificar
    // se o dispositivo é confiável
    if (user.twoFactorEnabled || clinicRequires2FA) {
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

    // ClinicSettings.sessionTimeoutMinutes tinha tela real sem nenhum efeito —
    // expiração real era sempre "8h" hardcoded. Só se aplica a staff
    // (clinicId presente); paciente é global, sem uma única clínica cujo
    // valor faria sentido usar, mantém os 8h de sempre.
    const sessionTimeoutMinutes = user.clinicId
      ? user.clinic?.settings?.sessionTimeoutMinutes
      : undefined;

    // Gerar token JWT (inclui todos os roles ativos)
    const token = generateAuthToken(
      user.id,
      user.clinicId,
      user.role,
      user.name,
      sessionTimeoutMinutes ? { expiresIn: sessionTimeoutMinutes * 60 } : {},
      user.roles,
    );

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // ClinicSettings.accessLogEnabled ("Log de acessos — Registrar todos os
    // acessos ao sistema", default true) tinha tela real sem nenhum efeito —
    // nenhum login era registrado em nenhum lugar. Só se aplica a staff
    // (clinicId presente); paciente é global.
    if (user.clinicId && user.clinic?.settings?.accessLogEnabled !== false) {
      await auditLogRepository.create({
        clinicId: user.clinicId,
        userId: user.id,
        userName: user.name,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
    }

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
        termsAccepted: Boolean(user.termsAcceptedAt && user.privacyAcceptedAt),
      },
    };
  }
}
