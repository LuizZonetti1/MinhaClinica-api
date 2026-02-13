import { ClinicRepository } from "../../repository/clinicRepository";

export class GetClinicService {
  private clinicRepository: ClinicRepository;

  constructor() {
    this.clinicRepository = new ClinicRepository();
  }

  // Buscar clínica por ID
  async getById(clinicId: string) {
    const clinic = await this.clinicRepository.findById(clinicId);

    if (!clinic) {
      throw new Error("Clínica não encontrada");
    }

    return clinic;
  }

  // Listar todas as clínicas
  async getAll() {
    return await this.clinicRepository.findAll();
  }
}
