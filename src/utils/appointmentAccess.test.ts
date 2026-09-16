import { describe, expect, it } from "vitest";
import { UserRole } from "../types/enums";
import { resolveAppointmentRole } from "./appointmentAccess";

const appointment = {
  clinicId: "c1",
  patientUserId: "paciente",
  professionalUserId: "profissional",
};

describe("resolveAppointmentRole", () => {
  it("dono que também é paciente vê a própria consulta de OUTRA clínica como paciente", () => {
    expect(
      resolveAppointmentRole(
        { userId: "paciente", clinicId: "c9", roles: [UserRole.ADMIN, UserRole.PATIENT] },
        appointment,
      ),
    ).toBe(UserRole.PATIENT);
  });

  it("equipe da clínica ativa acessa como equipe", () => {
    expect(
      resolveAppointmentRole(
        { userId: "outra", clinicId: "c1", roles: [UserRole.RECEPTIONIST] },
        appointment,
      ),
    ).toBe(UserRole.RECEPTIONIST);
  });

  it("equipe de outra clínica não acessa consulta alheia", () => {
    expect(
      resolveAppointmentRole(
        { userId: "outra", clinicId: "c9", roles: [UserRole.ADMIN, UserRole.PATIENT] },
        appointment,
      ),
    ).toBeNull();
  });

  it("paciente sem clínica ativa acessa só a própria consulta", () => {
    expect(
      resolveAppointmentRole(
        { userId: "paciente", clinicId: null, roles: [UserRole.PATIENT] },
        appointment,
      ),
    ).toBe(UserRole.PATIENT);
    expect(
      resolveAppointmentRole(
        { userId: "intruso", clinicId: null, roles: [UserRole.PATIENT] },
        appointment,
      ),
    ).toBeNull();
  });

  it("profissional da clínica recebe o papel para a tela aplicar a regra de posse", () => {
    expect(
      resolveAppointmentRole(
        { userId: "profissional", clinicId: "c1", roles: [UserRole.PROFESSIONAL] },
        appointment,
      ),
    ).toBe(UserRole.PROFESSIONAL);
    expect(
      resolveAppointmentRole(
        { userId: "colega", clinicId: "c1", roles: [UserRole.PROFESSIONAL] },
        appointment,
      ),
    ).toBe(UserRole.PROFESSIONAL);
  });
});
