import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "../../database/prisma";
import { ClinicRepository } from "../../repository/clinicRepository";
import { PatientRepository } from "../../repository/patientRepository";
import { UserRepository } from "../../repository/userRepository";
import type { ReceptionRegisterPatientInput } from "../../types/patient";
import { UserRole, UserStatus } from "../../types/enums";
import { createVerificationData } from "../../utils/verificationTokenUtils";
import { createEmailProvider, EmailService } from "../email/emailService";

/**
 * Gera uma senha aleatória segura com letras maiúsculas, minúsculas e números
 */
function generateRandomPassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;

  // Garante ao menos 1 de cada categoria
  const mandatory = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
  ];

  const rest = Array.from({ length: length - mandatory.length }, () => {
    return all[crypto.randomInt(all.length)];
  });

  return [...mandatory, ...rest]
    .sort(() => crypto.randomInt(3) - 1)
    .join("");
}

/**
 * CADASTRO DE PACIENTE PELA RECEPÇÃO
 *
 * Cria o User (global, sem clinicId) e o Patient em uma única etapa.
 * A conta é criada com status PENDING_ACTIVATION.
 * Um email é enviado com senha temporária + link "Ativar Conta".
 */
export class ReceptionPatientRegistrationService {
  private userRepository = new UserRepository();
  private patientRepository = new PatientRepository();
  private clinicRepository = new ClinicRepository();
  private emailService = new EmailService(createEmailProvider());

  async execute(data: ReceptionRegisterPatientInput, clinicId: string) {
    // ── 0) Buscar nome da clínica para o email ───────────────────────────────
    const clinic = await this.clinicRepository.findById(clinicId);
    const clinicName = clinic?.tradeName ?? clinic?.legalName ?? "Minha Clínica";

    // ── 1) Verificar duplicidade de email ────────────────────────────────────
    const existingUser = await this.userRepository.findByEmail(data.email);

    if (existingUser) {
      if (existingUser.status === UserStatus.PENDING_ACTIVATION) {
        throw Object.assign(
          new Error(
            "Este email já possui um cadastro aguardando ativação. Solicite ao paciente que verifique sua caixa de entrada.",
          ),
          { statusCode: 409 },
        );
      }
      throw Object.assign(new Error("Email já cadastrado"), { statusCode: 409 });
    }

    // ── 2) Verificar duplicidade de CPF ──────────────────────────────────────
    const cleanCpf = data.cpf.replace(/\D/g, "");
    const existingCpf = await this.userRepository.findByCpf(cleanCpf);
    if (existingCpf) {
      throw Object.assign(new Error("CPF já cadastrado"), { statusCode: 409 });
    }

    // ── 3) Gerar senha aleatória e hashear ─────────────────────────────────
    const temporaryPassword = generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // ── 4) Normalizar dados formatados do frontend ─────────────────────────
    const cleanPhone = data.phone.replace(/\D/g, "");
    const cleanZipCode = data.zipCode ? data.zipCode.replace(/\D/g, "") : undefined;

    // ── 5) Criar User global (sem clinicId) ────────────────────────────────
    const user = await this.userRepository.createUser({
      name: data.name,
      email: data.email,
      cpf: cleanCpf,
      phone: cleanPhone,
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.PENDING_ACTIVATION,
      mustChangePassword: false,
    });

    // ── 6) Criar Patient sem vínculo de clínica ────────────────────────────
    // O vínculo com a clínica ocorre ao agendar a primeira consulta
    const patient = await this.patientRepository.createPatient({
      userId: user.id,
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

    // ── 7) Gerar token de ativação (48 horas) ──────────────────────────────
    const activation = createVerificationData(48 * 60);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: activation.hashedToken,
        verificationExpires: activation.expiresAt,
      },
    });

    // ── 8) Enviar email de boas-vindas ─────────────────────────────────────
    await this.emailService.sendReceptionWelcomeEmail(
      data.email,
      data.name,
      temporaryPassword,
      activation.token,
      clinicName,
    );

    return {
      userId: user.id,
      patientId: patient.id,
      name: user.name,
      email: user.email,
      message: "Paciente cadastrado com sucesso! Um email de ativação foi enviado.",
    };
  }
}
