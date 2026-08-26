import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { UserRepository } from "../../repository/userRepository";
import { UserRole, UserStatus } from "../../types/enums";
import type { CompleteStaffInput, InviteStaffInput } from "../../types/user";
import {
  createVerificationData,
  INVITE_EXPIRATION_MINUTES,
} from "../../utils/verificationTokenUtils";
import { createEmailProvider, EmailService } from "../email/emailService";
import { IssueSessionService } from "../auth/issueSessionService";

/**
 * CONVIDAR STAFF (Recepcionista/Admin) - ETAPA 1
 * Admin convida outro staff
 */
export class InviteStaffService {
  private userRepository = new UserRepository();
  private emailService = new EmailService(createEmailProvider());

  async execute(adminId: string, data: InviteStaffInput) {
    // Verificar se quem está convidando é admin
    const admin = await this.userRepository.findById(adminId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error("Apenas administradores podem convidar staff");
    }

    if (!admin.clinicId) {
      throw new Error("Admin não está vinculado a uma clínica");
    }
    const adminClinicId = admin.clinicId; // string (narrowed)

    // Verificar se email já existe
    const existingUser = await this.userRepository.findByEmail(adminClinicId, data.email);

    if (existingUser) {
      throw Object.assign(new Error("Este e-mail já possui cadastro na plataforma."), {
        statusCode: 409,
        code: "EMAIL_ALREADY_REGISTERED",
        action: "LOGIN_OR_RECOVER",
      });
    }

    // Buscar nome da clínica
    const clinic = await prisma.clinic.findUnique({
      where: { id: adminClinicId },
    });

    if (!clinic) {
      throw new Error("Clínica não encontrada");
    }

    // Checagem só por e-mail deixa passar convite duplicado para a mesma
    // pessoa com e-mail diferente — aviso não-bloqueante, não impede o convite.
    const possibleDuplicate = await prisma.user.findFirst({
      where: {
        clinicId: adminClinicId,
        status: UserStatus.PENDING_ACTIVATION,
        name: { equals: data.name, mode: "insensitive" },
      },
      select: { email: true },
    });

    // Criar token de verificação
    const verification = createVerificationData(INVITE_EXPIRATION_MINUTES);

    // Criar usuário com status pendente
    const user = await this.userRepository.createUser({
      clinicId: adminClinicId,
      name: data.name,
      email: data.email,
      phone: "00000000000", // Temporário
      cpf: "00000000000", // Temporário
      password: "temp", // Temporário
      role: data.role,
      status: UserStatus.PENDING_ACTIVATION,
      mustChangePassword: false,
    });

    // Salvar token de verificação
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verification.hashedToken,
        verificationExpires: verification.expiresAt,
      },
    });

    // Enviar email
    await this.emailService.sendStaffInviteEmail(
      data.email,
      data.name,
      clinic.tradeName,
      data.role,
      verification.token,
    );

    return {
      message: "Convite enviado com sucesso",
      email: data.email,
      userId: user.id,
      duplicateNameWarning: possibleDuplicate
        ? `Já existe um convite pendente para "${data.name}" (${possibleDuplicate.email}). Confira se não é a mesma pessoa antes de prosseguir.`
        : undefined,
    };
  }
}

/**
 * COMPLETAR CADASTRO STAFF - ETAPA 3
 */
export class CompleteStaffService {
  private userRepository = new UserRepository();

  async execute(userId: string, data: CompleteStaffInput) {
    // Buscar usuário
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if (user.status !== UserStatus.EMAIL_VERIFIED) {
      throw new Error("Usuário já ativo ou status inválido");
    }

    if (user.role !== UserRole.RECEPTIONIST && user.role !== UserRole.ADMIN) {
      throw new Error("Tipo de usuário inválido");
    }

    if (!user.clinicId) {
      throw new Error("Staff não está vinculado a uma clínica");
    }
    const userClinicId = user.clinicId; // string (narrowed)

    // Verificar se CPF já existe em outro usuário
    const existingCpf = await this.userRepository.findByCpfInClinic(userClinicId, data.cpf);
    if (existingCpf && existingCpf.id !== userId) {
      throw Object.assign(new Error("Este CPF já possui cadastro na plataforma."), {
        statusCode: 409,
        code: "CPF_ALREADY_REGISTERED",
        action: "LOGIN_OR_RECOVER",
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Atualizar dados do usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        cpf: data.cpf,
        phone: data.phone,
        password: hashedPassword,
        status: UserStatus.ACTIVE, // Ativa o usuário
        mustChangePassword: true, // Staff deve trocar senha no primeiro login
        verificationToken: null,
        verificationExpires: null,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });

    // Cadastro concluído = sessão aberta (ver IssueSessionService).
    const sessao = await new IssueSessionService().execute(user.id);

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: "Cadastro completado com sucesso!",
      ...sessao,
    };
  }
}
