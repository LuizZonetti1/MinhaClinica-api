import { prisma } from "../../database/prisma";
import { ProcedureRepository } from "../../repository/procedureRepository";

const procedureRepository = new ProcedureRepository();

export class ListProfessionalProceduresService {
  async execute(professionalId: string, clinicId: string) {
    const professional = await prisma.professional.findFirst({
      where: { id: professionalId, clinicId },
      select: { id: true },
    });

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }

    return procedureRepository.findActiveForProfessional(professionalId, clinicId);
  }
}
