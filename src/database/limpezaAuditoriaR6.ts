import "dotenv/config";
import { InviteStatus, MembershipStatus, UserRole } from "../types/enums";
import { stripCNPJ, validateCNPJ } from "../utils/validateCNPJ";
import { prisma } from "./prisma";

/**
 * Limpeza dos resíduos deixados pelas rodadas 4, 5 e 6 de auditoria no banco DEV.
 *
 * Alternativa direcionada ao `db:reset`: remove só o que as rodadas sujaram e
 * preserva o restante da base de teste. Idempotente — pode rodar de novo sem
 * efeito adicional.
 *
 *   npm run db:limpeza-r6            → só lista o que seria feito (dry-run)
 *   npm run db:limpeza-r6 -- --apply → executa
 *
 * O corte dos rascunhos de documento é configurável:
 *   npm run db:limpeza-r6 -- --apply --desde=2026-08-01
 */

const APPLY = process.argv.includes("--apply");
const DESDE_ARG = process.argv.find((arg) => arg.startsWith("--desde="));
const DESDE = new Date(DESDE_ARG ? DESDE_ARG.split("=")[1] : "2026-08-01T00:00:00.000Z");

// Nomes exatos citados no relatório da rodada 6.
const CLINICAS_DE_TESTE = ["Clínica Rodada Seis", "Clinica Seis Bravo", "Clinica Charlie Seis"];
const USUARIOS_PARA_REATIVAR = ["Pedro Almeida", "Luiz Zonetti"];
const MARCA_DE_TESTE = "auditoria r6";

const PESOS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

const digitoVerificador = (digitos: string, pesos: number[]): number => {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) {
    soma += Number(digitos[i]) * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
};

const comDigitosVerificadores = (raiz: string): string => {
  const primeiro = digitoVerificador(raiz, PESOS_1);
  const segundo = digitoVerificador(`${raiz}${primeiro}`, PESOS_2);
  return `${raiz}${primeiro}${segundo}`;
};

let acoes = 0;

const plano = (mensagem: string): void => {
  acoes += 1;
  console.log(`  ${APPLY ? "✔" : "•"} ${mensagem}`);
};

/** 1. Bloqueio de agenda "Férias teste auditoria R6" na Dra. Fernanda. */
async function removerBloqueiosDeTeste(): Promise<void> {
  console.log("\n1. Bloqueios de agenda criados pela auditoria");

  const bloqueios = await prisma.professionalScheduleBlock.findMany({
    where: { reason: { contains: MARCA_DE_TESTE, mode: "insensitive" } },
    include: { professional: { include: { user: { select: { name: true } } } } },
  });

  if (bloqueios.length === 0) {
    console.log("  (nada a remover)");
    return;
  }

  for (const bloqueio of bloqueios) {
    const inicio = bloqueio.startDateTime.toISOString().slice(0, 10);
    const fim = bloqueio.endDateTime.toISOString().slice(0, 10);
    plano(
      `remover bloqueio "${bloqueio.reason}" de ${bloqueio.professional.user.name} (${inicio} → ${fim})`,
    );
  }

  if (APPLY) {
    await prisma.professionalScheduleBlock.deleteMany({
      where: { id: { in: bloqueios.map((bloqueio) => bloqueio.id) } },
    });
  }
}

/**
 * 2. Pedro Almeida e Luiz Zonetti travados em bloqueio por faltas desde a
 * rodada 5. O bloqueio agora vive no papel de paciente (Patient.blockedAt).
 */
async function reativarUsuariosBloqueados(): Promise<void> {
  console.log("\n2. Pacientes bloqueados a reativar");

  const pacientes = await prisma.patient.findMany({
    where: { user: { name: { in: USUARIOS_PARA_REATIVAR } }, blockedAt: { not: null } },
    select: { id: true, user: { select: { name: true, email: true } } },
  });

  if (pacientes.length === 0) {
    console.log("  (nenhum dos dois está bloqueado)");
    return;
  }

  for (const paciente of pacientes) {
    plano(`desbloquear ${paciente.user.name} <${paciente.user.email}>`);
  }

  if (APPLY) {
    await prisma.patient.updateMany({
      where: { id: { in: pacientes.map((paciente) => paciente.id) } },
      data: { blockedAt: null },
    });
  }
}

/**
 * 3. Clínicas criadas só para testar o cadastro.
 * Clinic tem 14 relações onDelete: Cascade — a exclusão só acontece se a clínica
 * estiver de fato vazia (sem consultas, profissionais, documentos ou vínculos
 * ativos). Contas não são apagadas junto: o vínculo sai pelo cascade.
 */
async function removerClinicasDeTeste(): Promise<void> {
  console.log("\n3. Clínicas de teste órfãs");

  const clinicas = await prisma.clinic.findMany({
    where: {
      OR: [{ tradeName: { in: CLINICAS_DE_TESTE } }, { legalName: { in: CLINICAS_DE_TESTE } }],
    },
    include: {
      _count: { select: { appointments: true, professionals: true, documents: true } },
      // Clinic não tem relação com Patient (paciente é usuário global): o sinal
      // de "clínica só de teste" é não ter nenhum vínculo ativo — ou seja, só o
      // dono com o cadastro pendente.
      memberships: {
        where: { status: MembershipStatus.ACTIVE },
        select: { id: true },
      },
    },
  });

  if (clinicas.length === 0) {
    console.log("  (nenhuma encontrada)");
    return;
  }

  for (const clinica of clinicas) {
    const { appointments, professionals, documents } = clinica._count;
    const usuariosAtivos = clinica.memberships.length;

    if (appointments > 0 || professionals > 0 || documents > 0 || usuariosAtivos > 0) {
      console.log(
        `  ⚠ "${clinica.tradeName}" NÃO será removida: tem ${appointments} consulta(s), ` +
          `${professionals} profissional(is), ${documents} documento(s) e ${usuariosAtivos} ` +
          "vínculo(s) ativo(s). Confira antes de apagar à mão.",
      );
      continue;
    }

    plano(
      `remover clínica de teste "${clinica.tradeName}" (CNPJ ${clinica.cnpj})`,
    );

    if (APPLY) {
      await prisma.clinic.delete({ where: { id: clinica.id } });
    }
  }
}

/**
 * 4. Convites de profissional duplicados e os criados pela auditoria.
 * Só toca em convite ainda pendente (ClinicInvite) — nunca em conta.
 */
async function limparConvitesPendentes(): Promise<void> {
  console.log("\n4. Convites de profissional pendentes");

  const convites = await prisma.clinicInvite.findMany({
    where: { role: UserRole.PROFESSIONAL, status: InviteStatus.PENDING },
    select: { id: true, name: true, email: true, clinicId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const paraRemover = new Map<string, string>();

  // 4a. Convites criados pela própria auditoria (ex: "Dra. Rita Auditoria R6").
  for (const convite of convites) {
    if (convite.name.toLowerCase().includes(MARCA_DE_TESTE)) {
      paraRemover.set(convite.id, `convite de teste "${convite.name}" <${convite.email}>`);
    }
  }

  // 4b. Duplicados por nome dentro da mesma clínica — mantém o mais recente.
  const vistos = new Set<string>();
  for (const convite of convites) {
    if (paraRemover.has(convite.id)) continue;

    const chave = `${convite.clinicId}::${convite.name.trim().toLowerCase()}`;
    if (vistos.has(chave)) {
      const criadoEm = convite.createdAt.toISOString().slice(0, 10);
      paraRemover.set(
        convite.id,
        `convite duplicado de "${convite.name}" <${convite.email}> (${criadoEm})`,
      );
    } else {
      vistos.add(chave);
    }
  }

  if (paraRemover.size === 0) {
    console.log(`  (${convites.length} convite(s) pendente(s), nenhum duplicado ou de teste)`);
    return;
  }

  for (const descricao of paraRemover.values()) {
    plano(`remover ${descricao}`);
  }

  if (APPLY) {
    await prisma.clinicInvite.updateMany({
      where: { id: { in: [...paraRemover.keys()] } },
      data: { status: InviteStatus.CANCELLED },
    });
  }
}

/**
 * 5. Rascunhos de documento (e seus anexos, por cascade) deixados pelas rodadas.
 * O seed não cria nenhum Document: tudo que existe na base DEV veio de teste manual.
 */
async function removerRascunhosDeDocumento(): Promise<void> {
  console.log(`\n5. Rascunhos de documento criados a partir de ${DESDE.toISOString().slice(0, 10)}`);

  const rascunhos = await prisma.document.findMany({
    where: { status: "DRAFT", createdAt: { gte: DESDE } },
    select: {
      id: true,
      documentNumber: true,
      type: true,
      createdAt: true,
      _count: { select: { attachments: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (rascunhos.length === 0) {
    console.log("  (nada a remover)");
    return;
  }

  for (const rascunho of rascunhos) {
    const criadoEm = rascunho.createdAt.toISOString().slice(0, 10);
    plano(
      `remover rascunho ${rascunho.documentNumber} (${rascunho.type}, ` +
        `${rascunho._count.attachments} anexo(s), ${criadoEm})`,
    );
  }

  if (APPLY) {
    // DocumentAttachment tem onDelete: Cascade — os anexos vão junto.
    await prisma.document.deleteMany({
      where: { id: { in: rascunhos.map((rascunho) => rascunho.id) } },
    });
  }
}

/**
 * 6. CNPJs sem dígito verificador válido.
 * A rodada 6 passou a validar o DV no cadastro E na tela de Configurações; sem
 * este reparo, uma clínica antiga (o seed usava CNPJs inventados) receberia 400
 * ao salvar qualquer campo das configurações. Mantém a raiz de 12 dígitos e só
 * recalcula os 2 últimos.
 */
async function corrigirCnpjsInvalidos(): Promise<void> {
  console.log("\n6. CNPJs com dígito verificador inválido");

  const clinicas = await prisma.clinic.findMany({
    select: { id: true, tradeName: true, cnpj: true },
  });

  const invalidas = clinicas.filter((clinica) => !validateCNPJ(clinica.cnpj));

  if (invalidas.length === 0) {
    console.log("  (todos válidos)");
    return;
  }

  // Clinic.cnpj é @unique. Duas clínicas de teste podem compartilhar a mesma raiz
  // de 12 dígitos e diferir só nos verificadores errados — corrigir as duas
  // geraria o mesmo número. O conjunto rastreia o que já está tomado, inclusive
  // pelo que este mesmo run acabou de reservar.
  const cnpjsEmUso = new Set(clinicas.map((clinica) => clinica.cnpj));

  for (const clinica of invalidas) {
    const raiz = stripCNPJ(clinica.cnpj).slice(0, 12).padEnd(12, "0");
    const corrigido = comDigitosVerificadores(raiz);

    if (cnpjsEmUso.has(corrigido)) {
      console.log(
        `  ⚠ "${clinica.tradeName}": ${clinica.cnpj} → ${corrigido} colidiria com outra clínica. Corrija à mão.`,
      );
      continue;
    }

    plano(`corrigir CNPJ de "${clinica.tradeName}": ${clinica.cnpj} → ${corrigido}`);
    cnpjsEmUso.delete(clinica.cnpj);
    cnpjsEmUso.add(corrigido);

    if (APPLY) {
      await prisma.clinic.update({ where: { id: clinica.id }, data: { cnpj: corrigido } });
    }
  }
}

async function main(): Promise<void> {
  console.log(
    APPLY
      ? "🧹 Limpeza da auditoria R6 — APLICANDO alterações\n"
      : "🔍 Limpeza da auditoria R6 — simulação (dry-run). Use -- --apply para executar.\n",
  );

  await removerBloqueiosDeTeste();
  await reativarUsuariosBloqueados();
  await removerClinicasDeTeste();
  await limparConvitesPendentes();
  await removerRascunhosDeDocumento();
  await corrigirCnpjsInvalidos();

  const sufixo = APPLY || acoes === 0 ? "" : " Rode de novo com -- --apply para executar.";
  console.log(
    `\n${APPLY ? "✅" : "📋"} ${acoes} ação(ões) ${APPLY ? "aplicadas" : "pendentes"}.${sufixo}`,
  );
}

main()
  .catch((erro) => {
    console.error("❌ Falha na limpeza:", erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
