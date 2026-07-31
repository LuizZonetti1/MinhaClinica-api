import { ProcedureRepository } from "../../repository/procedureRepository";

const procedureRepository = new ProcedureRepository();

export class ListProceduresService {
  async execute(clinicId: string, includeInactive: boolean) {
    return procedureRepository.findByClinic(clinicId, includeInactive);
  }
}
