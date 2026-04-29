export interface ClinicDirectoryItem {
    id: string;
    tradeName: string;
    logoUrl: string | null;
    phone: string | null;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    specialtyNames: string[];
    professionalsCount: number;
}

export interface ClinicProfessionalSpecialty {
    name: string;
    isPrimary: boolean;
}

export interface ClinicProfessionalWorkingHour {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    lunchBreakStart: string | null;
    lunchBreakEnd: string | null;
}

export interface ClinicProfessionalDirectoryItem {
    id: string;
    name: string;
    avatarUrl: string | null;
    professionalCouncil: string;
    registrationNumber: string;
    registrationState: string;
    bio: string | null;
    formations: string | null;
    specialties: ClinicProfessionalSpecialty[];
    workingHours: ClinicProfessionalWorkingHour[];
    affiliatedClinic: {
        id: string;
        tradeName: string;
        city: string;
        state: string;
    };
}
