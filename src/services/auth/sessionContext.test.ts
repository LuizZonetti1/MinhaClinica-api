import { describe, expect, it } from "vitest";
import { UserRole } from "../../types/enums";
import {
  buildSessionContext,
  deriveRoles,
  isPatientUsable,
  pickActiveClinicId,
  type SessionUser,
} from "./sessionContext";

const clinic = (id: string, overrides: Partial<{ twoFactorEnabled: boolean }> = {}) => ({
  clinicId: id,
  roles: [] as UserRole[],
  clinic: {
    tradeName: `Clínica ${id}`,
    settings: {
      twoFactorEnabled: overrides.twoFactorEnabled ?? false,
      sessionTimeoutMinutes: 30,
      accessLogEnabled: true,
    },
  },
});

const baseUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: "u1",
  name: "Conta",
  email: "conta@email.com",
  role: UserRole.PATIENT,
  activeClinicId: null,
  twoFactorEnabled: false,
  termsAcceptedAt: new Date(),
  privacyAcceptedAt: new Date(),
  patient: { isActive: true, blockedAt: null },
  memberships: [],
  professionals: [],
  ...overrides,
});

describe("isPatientUsable", () => {
  it("aceita paciente ativo e não bloqueado", () => {
    expect(isPatientUsable({ isActive: true, blockedAt: null })).toBe(true);
  });

  it("recusa paciente bloqueado por faltas, inativo ou inexistente", () => {
    expect(isPatientUsable({ isActive: true, blockedAt: new Date() })).toBe(false);
    expect(isPatientUsable({ isActive: false, blockedAt: null })).toBe(false);
    expect(isPatientUsable(null)).toBe(false);
  });
});

describe("deriveRoles", () => {
  it("ignora PROFESSIONAL sem registro Professional ativo na clínica", () => {
    expect(
      deriveRoles({
        membershipRoles: [UserRole.ADMIN, UserRole.PROFESSIONAL],
        hasActiveProfessional: false,
        patient: null,
      }),
    ).toEqual([UserRole.ADMIN]);
  });

  it("soma PATIENT aos papéis da clínica e ordena por prioridade", () => {
    expect(
      deriveRoles({
        membershipRoles: [UserRole.PROFESSIONAL, UserRole.RECEPTIONIST],
        hasActiveProfessional: true,
        patient: { isActive: true, blockedAt: null },
      }),
    ).toEqual([UserRole.RECEPTIONIST, UserRole.PROFESSIONAL, UserRole.PATIENT]);
  });

  it("nunca aceita PATIENT vindo do vínculo (paciente é global)", () => {
    expect(
      deriveRoles({
        membershipRoles: [UserRole.PATIENT],
        hasActiveProfessional: false,
        patient: null,
      }),
    ).toEqual([]);
  });
});

describe("pickActiveClinicId", () => {
  it("usa a preferida quando ainda há vínculo", () => {
    expect(pickActiveClinicId(["a", "b"], "b")).toBe("b");
  });

  it("cai na primeira clínica quando a preferida não vale mais", () => {
    expect(pickActiveClinicId(["a", "b"], "x")).toBe("a");
  });

  it("devolve null para conta sem clínica", () => {
    expect(pickActiveClinicId([], "x")).toBeNull();
  });
});

describe("buildSessionContext", () => {
  it("conta só de paciente abre sem clínica", () => {
    const ctx = buildSessionContext(baseUser());
    expect(ctx.clinicId).toBeNull();
    expect(ctx.roles).toEqual([UserRole.PATIENT]);
    expect(ctx.role).toBe(UserRole.PATIENT);
    expect(ctx.clinics).toEqual([]);
  });

  it("paciente que também é dono abre na clínica e mantém PATIENT", () => {
    const user = baseUser({
      activeClinicId: "c1",
      memberships: [{ ...clinic("c1"), roles: [UserRole.ADMIN] }],
    });
    const ctx = buildSessionContext(user);
    expect(ctx.clinicId).toBe("c1");
    expect(ctx.roles).toEqual([UserRole.ADMIN, UserRole.PATIENT]);
    expect(ctx.role).toBe(UserRole.ADMIN);
    expect(ctx.sessionTimeoutMinutes).toBe(30);
  });

  it("papéis valem só na clínica ativa", () => {
    const user = baseUser({
      activeClinicId: "c2",
      memberships: [
        { ...clinic("c1"), roles: [UserRole.ADMIN] },
        { ...clinic("c2"), roles: [UserRole.PROFESSIONAL] },
      ],
      professionals: [{ clinicId: "c2" }],
    });
    const ctx = buildSessionContext(user);
    expect(ctx.clinicId).toBe("c2");
    expect(ctx.roles).toEqual([UserRole.PROFESSIONAL, UserRole.PATIENT]);
    expect(ctx.clinics.map((c) => c.id)).toEqual(["c1", "c2"]);
  });

  it("null explícito abre a área de paciente mesmo com clínicas", () => {
    const user = baseUser({
      activeClinicId: "c1",
      memberships: [{ ...clinic("c1"), roles: [UserRole.ADMIN] }],
    });
    const ctx = buildSessionContext(user, null);
    expect(ctx.clinicId).toBeNull();
    expect(ctx.roles).toEqual([UserRole.PATIENT]);
    expect(ctx.clinics).toHaveLength(1);
  });

  it("exige 2FA se qualquer clínica da conta exigir", () => {
    const user = baseUser({
      activeClinicId: "c1",
      memberships: [
        { ...clinic("c1"), roles: [UserRole.ADMIN] },
        { ...clinic("c2", { twoFactorEnabled: true }), roles: [UserRole.RECEPTIONIST] },
      ],
    });
    expect(buildSessionContext(user).twoFactorRequired).toBe(true);
    expect(buildSessionContext(baseUser()).twoFactorRequired).toBe(false);
  });

  it("vínculo sem papel usável não aparece como clínica", () => {
    const user = baseUser({
      memberships: [{ ...clinic("c1"), roles: [UserRole.PROFESSIONAL] }],
      professionals: [],
      patient: null,
    });
    const ctx = buildSessionContext(user);
    expect(ctx.clinics).toEqual([]);
    expect(ctx.roles).toEqual([]);
  });
});
