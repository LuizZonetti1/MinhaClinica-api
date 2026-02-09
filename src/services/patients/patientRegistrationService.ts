import { UserRepository } from "../../repository/userRepository";
import { PatientRepository } from "../../repository/patientRepository";
import { EmailService, ConsoleEmailProvider } from "../email/emailService";
import { createVerificationData, hashToken, isTokenExpired } from "../../utils/verificationTokenUtils";
import { prisma } from "../../database/prisma";
import bcrypt from "bcryptjs";

/**
 * REGISTRO DE PACIENTE - ETAPA 1
 * Usuário se cadastra sozinho (público)
 */
export class RegisterPatientService {
    private userRepository = new UserRepository();
    private emailService = new EmailService(new ConsoleEmailProvider());

    async execute(data: {
        clinicId: string;
        name: string;
        email: string;
    }) {
        // Verificar se email já existe
        const existingUser = await this.userRepository.findByEmail(
            data.clinicId,
            data.email
        );

        if (existingUser) {
            throw new Error("Email já cadastrado nesta clínica");
        }

        // Criar token de verificação
        const verification = createVerificationData(24); // 24 horas

        // Criar usuário com status pendente
        const user = await this.userRepository.createUser({
            clinicId: data.clinicId,
            name: data.name,
            email: data.email,
            phone: "00000000000", // Temporário
            cpf: "00000000000", // Temporário
            password: "temp", // Temporário
            role: "PATIENT",
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
        await this.emailService.sendPatientVerificationEmail(
            data.email,
            data.name,
            verification.token
        );

        return {
            message: "Cadastro iniciado. Verifique seu email para continuar.",
            email: data.email
        };
    }
}

/**
 * COMPLETAR CADASTRO PACIENTE - ETAPA 3
 */
export class CompletePatientService {
    private userRepository = new UserRepository();
    private patientRepository = new PatientRepository();

    async execute(
        userId: string,
        data: {
            cpf: string;
            phone: string;
            password: string;
            dateOfBirth: Date;
            gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
            rg?: string;
            zipCode?: string;
            street?: string;
            number?: string;
            complement?: string;
            neighborhood?: string;
            city?: string;
            state?: string;
            alternativePhone?: string;
            allergies?: string;
            observations?: string;
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

        if (user.role !== "PATIENT") {
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
            }
        });

        // Criar registro de paciente
        const patient = await this.patientRepository.createPatient({
            userId,
            clinicId: user.clinicId,
            cpf: data.cpf,
            rg: data.rg,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            zipCode: data.zipCode,
            street: data.street,
            number: data.number,
            complement: data.complement,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            alternativePhone: data.alternativePhone,
            allergies: data.allergies,
            observations: data.observations,
        });

        // Limpar token de verificação
        await prisma.user.update({
            where: { id: userId },
            data: {
                verificationToken: null,
                verificationExpires: null,
            }
        });

        return {
            userId: user.id,
            patientId: patient.id,
            name: user.name,
            email: user.email,
            message: "Cadastro completado com sucesso!"
        };
    }
}
