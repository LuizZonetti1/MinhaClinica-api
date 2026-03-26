import { prisma } from "../../database/prisma";
import type { ClinicSearchItem } from "../../types/patient";

export class SearchClinicsService {
  async execute(q: string): Promise<ClinicSearchItem[]> {
    const term = q.trim();

    const clinics = await prisma.clinic.findMany({
      where: {
        isActive: true,
        ...(term
          ? {
              OR: [
                { tradeName: { contains: term, mode: "insensitive" } },
                { legalName: { contains: term, mode: "insensitive" } },
                { city: { contains: term, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        tradeName: true,
        logoUrl: true,
        street: true,
        number: true,
        neighborhood: true,
        city: true,
        state: true,
      },
      orderBy: { tradeName: "asc" },
      take: 20,
    });

    return clinics;
  }
}
