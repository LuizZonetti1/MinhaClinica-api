import bcrypt from "bcryptjs";
import type { Prisma } from "../../../generated/prisma";
import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import { UserRepository } from "../../repository/userRepository";
import { MembershipStatus, UserRole, UserStatus } from "../../types/enums";
import type { CompleteClinicOwnerInput, RegisterClinicInput } from "../../types/user";
import {
  createVerificationData,
  hashToken,
  isTokenExpired,
} from "../../utils/verificationTokenUtils";
import { IssueSessionService } from "../auth/issueSessionService";
import { createEmailProvider, EmailService } from "../email/emailService";
import { maskEmail } from "../invites/inviteService";

type Tx = Prisma.TransactionClient;

/** Minutos de validade do link de verificação do dono NOVO — o e-mail promete 25. */
const CLINIC_VERIFICATION_MINUTES = 25;

/**
 * Horas de validade do link para quem cadastra a clínica com uma conta que já
 * existe. Mais folgado que o de conta nova: a confirmação exige entrar com a
 * senha, e a conta segue funcionando normalmente enquanto isso.
 */
const CLINIC_EXISTING_ACCOUNT_HOURS = 24;

/** Mesma resposta em todos os casos: não revela se o e-mail já tem conta. */
const START_RESPONSE_MESSAGE =
  "Cadastro iniciado! Enviamos um link para o e-mail do responsável. " +
  "Confirme o e-mail para concluir o cadastro da clínica.";

const auditLogRepository = new AuditLogRepository();

const httpError = (statusCode: number, message: string, extra: Record<string, unknown> = {}) =>
  Object.assign(new Error(message), { statusCode, ...extra });

type ClinicFields = Omit<RegisterClinicInput, "ownerEmail" | "ownerName" | "clinicEmail">;

/** Dados da clínica como gravados em Clinic. */
const toClinicData = (fields: ClinicFields, clinicEmail: string) => ({
  legalName: fields.legalName,
  tradeName: fields.tradeName,
  cnpj: fields.cnpj,
  email: clinicEmail,
  phone: fields.phone,
  zipCode: fields.zipCode,
  street: fields.street,
  number: fields.number,
  complement: fields.complement,
  neighborhood: fields.neighborhood,
  city: fields.city,
  state: fields.state,
  website: fields.website,
});

/**
 * CNPJ e e-mail da clínica são @unique. `exceptClinicId` permite regravar a
 * própria clínica em cadastro com os dados corrigidos.
 */
async function assertClinicIdentifiersFree(
  cnpj: string,
  clinicEmail: string,
  exceptClinicId?: string,
) {
  const notSelf = exceptClinicId ? { id: { not: exceptClinicId } } : {};
  const [cnpjOwner, emailOwner] = await Promise.all([
    prisma.clinic.findFirst({ where: { cnpj, ...notSelf }, select: { id: true } }),
    prisma.clinic.findFirst({ where: { email: clinicEmail, ...notSelf }, select: { id: true } }),
  ]);
  if (cnpjOwner) throw httpError(409, "CNPJ já cadastrado");
  if (emailOwner) throw httpError(409, "E-mail da clínica já cadastrado");
}

/**
 * Clínica ainda em cadastro de uma conta: vínculo PENDING de ADMIN numa clínica
 * inativa. É a ÚNICA clínica que o formulário público pode regravar — antes,
 * bastava o e-mail de qualquer convidado pendente para sobrescrever os dados
 * de uma clínica ativa.
 */
const findPendingOwnedClinic = (userId: string, tx: Tx = prisma) =>
  tx.clinicMembership.findFirst({
    where: {
      userId,
      status: MembershipStatus.PENDING,
      roles: { has: UserRole.ADMIN },
      clinic: { isActive: false },
    },
    orderBy: { createdAt: "desc" },
    include: { clinic: true },
  });

// ============================================================
// ETAPA 1 — Cadastrar clínica e iniciar verificação de e-mail
// ============================================================

export class RegisterClinicService {
  private userRepository = new UserRepository();
  private emailService = new EmailService(createEmailProvider());

  async execute(data: RegisterClinicInput) {
    const { ownerName, clinicEmail, ...clinicFields } = data;
    const ownerEmail = data.ownerEmail.toLowerCase().trim();

    const existingUser = await this.userRepository.findByEmail(ownerEmail);

    if (!existingUser) {
      return this.startWithNewAccount(ownerName, ownerEmail, clinicEmail, clinicFields);
    }

    if (existingUser.status === UserStatus.ACTIVE) {
      return this.startWithExistingAccount(existingUser, clinicEmail, clinicFields);
    }

    const pendingOwned =
      existingUser.status === UserStatus.PENDING_ACTIVATION ||
      existingUser.status === UserStatus.EMAIL_VERIFIED
        ? await findPendingOwnedClinic(existingUser.id)
        : null;

    if (pendingOwned) {
      return this.restartPendingOwner(existingUser, pendingOwned.clinicId, ownerName, clinicEmail, clinicFields);
    }

    // Conta existe mas não está ativa (bloqueada, desativada ou com o cadastro
    // de paciente pela metade). Nada é criado; só o dono do e-mail fica sabendo
    // o que fazer — a resposta é a mesma de sempre.
    this.emailService
      .sendClinicRegistrationAccountInactiveEmail(ownerEmail, existingUser.name, clinicFields.tradeName)
      .catch((err) => console.error("[cadastro-clinica] Falha ao enviar aviso de conta inativa:", err));

    return { message: START_RESPONSE_MESSAGE, email: ownerEmail };
  }

  /** (a) E-mail sem conta: conta nova do dono + clínica inativa, ambos pendentes. */
  private async startWithNewAccount(
    ownerName: string,
    ownerEmail: string,
    clinicEmail: string,
    clinicFields: ClinicFields,
  ) {
    await assertClinicIdentifiersFree(clinicFields.cnpj, clinicEmail);

    const verification = createVerificationData(CLINIC_VERIFICATION_MINUTES);

    const clinic = await prisma.$transaction(async (tx) => {
      const created = await tx.clinic.create({
        data: {
          ...toClinicData(clinicFields, clinicEmail),
          subdomain: clinicFields.subdomain ?? undefined,
          timezone: clinicFields.timezone ?? "America/Sao_Paulo",
          isActive: false, // ativada apenas ao completar o cadastro
        },
      });

      const owner = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          password: "pending",
          role: UserRole.ADMIN,
          status: UserStatus.PENDING_ACTIVATION,
          mustChangePassword: false,
          verificationToken: verification.hashedToken,
          verificationExpires: verification.expiresAt,
        },
      });

      await tx.clinicMembership.create({
        data: {
          userId: owner.id,
          clinicId: created.id,
          roles: [UserRole.ADMIN],
          status: MembershipStatus.PENDING,
        },
      });

      return created;
    });

    await this.emailService.sendClinicOwnerVerificationEmail(
      ownerEmail,
      ownerName,
      clinic.tradeName,
      verification.token,
    );

    return { message: START_RESPONSE_MESSAGE, email: ownerEmail };
  }

  /**
   * (b) Dono NOVO que reenviou o formulário antes de concluir: regrava a
   * clínica em cadastro com o que acabou de preencher e manda um link novo.
   */
  private async restartPendingOwner(
    user: { id: string },
    clinicId: string,
    ownerName: string,
    clinicEmail: string,
    clinicFields: ClinicFields,
  ) {
    await assertClinicIdentifiersFree(clinicFields.cnpj, clinicEmail, clinicId);

    const verification = createVerificationData(CLINIC_VERIFICATION_MINUTES);

    await prisma.$transaction([
      prisma.clinic.update({
        where: { id: clinicId },
        data: toClinicData(clinicFields, clinicEmail),
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          name: ownerName,
          // Volta para PENDING_ACTIVATION: é o status que VerifyEmailService
          // exige para aceitar o link novo.
          status: UserStatus.PENDING_ACTIVATION,
          verificationToken: verification.hashedToken,
          verificationExpires: verification.expiresAt,
        },
      }),
    ]);

    const email = (await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } }))
      ?.email as string;

    await this.emailService.sendClinicOwnerVerificationEmail(
      email,
      ownerName,
      clinicFields.tradeName,
      verification.token,
    );

    return { message: START_RESPONSE_MESSAGE, email };
  }

  /**
   * (c) E-mail de uma conta ATIVA (ex.: um paciente abrindo a própria clínica).
   * Não cria conta nem mexe no status, senha ou nome dela: cria a clínica
   * inativa com um vínculo ADMIN pendente e manda o link de confirmação. Quem
   * confirma precisa entrar com a senha da conta.
   */
  private async startWithExistingAccount(
    user: { id: string; name: string; email: string },
    clinicEmail: string,
    clinicFields: ClinicFields,
  ) {
    const reusable = await prisma.clinicMembership.findFirst({
      where: {
        userId: user.id,
        status: MembershipStatus.PENDING,
        roles: { has: UserRole.ADMIN },
        clinic: { isActive: false, verificationToken: { not: null } },
      },
      orderBy: { createdAt: "desc" },
    });

    await assertClinicIdentifiersFree(clinicFields.cnpj, clinicEmail, reusable?.clinicId);

    const verification = createVerificationData(CLINIC_EXISTING_ACCOUNT_HOURS * 60);

    const clinic = await prisma.$transaction(async (tx) => {
      const clinicData = {
        ...toClinicData(clinicFields, clinicEmail),
        verificationToken: verification.hashedToken,
        verificationExpires: verification.expiresAt,
      };

      // Reenvio do formulário antes de confirmar: regrava a MESMA clínica em
      // cadastro em vez de criar outra.
      if (reusable) {
        return tx.clinic.update({ where: { id: reusable.clinicId }, data: clinicData });
      }

      const created = await tx.clinic.create({
        data: {
          ...clinicData,
          subdomain: clinicFields.subdomain ?? undefined,
          timezone: clinicFields.timezone ?? "America/Sao_Paulo",
          isActive: false,
        },
      });

      await tx.clinicMembership.create({
        data: {
          userId: user.id,
          clinicId: created.id,
          roles: [UserRole.ADMIN],
          status: MembershipStatus.PENDING,
        },
      });

      return created;
    });

    await this.emailService.sendClinicExistingAccountEmail(
      user.email,
      user.name,
      clinic.tradeName,
      verification.token,
      CLINIC_EXISTING_ACCOUNT_HOURS,
    );

    return { message: START_RESPONSE_MESSAGE, email: user.email };
  }
}

// ============================================================
// ETAPA 3 — Completar dados do dono (conta NOVA)
// ============================================================
export class CompleteClinicOwnerService {
  private userRepository = new UserRepository();

  async execute(userId: string, data: CompleteClinicOwnerInput) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if (user.status !== UserStatus.EMAIL_VERIFIED) {
      throw new Error("E-mail não verificado ou cadastro já concluído");
    }

    const pending = await findPendingOwnedClinic(userId);
    if (!pending) {
      throw new Error("Clínica não encontrada para este usuário");
    }
    const clinicId = pending.clinicId;

    // CPF é único na plataforma (uma pessoa, uma conta)
    const cleanCpf = data.cpf.replace(/\D/g, "");
    const existingCpf = await this.userRepository.findByCpfGlobal(cleanCpf);
    if (existingCpf && existingCpf.id !== userId) {
      throw Object.assign(new Error("Este CPF já possui cadastro na plataforma."), {
        statusCode: 409,
        code: "CPF_ALREADY_REGISTERED",
        action: "LOGIN_OR_RECOVER",
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const cleanPhone = data.phone.replace(/\D/g, "");
    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          cpf: cleanCpf,
          phone: cleanPhone,
          password: hashedPassword,
          status: UserStatus.ACTIVE,
          mustChangePassword: false,
          verificationToken: null,
          verificationExpires: null,
          termsAcceptedAt: now,
          privacyAcceptedAt: now,
          activeClinicId: clinicId,
        },
      }),
      prisma.clinicMembership.update({
        where: { id: pending.id },
        data: { status: MembershipStatus.ACTIVE, termsAcceptedAt: now },
      }),
      prisma.clinic.update({
        where: { id: clinicId },
        data: { isActive: true },
      }),
    ]);

    // Cadastro concluído = sessão aberta. Sem isto a tela mandava para
    // /dashboard sem token e PrivateRoutes devolvia a pessoa para /login.
    const sessao = await new IssueSessionService().execute(user.id, { clinicId });

    return {
      userId: user.id,
      clinicId,
      name: user.name,
      email: user.email,
      message: "Cadastro da clínica concluído com sucesso! Bem-vindo ao Minha Clínica.",
      ...sessao,
    };
  }
}

// ============================================================
// CONTA EXISTENTE — conferir e confirmar a clínica
// ============================================================

/** Clínica em cadastro por conta existente, pelo token do e-mail. */
async function findClinicByExistingAccountToken(token: string) {
  const clinic = await prisma.clinic.findFirst({
    where: { verificationToken: hashToken(token ?? ""), isActive: false },
    include: {
      memberships: {
        where: { status: MembershipStatus.PENDING, roles: { has: UserRole.ADMIN } },
        include: { user: { select: { id: true, email: true } } },
        take: 1,
      },
    },
  });

  const membership = clinic?.memberships[0];
  if (!clinic || !membership) {
    throw httpError(404, "Link inválido ou cadastro já confirmado.", {
      code: "CLINIC_REGISTRATION_NOT_FOUND",
    });
  }
  if (!clinic.verificationExpires || isTokenExpired(clinic.verificationExpires)) {
    throw httpError(410, "Este link expirou. Envie o cadastro da clínica novamente.", {
      code: "CLINIC_REGISTRATION_EXPIRED",
    });
  }
  return { clinic, membership };
}

/** GET /api/clinics/register/existing/:token — resumo para a tela de confirmação. */
export class GetExistingAccountClinicRegistrationService {
  async execute(token: string) {
    const { clinic, membership } = await findClinicByExistingAccountToken(token);
    return {
      tradeName: clinic.tradeName,
      legalName: clinic.legalName,
      cnpjMasked: `${clinic.cnpj.slice(0, 2)}.***.***/${clinic.cnpj.slice(8, 12)}-**`,
      city: clinic.city,
      state: clinic.state,
      ownerEmailMasked: maskEmail(membership.user.email),
    };
  }
}

/**
 * POST /api/clinics/register/existing/confirm — a conta logada confirma a
 * clínica que cadastrou com o próprio e-mail. Só completa o que falta na conta
 * (CPF/telefone) e registra o aceite dos termos como responsável pela clínica.
 */
export class ConfirmExistingAccountClinicService {
  async execute(
    userId: string,
    data: { token: string; termsAccepted: boolean; cpf?: string; phone?: string },
  ) {
    const { clinic, membership } = await findClinicByExistingAccountToken(data.token);

    if (membership.userId !== userId) {
      throw httpError(
        403,
        `Este cadastro foi feito com o e-mail ${maskEmail(membership.user.email)}. Entre com essa conta para confirmar.`,
        { code: "CLINIC_REGISTRATION_ACCOUNT_MISMATCH" },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, cpf: true, phone: true },
    });
    if (!user) throw httpError(404, "Usuário não encontrado");

    const errors: { field: string; message: string }[] = [];
    if (!user.cpf && !data.cpf) errors.push({ field: "cpf", message: "CPF é obrigatório" });
    if (!user.phone && !data.phone) {
      errors.push({ field: "phone", message: "Telefone é obrigatório" });
    }
    if (errors.length > 0) {
      throw httpError(400, "Complete os dados que faltam na sua conta.", {
        code: "ACCOUNT_DATA_REQUIRED",
        errors,
      });
    }
    if (!user.cpf && data.cpf) {
      const cpfOwner = await prisma.user.findFirst({
        where: { cpf: data.cpf, id: { not: userId } },
        select: { id: true },
      });
      if (cpfOwner) {
        throw httpError(409, "Este CPF já possui cadastro na plataforma.", {
          code: "CPF_ALREADY_REGISTERED",
        });
      }
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.clinic.update({
        where: { id: clinic.id },
        data: { isActive: true, verificationToken: null, verificationExpires: null },
      }),
      prisma.clinicMembership.update({
        where: { id: membership.id },
        data: { status: MembershipStatus.ACTIVE, termsAcceptedAt: now },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          activeClinicId: clinic.id,
          ...(!user.cpf && data.cpf ? { cpf: data.cpf } : {}),
          ...(!user.phone && data.phone ? { phone: data.phone } : {}),
        },
      }),
    ]);

    await auditLogRepository.create({
      clinicId: clinic.id,
      userId,
      userName: user.name,
      action: "CREATE_CLINIC_EXISTING_ACCOUNT",
      entity: "Clinic",
      entityId: clinic.id,
      newData: { tradeName: clinic.tradeName },
    });

    const session = await new IssueSessionService().execute(userId, { clinicId: clinic.id });

    return {
      clinicId: clinic.id,
      message: "Cadastro da clínica concluído com sucesso! Bem-vindo ao Minha Clínica.",
      ...session,
    };
  }
}

// ============================================================
// REENVIO de verificação para dono da clínica
// ============================================================
export class ResendClinicVerificationService {
  private emailService = new EmailService(createEmailProvider());

  async execute(data: { email: string }) {
    const genericResponse = {
      message:
        "Se este e-mail tiver um cadastro de clínica pendente, um novo link foi enviado.",
    };

    const user = await prisma.user.findFirst({
      where: { email: data.email?.toLowerCase().trim() },
      select: { id: true, name: true, email: true, status: true },
    });
    if (!user) return genericResponse;

    const pending = await findPendingOwnedClinic(user.id);
    if (!pending) return genericResponse;

    // Conta nova ainda não ativada → link de verificação do dono.
    if (user.status === UserStatus.PENDING_ACTIVATION) {
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
        pending.clinic.tradeName,
        verification.token,
      );
      return genericResponse;
    }

    // Conta existente com clínica aguardando confirmação → link de confirmação.
    if (user.status === UserStatus.ACTIVE && pending.clinic.verificationToken) {
      const verification = createVerificationData(CLINIC_EXISTING_ACCOUNT_HOURS * 60);
      await prisma.clinic.update({
        where: { id: pending.clinicId },
        data: {
          verificationToken: verification.hashedToken,
          verificationExpires: verification.expiresAt,
        },
      });
      await this.emailService.sendClinicExistingAccountEmail(
        user.email,
        user.name,
        pending.clinic.tradeName,
        verification.token,
        CLINIC_EXISTING_ACCOUNT_HOURS,
      );
    }

    return genericResponse;
  }
}
