import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { UserRepository } from "../../repository/userRepository";
import { UserRole, UserStatus } from "../../types/enums";
import type { CompleteProfessionalInput, InviteProfessionalInput } from "../../types/user";
import { createVerificationData } from "../../utils/verificationTokenUtils";
import { createEmailProvider, EmailService } from "../email/emailService";

/**
 * CONVIDAR PROFISSIONAL - ETAPA 1
 * Admin convida profissional
 */
export class InviteProfessionalService {
  private userRepository = new UserRepository();
  private emailService = new EmailService(createEmailProvider());

  async execute(adminId: string, data: InviteProfessionalInput) {
    // Verificar se quem está convidando é admin
    const admin = await this.userRepository.findById(adminId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error("Apenas administradores podem convidar profissionais");
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

    // Criar token de verificação
    const verification = createVerificationData(48); // 48 horas

    // Buscar ou criar a especialidade na clínica
    const specialtyRecord = await prisma.specialty.upsert({
      where: { clinicId_name: { clinicId: adminClinicId, name: data.specialty } },
      update: {},
      create: {
        clinicId: adminClinicId,
        name: data.specialty,
      },
    });

    // Criar usuário com status pendente
    const user = await this.userRepository.createUser({
      clinicId: adminClinicId,
      name: data.name,
      email: data.email,
      phone: "00000000000", // Temporário
      cpf: "00000000000", // Temporário
      password: "temp", // Temporário
      role: UserRole.PROFESSIONAL,
      status: UserStatus.PENDING_ACTIVATION,
      mustChangePassword: false,
    });

    // Salvar token de verificação e especialidade pendente
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verification.hashedToken,
        verificationExpires: verification.expiresAt,
        pendingSpecialtyId: specialtyRecord.id,
      },
    });

    // Enviar email
    await this.emailService.sendProfessionalInviteEmail(
      data.email,
      data.name,
      clinic.tradeName,
      verification.token,
    );

    return {
      message: "Convite enviado com sucesso",
      email: data.email,
      userId: user.id,
    };
  }
}

/**
 * CANCELAR CONVITE - remove o User pendente, liberando o e-mail para um novo convite.
 * Só atua sobre convites de fato pendentes (PENDING_ACTIVATION, sem Professional
 * vinculado) — depois que o convidado completa o cadastro, isso não é mais
 * "cancelamento de convite", é remoção de profissional (outro fluxo).
 */
export class CancelProfessionalInviteService {
  private userRepository = new UserRepository();

  async execute(adminId: string, userId: string) {
    const admin = await this.userRepository.findById(adminId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error("Apenas administradores podem cancelar convites");
    }

    if (!admin.clinicId) {
      throw new Error("Admin não está vinculado a uma clínica");
    }

    const pendingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        clinicId: admin.clinicId,
        role: UserRole.PROFESSIONAL,
        status: UserStatus.PENDING_ACTIVATION,
        professional: { is: null },
      },
    });

    if (!pendingUser) {
      throw new Error("Convite nao encontrado");
    }

    await prisma.user.delete({ where: { id: pendingUser.id } });

    return { message: "Convite cancelado com sucesso" };
  }
}

/**
 * COMPLETAR CADASTRO PROFISSIONAL - ETAPA 3
 */
export class CompleteProfessionalService {
  private userRepository = new UserRepository();

  async execute(userId: string, data: CompleteProfessionalInput) {
    // Buscar usuário
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if (user.status !== UserStatus.EMAIL_VERIFIED) {
      throw new Error("Usuário já ativo ou status inválido");
    }

    if (user.role !== UserRole.PROFESSIONAL) {
      throw new Error("Tipo de usuário inválido");
    }

    if (!user.clinicId) {
      throw new Error("Profissional não está vinculado a uma clínica");
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
        verificationToken: null,
        verificationExpires: null,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });

    // Criar registro de profissional e vincular especialidade pendente
    const professional = await prisma.professional.create({
      data: {
        userId,
        clinicId: userClinicId,
        professionalCouncil: data.professionalCouncil,
        registrationNumber: data.registrationNumber,
        registrationState: data.registrationState,
        defaultAppointmentDuration: data.defaultAppointmentDuration || 30,
        formations: data.formations ?? null,
      },
    });

    // Vincular especialidade pendente (definida no convite)
    if (user.pendingSpecialtyId) {
      await prisma.professionalSpecialty.create({
        data: {
          professionalId: professional.id,
          specialtyId: user.pendingSpecialtyId,
          isPrimary: true,
        },
      });

      // Limpar specialtyId pendente do usuário
      await prisma.user.update({
        where: { id: userId },
        data: { pendingSpecialtyId: null },
      });
    }

    return {
      userId: user.id,
      professionalId: professional.id,
      name: user.name,
      email: user.email,
      message: "Cadastro completado com sucesso!",
    };
  }
}
