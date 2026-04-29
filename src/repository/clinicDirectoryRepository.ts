import { prisma } from "../database/prisma";
import type {
    ClinicDirectoryItem,
    ClinicProfessionalDirectoryItem,
} from "../types/clinicDirectory";

export class ClinicDirectoryRepository {
    async listClinics(q?: string): Promise<ClinicDirectoryItem[]> {
        const term = q?.trim() ?? "";

        const clinics = await prisma.clinic.findMany({
            where: {
                isActive: true,
                ...(term
                    ? {
                        OR: [
                            { tradeName: { contains: term, mode: "insensitive" } },
                            { legalName: { contains: term, mode: "insensitive" } },
                            { city: { contains: term, mode: "insensitive" } },
                        ],
                    }
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
