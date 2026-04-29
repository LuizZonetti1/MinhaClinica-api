import { ClinicDirectoryRepository } from "../../repository/clinicDirectoryRepository";
import type { ClinicDirectoryItem } from "../../types/clinicDirectory";

export class ListClinicsService {
    private repository = new ClinicDirectoryRepository();

    async execute(q?: string): Promise<ClinicDirectoryItem[]> {
        return this.repository.listClinics(q);
    }
}
