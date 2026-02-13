import { ClinicRepository } from "../../repository/clinicRepository";

interface UpdateClinicRequest {
  legalName?: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  timezone?: string;
  isActive?: boolean;
  complement?: string;
  logoUrl?: string;
  website?: string;
  subdomain?: string;
  customDomain?: string;
}

export class UpdateClinicService {
  private clinicRepository: ClinicRepository;

  constructor() {
    this.clinicRepository = new ClinicRepository();
  }

  async execute(clinicId: string, data: UpdateClinicRequest) {
    try {
      // Verifica se a clínica existe
      const existingClinic = await this.clinicRepository.findById(clinicId);

      if (!existingClinic) {
        throw new Error("Clínica não encontrada");
      }

      // Atualiza a clínica
      const clinic = await this.clinicRepository.updateClinic(clinicId, data);

      return clinic;
    } catch (error: any) {
      // Trata erros do Prisma
      if (error.code === "P2002") {
        const field = error.meta?.target?.[0];

        if (field === "cnpj") {
          throw new Error(`CNPJ já está cadastrado`);
        }
        if (field === "email") {
          throw new Error(`Email já está cadastrado`);
        }
        if (field === "subdomain") {
          throw new Error(`Subdomain já está em uso`);
        }

        throw new Error("Já existe uma clínica com estes dados");
      }

      throw error;
    }
  }
}
