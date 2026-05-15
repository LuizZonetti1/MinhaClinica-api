import { prisma } from "../../database/prisma";
import { Gender, NotificationChannel, NotificationType, UserRole } from "../../types/enums";
import { generateAuthToken } from "../../utils/jwtUtils";

// Roles que cada role primário pode acumular além do seu próprio
const ALLOWED_EXTRA_ROLES: Record<UserRole, UserRole[]> = {
    [UserRole.ADMIN]: [UserRole.PROFESSIONAL, UserRole.RECEPTIONIST, UserRole.PATIENT],
    [UserRole.PROFESSIONAL]: [UserRole.PATIENT],
    [UserRole.RECEPTIONIST]: [UserRole.PATIENT],
    [UserRole.PATIENT]: [],
};

export class UpdateUserRolesService {
    async execute(userId: string, roles: UserRole[]): Promise<{ token: string; roles: UserRole[] }> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) throw new Error("Usuário não encontrado");

        const primaryRole = user.role;
        const allowed = ALLOWED_EXTRA_ROLES[primaryRole];

        // Role primário sempre deve estar incluído
        if (!roles.includes(primaryRole)) {
            throw new Error(`O papel primário (${primaryRole}) não pode ser removido`);
        }

        // Valida que todos os roles enviados são permitidos
        const invalid = roles.filter((r) => r !== primaryRole && !allowed.includes(r));
        if (invalid.length > 0) {
            throw new Error(`Papéis não permitidos: ${invalid.join(", ")}`);
        }

        // Remove duplicatas
        const uniqueRoles = [...new Set(roles)];

        // Reconcilia registros de Professional e Patient com base no estado final dos roles.
        // Executado ANTES do update para que erros (ex: CPF ausente) abortem a operação.
        await this.reconcileProfessional(user.id, user.clinicId, uniqueRoles);
        await this.reconcilePatient(user.id, user.cpf, uniqueRoles);

        await prisma.user.update({
            where: { id: userId },
            data: { roles: uniqueRoles },
        });

        // Gera novo token com roles atualizados
        const token = generateAuthToken(user.id, user.clinicId, user.role, user.name, {}, uniqueRoles);

        return { token, roles: uniqueRoles };
    }

    /**
     * Garante que o registro Professional existe e está ativo quando PROFESSIONAL está nos roles,
     * ou o desativa quando não está. Não deleta para preservar histórico (agenda, consultas).
     */
    private async reconcileProfessional(
        userId: string,
        clinicId: string | null,
        roles: UserRole[],
    ): Promise<void> {
        if (!clinicId) return; // sem clínica não há registro de profissional

        const hasProfessional = roles.includes(UserRole.PROFESSIONAL);
        const existing = await prisma.professional.findUnique({ where: { userId } });

        if (hasProfessional) {
            if (existing) {
                // Já existe: apenas reativa se estava inativo
                if (!existing.isActive) {
                    await prisma.professional.update({
                        where: { id: existing.id },
                        data: { isActive: true },
                    });
                }
            } else {
                // Cria o registro com valores padrão. Os campos obrigatórios (conselho, CRM, estado)
                // ficam em branco e podem ser preenchidos via EditProfile do profissional.
                await prisma.professional.create({
                    data: {
                        clinicId,
                        userId,
                        professionalCouncil: "",
                        registrationNumber: "",
                        registrationState: "",
                    },
                });

                // Notifica o profissional para completar o perfil (fire-and-forget)
                void (async () => {
                    try {
                        const userRecord = await prisma.user.findUnique({
                            where: { id: userId },
                            select: { email: true, name: true, phone: true },
                        });
                        if (!userRecord) return;
                        const { NotificationRepository } = await import(
                            "../../repository/notificationRepository"
                        );
                        const notifRepo = new NotificationRepository();
                        await notifRepo.create({
                            clinicId,
                            recipientEmail: userRecord.email,
                            recipientPhone: userRecord.phone ?? undefined,
                            recipientName: userRecord.name,
                            recipientUserId: userId,
                            type: NotificationType.SYSTEM_ALERT,
                            channel: NotificationChannel.IN_APP,
                            subject: "Complete seu perfil profissional",
                            message:
                                "Complete seu perfil profissional — adicione conselho, especialidades e horários de atendimento.",
                        });
                    } catch {
                        // fire-and-forget: não propaga erro
                    }
                })();
            }
        } else {
            // Remove o papel: desativa o registro sem apagar histórico
            if (existing?.isActive) {
                await prisma.professional.update({
                    where: { id: existing.id },
                    data: { isActive: false },
                });
            }
        }
    }

    /**
     * Garante que o registro Patient existe e está ativo quando PATIENT está nos roles.
     * Patient é universal (clinicId nulo) — aparece em todas as clínicas ao ser consultado.
     * Desativa o registro quando PATIENT é removido dos roles.
     */
    private async reconcilePatient(
        userId: string,
        userCpf: string | null,
        roles: UserRole[],
    ): Promise<void> {
        const hasPatient = roles.includes(UserRole.PATIENT);
        const existing = await prisma.patient.findUnique({ where: { userId } });

        if (hasPatient) {
            if (existing) {
                // Já existe: apenas reativa se estava inativo
                if (!existing.isActive) {
                    await prisma.patient.update({
                        where: { id: existing.id },
                        data: { isActive: true },
                    });
                }
            } else {
                // Precisa criar: CPF é obrigatório
                if (!userCpf) {
                    throw new Error(
                        "Preencha o CPF no seu perfil antes de ativar o papel de Paciente.",
                    );
                }

                // Garante que o CPF não está vinculado a outro usuário
                const cpfOwner = await prisma.patient.findUnique({ where: { cpf: userCpf } });
                if (cpfOwner) {
                    throw new Error("Este CPF já está cadastrado como paciente por outro usuário.");
                }

                await prisma.patient.create({
                    data: {
                        userId,
                        clinicId: null, // Universal: sem vínculo com clínica específica
                        cpf: userCpf,
                        dateOfBirth: new Date("1900-01-01"), // Placeholder — atualizar via perfil do paciente
                        gender: Gender.PREFER_NOT_TO_SAY,   // Placeholder — atualizar via perfil do paciente
                    },
                });
            }
        } else {
            // Remove o papel: desativa sem apagar histórico de consultas
            if (existing?.isActive) {
                await prisma.patient.update({
                    where: { id: existing.id },
                    data: { isActive: false },
                });
            }
        }
    }
}
