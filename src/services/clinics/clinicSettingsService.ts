import { AuditLogRepository } from "../../repository/auditLogRepository";
import { ClinicHolidayRepository } from "../../repository/clinicHolidayRepository";
import { ClinicRepository } from "../../repository/clinicRepository";
import { ClinicWorkingHoursRepository } from "../../repository/clinicWorkingHoursRepository";
import type {
  ClinicNotificationSettings,
  ClinicPolicySettings,
  ClinicScheduleSettings,
  ClinicSecuritySettings,
  ClinicSettingsResponse,
  UpdateClinicInfoInput,
  UpdateClinicNotificationsInput,
  UpdateClinicPolicyInput,
  UpdateClinicScheduleInput,
  UpdateClinicSecurityInput,
  WorkingDaysPreset,
} from "../../types/clinic";
import type { AuditContext } from "../../types/document";
import type { DayOfWeek } from "../../types/enums";

// ── GET /api/clinics/settings ────────────────────────────────────────────────

export class GetClinicSettingsService {
  private clinicRepository: ClinicRepository;

  constructor() {
    this.clinicRepository = new ClinicRepository();
  }

  async execute(clinicId: string): Promise<ClinicSettingsResponse> {
    const clinic = await this.clinicRepository.findWithSettings(clinicId);

    if (!clinic) {
      throw new Error("Clínica não encontrada");
    }

    const s = clinic.settings;

    const schedule: ClinicScheduleSettings = {
      openTime: s?.openTime ?? "08:00",
      closeTime: s?.closeTime ?? "18:00",
      minIntervalBetweenAppointments: s?.minIntervalBetweenAppointments ?? 15,
      workingDaysPreset: (s?.workingDaysPreset ?? "WEEKDAYS") as WorkingDaysPreset,
    };

    const notifications: ClinicNotificationSettings = {
      sendAppointmentReminder: s?.sendAppointmentReminder ?? true,
      sendCancellationAlert: s?.sendCancellationAlert ?? true,
      sendNewPatientAlert: s?.sendNewPatientAlert ?? false,
      sendDailyReport: s?.sendDailyReport ?? false,
    };

    const security: ClinicSecuritySettings = {
      twoFactorEnabled: s?.twoFactorEnabled ?? false,
      accessLogEnabled: s?.accessLogEnabled ?? true,
      sessionTimeoutMinutes: s?.sessionTimeoutMinutes ?? 30,
    };

    // Espelham os @default de ClinicSettings (prisma/schema.prisma) — mesmos
    // valores usados como fallback em assertSlotIsBookable/autoNoShowService
    // quando a clínica ainda não tem uma linha de settings salva.
    const policy: ClinicPolicySettings = {
      allowOnlineBooking: s?.allowOnlineBooking ?? true,
      minAdvanceBookingHours: s?.minAdvanceBookingHours ?? 2,
      maxAdvanceBookingDays: s?.maxAdvanceBookingDays ?? 60,
      maxCancellationHours: s?.maxCancellationHours ?? 24,
      maxConsecutiveNoShows: s?.maxConsecutiveNoShows ?? 3,
      appointmentToleranceMinutes: s?.appointmentToleranceMinutes ?? 15,
    };

    return {
      info: {
        id: clinic.id,
        legalName: clinic.legalName,
        tradeName: clinic.tradeName,
        cnpj: clinic.cnpj,
        email: clinic.email,
        phone: clinic.phone,
        website: clinic.website,
        logoUrl: clinic.logoUrl,
        zipCode: clinic.zipCode,
        street: clinic.street,
        number: clinic.number,
        complement: clinic.complement,
        neighborhood: clinic.neighborhood,
        city: clinic.city,
        state: clinic.state,
        timezone: clinic.timezone,
        isActive: clinic.isActive,
        createdAt: clinic.createdAt,
        updatedAt: clinic.updatedAt,
      },
      schedule,
      notifications,
      security,
      policy,
    };
  }
}

// ── PATCH /api/clinics/settings/info ────────────────────────────────────────

export class UpdateClinicInfoService {
  private clinicRepository: ClinicRepository;
  private auditLogRepository = new AuditLogRepository();

  constructor() {
    this.clinicRepository = new ClinicRepository();
  }

  async execute(clinicId: string, data: UpdateClinicInfoInput, context: AuditContext) {
    const existing = await this.clinicRepository.findById(clinicId);

    if (!existing) {
      throw new Error("Clínica não encontrada");
    }

    try {
      const updated = await this.clinicRepository.updateClinic(clinicId, data);
      await this.auditLogRepository.create({
        clinicId,
        userId: context.userId,
        userName: context.userName,
        action: "UPDATE_CLINIC_INFO",
        entity: "Clinic",
        entityId: clinicId,
        newData: data,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        const field = error.meta?.target?.[0];
        if (field === "cnpj") throw new Error("CNPJ já está cadastrado");
        if (field === "email") throw new Error("E-mail já está cadastrado");
        throw new Error("Já existe uma clínica com estes dados");
      }
      throw error;
    }
  }
}

// ── PATCH /api/clinics/settings/schedule ────────────────────────────────────

export class UpdateClinicScheduleService {
  private clinicRepository: ClinicRepository;
  private auditLogRepository = new AuditLogRepository();

  constructor() {
    this.clinicRepository = new ClinicRepository();
  }

  async execute(clinicId: string, data: UpdateClinicScheduleInput, context: AuditContext) {
    const existing = await this.clinicRepository.findById(clinicId);

    if (!existing) {
      throw new Error("Clínica não encontrada");
    }

    // Um PATCH pode enviar só um dos dois horários — valida contra o que vai
    // valer depois de aplicado (o novo valor, ou o que já está salvo).
    const existingSettings = await this.clinicRepository.findSettingsByClinicId(clinicId);
    const effectiveOpenTime = data.openTime ?? existingSettings?.openTime ?? "08:00";
    const effectiveCloseTime = data.closeTime ?? existingSettings?.closeTime ?? "18:00";

    if (effectiveOpenTime >= effectiveCloseTime) {
      throw Object.assign(
        new Error("Horário de fechamento deve ser depois do horário de abertura."),
        { statusCode: 400 },
      );
    }

    const updated = await this.clinicRepository.upsertSettings(clinicId, {
      openTime: data.openTime,
      closeTime: data.closeTime,
      minIntervalBetweenAppointments: data.minIntervalBetweenAppointments,
      workingDaysPreset: data.workingDaysPreset,
    });
    await this.auditLogRepository.create({
      clinicId,
      userId: context.userId,
      userName: context.userName,
      action: "UPDATE_CLINIC_SCHEDULE",
      entity: "ClinicSettings",
      entityId: clinicId,
      newData: data,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return updated;
  }
}

// ── PATCH /api/clinics/settings/notifications ────────────────────────────────

export class UpdateClinicNotificationsService {
  private clinicRepository: ClinicRepository;
  private auditLogRepository = new AuditLogRepository();

  constructor() {
    this.clinicRepository = new ClinicRepository();
  }

  async execute(clinicId: string, data: UpdateClinicNotificationsInput, context: AuditContext) {
    const existing = await this.clinicRepository.findById(clinicId);

    if (!existing) {
      throw new Error("Clínica não encontrada");
    }

    const updated = await this.clinicRepository.upsertSettings(clinicId, {
      sendAppointmentReminder: data.sendAppointmentReminder,
      sendCancellationAlert: data.sendCancellationAlert,
      sendNewPatientAlert: data.sendNewPatientAlert,
      sendDailyReport: data.sendDailyReport,
    });
    await this.auditLogRepository.create({
      clinicId,
      userId: context.userId,
      userName: context.userName,
      action: "UPDATE_CLINIC_NOTIFICATIONS",
      entity: "ClinicSettings",
      entityId: clinicId,
      newData: data,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return updated;
  }
}

// ── PATCH /api/clinics/settings/security ─────────────────────────────────────

export class UpdateClinicSecurityService {
  private clinicRepository: ClinicRepository;
  private auditLogRepository = new AuditLogRepository();

  constructor() {
    this.clinicRepository = new ClinicRepository();
  }

  async execute(clinicId: string, data: UpdateClinicSecurityInput, context: AuditContext) {
    const existing = await this.clinicRepository.findById(clinicId);

    if (!existing) {
      throw new Error("Clínica não encontrada");
    }

    const updated = await this.clinicRepository.upsertSettings(clinicId, {
      twoFactorEnabled: data.twoFactorEnabled,
      accessLogEnabled: data.accessLogEnabled,
      sessionTimeoutMinutes: data.sessionTimeoutMinutes,
    });
    await this.auditLogRepository.create({
      clinicId,
      userId: context.userId,
      userName: context.userName,
      action: "UPDATE_CLINIC_SECURITY",
      entity: "ClinicSettings",
      entityId: clinicId,
      newData: data,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return updated;
  }
}

// ── PATCH /api/clinics/settings/policy ───────────────────────────────────────

export class UpdateClinicPolicyService {
  private clinicRepository: ClinicRepository;
  private auditLogRepository = new AuditLogRepository();

  constructor() {
    this.clinicRepository = new ClinicRepository();
  }

  async execute(clinicId: string, data: UpdateClinicPolicyInput, context: AuditContext) {
    const existing = await this.clinicRepository.findById(clinicId);

    if (!existing) {
      throw new Error("Clínica não encontrada");
    }

    const updated = await this.clinicRepository.upsertSettings(clinicId, {
      allowOnlineBooking: data.allowOnlineBooking,
      minAdvanceBookingHours: data.minAdvanceBookingHours,
      maxAdvanceBookingDays: data.maxAdvanceBookingDays,
      maxCancellationHours: data.maxCancellationHours,
      maxConsecutiveNoShows: data.maxConsecutiveNoShows,
      appointmentToleranceMinutes: data.appointmentToleranceMinutes,
    });
    await this.auditLogRepository.create({
      clinicId,
      userId: context.userId,
      userName: context.userName,
      action: "UPDATE_CLINIC_POLICY",
      entity: "ClinicSettings",
      entityId: clinicId,
      newData: data,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return updated;
  }
}

// ── GET/PUT /api/clinics/settings/working-hours ──────────────────────────────
// ClinicWorkingHours (horário por dia da semana) — antes vestigial: nenhum
// código de produção lia ou escrevia essa tabela, só o seed. A tela de
// Configurações achatava tudo em openTime/closeTime únicos (ClinicSettings).

export class GetClinicWorkingHoursService {
  private repository = new ClinicWorkingHoursRepository();

  async execute(clinicId: string) {
    return this.repository.findByClinic(clinicId);
  }
}

export class UpdateClinicWorkingHoursService {
  private repository = new ClinicWorkingHoursRepository();
  private auditLogRepository = new AuditLogRepository();

  async execute(
    clinicId: string,
    days: { dayOfWeek: DayOfWeek; isOpen: boolean; openTime: string; closeTime: string }[],
    context: AuditContext,
  ) {
    const updated = await this.repository.upsertMany(clinicId, days);
    await this.auditLogRepository.create({
      clinicId,
      userId: context.userId,
      userName: context.userName,
      action: "UPDATE_CLINIC_WORKING_HOURS",
      entity: "ClinicWorkingHours",
      entityId: clinicId,
      newData: { days },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return updated;
  }
}

// ── GET/POST/DELETE /api/clinics/settings/holidays ───────────────────────────
// ClinicHoliday — antes vestigial: nenhum código de produção lia ou escrevia,
// só o seed (feriados nunca bloqueavam agendamento na prática, embora
// assertSlotIsBookable já os leia desde V5).

export class GetClinicHolidaysService {
  private repository = new ClinicHolidayRepository();

  async execute(clinicId: string) {
    return this.repository.findByClinic(clinicId);
  }
}

export class CreateClinicHolidayService {
  private repository = new ClinicHolidayRepository();
  private auditLogRepository = new AuditLogRepository();

  async execute(
    clinicId: string,
    data: { date: Date; description: string; isRecurring: boolean },
    context: AuditContext,
  ) {
    const holiday = await this.repository.create({ clinicId, ...data });
    await this.auditLogRepository.create({
      clinicId,
      userId: context.userId,
      userName: context.userName,
      action: "CREATE_CLINIC_HOLIDAY",
      entity: "ClinicHoliday",
      entityId: holiday.id,
      newData: data,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return holiday;
  }
}

export class DeleteClinicHolidayService {
  private repository = new ClinicHolidayRepository();
  private auditLogRepository = new AuditLogRepository();

  async execute(clinicId: string, holidayId: string, context: AuditContext): Promise<void> {
    const holiday = await this.repository.findById(holidayId);
    if (!holiday || holiday.clinicId !== clinicId) {
      throw Object.assign(new Error("Feriado não encontrado"), { statusCode: 404 });
    }
    await this.repository.delete(holidayId);
    await this.auditLogRepository.create({
      clinicId,
      userId: context.userId,
      userName: context.userName,
      action: "DELETE_CLINIC_HOLIDAY",
      entity: "ClinicHoliday",
      entityId: holidayId,
      oldData: { date: holiday.date, description: holiday.description },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
