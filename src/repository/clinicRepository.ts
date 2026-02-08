import { prisma } from "../database/prisma";

export class ClinicRepository {
    async createClinic(data: {
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
    }) {
        return prisma.clinic.create({
            data,
        });
    }

    async findByNameAndAddress(
        tradeName: string,
        street: string,
        number: string,
        city: string,
        state: string
    ) {
        return prisma.clinic.findFirst({
            where: {
                tradeName,
                street,
                number,
                city,
                state,
            },
        });
    }
}
