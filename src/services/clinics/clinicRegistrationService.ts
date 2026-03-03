import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { UserRepository } from "../../repository/userRepository";
import { UserRole, UserStatus } from "../../types/enums";
import type { CompleteClinicOwnerInput, RegisterClinicInput } from "../../types/user";
import { generateTempRegistrationToken } from "../../utils/jwtUtils";
import { createVerificationData } from "../../utils/verificationTokenUtils";
import { createEmailProvider, EmailService } from "../email/emailService";

// ============================================================
// ETAPA 1 — Cadastrar clínica e iniciar verificação de e-mail
// ============================================================
export class RegisterClinicService {
  private userRepository = new UserRepository();
  private emailService = new EmailService(createEmailProvider());

  async execute(data: RegisterClinicInput) {
    const { ownerEmail, ownerName, clinicEmail, ...clinicFields } = data;

    // 1. Verificar se já existe usuario com esse e-mail (dono)
    const existingUser = await this.userRepository.findByEmail(ownerEmail);

    if (existingUser) {
      // E-mail verificado mas cadastro não concluído → manda direto para etapa 3
      if (existingUser.status === UserStatus.EMAIL_VERIFIED) {
        const tempToken = generateTempRegistrationToken(
          existingUser.id,
          existingUser.clinicId,
          existingUser.role as (typeof UserRole)[keyof typeof UserRole],
        );
        return {
          message: "E-mail já verificado. Continue para completar seus dados de acesso.",
          email: ownerEmail,
          tempToken,
          redirectToComplete: true,
        };
      }

      // Pendente → reenviar link
      if (existingUser.status === UserStatus.PENDING_ACTIVATION) {
        const verification = createVerificationData(25);
        // Atualiza a clínica vinculada se existir
        const clinic = existingUser.clinicId
          ? await prisma.clinic.findUnique({ where: { id: existingUser.clinicId } })
          : null;

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: ownerName,
            verificationToken: verification.hashedToken,
            verificationExpires: verification.expiresAt,
          },
        });

        await this.emailService.sendClinicOwnerVerificationEmail(
          ownerEmail,
          ownerName,
          clinic?.tradeName ?? clinicFields.tradeName,
          verification.token,
        );

        return {
          message: "Cadastro já iniciado. Reenviamos o link de verificação para seu e-mail.",
          email: ownerEmail,
        };
      }

      // Cadastro completo → erro
      throw Object.assign(new Error("E-mail já cadastrado"), { statusCode: 409 });
    }

    // 2. Verificar CNPJ duplicado
    const existingCnpj = await prisma.clinic.findUnique({
      where: { cnpj: clinicFields.cnpj },
    });
    if (existingCnpj) {
      throw Object.assign(new Error("CNPJ já cadastrado"), { statusCode: 409 });
    }

    // 3. Verificar e-mail de contato da clínica duplicado
    const existingClinicEmail = await prisma.clinic.findUnique({
      where: { email: clinicEmail },
    });
    if (existingClinicEmail) {
      throw Object.assign(new Error("E-mail da clínica já cadastrado"), { statusCode: 409 });
    }

    // 4. Criar clínica (inativa até o dono completar o cadastro)
    const clinic = await prisma.clinic.create({
      data: {
        legalName: clinicFields.legalName,
        tradeName: clinicFields.tradeName,
        cnpj: clinicFields.cnpj,
        email: clinicEmail,
        phone: clinicFields.phone,
        zipCode: clinicFields.zipCode,
        street: clinicFields.street,
        number: clinicFields.number,
        complement: clinicFields.complement,
        neighborhood: clinicFields.neighborhood,
        city: clinicFields.city,
        state: clinicFields.state,
        website: clinicFields.website,
        subdomain: clinicFields.subdomain ?? undefined,
        timezone: clinicFields.timezone ?? "America/Sao_Paulo",
        isActive: false, // ativada apenas ao completar o cadastro
      },
    });

    // 5. Criar usuário admin (pendente) vinculado à clínica
    const verification = createVerificationData(25);

    const owner = await this.userRepository.createUser({
      clinicId: clinic.id,
      name: ownerName,
      email: ownerEmail,
      role: UserRole.ADMIN,
      status: UserStatus.PENDING_ACTIVATION,
      mustChangePassword: false,
    });

    // 6. Salvar token de verificação no usuário
    await prisma.user.update({
      where: { id: owner.id },
      data: {
        verificationToken: verification.hashedToken,
        verificationExpires: verification.expiresAt,
      },
    });

    // 7. Enviar e-mail de verificação para o dono
    await this.emailService.sendClinicOwnerVerificationEmail(
      ownerEmail,
      ownerName,
      clinic.tradeName,
      verification.token,
    );

    return {
      message:
        "Cadastro iniciado! Enviamos um link de verificação para seu e-mail. " +
        "Confirme o e-mail e complete seus dados de acesso.",
      email: ownerEmail,
      clinicId: clinic.id,
    };
  }
}

// ============================================================
// ETAPA 3 — Completar dados do dono
// ============================================================
export class CompleteClinicOwnerService {
  private userRepository = new UserRepository();

  async execute(userId: string, data: CompleteClinicOwnerInput) {
    // 1. Buscar usuário
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if (user.status !== UserStatus.EMAIL_VERIFIED) {
      throw new Error("E-mail não verificado ou cadastro já concluído");
    }

    if (user.role !== UserRole.ADMIN) {
      throw new Error("Tipo de usuário inválido para este fluxo");
    }

    if (!user.clinicId) {
      throw new Error("Clínica não encontrada para este usuário");
    }

    // 2. Verificar CPF duplicado
    const cleanCpf = data.cpf.replace(/\D/g, "");
    const existingCpf = await this.userRepository.findByCpf(cleanCpf);
    if (existingCpf && existingCpf.id !== userId) {
      throw Object.assign(new Error("CPF já cadastrado"), { statusCode: 409 });
    }

    // 3. Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const cleanPhone = data.phone.replace(/\D/g, "");

    // 4. Atualizar dados do usuário e ativar
    await prisma.user.update({
      where: { id: userId },
      data: {
        cpf: cleanCpf,
        phone: cleanPhone,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    // 5. Ativar a clínica
    await prisma.clinic.update({
      where: { id: user.clinicId },
      data: { isActive: true },
    });

    return {
      userId: user.id,
      clinicId: user.clinicId,
      name: user.name,
      email: user.email,
      message: "Cadastro da clínica concluído com sucesso! Bem-vindo ao Minha Clínica.",
    };
  }
}

// ============================================================
// REENVIO de verificação para dono da clínica
// ============================================================
export class ResendClinicVerificationService {
  private emailService = new EmailService(createEmailProvider());

  async execute(data: { email: string }) {
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
        role: UserRole.ADMIN,
        status: UserStatus.PENDING_ACTIVATION,
      },
      include: {
        clinic: { select: { tradeName: true } },
      },
    });

    if (!user) {
      // Resposta genérica por segurança
      return {
        message:
          "Se este e-mail estiver cadastrado e pendente de verificação, um novo link foi enviado.",
      };
    }

    const verification = createVerificationData(25);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verification.hashedToken,
        verificationExpires: verification.expiresAt,
      },
    });

    await this.emailService.sendClinicOwnerVerificationEmail(
      user.email,
      user.name,
      user.clinic?.tradeName ?? "sua clínica",
      verification.token,
    );

    return {
      message: "Novo link de verificação enviado. Verifique sua caixa de entrada.",
    };
  }
}
