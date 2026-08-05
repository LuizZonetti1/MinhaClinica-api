import { prisma } from "../../database/prisma";

/**
 * Registra o aceite de Termos de Uso e Política de Privacidade para uma
 * conta que já existia antes desta funcionalidade (por isso não tem
 * termsAcceptedAt/privacyAcceptedAt gravados no cadastro). Usado pelo
 * banner de pendência exibido no próximo login — nunca preenche
 * retroativamente sem uma ação explícita do usuário.
 */
export class AcceptTermsService {
  async execute(userId: string): Promise<{ message: string }> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });

    return { message: "Aceite registrado com sucesso." };
  }
}
