import { UserRepository } from "../../repository/userRepository";
import { EmailService, ConsoleEmailProvider } from "../email/emailService";
import { createVerificationData } from "../../utils/verificationTokenUtils";
import { prisma } from "../../database/prisma";
import bcrypt from "bcryptjs";

/**
 * CONVIDAR STAFF (Recepcionista/Admin) - ETAPA 1
 * Admin convida outro staff
 */
export class InviteStaffService {
    private userRepository = new UserRepository();
    private emailService = new EmailService(new ConsoleEmailProvider());

    async execute(
        adminId: string,
        data: {
            name: string;
            email: string;
            role: "RECEPTIONIST" | "ADMIN";
        }
    ) {
        // Verificar se quem está convidando é admin
        const admin = await this.userRepository.findById(adminId);
        if (!admin || admin.role !== "ADMIN") {
            throw new Error("Apenas administradores podem convidar staff");
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
            role: data.role,
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
        await this.emailService.sendStaffInviteEmail(
            data.email,
            data.name,
            clinic.tradeName,
            data.role,
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
 * COMPLETAR CADASTRO STAFF - ETAPA 3
 */
export class CompleteStaffService {
    private userRepository = new UserRepository();

    async execute(
        userId: string,
        data: {
            cpf: string;
            phone: string;
            password: string;
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

        if (user.role !== "RECEPTIONIST" && user.role !== "ADMIN") {
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
                mustChangePassword: true, // Staff deve trocar senha no primeiro login
                verificationToken: null,
                verificationExpires: null,
            }
        });

        return {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            message: "Cadastro completado com sucesso!"
        };
    }
}
