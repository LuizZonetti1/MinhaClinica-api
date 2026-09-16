import type { Prisma } from "../../generated/prisma";
import { prisma } from "../database/prisma";
import { MembershipStatus, type UserRole } from "../types/enums";

type Tx = Prisma.TransactionClient;

/**
 * Filtro de User: "tem vínculo ativo na clínica" (opcionalmente com algum dos
 * papéis). Substitui o antigo `where: { clinicId }` em User — uma conta pode
 * ser equipe em várias clínicas, então o tenant fica no vínculo.
 */
export const activeMemberOf = (
  clinicId: string,
  roles?: readonly UserRole[],
): Prisma.UserWhereInput => ({
  memberships: {
    some: {
      clinicId,
      status: MembershipStatus.ACTIVE,
      deletedAt: null,
      ...(roles && roles.length > 0 ? { roles: { hasSome: [...roles] } } : {}),
    },
  },
});

/** Mesmo filtro, para qualquer status do vínculo (ativos e desativados). */
export const memberOf = (
  clinicId: string,
  roles?: readonly UserRole[],
): Prisma.UserWhereInput => ({
  memberships: {
    some: {
      clinicId,
      deletedAt: null,
      ...(roles && roles.length > 0 ? { roles: { hasSome: [...roles] } } : {}),
    },
  },
});

export class MembershipRepository {
  findByUserAndClinic(userId: string, clinicId: string, tx: Tx = prisma) {
    return tx.clinicMembership.findUnique({
      where: { userId_clinicId: { userId, clinicId } },
    });
  }

  /**
   * Soma um papel ao vínculo da conta na clínica, criando ou reativando o
   * vínculo. Não mexe nos outros papéis nem em outras clínicas.
   */
  async grantRole(
    input: { userId: string; clinicId: string; role: UserRole; termsAcceptedAt?: Date | null },
    tx: Tx = prisma,
  ) {
    const existing = await this.findByUserAndClinic(input.userId, input.clinicId, tx);

    if (!existing) {
      return tx.clinicMembership.create({
        data: {
          userId: input.userId,
          clinicId: input.clinicId,
          roles: [input.role],
          status: MembershipStatus.ACTIVE,
          termsAcceptedAt: input.termsAcceptedAt ?? null,
        },
      });
    }

    // Vínculo encerrado antes (deletedAt) volta só com o papel concedido agora:
    // papéis antigos de quando a pessoa foi desligada não ressuscitam.
    const baseRoles = existing.deletedAt ? [] : existing.roles;

    return tx.clinicMembership.update({
      where: { id: existing.id },
      data: {
        roles: [...new Set([...baseRoles, input.role])],
        status: MembershipStatus.ACTIVE,
        deletedAt: null,
        ...(input.termsAcceptedAt ? { termsAcceptedAt: input.termsAcceptedAt } : {}),
      },
    });
  }

  /**
   * Tira um papel do vínculo. Se não sobrar papel, o vínculo é encerrado
   * (INACTIVE + deletedAt). Devolve o vínculo atualizado, ou null se não havia.
   */
  async revokeRole(input: { userId: string; clinicId: string; role: UserRole }, tx: Tx = prisma) {
    const existing = await this.findByUserAndClinic(input.userId, input.clinicId, tx);
    if (!existing) return null;

    const roles = existing.roles.filter((r) => r !== input.role);

    return tx.clinicMembership.update({
      where: { id: existing.id },
      data:
        roles.length > 0
          ? { roles }
          : { roles, status: MembershipStatus.INACTIVE, deletedAt: new Date() },
    });
  }

  /**
   * A conta ainda tem alguma identidade viva além do vínculo informado?
   * (outro vínculo não encerrado ou registro de paciente). Usado para decidir
   * se desligar alguém pode anonimizar a conta inteira.
   */
  async hasOtherIdentity(userId: string, exceptClinicId: string, tx: Tx = prisma) {
    const [otherMemberships, patient] = await Promise.all([
      tx.clinicMembership.count({
        where: { userId, clinicId: { not: exceptClinicId }, deletedAt: null },
      }),
      tx.patient.count({ where: { userId } }),
    ]);
    return otherMemberships > 0 || patient > 0;
  }
}
