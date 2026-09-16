import type { InviteStaffInput } from "../../types/user";
import { CreateInviteService } from "../invites/inviteService";

/**
 * CONVIDAR STAFF (Recepcionista/Admin)
 * Admin convida outro membro da equipe. O convite vale para qualquer e-mail —
 * inclusive de quem já tem conta, que aceita entrando com a própria senha.
 * Aceite e cadastro ficam em services/invites.
 */
export class InviteStaffService {
  async execute(adminId: string, clinicId: string, data: InviteStaffInput) {
    return new CreateInviteService().execute({
      adminId,
      clinicId,
      name: data.name,
      email: data.email,
      role: data.role,
    });
  }
}
