import { UserRole } from "../../types/enums";
import type { InviteProfessionalInput } from "../../types/user";
import { CreateInviteService } from "../invites/inviteService";

/**
 * CONVIDAR PROFISSIONAL
 * Admin convida profissional. O convite vale para qualquer e-mail — inclusive
 * de quem já tem conta (ex.: um paciente), que aceita entrando com a própria
 * senha. Aceite e cadastro ficam em services/invites.
 */
export class InviteProfessionalService {
  async execute(adminId: string, clinicId: string, data: InviteProfessionalInput) {
    return new CreateInviteService().execute({
      adminId,
      clinicId,
      name: data.name,
      email: data.email,
      role: UserRole.PROFESSIONAL,
      specialty: data.specialty,
    });
  }
}
