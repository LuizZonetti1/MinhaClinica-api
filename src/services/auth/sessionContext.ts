import { prisma } from "../../database/prisma";
import { MembershipStatus, UserRole } from "../../types/enums";
import { generateAuthToken } from "../../utils/jwtUtils";
import { isStaffRole, sortRoles } from "../../utils/roles";

export { ROLE_PRIORITY, STAFF_ROLES, isStaffRole, sortRoles } from "../../utils/roles";

/**
 * Contexto de sessão de uma conta unificada.
 *
 * Uma conta (um e-mail) pode ser paciente — papel global, vive em Patient — e
 * equipe em várias clínicas — um ClinicMembership por clínica. A sessão sempre
 * roda no contexto de UMA clínica ativa (ou de nenhuma, para quem é só
 * paciente): é o `clinicId` do JWT, e todo filtro multi-tenant existente usa
 * `req.clinicId`. Os papéis valem só dentro dessa clínica, somados a PATIENT.
 *
 * Tudo que decide "quais papéis esta conta tem agora" passa por aqui — login,
 * 2FA, emissão de sessão e o authMiddleware — para os quatro nunca divergirem.
 */

// ─── Regras puras (sem banco) ────────────────────────────────────────────────

export type PatientState = { isActive: boolean; blockedAt: Date | null } | null | undefined;

/** Paciente usável: registro ativo e não bloqueado por faltas. */
export const isPatientUsable = (patient: PatientState): boolean =>
  Boolean(patient?.isActive && !patient.blockedAt);

/**
 * Papéis efetivos numa clínica. PROFESSIONAL só vale com o registro
 * Professional ativo NAQUELA clínica — é o mesmo critério que o login já usava
 * (Professional.isActive), agora por clínica.
 */
export const deriveRoles = (input: {
  membershipRoles?: readonly UserRole[] | null;
  hasActiveProfessional: boolean;
  patient: PatientState;
}): UserRole[] => {
  const roles: UserRole[] = [];
  for (const role of input.membershipRoles ?? []) {
    if (!isStaffRole(role)) continue;
    if (role === UserRole.PROFESSIONAL && !input.hasActiveProfessional) continue;
    roles.push(role);
  }
  if (isPatientUsable(input.patient)) roles.push(UserRole.PATIENT);
  return sortRoles(roles);
};

/**
 * Clínica que a sessão abre: a preferida, se a conta ainda tem vínculo ativo
 * lá; senão a primeira clínica ativa; senão nenhuma (conta só de paciente).
 * `clinicIds` deve vir só com vínculos usáveis, na ordem de preferência.
 */
export const pickActiveClinicId = (
  clinicIds: readonly string[],
  preferredClinicId?: string | null,
): string | null => {
  if (preferredClinicId && clinicIds.includes(preferredClinicId)) return preferredClinicId;
  return clinicIds[0] ?? null;
};

// ─── Carga do banco ──────────────────────────────────────────────────────────

/** Include do Prisma com tudo que o contexto de sessão precisa. */
export const SESSION_USER_INCLUDE = {
  patient: { select: { isActive: true, blockedAt: true } },
  memberships: {
    where: { status: MembershipStatus.ACTIVE, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      clinicId: true,
      roles: true,
      clinic: {
        select: {
          tradeName: true,
          settings: {
            select: {
              twoFactorEnabled: true,
              sessionTimeoutMinutes: true,
              accessLogEnabled: true,
            },
          },
        },
      },
    },
  },
  professionals: {
    where: { isActive: true, deletedAt: null },
    select: { clinicId: true },
  },
} as const;

type SessionMembership = {
  clinicId: string;
  roles: UserRole[];
  clinic: {
    tradeName: string;
    settings: {
      twoFactorEnabled: boolean;
      sessionTimeoutMinutes: number;
      accessLogEnabled: boolean;
    } | null;
  };
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  activeClinicId: string | null;
  twoFactorEnabled: boolean;
  termsAcceptedAt: Date | null;
  privacyAcceptedAt: Date | null;
  patient: PatientState;
  memberships: SessionMembership[];
  professionals: { clinicId: string }[];
};

export interface SessionClinic {
  id: string;
  name: string;
  roles: UserRole[];
}

export interface SessionContext {
  clinicId: string | null;
  clinicName: string | null;
  roles: UserRole[];
  /** Papel de maior prioridade entre os efetivos. */
  role: UserRole;
  /** Clínicas em que a conta é equipe, com os papéis efetivos em cada uma. */
  clinics: SessionClinic[];
  sessionTimeoutMinutes: number | null;
  accessLogEnabled: boolean;
  twoFactorRequired: boolean;
}

/**
 * Monta o contexto da sessão. `preferredClinicId`: `undefined` usa a clínica
 * preferida da conta; um id abre essa clínica se houver vínculo ativo; `null`
 * abre sem clínica (área de paciente).
 */
export const buildSessionContext = (
  user: SessionUser,
  preferredClinicId?: string | null,
): SessionContext => {
  const professionalClinics = new Set(user.professionals.map((p) => p.clinicId));

  const clinics: SessionClinic[] = user.memberships
    .map((m) => ({
      id: m.clinicId,
      name: m.clinic.tradeName,
      roles: deriveRoles({
        membershipRoles: m.roles,
        hasActiveProfessional: professionalClinics.has(m.clinicId),
        patient: null,
      }),
    }))
    // Vínculo sem nenhum papel usável (ex.: só PROFESSIONAL com o registro
    // desativado) não abre a clínica.
    .filter((c) => c.roles.length > 0);

  // `undefined` = sem preferência explícita (usa a da conta); `null` = sessão
  // sem clínica ativa, só como paciente.
  const clinicId =
    preferredClinicId === null
      ? null
      : pickActiveClinicId(
          clinics.map((c) => c.id),
          preferredClinicId ?? user.activeClinicId,
        );
  const active = clinicId ? user.memberships.find((m) => m.clinicId === clinicId) : undefined;
  const activeClinic = clinicId ? clinics.find((c) => c.id === clinicId) : undefined;

  const roles = sortRoles([
    ...(activeClinic?.roles ?? []),
    ...(isPatientUsable(user.patient) ? [UserRole.PATIENT] : []),
  ]);

  return {
    clinicId,
    clinicName: active?.clinic.tradeName ?? null,
    roles,
    role: roles[0] ?? user.role,
    clinics,
    sessionTimeoutMinutes: active?.clinic.settings?.sessionTimeoutMinutes ?? null,
    accessLogEnabled: active?.clinic.settings?.accessLogEnabled !== false,
    // 2FA do próprio usuário OU de qualquer clínica em que ele trabalha: a
    // política da clínica protege dados de pacientes, e a mesma sessão pode
    // trocar de clínica sem novo login.
    twoFactorRequired:
      user.twoFactorEnabled ||
      user.memberships.some((m) => m.clinic.settings?.twoFactorEnabled === true),
  };
};

/** `user` devolvido ao cliente — mesmo formato no login, 2FA e cadastros. */
export const toSessionUserPayload = (user: SessionUser, ctx: SessionContext) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: ctx.role,
  roles: ctx.roles,
  clinicId: ctx.clinicId,
  clinicName: ctx.clinicName,
  clinics: ctx.clinics,
  termsAccepted: Boolean(user.termsAcceptedAt && user.privacyAcceptedAt),
});

export type SessionUserPayload = ReturnType<typeof toSessionUserPayload>;

export const generateSessionToken = (user: SessionUser, ctx: SessionContext): string =>
  generateAuthToken(user.id, ctx.clinicId, ctx.role, user.name, {}, ctx.roles);

export const loadSessionUserById = (userId: string) =>
  prisma.user.findUnique({ where: { id: userId }, include: SESSION_USER_INCLUDE });

export const loadSessionUserByEmail = (email: string) =>
  prisma.user.findFirst({ where: { email }, include: SESSION_USER_INCLUDE });

/**
 * Papéis efetivos de uma requisição, lidos do banco a cada chamada pelo
 * authMiddleware. Assim um papel removido (ou uma clínica que desliga a pessoa)
 * perde efeito na hora, sem esperar o token de 8h expirar.
 *
 * `clinicId` do token vazio vira "" no filtro: nenhum vínculo tem id vazio, e
 * `undefined` faria o Prisma ignorar o filtro e devolver todos os vínculos.
 */
export const loadRequestAuth = async (userId: string, clinicId: string | null) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      status: true,
      role: true,
      passwordChangedAt: true,
      patient: { select: { isActive: true, blockedAt: true } },
      memberships: {
        where: { clinicId: clinicId ?? "", status: MembershipStatus.ACTIVE, deletedAt: null },
        select: { roles: true },
      },
      professionals: {
        where: { clinicId: clinicId ?? "", isActive: true, deletedAt: null },
        select: { id: true },
      },
    },
  });

  if (!user) return null;

  const membership = user.memberships[0];
  const staffRoles = deriveRoles({
    membershipRoles: membership?.roles,
    hasActiveProfessional: user.professionals.length > 0,
    patient: null,
  });

  return {
    status: user.status,
    passwordChangedAt: user.passwordChangedAt,
    /** Token aponta para uma clínica em que a conta não tem mais acesso. */
    clinicAccessRevoked: Boolean(clinicId) && staffRoles.length === 0,
    roles: sortRoles([
      ...staffRoles,
      ...(isPatientUsable(user.patient) ? [UserRole.PATIENT] : []),
    ]),
  };
};
