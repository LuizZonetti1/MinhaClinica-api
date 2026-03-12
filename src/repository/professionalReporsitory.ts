import { prisma } from "../database/prisma";

export class ProfessionalRepository {

    async getAllProfessionals(clinicId: string) {
        return prisma.professional.findMany({
            where: { clinicId },
        });
    }

}

