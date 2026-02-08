import { ClinicRepository } from "../repository/clinicRepository";

interface CreateClinicRequest {
    legalName: string,
    tradeName: string,
    cnpj: string,
    email: string,
    phone: string,
    zipCode: string,
    street: string,
    number: string,
    neighborhood: string,
    city: string,
    state: string,
    timezone: string,
    isActive: boolean,
    complement?: string,
    logoUrl?: string,
    website?: string,
    subdomain?: string,
    customDomain?: string,
}


export class CreateClinicService {
    private clinicRepository: ClinicRepository;

    constructor() {
        this.clinicRepository = new ClinicRepository();
    }

    async execute(data: CreateClinicRequest) {
        try {
            // Verifica se já existe uma clínica com o MESMO NOME no MESMO ENDEREÇO
            const existingClinic = await this.clinicRepository.findByNameAndAddress(
                data.tradeName,
                data.street,
                data.number,
                data.city,
                data.state
            );

            if (existingClinic) {
                throw new Error(
                    `Já existe uma clínica com o nome "${data.tradeName}" neste endereço: ${data.street}, ${data.number} - ${data.city}/${data.state}`
                );
            }

            // Cria a clínica se não houver duplicação
            const clinic = await this.clinicRepository.createClinic(data);

            if (!clinic) {
                throw new Error("Erro ao criar clínica");
            }

            return clinic;
        } catch (error: any) {
            // Trata erros do Prisma
            if (error.code === 'P2002') {
                // Unique constraint violation
                const field = error.meta?.target?.[0];
                
                if (field === 'cnpj') {
                    throw new Error(`CNPJ ${data.cnpj} já está cadastrado`);
                }
                if (field === 'email') {
                    throw new Error(`Email ${data.email} já está cadastrado`);
                }
                if (field === 'subdomain') {
                    throw new Error(`Subdomain já está em uso`);
                }
                
                throw new Error('Já existe uma clínica com estes dados');
            }
            
            // Repassa outros erros
            throw error;
        }
    }
}