import type { Request, Response } from "express";
import { VerifyEmailService } from "../services/auth/verifyEmailService";
import { UserRole } from "../types/enums";

/**
 * Mapa de rotas de sucesso por role
 * Cada role tem sua tela de "completar cadastro" no frontend
 */
const SUCCESS_ROUTES: Record<string, string> = {
  [UserRole.PATIENT]: "/completar-cadastro",
  [UserRole.ADMIN]: "/clinica/registro/completo",
  [UserRole.PROFESSIONAL]: "/profissional/completar-cadastro",
  [UserRole.RECEPTIONIST]: "/recepcao/completar-cadastro",
};

/**
 * Mapa de rotas de erro por role
 * Redireciona para o início do fluxo de cadastro em caso de token inválido/expirado
 */
const ERROR_ROUTES: Record<string, string> = {
  [UserRole.PATIENT]: "/cadastro",
  [UserRole.ADMIN]: "/clinica/cadastro",
  [UserRole.PROFESSIONAL]: "/profissional/cadastro",
  [UserRole.RECEPTIONIST]: "/recepcao/cadastro",
};

/**
 * Detecta se a requisição veio de fetch/axios ou de navegação direta do browser
 */
export function isApiRequest(req: Request): boolean {
  const accept = req.headers.accept ?? "";
  return (
    accept.includes("application/json") ||
    req.headers["x-requested-with"] === "XMLHttpRequest" ||
    !!req.headers["origin"]
  );
}

/**
 * Handler reutilizável para o link de verificação de e-mail.
 * Lê a role do usuário no banco e redireciona para a tela correta.
 * Funciona para PATIENT, ADMIN, PROFESSIONAL e RECEPTIONIST.
 */
export async function resolveVerifyRedirect(req: Request, res: Response): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const token = (req.params.token || req.query.token) as string;
  const isApi = isApiRequest(req);

  if (!token) {
    if (isApi) {
      res.status(400).json({ error: "Token não fornecido" });
    } else {
      res.redirect(`${frontendUrl}/cadastro?erro=token_invalido`);
    }
    return;
  }

  try {
    const service = new VerifyEmailService();
    const result = await service.execute(String(token));

    const successPath = SUCCESS_ROUTES[result.role] ?? "/completar-cadastro";
    const params = new URLSearchParams({
      tempToken: result.tempToken,
      role: result.role,
      name: result.name,
      email: result.email,
    });
    const redirectUrl = `${frontendUrl}${successPath}?${params.toString()}`;

    if (isApi) {
      res.status(200).json({
        tempToken: result.tempToken,
        role: result.role,
        name: result.name,
        email: result.email,
        redirectUrl,
      });
    } else {
      res.redirect(redirectUrl);
    }
  } catch (error) {
    const isExpired = error instanceof Error && error.message.toLowerCase().includes("expirado");
    const errorCode = isExpired ? "token_expirado" : "token_invalido";

    if (isApi) {
      res.status(isExpired ? 410 : 400).json({
        error: error instanceof Error ? error.message : "Token inválido",
      });
    } else {
      // Sem role disponível no erro — fallback genérico
      const errorPath = ERROR_ROUTES[UserRole.PATIENT];
      res.redirect(`${frontendUrl}${errorPath}?erro=${errorCode}`);
    }
  }
}
