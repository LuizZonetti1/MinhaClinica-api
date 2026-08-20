/**
 * Validação das variáveis de ambiente no boot.
 *
 * Chamado por `server.ts` antes do `listen`: se faltar algo obrigatório o
 * processo morre com a lista do que falta, em vez de subir e quebrar depois no
 * meio de um fluxo de usuário — ou, pior, subir funcionando e inseguro.
 *
 * O caso que motivou isto é o `NODE_ENV` esquecido no painel de deploy: sem
 * ele, `app.ts` calcula `isDev = true` e libera CORS para QUALQUER origem com
 * `credentials: true`, com o token em localStorage do outro lado. O
 * `.env.example` já prometia "a aplicação não inicia sem elas"; até aqui não
 * havia nada que cumprisse essa promessa.
 *
 * Roda só no processo do servidor. Scripts (seed, migrations, prisma studio)
 * não importam este arquivo e seguem funcionando com o .env parcial de sempre.
 */

const MIN_SECRET_LENGTH = 32;

const VALID_NODE_ENVS = ["development", "test", "production"] as const;

const isBlank = (value: string | undefined): boolean => !value || value.trim() === "";

export interface EnvCheckResult {
  errors: string[];
  warnings: string[];
}

/**
 * Função pura — recebe o env e devolve o que está errado, sem encerrar o
 * processo. Separada de `assertEnv` para poder ser exercitada em teste.
 */
export const checkEnv = (env: NodeJS.ProcessEnv = process.env): EnvCheckResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodeEnv = env.NODE_ENV;
  const isProduction = nodeEnv === "production";

  if (isBlank(nodeEnv)) {
    errors.push(
      "NODE_ENV não está definido. Defina explicitamente como development, test ou production — " +
        "sem isso a API sobe em modo de desenvolvimento e aceita requisições de qualquer origem.",
    );
  } else if (!VALID_NODE_ENVS.includes(nodeEnv as (typeof VALID_NODE_ENVS)[number])) {
    errors.push(
      `NODE_ENV="${nodeEnv}" é inválido. Use development, test ou production. ` +
        "Qualquer valor diferente de production é tratado como desenvolvimento.",
    );
  }

  if (isBlank(env.DATABASE_URL)) {
    errors.push("DATABASE_URL é obrigatória.");
  }

  // Os dois segredos têm fallback para JWT_SECRET no código (compatibilidade
  // com .env antigos), então o que importa validar é o valor efetivo.
  const accessSecret = env.JWT_ACCESS_SECRET ?? env.JWT_SECRET;
  const tempSecret = env.JWT_TEMP_SECRET ?? env.JWT_SECRET;

  if (isBlank(accessSecret)) {
    errors.push("JWT_ACCESS_SECRET é obrigatória — sem ela nenhum login funciona.");
  }

  if (isBlank(tempSecret)) {
    errors.push("JWT_TEMP_SECRET é obrigatória — sem ela nenhum cadastro se conclui.");
  }

  if (!isBlank(accessSecret) && !isBlank(tempSecret) && accessSecret === tempSecret) {
    const mensagem =
      "JWT_ACCESS_SECRET e JWT_TEMP_SECRET têm o mesmo valor. Com segredos iguais, um token " +
      "temporário de cadastro tem assinatura válida como token de acesso. Gere dois valores " +
      "distintos.";
    // Em produção é erro; em desenvolvimento é aviso, para não travar quem já
    // tem um .env local com os três segredos iguais. O authMiddleware rejeita
    // tokens com `type` justamente para cobrir esse intervalo.
    if (isProduction) {
      errors.push(mensagem);
    } else {
      warnings.push(mensagem);
    }
  }

  if (isProduction) {
    if (!isBlank(accessSecret) && (accessSecret as string).length < MIN_SECRET_LENGTH) {
      errors.push(
        `JWT_ACCESS_SECRET tem ${(accessSecret as string).length} caracteres; o mínimo é ${MIN_SECRET_LENGTH}.`,
      );
    }

    if (!isBlank(tempSecret) && (tempSecret as string).length < MIN_SECRET_LENGTH) {
      errors.push(
        `JWT_TEMP_SECRET tem ${(tempSecret as string).length} caracteres; o mínimo é ${MIN_SECRET_LENGTH}.`,
      );
    }

    if (isBlank(env.FRONTEND_URL)) {
      errors.push(
        "FRONTEND_URL é obrigatória em produção — é a única origem que o CORS libera e a base " +
          "dos links enviados por e-mail. Sem ela o CORS cai no padrão do pacote, que é aberto.",
      );
    } else if (!env.FRONTEND_URL.trim().startsWith("https://")) {
      warnings.push(
        `FRONTEND_URL="${env.FRONTEND_URL}" não usa https. O token trafega no header Authorization; ` +
          "sem TLS ele vai em claro.",
      );
    }

    // emailProvider.ts já lança em produção sem BREVO_API_KEY, mas só na
    // primeira tentativa de envio — o que acontece dentro de um cadastro de
    // usuário. Antecipar para o boot troca "cadastro quebrado em produção"
    // por "deploy que não sobe".
    if (isBlank(env.BREVO_API_KEY)) {
      errors.push("BREVO_API_KEY é obrigatória em produção — é o provedor de e-mail usado lá.");
    }

    if (isBlank(env.EMAIL_FROM)) {
      errors.push("EMAIL_FROM é obrigatória em produção (remetente verificado no Brevo).");
    }
  }

  return { errors, warnings };
};

/**
 * Aplica o resultado de `checkEnv`: imprime os avisos e encerra o processo se
 * houver erro. Chamar antes de abrir a porta.
 */
export const assertEnv = (env: NodeJS.ProcessEnv = process.env): void => {
  const { errors, warnings } = checkEnv(env);

  for (const warning of warnings) {
    console.warn(`[ENV] Aviso: ${warning}`);
  }

  if (errors.length === 0) {
    return;
  }

  console.error(
    `\n[ENV] A API não pode iniciar: ${errors.length} variável(is) de ambiente com problema.\n`,
  );
  for (const error of errors) {
    console.error(`  · ${error}`);
  }
  console.error("\nConsulte o .env.example para o conjunto completo.\n");

  process.exit(1);
};
