import { UserRepository } from "../../repository/userRepository";
import { EmailService, ConsoleEmailProvider } from "../email/emailService";
import { createVerificationData } from "../../utils/verificationTokenUtils";
import { prisma } from "../../database/prisma";
import bcrypt from "bcryptjs";

/**
 * CONVIDAR PROFISSIONAL - ETAPA 1
 * Admin convida profissional
 */
export class InviteProfessionalService {
    private userRepository = new UserRepository();
    private emailService = new EmailService(new ConsoleEmailProvider());

    async execute(
        adminId: string,
        data: {
            name: string;
            email: string;
        }
    ) {
        // Verificar se quem está convidando é admin
        const admin = await this.userRepository.findById(adminId);
        if (!admin || admin.role !== "ADMIN") {
            throw new Error("Apenas administradores podem convidar profissionais");
        }

        // Verificar se email já existe
        const existingUser = await this.userRepository.findByEmail(
            admin.clinicId,
            data.email
        );

        if (existingUser) {
            throw new Error("Email já cadastrado nesta clínica");
        }

        // Buscar nome da clínica
        const clinic = await prisma.clinic.findUnique({
            where: { id: admin.clinicId }
        });

        if (!clinic) {
            throw new Error("Clínica não encontrada");
        }

        // Criar token de verificação
        const verification = createVerificationData(48); // 48 horas

        // Criar usuário com status pendente
        const user = await this.userRepository.createUser({
            clinicId: admin.clinicId,
            name: data.name,
            email: data.email,
            phone: "00000000000", // Temporário
            cpf: "00000000000", // Temporário
            password: "temp", // Temporário
            role: "PROFESSIONAL",
            status: "PENDING_ACTIVATION",
            mustChangePassword: false,
        });

        // Salvar token de verificação
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken: verification.hashedToken,
                verificationExpires: verification.expiresAt,
            }
        });

        // Enviar email
        await this.emailService.sendProfessionalInviteEmail(
            data.email,
            data.name,
            clinic.tradeName,
            verification.token
        );

        return {
            message: "Convite enviado com sucesso",
            email: data.email,
            userId: user.id
        };
    }
}

/**
 * COMPLETAR CADASTRO PROFISSIONAL - ETAPA 3
 */
export class CompleteProfessionalService {
    private userRepository = new UserRepository();

    async execute(
        userId: string,
        data: {
            cpf: string;
            phone: string;
            password: string;
            professionalCouncil: string;
            registrationNumber: string;
            registrationState: string;
            defaultAppointmentDuration?: number;
        }
    ) {
        // Buscar usuário
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        if (user.status !== "PENDING_ACTIVATION") {
            throw new Error("Usuário já ativo ou status inválido");
        }

        if (user.role !== "PROFESSIONAL") {
            throw new Error("Tipo de usuário inválido");
        }

        // Verificar se CPF já existe em outro usuário
        const existingCpf = await this.userRepository.findByCpf(user.clinicId, data.cpf);
        if (existingCpf && existingCpf.id !== userId) {
            throw new Error("CPF já cadastrado");
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Atualizar dados do usuário
        await prisma.user.update({
            where: { id: userId },
            data: {
                cpf: data.cpf,
                phone: data.phone,
                password: hashedPassword,
                status: "ACTIVE", // Ativa o usuário
                verificationToken: null,
                verificationExpires: null,
            }
        });

        // Criar registro de profissional
        const professional = await prisma.professional.create({
            data: {
                userId,
                clinicId: user.clinicId,
                professionalCouncil: data.professionalCouncil,
                registrationNumber: data.registrationNumber,
                registrationState: data.registrationState,
                defaultAppointmentDuration: data.defaultAppointmentDuration || 30,
            }
        });

        return {
            userId: user.id,
            professionalId: professional.id,
            name: user.name,
            email: user.email,
            message: "Cadastro completado com sucesso!"
        };
    }
}
