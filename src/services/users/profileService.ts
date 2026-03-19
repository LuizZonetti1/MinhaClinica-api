import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { DashboardRepository } from "../../repository/dashboardRepository";
import { UserRepository } from "../../repository/userRepository";
import { UserRole } from "../../types/enums";
import type {
  ChangePasswordInput,
  ReceptionProfileResponse,
  UpdateProfileInput,
  UserProfileResponse,
} from "../../types/profile";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.RECEPTIONIST]: "Recepcionista",
  [UserRole.PROFESSIONAL]: "Profissional",
  [UserRole.PATIENT]: "Paciente",
};

// ── GET /api/users/me ─────────────────────────────────────────────────────────

export class GetProfileService {
  private userRepository: UserRepository;
  private dashboardRepository: DashboardRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.dashboardRepository = new DashboardRepository();
  }

  async execute(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepository.findWithClinic(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const clinic = user.clinic;

    // ── Estatísticas (só disponíveis se o usuário tem clínica) ──────────────
    let totalPatients = 0;
    let activeProfessionals = 0;
    let appointmentsThisMonth = 0;
    let monthlyRevenue = 0;

    if (clinic) {
      const now = dayjs().tz(DEFAULT_TIMEZONE);
      const firstDayOfMonth = now.startOf("month").toDate();
      const firstDayOfNextMonth = now.add(1, "month").startOf("month").toDate();

      [totalPatients, activeProfessionals, appointmentsThisMonth, monthlyRevenue] =
        await Promise.all([
          this.dashboardRepository.countPatients(clinic.id),
          this.dashboardRepository.countActiveProfessionals(clinic.id),
          this.dashboardRepository.countAppointmentsThisMonth(
            clinic.id,
            firstDayOfMonth,
            firstDayOfNextMonth,
          ),
          this.dashboardRepository.getMonthlyIncome(clinic.id, firstDayOfMonth),
        ]);
    }

    // ── Endereço formatado (endereço da clínica como referência do admin) ───
    let address: string | null = null;
    if (clinic) {
      address = `${clinic.street}, ${clinic.number}${clinic.complement ? ` - ${clinic.complement}` : ""} - ${clinic.city}/${clinic.state}`;
    }

    return {
      personal: {
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        address,
        avatarUrl: user.avatarUrl ?? null,
      },
      clinic: {
        tradeName: clinic?.tradeName ?? "",
        role: ROLE_LABELS[user.role as UserRole] ?? user.role,
        foundedAt: clinic ? dayjs(clinic.createdAt).tz(DEFAULT_TIMEZONE).toISOString() : "",
        professionalsCount: activeProfessionals,
      },
      access: {
        role: user.role as UserRole,
        lastLoginAt: user.lastLoginAt
          ? dayjs(user.lastLoginAt).tz(DEFAULT_TIMEZONE).toISOString()
          : null,
        twoFactorEnabled: clinic?.settings?.twoFactorEnabled ?? false,
        sessionActive: true,
      },
      stats: {
        totalPatients,
        activeProfessionals,
        appointmentsThisMonth,
        monthlyRevenue,
      },
    };
  }
}

// ── GET /api/reception/me ────────────────────────────────────────────────────

export class GetReceptionProfileService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(userId: string): Promise<ReceptionProfileResponse> {
    const user = await this.userRepository.findWithClinic(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const clinic = user.clinic;

    const address = clinic
      ? `${clinic.street}, ${clinic.number}${clinic.complement ? ` - ${clinic.complement}` : ""} - ${clinic.city}/${clinic.state}`
      : null;

    return {
      personal: {
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        address,
        avatarUrl: user.avatarUrl ?? null,
      },
      professional: {
        role: ROLE_LABELS[UserRole.RECEPTIONIST],
        ramal: null,
        admittedAt: dayjs(user.createdAt).tz(DEFAULT_TIMEZONE).toISOString(),
        shift: null,
      },
      access: {
        role: user.role as UserRole,
        lastLoginAt: user.lastLoginAt
          ? dayjs(user.lastLoginAt).tz(DEFAULT_TIMEZONE).toISOString()
          : null,
        sessionActive: true,
      },
    };
  }
}

// ── PATCH /api/users/me ───────────────────────────────────────────────────────

export class UpdateProfileService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(userId: string, data: UpdateProfileInput) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const updated = await this.userRepository.updateUser(userId, {
      name: data.name,
      phone: data.phone,
      avatarUrl: data.avatarUrl ?? undefined,
    });

    return {
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      avatarUrl: updated.avatarUrl,
    };
  }
}

// ── PATCH /api/staff/me/password ─────────────────────────────────────────────

export class ChangePasswordService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(userId: string, data: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const passwordMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!passwordMatch) {
      throw new Error("Senha atual incorreta");
    }

    const hashed = await bcrypt.hash(data.newPassword, 10);
    await this.userRepository.updatePassword(userId, hashed);
  }
}
