import { UserRole } from "../types/enums";

/**
 * Com qual papel a conta acessa uma consulta.
 *
 * Uma mesma conta pode ser equipe na clínica ativa e paciente em qualquer
 * clínica. A decisão não pode olhar só o papel "principal" (antes, um dono de
 * clínica que também era paciente levava 403 nos próprios documentos de
 * consultas em outras clínicas):
 *
 * - consulta da clínica ativa → papel de equipe (ADMIN > RECEPTIONIST >
 *   PROFESSIONAL). PROFESSIONAL continua sujeito à regra de posse de cada tela;
 * - senão, se a conta é a paciente da consulta → PATIENT;
 * - senão → null (sem acesso).
 */
export const resolveAppointmentRole = (
  session: { userId: string; clinicId: string | null | undefined; roles: readonly string[] },
  appointment: { clinicId: string; patientUserId: string; professionalUserId?: string | null },
): UserRole | null => {
  const has = (role: UserRole) => session.roles.includes(role);
  const inActiveClinic = Boolean(session.clinicId) && appointment.clinicId === session.clinicId;

  if (inActiveClinic) {
    if (has(UserRole.ADMIN)) return UserRole.ADMIN;
    if (has(UserRole.RECEPTIONIST)) return UserRole.RECEPTIONIST;
    if (has(UserRole.PROFESSIONAL) && appointment.professionalUserId === session.userId) {
      return UserRole.PROFESSIONAL;
    }
  }

  if (has(UserRole.PATIENT) && appointment.patientUserId === session.userId) {
    return UserRole.PATIENT;
  }

  // Profissional da clínica olhando consulta de outro profissional: devolve o
  // papel para a tela aplicar (e auditar) a negação de posse.
  if (inActiveClinic && has(UserRole.PROFESSIONAL)) return UserRole.PROFESSIONAL;

  return null;
};
