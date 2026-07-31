import "dotenv/config";
import { AppointmentType } from "../types/enums";
import { prisma } from "./prisma";

// Migração de dados (aditiva, não-destrutiva): garante que toda clínica com
// profissional ativo tenha ao menos um Procedure "Consulta" vinculado a cada um
// deles, refletindo a duração já configurada no perfil do profissional.
// Idempotente: upsert por @@unique, pode ser executado múltiplas vezes sem duplicar.
// Appointment.procedureId NÃO é preenchido — agendamentos históricos ficam null.
// Preço está fora de escopo nesta fase: usa placeholder 0 até o módulo financeiro existir.
const DEFAULT_PROCEDURE_PRICE = 0;

async function main() {
  console.log("🔧 Migrando procedimentos padrão por clínica...\n");

  const clinics = await prisma.clinic.findMany({
    select: { id: true, tradeName: true },
  });

  let clinicsProcessed = 0;
  let clinicsSkipped = 0;

  for (const clinic of clinics) {
    const professionals = await prisma.professional.findMany({
      where: { clinicId: clinic.id, isActive: true },
      select: { id: true, defaultAppointmentDuration: true },
      orderBy: { createdAt: "asc" },
    });

    if (professionals.length === 0) {
      clinicsSkipped += 1;
      continue;
    }

    // A duração do profissional ativo mais antigo usa o nome "Consulta" sem sufixo;
    // demais durações distintas viram "Consulta (N min)" para não colidir com
    // @@unique([clinicId, name]).
    const firstDuration = professionals[0].defaultAppointmentDuration;
    const nameForDuration = (duration: number): string =>
      duration === firstDuration ? "Consulta" : `Consulta (${duration} min)`;

    const distinctDurations = [...new Set(professionals.map((p) => p.defaultAppointmentDuration))];

    await prisma.$transaction(async (tx) => {
      const procedureIdByDuration = new Map<number, string>();

      for (const duration of distinctDurations) {
        const name = nameForDuration(duration);
        const procedure = await tx.procedure.upsert({
          where: { clinicId_name: { clinicId: clinic.id, name } },
          update: {},
          create: {
            clinicId: clinic.id,
            name,
            defaultDuration: duration,
            defaultPrice: DEFAULT_PROCEDURE_PRICE,
            defaultType: AppointmentType.CONSULTATION,
            isActive: true,
          },
        });
        procedureIdByDuration.set(duration, procedure.id);
      }

      for (const professional of professionals) {
        const procedureId = procedureIdByDuration.get(professional.defaultAppointmentDuration);
        if (!procedureId) continue;

        await tx.professionalProcedure.upsert({
          where: {
            professionalId_procedureId: {
              professionalId: professional.id,
              procedureId,
            },
          },
          update: {},
          create: {
            professionalId: professional.id,
            procedureId,
          },
        });
      }
    });

    clinicsProcessed += 1;
    console.log(
      `  ✅ ${clinic.tradeName}: ${distinctDurations.length} procedimento(s) garantido(s), ${professionals.length} profissional(is) vinculado(s)`,
    );
  }

  console.log(
    `\n✨ Concluído. ${clinicsProcessed} clínica(s) processada(s), ${clinicsSkipped} sem profissional ativo (ignorada(s)).`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Erro na migração de procedimentos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
