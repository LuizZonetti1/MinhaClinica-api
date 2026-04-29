import { ClinicDirectoryRepository } from "../../repository/clinicDirectoryRepository";
import type { ClinicProfessionalDirectoryItem } from "../../types/clinicDirectory";

export class ListClinicProfessionalsService {
    private repository = new ClinicDirectoryRepository();

    async execute(clinicId: string): Promise<ClinicProfessionalDirectoryItem[]> {
        const exists = await this.repository.clinicExists(clinicId);
        if (!exists) {
            const error = new Error("Clínica não encontrada") as Error & { statusCode: number };
            error.statusCode = 404;
            throw error;
        }

        return this.repository.listProfessionals(clinicId);
    }
}
