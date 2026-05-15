import { ClinicDirectoryRepository } from "../../repository/clinicDirectoryRepository";
import type { ClinicDirectoryItem, ClinicListFilters } from "../../types/clinicDirectory";

export class ListClinicsService {
    private repository = new ClinicDirectoryRepository();

    async execute(filters: ClinicListFilters = {}): Promise<ClinicDirectoryItem[]> {
        return this.repository.listClinics(filters);
    }
}
