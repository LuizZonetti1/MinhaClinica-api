import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { generateAuthToken } from "../../utils/jwtUtils";

/**
 * LOGIN - Autenticar usuário
 * Apenas email e senha (usuário já está vinculado à clínica)
 */
export class LoginService {
  async execute(data: { email: string; password: string }) {
    // Buscar usuário por email
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
      include: {
        clinic: true,
      },
    });

    if (!user) {
      throw new Error("Email ou senha incorretos");
    }

    // Verificar se conta está ativa
    if (user.status !== "ACTIVE") {
      throw new Error("Conta não está ativa. Complete seu cadastro ou aguarde aprovação.");
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      throw new Error("Email ou senha incorretos");
    }

    // Gerar token JWT
    const token = generateAuthToken(user.id, user.clinicId, user.role);

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        clinicName: user.clinic?.tradeName ?? null,
      },
    };
  }
}
