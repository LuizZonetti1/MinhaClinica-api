import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { UserRepository } from "../../repository/userRepository";
import { UserRole, UserStatus } from "../../types/enums";
import type { CompleteClinicOwnerInput, RegisterClinicInput } from "../../types/user";
import { createVerificationData } from "../../utils/verificationTokenUtils";
import { createEmailProvider, EmailService } from "../email/emailService";
import { IssueSessionService } from "../auth/issueSessionService";

// ============================================================
// ETAPA 1 — Cadastrar clínica e iniciar verificação de e-mail
// ============================================================

/** Minutos de validade do link de verificação do dono — o e-mail promete 25. */
const CLINIC_VERIFICATION_MINUTES = 25;

export class RegisterClinicService {
  private userRepository = new UserRepository();
  private emailService = new EmailService(createEmailProvider());

  /**
   * Regrava a clínica de um cadastro ainda em aberto com o que o responsável
   * acabou de preencher. Sem isto, reenviar o formulário com o CNPJ ou o endereço
   * corrigidos não teria efeito nenhum: a clínica ficaria com os dados da
   * primeira tentativa e o responsável não teria como saber.
   */
  private async atualizarClinicaEmCadastro(
    clinicId: string | null,
    dados: Omit<RegisterClinicInput, "ownerEmail" | "ownerName" | "clinicEmail"> & {
      email: string;
    },
  ): Promise<void> {
    if (!clinicId) return;

    // cnpj e email são @unique: só recusa se pertencerem a OUTRA clínica.
    const cnpjEmOutra = await prisma.clinic.findFirst({
      where: { cnpj: dados.cnpj, id: { not: clinicId } },
      select: { id: true },
    });
    if (cnpjEmOutra) {
      throw Object.assign(new Error("CNPJ já cadastrado"), { statusCode: 409 });
    }

    const emailEmOutra = await prisma.clinic.findFirst({
      where: { email: dados.email, id: { not: clinicId } },
      select: { id: true },
    });
    if (emailEmOutra) {
      throw Object.assign(new Error("E-mail da clínica já cadastrado"), { statusCode: 409 });
    }

    await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        legalName: dados.legalName,
        tradeName: dados.tradeName,
        cnpj: dados.cnpj,
        email: dados.email,
        phone: dados.phone,
        zipCode: dados.zipCode,
        street: dados.street,
        number: dados.number,
        complement: dados.complement,
        neighborhood: dados.neighborhood,
        city: dados.city,
        state: dados.state,
        website: dados.website,
      },
    });
  }

  async execute(data: RegisterClinicInput) {
    const { ownerEmail, ownerName, clinicEmail, ...clinicFields } = data;

    // 1. Verificar se já existe usuario com esse e-mail (dono)
    const existingUser = await this.userRepository.findByEmail(ownerEmail);

    if (existingUser) {
      // Cadastro em aberto — seja porque o link nunca foi clicado
      // (PENDING_ACTIVATION) ou porque foi clicado mas a Etapa 3 não terminou
      // (EMAIL_VERIFIED). Nos dois casos o percurso é o mesmo: regravar os dados
      // da clínica, mandar um link novo e devolver o responsável para a tela de
      // "verifique seu e-mail".
      //
      // Havia aqui um atalho só para EMAIL_VERIFIED que pulava direto para a
      // Etapa 3: não enviava e-mail nenhum (parecia que o envio tinha quebrado),
      // sumia com a tela de verificação do percurso e, pior, descartava em
      // silêncio a clínica recém-preenchida — o tempToken apontava para a clínica
      // antiga. Reverificar custa um clique e mantém o fluxo sempre igual.
      if (
        existingUser.status === UserStatus.PENDING_ACTIVATION ||
        existingUser.status === UserStatus.EMAIL_VERIFIED
      ) {
        const verification = createVerificationData(CLINIC_VERIFICATION_MINUTES);

        await this.atualizarClinicaEmCadastro(existingUser.clinicId, {
          ...clinicFields,
          email: clinicEmail,
        });

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: ownerName,
            // Volta para PENDING_ACTIVATION: é o status que VerifyEmailService
            // exige para aceitar o link novo.
            status: UserStatus.PENDING_ACTIVATION,
            verificationToken: verification.hashedToken,
            verificationExpires: verification.expiresAt,
          },
        });

        await this.emailService.sendClinicOwnerVerificationEmail(
          ownerEmail,
          ownerName,
          clinicFields.tradeName,
          verification.token,
        );

        return {
          message: "Cadastro já iniciado. Reenviamos o link de verificação para seu e-mail.",
          email: ownerEmail,
        };
      }

      // Cadastro completo → erro
      throw Object.assign(new Error("Este e-mail já possui cadastro na plataforma."), {
        statusCode: 409,
        code: "EMAIL_ALREADY_REGISTERED",
        action: "LOGIN_OR_RECOVER",
      });
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
    const verification = createVerificationData(CLINIC_VERIFICATION_MINUTES);

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
    const existingCpf = await this.userRepository.findByCpfGlobal(cleanCpf);
    if (existingCpf && existingCpf.id !== userId) {
      throw Object.assign(new Error("Este CPF já possui cadastro na plataforma."), {
        statusCode: 409,
        code: "CPF_ALREADY_REGISTERED",
        action: "LOGIN_OR_RECOVER",
      });
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
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });

    // 5. Ativar a clínica
    await prisma.clinic.update({
      where: { id: user.clinicId },
      data: { isActive: true },
    });

    // Cadastro concluído = sessão aberta. Sem isto a tela mandava para
    // /dashboard sem token e PrivateRoutes devolvia a pessoa para /login.
    const sessao = await new IssueSessionService().execute(user.id);

    return {
      userId: user.id,
      clinicId: user.clinicId,
      name: user.name,
      email: user.email,
      message: "Cadastro da clínica concluído com sucesso! Bem-vindo ao Minha Clínica.",
      ...sessao,
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

    const verification = createVerificationData(CLINIC_VERIFICATION_MINUTES);

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
