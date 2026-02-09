import { ClinicRepository } from "../../repository/clinicRepository";

export class DeleteClinicService {
    async execute(clinicId: string) {
        const clinicRepository = new ClinicRepository();
        return await clinicRepository.delete(clinicId);
    }
}
