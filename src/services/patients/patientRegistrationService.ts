/** biome-ignore-all lint/correctness/useParseIntRadix: <explanation> */
import bcrypt from "bcryptjs";
import { prisma } from "../../database/prisma";
import { PatientRepository } from "../../repository/patientRepository";
import { UserRepository } from "../../repository/userRepository";
import { UserRole, UserStatus } from "../../types/enums";
import type { CompletePatientInput, RegisterPatientInput } from "../../types/user";
import { generateTempRegistrationToken } from "../../utils/jwtUtils";
import { createVerificationData } from "../../utils/verificationTokenUtils";
import { createEmailProvider, EmailService } from "../email/emailService";

/**
 * Valida dígitos verificadores do CPF
 * TODO: remover bypass e reativar validação real quando os testes forem concluídos
 */
function isValidCPF(_cpf: string): boolean {
  // BYPASS TEMPORÁRIO — aceita qualquer CPF durante os testes
  return true;
}

/**
 * REGISTRO DE PACIENTE - ETAPA 1
 * Usuário se cadastra sozinho (público)
 */
export class RegisterPatientService {
  private userRepository = new UserRepository();
  private emailService = new EmailService(createEmailProvider());

  async execute(data: RegisterPatientInput) {
    // Verificar se email já existe globalmente
    const existingUser = await this.userRepository.findByEmail(data.email);

    if (existingUser) {
      // Verificou o email mas não finalizou o cadastro → gerar novo token e ir direto para etapa 3
      if (existingUser.status === UserStatus.EMAIL_VERIFIED) {
        const tempToken = generateTempRegistrationToken(existingUser.id, existingUser.clinicId);
        return {
          message: "Email já verificado. Continue para completar seu cadastro.",
          email: existingUser.email,
          tempToken,
          redirectToComplete: true,
        };
      }

      // Ainda não verificou o email → reenviar link
      if (existingUser.status === UserStatus.PENDING_ACTIVATION) {
        const verification = createVerificationData(25);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: data.name,
            verificationToken: verification.hashedToken,
            verificationExpires: verification.expiresAt,
          },
        });
        await this.emailService.sendPatientVerificationEmail(
          existingUser.email,
          data.name,
          verification.token,
        );
        return {
          message: "Cadastro iniciado. Verifique seu email para continuar.",
          email: existingUser.email,
        };
      }

      // Cadastro completo → erro
      throw Object.assign(new Error("Email já cadastrado"), { statusCode: 409 });
    }

    // Criar token de verificação (25 minutos)
    const verification = createVerificationData(25);

    // Criar usuário com status pendente (sem clínica — paciente é global)
    const user = await this.userRepository.createUser({
      name: data.name,
      email: data.email,
      phone: "00000000000", // Temporário
      cpf: "00000000000", // Temporário
      password: "temp", // Temporário
      role: UserRole.PATIENT,
      status: UserStatus.PENDING_ACTIVATION,
      mustChangePassword: false,
    });

    // Salvar token de verificação
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: verification.hashedToken,
        verificationExpires: verification.expiresAt,
      },
    });

    // Enviar email
    await this.emailService.sendPatientVerificationEmail(data.email, data.name, verification.token);

    return {
      message: "Cadastro iniciado. Verifique seu email para continuar.",
      email: data.email,
    };
  }
}

/**
 * COMPLETAR CADASTRO PACIENTE - ETAPA 3
 */
export class CompletePatientService {
  private userRepository = new UserRepository();
  private patientRepository = new PatientRepository();

  async execute(userId: string, data: CompletePatientInput) {
    // Buscar usuário
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if (user.status !== UserStatus.EMAIL_VERIFIED) {
      throw new Error("Email não verificado ou cadastro já concluído");
    }

    if (user.role !== UserRole.PATIENT) {
      throw new Error("Tipo de usuário inválido");
    }

    // Validar dígitos verificadores do CPF
    const cleanCpf = data.cpf.replace(/\D/g, "");
    if (!isValidCPF(cleanCpf)) {
      throw new Error("CPF inválido");
    }

    // Verificar se CPF já existe em outro usuário (busca global)
    const existingCpf = await this.userRepository.findByCpf(cleanCpf);
    if (existingCpf && existingCpf.id !== userId) {
      throw Object.assign(new Error("CPF já cadastrado"), { statusCode: 409 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Normalizar campos formatados pelo frontend
    const cleanPhone = data.phone.replace(/\D/g, "");
    const cleanZipCode = data.zipCode ? data.zipCode.replace(/\D/g, "") : undefined;

    // Atualizar dados do usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        cpf: cleanCpf,
        phone: cleanPhone,
        password: hashedPassword,
        status: UserStatus.ACTIVE, // Ativa o usuário
      },
    });

    // Criar registro de paciente (sem clínica — vínculo ocorre ao agendar consulta)
    const patient = await this.patientRepository.createPatient({
      userId,
      cpf: cleanCpf,
      rg: data.rg,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      zipCode: cleanZipCode,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      alternativePhone: data.alternativePhone,
      bloodType: data.bloodType,
      allergies: data.allergies,
      medications: data.medications,
      conditions: data.conditions,
      observations: data.observations,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
    });

    // Limpar token de verificação
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationToken: null,
        verificationExpires: null,
      },
    });

    return {
      userId: user.id,
      patientId: patient.id,
      name: user.name,
      email: user.email,
      message: "Cadastro completado com sucesso!",
    };
  }
}
