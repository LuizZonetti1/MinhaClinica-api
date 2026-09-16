import { UserRole } from "../types/enums";

/** Papéis de equipe — os únicos que vivem num vínculo com clínica. */
export const STAFF_ROLES: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.RECEPTIONIST,
  UserRole.PROFESSIONAL,
];

/** Ordem usada para escolher o papel "principal" e ordenar os papéis. */
export const ROLE_PRIORITY: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.RECEPTIONIST,
  UserRole.PROFESSIONAL,
  UserRole.PATIENT,
];

export const isStaffRole = (role: string): boolean => STAFF_ROLES.includes(role as UserRole);

export const sortRoles = (roles: Iterable<UserRole>): UserRole[] =>
  [...new Set(roles)].sort((a, b) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b));

/** Algum dos papéis de equipe está na lista? */
export const hasStaffRole = (roles: readonly string[] | undefined): boolean =>
  (roles ?? []).some(isStaffRole);
