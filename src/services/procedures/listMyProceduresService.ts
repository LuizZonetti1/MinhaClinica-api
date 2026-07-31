import { prisma } from "../../database/prisma";
import { ProcedureRepository } from "../../repository/procedureRepository";

const procedureRepository = new ProcedureRepository();

export class ListMyProceduresService {
  async execute(userId: string, clinicId: string) {
    const professional = await prisma.professional.findFirst({
      where: { userId, clinicId },
      select: { id: true },
    });

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }

    const [procedures, selectedIds] = await Promise.all([
      procedureRepository.findByClinic(clinicId, false),
      procedureRepository.findProcedureIdsByProfessional(professional.id),
    ]);

    const selectedSet = new Set(selectedIds);

    return procedures.map((procedure) => ({
      ...procedure,
      selected: selectedSet.has(procedure.id),
    }));
  }
}
