import bcrypt from "bcryptjs";
import type { Prisma } from "../../../generated/prisma";
import { prisma } from "../../database/prisma";
import { AuditLogRepository } from "../../repository/auditLogRepository";
import { MembershipRepository } from "../../repository/membershipRepository";
import type { AcceptInviteInput, RegisterFromInviteInput } from "../../schemas/inviteSchema";
import { InviteStatus, MembershipStatus, UserRole, UserStatus } from "../../types/enums";
import {
  createVerificationData,
  hashToken,
  INVITE_EXPIRATION_MINUTES,
} from "../../utils/verificationTokenUtils";
import { IssueSessionService } from "../auth/issueSessionService";
import { deriveRoles } from "../auth/sessionContext";
import { createEmailProvider, EmailService } from "../email/emailService";

type Tx = Prisma.TransactionClient;
type InviteRole = Extract<UserRole, "ADMIN" | "RECEPTIONIST" | "PROFESSIONAL">;

const auditLogRepository = new AuditLogRepository();
const membershipRepository = new MembershipRepository();

/**
 * Convites de equipe.
 *
 * Um convite NÃO cria conta. Ele fica em ClinicInvite até alguém aceitar:
 * - quem já tem conta com aquele e-mail (inclusive quem é só paciente) entra
 *   com a própria senha e aceita — a clínica vira mais um vínculo da conta;
 * - quem não tem conta cria a conta na própria página do convite.
 *
 * Antes, o convite criava um User novo com o e-mail convidado; como o e-mail é
 * único na plataforma, convidar um paciente estourava a unicidade e o convite
 * nunca saía.
 */

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
};

const ROLE_LABELS: Record<InviteRole, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.RECEPTIONIST]: "Recepcionista",
  [UserRole.PROFESSIONAL]: "Profissional",
};

const httpError = (statusCode: number, message: string, extra: Record<string, unknown> = {}) =>
  Object.assign(new Error(message), { statusCode, ...extra });

async function sendInviteEmail(
  invite: { email: string; name: string; role: UserRole },
  clinicName: string,
  token: string,
): Promise<string | undefined> {
  const emailService = new EmailService(createEmailProvider());
  try {
    if (invite.role === UserRole.PROFESSIONAL) {
      await emailService.sendProfessionalInviteEmail(invite.email, invite.name, clinicName, token);
    } else {
      await emailService.sendStaffInviteEmail(
        invite.email,
        invite.name,
        clinicName,
        invite.role as Extract<UserRole, "RECEPTIONIST" | "ADMIN">,
        token,
      );
    }
    return undefined;
  } catch (err) {
    // O convite já foi persistido: falha no envio nunca passa em silêncio —
    // o ADMIN é avisado e pode reenviar.
    console.error("[convite] Falha ao enviar e-mail de convite:", err);
    return "Convite criado, mas não foi possível enviar o e-mail. Reenvie o convite ou avise a pessoa manualmente.";
  }
}

/** Busca o convite pelo token e garante que ainda pode ser usado. */
async function findUsableInvite(token: string, tx: Tx = prisma) {
  const invite = await tx.clinicInvite.findUnique({
    where: { tokenHash: hashToken(token ?? "") },
    include: { clinic: { select: { id: true, tradeName: true, isActive: true } } },
  });

  if (!invite || !invite.clinic.isActive) {
    throw httpError(404, "Convite inválido ou inexistente.", { code: "INVITE_NOT_FOUND" });
  }
  if (invite.status === InviteStatus.ACCEPTED) {
    throw httpError(410, "Este convite já foi aceito.", { code: "INVITE_ALREADY_ACCEPTED" });
  }
  if (invite.status !== InviteStatus.PENDING) {
    throw httpError(410, "Este convite foi cancelado.", { code: "INVITE_CANCELLED" });
  }
  if (invite.expiresAt < new Date()) {
    throw httpError(410, "Este convite expirou. Peça à clínica para reenviar.", {
      code: "INVITE_EXPIRED",
    });
  }
  return invite;
}

type ProfessionalData = Pick<
  AcceptInviteInput,
  | "professionalCouncil"
  | "registrationNumber"
  | "registrationState"
  | "defaultAppointmentDuration"
  | "formations"
>;

function assertProfessionalData(role: UserRole, data: ProfessionalData) {
  if (role !== UserRole.PROFESSIONAL) return;
  const errors: { field: string; message: string }[] = [];
  if (!data.professionalCouncil) {
    errors.push({ field: "professionalCouncil", message: "Conselho profissional é obrigatório" });
  }
  if (!data.registrationNumber) {
    errors.push({ field: "registrationNumber", message: "Número de registro é obrigatório" });
  }
  if (!data.registrationState) {
    errors.push({ field: "registrationState", message: "Estado de registro é obrigatório" });
  }
  if (errors.length > 0) {
    throw httpError(400, "Complete os dados profissionais para aceitar o convite.", {
      code: "PROFESSIONAL_DATA_REQUIRED",
      errors,
    });
  }
}

/**
 * Aplica o convite a uma conta dentro da transação: soma o papel ao vínculo,
 * cria/reativa o registro Professional da clínica e marca o convite como aceito.
 */
async function applyInvite(
  tx: Tx,
  invite: { id: string; clinicId: string; role: UserRole; specialtyId: string | null },
  userId: string,
  data: ProfessionalData,
) {
  const now = new Date();

  await membershipRepository.grantRole(
    { userId, clinicId: invite.clinicId, role: invite.role, termsAcceptedAt: now },
    tx,
  );

  if (invite.role === UserRole.PROFESSIONAL) {
    const professionalData = {
      professionalCouncil: data.professionalCouncil as string,
      registrationNumber: data.registrationNumber as string,
      registrationState: data.registrationState as string,
      defaultAppointmentDuration: data.defaultAppointmentDuration || 30,
      formations: data.formations ?? null,
    };

    // Quem já foi profissional desta clínica (desligado antes) é reativado no
    // mesmo registro, preservando o histórico de consultas.
    const professional = await tx.professional.upsert({
      where: { userId_clinicId: { userId, clinicId: invite.clinicId } },
      update: { ...professionalData, isActive: true, deletedAt: null },
      create: { ...professionalData, userId, clinicId: invite.clinicId },
    });

    if (invite.specialtyId) {
      await tx.professionalSpecialty.updateMany({
        where: { professionalId: professional.id },
        data: { isPrimary: false },
      });
      await tx.professionalSpecialty.upsert({
        where: {
          professionalId_specialtyId: {
            professionalId: professional.id,
            specialtyId: invite.specialtyId,
          },
        },
        update: { isPrimary: true },
        create: {
          professionalId: professional.id,
          specialtyId: invite.specialtyId,
          isPrimary: true,
        },
      });
    }
  }

  await tx.clinicInvite.update({
    where: { id: invite.id },
    data: { status: InviteStatus.ACCEPTED, acceptedByUserId: userId, acceptedAt: now },
  });

  await tx.user.update({ where: { id: userId }, data: { activeClinicId: invite.clinicId } });
}

// Unicidade violada (ex.: conselho + registro já usado por outro profissional
// da clínica). Checagem por `code`, como no resto do projeto.
const isRegistrationConflict = (error: unknown) =>
  typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export class CreateInviteService {
  async execute(input: {
    adminId: string;
    clinicId: string;
    name: string;
    email: string;
    role: InviteRole;
    specialty?: string;
  }) {
    const email = normalizeEmail(input.email);

    const [admin, clinic] = await Promise.all([
      prisma.user.findUnique({ where: { id: input.adminId }, select: { name: true } }),
      prisma.clinic.findUnique({ where: { id: input.clinicId }, select: { tradeName: true } }),
    ]);
    if (!clinic) throw httpError(404, "Clínica não encontrada");

    // Já faz parte da equipe com esse papel? (informação interna da clínica —
    // não revela nada sobre a conta fora dela)
    const existingUser = await prisma.user.findFirst({
      where: { email },
      select: {
        memberships: {
          where: { clinicId: input.clinicId, status: MembershipStatus.ACTIVE, deletedAt: null },
          select: { roles: true },
        },
        professionals: {
          where: { clinicId: input.clinicId, isActive: true, deletedAt: null },
          select: { id: true },
        },
      },
    });
    if (existingUser) {
      const rolesHere = deriveRoles({
        membershipRoles: existingUser.memberships[0]?.roles,
        hasActiveProfessional: existingUser.professionals.length > 0,
        patient: null,
      });
      if (rolesHere.includes(input.role)) {
        throw httpError(409, "Esta pessoa já faz parte da equipe com este papel.", {
          code: "ALREADY_MEMBER",
        });
      }
    }

    const pending = await prisma.clinicInvite.findFirst({
      where: { clinicId: input.clinicId, email, role: input.role, status: InviteStatus.PENDING },
    });
    if (pending && pending.expiresAt > new Date()) {
      throw httpError(409, "Já existe um convite pendente para este e-mail. Você pode reenviá-lo.", {
        code: "INVITE_ALREADY_PENDING",
        action: "RESEND_INVITE",
      });
    }

    // Checagem só por e-mail deixa passar convite duplicado para a mesma
    // pessoa com e-mail diferente — aviso não-bloqueante.
    const possibleDuplicate = await prisma.clinicInvite.findFirst({
      where: {
        clinicId: input.clinicId,
        status: InviteStatus.PENDING,
        email: { not: email },
        name: { equals: input.name, mode: "insensitive" },
      },
      select: { email: true },
    });

    const verification = createVerificationData(INVITE_EXPIRATION_MINUTES);

    const invite = await prisma.$transaction(async (tx) => {
      let specialtyId: string | null = null;
      if (input.role === UserRole.PROFESSIONAL && input.specialty) {
        const specialty = await tx.specialty.upsert({
          where: { clinicId_name: { clinicId: input.clinicId, name: input.specialty } },
          update: {},
          create: { clinicId: input.clinicId, name: input.specialty },
        });
        specialtyId = specialty.id;
      }

      const data = {
        name: input.name,
        specialtyId,
        tokenHash: verification.hashedToken,
        expiresAt: verification.expiresAt,
        invitedById: input.adminId,
      };

      // Convite vencido para o mesmo e-mail/papel é renovado no mesmo registro.
      return pending
        ? tx.clinicInvite.update({ where: { id: pending.id }, data })
        : tx.clinicInvite.create({
            data: { ...data, clinicId: input.clinicId, email, role: input.role },
          });
    });

    await auditLogRepository.create({
      clinicId: input.clinicId,
      userId: input.adminId,
      userName: admin?.name ?? "Administrador",
      action: "INVITE_STAFF",
      entity: "ClinicInvite",
      entityId: invite.id,
      newData: { email, role: input.role },
    });

    const emailWarning = await sendInviteEmail(invite, clinic.tradeName, verification.token);

    // Resposta neutra: não diz se o e-mail já tem conta (evita revelar à
    // clínica que a pessoa usa a plataforma, por exemplo como paciente).
    return {
      message: "Convite enviado com sucesso",
      email,
      inviteId: invite.id,
      emailWarning,
      duplicateNameWarning: possibleDuplicate
        ? `Já existe um convite pendente para "${input.name}" (${possibleDuplicate.email}). Confira se não é a mesma pessoa antes de prosseguir.`
        : undefined,
    };
  }
}

export class ResendInviteService {
  async execute(adminId: string, clinicId: string, inviteId: string) {
    const invite = await prisma.clinicInvite.findFirst({
      where: { id: inviteId, clinicId, status: InviteStatus.PENDING },
      include: { clinic: { select: { tradeName: true } } },
    });
    if (!invite) throw httpError(404, "Convite não encontrado");

    const verification = createVerificationData(INVITE_EXPIRATION_MINUTES);
    await prisma.clinicInvite.update({
      where: { id: invite.id },
      data: { tokenHash: verification.hashedToken, expiresAt: verification.expiresAt },
    });

    const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true } });
    await auditLogRepository.create({
      clinicId,
      userId: adminId,
      userName: admin?.name ?? "Administrador",
      action: "RESEND_INVITE",
      entity: "ClinicInvite",
      entityId: invite.id,
    });

    const emailWarning = await sendInviteEmail(
      invite,
      invite.clinic.tradeName,
      verification.token,
    );
    return { message: "Convite reenviado", emailWarning };
  }
}

export class CancelInviteService {
  async execute(adminId: string, clinicId: string, inviteId: string) {
    const invite = await prisma.clinicInvite.findFirst({
      where: { id: inviteId, clinicId, status: InviteStatus.PENDING },
    });
    if (!invite) throw httpError(404, "Convite não encontrado");

    // Só o convite é cancelado — nenhuma conta é apagada.
    await prisma.clinicInvite.update({
      where: { id: invite.id },
      data: { status: InviteStatus.CANCELLED },
    });

    const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true } });
    await auditLogRepository.create({
      clinicId,
      userId: adminId,
      userName: admin?.name ?? "Administrador",
      action: "CANCEL_INVITE",
      entity: "ClinicInvite",
      entityId: invite.id,
    });

    return { message: "Convite cancelado com sucesso" };
  }
}

// ─── CONVIDADO ───────────────────────────────────────────────────────────────

/** GET /api/invites/:token — dados para a página do convite (público). */
export class GetInviteByTokenService {
  async execute(token: string) {
    const invite = await findUsableInvite(token);

    const [specialty, account] = await Promise.all([
      invite.specialtyId
        ? prisma.specialty.findUnique({ where: { id: invite.specialtyId }, select: { name: true } })
        : null,
      prisma.user.findFirst({ where: { email: invite.email }, select: { status: true } }),
    ]);

    return {
      clinicName: invite.clinic.tradeName,
      role: invite.role,
      roleLabel: ROLE_LABELS[invite.role as InviteRole] ?? invite.role,
      specialtyName: specialty?.name ?? null,
      invitedName: invite.name,
      emailMasked: maskEmail(invite.email),
      expiresAt: invite.expiresAt,
      // Quem tem o token é o dono da caixa de e-mail: saber se já existe conta
      // decide entre "entrar para aceitar" e "criar conta".
      accountStatus: !account ? "NONE" : account.status === UserStatus.ACTIVE ? "ACTIVE" : "INACTIVE",
    };
  }
}

/**
 * GET /api/invites/:token/prefill (autenticado) — confere se a sessão é da
 * conta convidada e devolve o que já se sabe dela: dados profissionais de
 * outra clínica (para não digitar tudo de novo) e o que ainda falta.
 */
export class GetInvitePrefillService {
  async execute(userId: string, token: string) {
    const invite = await findUsableInvite(token);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        cpf: true,
        phone: true,
        professionals: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            professionalCouncil: true,
            registrationNumber: true,
            registrationState: true,
            defaultAppointmentDuration: true,
            formations: true,
          },
        },
      },
    });
    if (!user) throw httpError(404, "Usuário não encontrado");

    const emailMatches = normalizeEmail(user.email) === invite.email;
    const professional = user.professionals[0];

    return {
      emailMatches,
      invitedEmailMasked: maskEmail(invite.email),
      missingFields: emailMatches
        ? [...(user.cpf ? [] : ["cpf"]), ...(user.phone ? [] : ["phone"])]
        : [],
      professional:
        emailMatches && invite.role === UserRole.PROFESSIONAL && professional?.professionalCouncil
          ? professional
          : null,
    };
  }
}

export class AcceptInviteService {
  async execute(userId: string, token: string, data: AcceptInviteInput) {
    const invite = await findUsableInvite(token);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, cpf: true, phone: true },
    });
    if (!user) throw httpError(404, "Usuário não encontrado");

    if (normalizeEmail(user.email) !== invite.email) {
      throw httpError(
        403,
        `Este convite foi enviado para ${maskEmail(invite.email)}. Entre com essa conta para aceitar.`,
        { code: "INVITE_EMAIL_MISMATCH" },
      );
    }

    assertProfessionalData(invite.role, data);

    // Só completa o que falta na conta — nunca sobrescreve CPF/telefone já
    // cadastrados (a conta pode ser de paciente, com dados já conferidos).
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

    try {
      await prisma.$transaction(async (tx) => {
        await applyInvite(tx, invite, userId, data);
        if ((!user.cpf && data.cpf) || (!user.phone && data.phone)) {
          await tx.user.update({
            where: { id: userId },
            data: {
              ...(!user.cpf && data.cpf ? { cpf: data.cpf } : {}),
              ...(!user.phone && data.phone ? { phone: data.phone } : {}),
            },
          });
        }
      });
    } catch (error) {
      if (isRegistrationConflict(error)) {
        throw httpError(409, "Já existe um profissional com este registro nesta clínica.", {
          code: "PROFESSIONAL_REGISTRATION_CONFLICT",
        });
      }
      throw error;
    }

    await auditLogRepository.create({
      clinicId: invite.clinicId,
      userId,
      userName: user.name,
      action: "ACCEPT_INVITE",
      entity: "ClinicInvite",
      entityId: invite.id,
      newData: { role: invite.role },
    });

    const session = await new IssueSessionService().execute(userId, {
      clinicId: invite.clinicId,
    });

    return {
      message: `Convite aceito! Você agora faz parte da equipe da ${invite.clinic.tradeName}.`,
      ...session,
    };
  }
}

export class RegisterFromInviteService {
  async execute(token: string, data: RegisterFromInviteInput) {
    const invite = await findUsableInvite(token);

    const existing = await prisma.user.findFirst({
      where: { email: invite.email },
      select: { id: true },
    });
    if (existing) {
      throw httpError(
        409,
        "Este e-mail já tem conta no Minha Clínica. Entre com ela para aceitar o convite.",
        { code: "ACCOUNT_EXISTS", action: "LOGIN" },
      );
    }

    const cpfOwner = await prisma.user.findFirst({ where: { cpf: data.cpf }, select: { id: true } });
    if (cpfOwner) {
      throw httpError(
        409,
        "Este CPF já possui cadastro na plataforma. Entre com a sua conta para aceitar o convite.",
        { code: "CPF_ALREADY_REGISTERED", action: "LOGIN_OR_RECOVER" },
      );
    }

    assertProfessionalData(invite.role, data);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = new Date();

    let userId: string;
    try {
      userId = await prisma.$transaction(async (tx) => {
        // A posse do token prova o e-mail: a conta já nasce ativa.
        const user = await tx.user.create({
          data: {
            name: data.name || invite.name,
            email: invite.email,
            cpf: data.cpf,
            phone: data.phone,
            password: hashedPassword,
            role: invite.role,
            status: UserStatus.ACTIVE,
            mustChangePassword: false,
            termsAcceptedAt: now,
            privacyAcceptedAt: now,
          },
        });
        await applyInvite(tx, invite, user.id, data);
        return user.id;
      });
    } catch (error) {
      if (isRegistrationConflict(error)) {
        throw httpError(409, "Não foi possível criar a conta: dados já cadastrados.", {
          code: "REGISTRATION_CONFLICT",
        });
      }
      throw error;
    }

    await auditLogRepository.create({
      clinicId: invite.clinicId,
      userId,
      userName: data.name || invite.name,
      action: "ACCEPT_INVITE",
      entity: "ClinicInvite",
      entityId: invite.id,
      newData: { role: invite.role, accountCreated: true },
    });

    const session = await new IssueSessionService().execute(userId, {
      clinicId: invite.clinicId,
    });

    return { message: "Cadastro concluído com sucesso!", ...session };
  }
}

export class DeclineInviteService {
  async execute(token: string) {
    const invite = await findUsableInvite(token);
    await prisma.clinicInvite.update({
      where: { id: invite.id },
      data: { status: InviteStatus.DECLINED },
    });
    return { message: "Convite recusado." };
  }
}
