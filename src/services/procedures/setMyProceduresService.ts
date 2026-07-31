import { prisma } from "../../database/prisma";
import { ProcedureRepository } from "../../repository/procedureRepository";

const procedureRepository = new ProcedureRepository();

export class SetMyProceduresService {
  async execute(userId: string, clinicId: string, procedureIds: string[]) {
    const professional = await prisma.professional.findFirst({
      where: { userId, clinicId },
      select: { id: true },
    });

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }

    const uniqueIds = [...new Set(procedureIds)];

    if (uniqueIds.length > 0) {
      const validProcedures = await procedureRepository.findByIds(uniqueIds, clinicId);
      if (validProcedures.length !== uniqueIds.length) {
        throw Object.assign(new Error("Um ou mais procedimentos não pertencem a esta clínica"), {
          statusCode: 400,
        });
      }
    }

    const currentIds = await procedureRepository.findProcedureIdsByProfessional(professional.id);
    const newIdsSet = new Set(uniqueIds);
    const removedIds = currentIds.filter((id) => !newIdsSet.has(id));

    if (removedIds.length > 0) {
      const blockedIds = await procedureRepository.findBlockedProcedureIds(
        professional.id,
        removedIds,
      );

      if (blockedIds.length > 0) {
        const blockedProcedures = await procedureRepository.findByIds(blockedIds, clinicId);
        throw Object.assign(
          new Error(
            "Não é possível remover procedimentos com agendamentos futuros (agendados ou confirmados)",
          ),
          {
            statusCode: 409,
            blockedProcedures: blockedProcedures.map((procedure) => ({
              id: procedure.id,
              name: procedure.name,
            })),
          },
        );
      }
    }

    await procedureRepository.replaceProfessionalProcedures(professional.id, uniqueIds);

    const procedures = await procedureRepository.findByClinic(clinicId, false);
    return procedures.map((procedure) => ({
      ...procedure,
      selected: newIdsSet.has(procedure.id),
    }));
  }
}
