import { prisma } from "../database/prisma";
import type {
    ClinicDirectoryItem,
    ClinicListFilters,
    ClinicProfessionalDirectoryItem,
} from "../types/clinicDirectory";

// Remove acentos e normaliza para lowercase — usado na comparação accent-insensitive
const stripAccents = (s: string): string =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export class ClinicDirectoryRepository {
    async listClinics(filters: ClinicListFilters = {}): Promise<ClinicDirectoryItem[]> {
        const name = filters.name?.trim() ?? "";
        const city = filters.city?.trim() ?? "";
        const specialty = filters.specialty?.trim() ?? "";

        // Filtragem por especialidade é accent+case insensitive via comparação em Node.js,
        // pois o PostgreSQL ILIKE não ignora acentos sem a extensão unaccent.
        let specialtyClinicIds: string[] | null = null;
        if (specialty) {
            const query = stripAccents(specialty);
            const rows = await prisma.specialty.findMany({
                where: { isActive: true },
                select: { clinicId: true, name: true },
            });
            const ids = rows
                .filter((s) => stripAccents(s.name).includes(query))
                .map((s) => s.clinicId)
                .filter((id): id is string => id !== null);
            specialtyClinicIds = [...new Set(ids)];
        }

        const clinics = await prisma.clinic.findMany({
            where: {
                isActive: true,
                ...(specialtyClinicIds !== null ? { id: { in: specialtyClinicIds } } : {}),
                ...(name
                    ? {
                        OR: [
                            { tradeName: { contains: name, mode: "insensitive" } },
                            { legalName: { contains: name, mode: "insensitive" } },
                        ],
                    }
                    : {}),
                ...(city
                    ? { city: { contains: city, mode: "insensitive" } }
                    : {}),
            },
            select: {
                id: true,
                tradeName: true,
                logoUrl: true,
                phone: true,
                street: true,
                number: true,
                neighborhood: true,
                city: true,
                state: true,
                specialties: {
                    where: { isActive: true },
                    select: { name: true },
                    orderBy: { name: "asc" },
                },
                _count: {
                    select: {
                        professionals: {
                            where: { user: { status: "ACTIVE" } },
                        },
                    },
                },
            },
            orderBy: { tradeName: "asc" },
        });

        return clinics.map((clinic) => ({
            id: clinic.id,
            tradeName: clinic.tradeName,
            logoUrl: clinic.logoUrl ?? null,
            phone: clinic.phone ?? null,
            street: clinic.street ?? "",
            number: clinic.number ?? "",
            neighborhood: clinic.neighborhood ?? "",
            city: clinic.city ?? "",
            state: clinic.state ?? "",
            specialtyNames: clinic.specialties.map((s) => s.name),
            professionalsCount: clinic._count.professionals,
        }));
    }

    async listProfessionals(clinicId: string): Promise<ClinicProfessionalDirectoryItem[]> {
        const professionals = await prisma.professional.findMany({
            where: {
                clinicId,
                user: { status: "ACTIVE" },
            },
            select: {
                id: true,
                professionalCouncil: true,
                registrationNumber: true,
                registrationState: true,
                bio: true,
                formations: true,
                user: {
                    select: {
                        name: true,
                        avatarUrl: true,
                    },
                },
                specialties: {
                    select: {
                        isPrimary: true,
                        specialty: {
                            select: { name: true },
                        },
                    },
                    orderBy: { isPrimary: "desc" },
                },
                workingHours: {
                    select: {
                        dayOfWeek: true,
                        startTime: true,
                        endTime: true,
                        lunchBreakStart: true,
                        lunchBreakEnd: true,
                    },
                    orderBy: { dayOfWeek: "asc" },
                },
                clinic: {
                    select: {
                        id: true,
                        tradeName: true,
                        city: true,
                        state: true,
                    },
                },
            },
            orderBy: { user: { name: "asc" } },
        });

        return professionals.map((p) => ({
            id: p.id,
            name: p.user.name,
            avatarUrl: p.user.avatarUrl ?? null,
            professionalCouncil: p.professionalCouncil,
            registrationNumber: p.registrationNumber,
            registrationState: p.registrationState,
            bio: p.bio ?? null,
            formations: p.formations ?? null,
            specialties: p.specialties.map((ps) => ({
                name: ps.specialty.name,
                isPrimary: ps.isPrimary,
            })),
            workingHours: p.workingHours.map((wh) => ({
                dayOfWeek: wh.dayOfWeek,
                startTime: wh.startTime,
                endTime: wh.endTime,
                lunchBreakStart: wh.lunchBreakStart ?? null,
                lunchBreakEnd: wh.lunchBreakEnd ?? null,
            })),
            affiliatedClinic: {
                id: p.clinic.id,
                tradeName: p.clinic.tradeName,
                city: p.clinic.city ?? "",
                state: p.clinic.state ?? "",
            },
        }));
    }

    async clinicExists(clinicId: string): Promise<boolean> {
        const count = await prisma.clinic.count({ where: { id: clinicId, isActive: true } });
        return count > 0;
    }
}
