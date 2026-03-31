import bcrypt from "bcryptjs";
import {
  AppointmentChannel,
  AppointmentStatus,
  CancellationReason,
  DayOfWeek,
  Gender,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  TransactionType,
  UserRole,
  UserStatus,
} from "../types/enums";
import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// SEED — 8 CLÍNICAS
// ---------------------------------------------------------------------------
// Palavra em comum (≥ 3 clínicas): "Saúde"
//   #1  Clínica Saúde Mais          — São Paulo/SP
//   #3  Saúde Total Clínica Médica  — São Paulo/SP
//   #4  Clínica Saúde & Vida        — São Paulo/SP
//   #5  Clínica Saúde Integrada     — Curitiba/PR
//   #8  VitaSaúde Clínica           — Curitiba/PR
//
// Palavra em comum (2 clínicas): "Odonto"
//   #2  OdontoPrime                 — Rio de Janeiro/RJ
//   #6  OdontoVita                  — Rio de Janeiro/RJ
//
// Cidades com mais de uma clínica:
//   São Paulo:      #1, #3, #4
//   Rio de Janeiro: #2, #6
//   Curitiba:       #5, #8
//   Belo Horizonte: #7
// ---------------------------------------------------------------------------

// Helpers de data
function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // ========================================
  // CLEANUP
  // ========================================
  console.log("🧹 Limpando dados existentes...");
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.financialRecord.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.professionalProcedure.deleteMany({});
  await prisma.procedure.deleteMany({});
  await prisma.professionalScheduleBlock.deleteMany({});
  await prisma.professionalWorkingHours.deleteMany({});
  await prisma.professionalSpecialty.deleteMany({});
  await prisma.patientComment.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.specialty.deleteMany({});
  await prisma.clinicHoliday.deleteMany({});
  await prisma.clinicWorkingHours.deleteMany({});
  await prisma.clinicSettings.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.clinic.deleteMany({});
  console.log("✅ Banco limpo\n");

  const hashedPassword = await bcrypt.hash("Senha123!", 10);

  // ╔══════════════════════════════════════════════════════╗
  // ║   CLÍNICA 1 — Clínica Saúde Mais  (São Paulo / SP)  ║
  // ║   "Saúde" — clínica principal, dados completos       ║
  // ╚══════════════════════════════════════════════════════╝
  // ========================================
  // CLÍNICA 1 — Saúde Mais (principal)
  // ========================================
  console.log("🏥 Criando Clínica 1 — Saúde Mais...");
  const clinic1 = await prisma.clinic.create({
    data: {
      legalName: "Clínica Saúde Mais LTDA",
      tradeName: "Clínica Saúde Mais",
      cnpj: "12345678000190",
      email: "contato@saudemais.com.br",
      phone: "11987654321",
      website: "https://www.saudemais.com.br",
      subdomain: "saudemais",
      zipCode: "01310100",
      street: "Avenida Paulista",
      number: "1000",
      complement: "Sala 501",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      timezone: "America/Sao_Paulo",
      isActive: true,
    },
  });
  console.log(`  ✅ ${clinic1.tradeName} (ID: ${clinic1.id})`);

  // -- Configurações
  await prisma.clinicSettings.create({
    data: {
      clinicId: clinic1.id,
      minIntervalBetweenAppointments: 15,
      minAdvanceBookingHours: 2,
      maxAdvanceBookingDays: 60,
      maxCancellationHours: 24,
      maxConsecutiveNoShows: 3,
      appointmentToleranceMinutes: 15,
      allowOnlineBooking: true,
      requirePatientConfirmation: true,
      sendAppointmentConfirmation: true,
      sendAppointmentReminder: true,
      reminderHoursBefore: 24,
      sendBirthdayMessage: true,
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      darkMode: false,
    },
  });

  // -- Horário de funcionamento
  await prisma.clinicWorkingHours.createMany({
    data: [
      {
        clinicId: clinic1.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic1.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic1.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic1.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic1.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic1.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "13:00",
      },
      {
        clinicId: clinic1.id,
        dayOfWeek: DayOfWeek.SUNDAY,
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
      },
    ],
  });

  // -- Feriados
  await prisma.clinicHoliday.createMany({
    data: [
      {
        clinicId: clinic1.id,
        date: new Date("2026-04-21"),
        description: "Tiradentes",
        isRecurring: true,
      },
      {
        clinicId: clinic1.id,
        date: new Date("2026-05-01"),
        description: "Dia do Trabalho",
        isRecurring: true,
      },
      {
        clinicId: clinic1.id,
        date: new Date("2026-09-07"),
        description: "Independência",
        isRecurring: true,
      },
      {
        clinicId: clinic1.id,
        date: new Date("2026-12-25"),
        description: "Natal",
        isRecurring: true,
      },
    ],
  });

  // -- Especialidades
  const [specCardio, specOrto, specFisio, specDerm, specNutri] = await Promise.all([
    prisma.specialty.create({
      data: {
        clinicId: clinic1.id,
        name: "Cardiologia",
        description: "Coração e sistema cardiovascular",
        icon: "❤️",
        color: "#EF4444",
        isActive: true,
      },
    }),
    prisma.specialty.create({
      data: {
        clinicId: clinic1.id,
        name: "Ortodontia",
        description: "Correção da posição dos dentes",
        icon: "😁",
        color: "#10B981",
        isActive: true,
      },
    }),
    prisma.specialty.create({
      data: {
        clinicId: clinic1.id,
        name: "Fisioterapia",
        description: "Reabilitação de lesões e disfunções",
        icon: "🏃",
        color: "#8B5CF6",
        isActive: true,
      },
    }),
    prisma.specialty.create({
      data: {
        clinicId: clinic1.id,
        name: "Dermatologia",
        description: "Pele, cabelo e unhas",
        icon: "🌿",
        color: "#F59E0B",
        isActive: true,
      },
    }),
    prisma.specialty.create({
      data: {
        clinicId: clinic1.id,
        name: "Nutrição",
        description: "Orientação nutricional e dietética",
        icon: "🥗",
        color: "#06B6D4",
        isActive: true,
      },
    }),
  ]);
  console.log("  ✅ 5 especialidades criadas");

  // ========================================
  // USUÁRIOS — Clínica 1
  // ========================================
  console.log("\n👥 Criando usuários da Clínica 1...");

  // Admin
  const admin1 = await prisma.user.create({
    data: {
      clinicId: clinic1.id,
      name: "Dr. Carlos Silva",
      cpf: "11111111111",
      email: "admin@saudemais.com.br",
      phone: "11900000001",
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  // Recepcionistas
  const recep1 = await prisma.user.create({
    data: {
      clinicId: clinic1.id,
      name: "Ana Paula Santos",
      cpf: "22222222222",
      email: "recepcao@saudemais.com.br",
      phone: "11900000002",
      password: hashedPassword,
      role: UserRole.RECEPTIONIST,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const recep2 = await prisma.user.create({
    data: {
      clinicId: clinic1.id,
      name: "Marcos Ferreira",
      cpf: "22222222223",
      email: "recepcao2@saudemais.com.br",
      phone: "11900000009",
      password: hashedPassword,
      role: UserRole.RECEPTIONIST,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });

  // Profissional 1 — Cardiologista
  const profUser1 = await prisma.user.create({
    data: {
      clinicId: clinic1.id,
      name: "Dra. Maria Oliveira",
      cpf: "33333333333",
      email: "maria.oliveira@saudemais.com.br",
      phone: "11900000003",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const prof1 = await prisma.professional.create({
    data: {
      clinicId: clinic1.id,
      userId: profUser1.id,
      professionalCouncil: "CRM",
      registrationNumber: "123456",
      registrationState: "SP",
      defaultAppointmentDuration: 30,
      calendarColor: "#EF4444",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: prof1.id, specialtyId: specCardio.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: prof1.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "12:00",
      },
      {
        professionalId: prof1.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "17:00",
      },
      {
        professionalId: prof1.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "12:00",
      },
      {
        professionalId: prof1.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "17:00",
      },
      {
        professionalId: prof1.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "12:00",
      },
    ],
  });

  // Profissional 2 — Ortodontista
  const profUser2 = await prisma.user.create({
    data: {
      clinicId: clinic1.id,
      name: "Dr. João Mendes",
      cpf: "44444444444",
      email: "joao.mendes@saudemais.com.br",
      phone: "11900000004",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const prof2 = await prisma.professional.create({
    data: {
      clinicId: clinic1.id,
      userId: profUser2.id,
      professionalCouncil: "CRO",
      registrationNumber: "654321",
      registrationState: "SP",
      defaultAppointmentDuration: 45,
      calendarColor: "#10B981",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: prof2.id, specialtyId: specOrto.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: prof2.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "18:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
      {
        professionalId: prof2.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "18:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
      {
        professionalId: prof2.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "12:00",
      },
    ],
  });

  // Profissional 3 — Fisioterapeuta
  const profUser3 = await prisma.user.create({
    data: {
      clinicId: clinic1.id,
      name: "Dra. Fernanda Lima",
      cpf: "55555555555",
      email: "fernanda.lima@saudemais.com.br",
      phone: "11900000005",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const prof3 = await prisma.professional.create({
    data: {
      clinicId: clinic1.id,
      userId: profUser3.id,
      professionalCouncil: "CREFITO",
      registrationNumber: "789012",
      registrationState: "SP",
      defaultAppointmentDuration: 50,
      calendarColor: "#8B5CF6",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: prof3.id, specialtyId: specFisio.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: prof3.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "12:00",
      },
      {
        professionalId: prof3.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "12:00",
      },
      {
        professionalId: prof3.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "12:00",
      },
      {
        professionalId: prof3.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "18:00",
      },
      {
        professionalId: prof3.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "18:00",
      },
    ],
  });

  // Bloqueio de agenda — Prof3 de férias
  await prisma.professionalScheduleBlock.create({
    data: {
      professionalId: prof3.id,
      startDateTime: daysFromNow(10),
      endDateTime: daysFromNow(17),
      reason: "Férias anuais",
      isAllDay: true,
    },
  });

  console.log(`  ✅ Admin, 2 recepcionistas e 3 profissionais criados`);

  // ========================================
  // PROCEDIMENTOS — Clínica 1
  // ========================================
  const [proc1, proc2, proc3, proc4, proc5, proc6] = await Promise.all([
    prisma.procedure.create({
      data: {
        clinicId: clinic1.id,
        name: "Consulta Cardiológica",
        code: "CARD-001",
        description: "Consulta de rotina com cardiologista",
        defaultDuration: 30,
        defaultPrice: 350.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic1.id,
        name: "Eletrocardiograma (ECG)",
        code: "CARD-002",
        description: "Exame de atividade elétrica do coração",
        defaultDuration: 20,
        defaultPrice: 150.0,
        isActive: true,
        allowOnlineBooking: false,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic1.id,
        name: "Avaliação Ortodôntica",
        code: "ORTO-001",
        description: "Primeira consulta para avaliação ortodôntica",
        defaultDuration: 45,
        defaultPrice: 250.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic1.id,
        name: "Manutenção de Aparelho",
        code: "ORTO-002",
        description: "Manutenção mensal de aparelho ortodôntico",
        defaultDuration: 30,
        defaultPrice: 180.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic1.id,
        name: "Sessão de Fisioterapia",
        code: "FISIO-001",
        description: "Sessão individualizada de fisioterapia",
        defaultDuration: 50,
        defaultPrice: 200.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic1.id,
        name: "Avaliação Fisioterapêutica",
        code: "FISIO-002",
        description: "Avaliação inicial e elaboração de protocolo",
        defaultDuration: 60,
        defaultPrice: 280.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
  ]);

  await prisma.professionalProcedure.createMany({
    data: [
      { professionalId: prof1.id, procedureId: proc1.id },
      { professionalId: prof1.id, procedureId: proc2.id },
      { professionalId: prof2.id, procedureId: proc3.id },
      { professionalId: prof2.id, procedureId: proc4.id },
      { professionalId: prof3.id, procedureId: proc5.id },
      { professionalId: prof3.id, procedureId: proc6.id },
    ],
  });
  console.log("  ✅ 6 procedimentos criados e vinculados\n");

  // ========================================
  // PACIENTES — Clínica 1
  // ========================================
  console.log("🧑‍⚕️ Criando pacientes...");

  const makePatient = async (
    userData: { name: string; cpf: string; email: string; phone: string },
    patientData: {
      cpf: string;
      dateOfBirth: Date;
      gender: Gender;
      city?: string;
      bloodType?: string;
      allergies?: string;
      conditions?: string;
      noShowCount?: number;
      totalAppointments?: number;
    },
  ) => {
    const user = await prisma.user.create({
      data: {
        clinicId: clinic1.id,
        name: userData.name,
        cpf: userData.cpf,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        role: UserRole.PATIENT,
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
        loginAttempts: 0,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });
    const patient = await prisma.patient.create({
      data: {
        clinicId: clinic1.id,
        userId: user.id,
        cpf: patientData.cpf,
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender,
        zipCode: "01310100",
        street: "Rua Example",
        number: "100",
        neighborhood: "Centro",
        city: patientData.city ?? "São Paulo",
        state: "SP",
        bloodType: patientData.bloodType,
        allergies: patientData.allergies,
        conditions: patientData.conditions,
        isActive: true,
        noShowCount: patientData.noShowCount ?? 0,
        totalAppointments: patientData.totalAppointments ?? 0,
      },
    });
    return { user, patient };
  };

  const { user: patUser1, patient: pat1 } = await makePatient(
    {
      name: "Pedro Almeida",
      cpf: "66600000001",
      email: "pedro.almeida@email.com",
      phone: "11970000001",
    },
    {
      cpf: "66600000001",
      dateOfBirth: new Date("1985-05-15"),
      gender: Gender.MALE,
      bloodType: "O+",
      conditions: "Hipertensão arterial leve",
      totalAppointments: 5,
    },
  );
  const { user: patUser2, patient: pat2 } = await makePatient(
    {
      name: "Juliana Costa",
      cpf: "66600000002",
      email: "juliana.costa@email.com",
      phone: "11970000002",
    },
    {
      cpf: "66600000002",
      dateOfBirth: new Date("1990-08-20"),
      gender: Gender.FEMALE,
      bloodType: "A+",
      allergies: "Penicilina",
      totalAppointments: 3,
    },
  );
  const { user: patUser3, patient: pat3 } = await makePatient(
    {
      name: "Roberto Ferreira",
      cpf: "66600000003",
      email: "roberto.ferreira@email.com",
      phone: "11970000003",
    },
    {
      cpf: "66600000003",
      dateOfBirth: new Date("1978-11-30"),
      gender: Gender.MALE,
      bloodType: "B-",
      conditions: "Diabetes tipo 2",
      totalAppointments: 8,
      noShowCount: 1,
    },
  );
  const { user: patUser4, patient: pat4 } = await makePatient(
    {
      name: "Amanda Lima",
      cpf: "66600000004",
      email: "amanda.lima@email.com",
      phone: "11970000004",
    },
    {
      cpf: "66600000004",
      dateOfBirth: new Date("2000-03-10"),
      gender: Gender.FEMALE,
      bloodType: "AB+",
      totalAppointments: 2,
    },
  );
  const { user: patUser5, patient: pat5 } = await makePatient(
    {
      name: "Fernando Souza",
      cpf: "66600000005",
      email: "fernando.souza@email.com",
      phone: "11970000005",
    },
    {
      cpf: "66600000005",
      dateOfBirth: new Date("1965-07-22"),
      gender: Gender.MALE,
      bloodType: "A-",
      conditions: "Colesterol alto",
      totalAppointments: 12,
      noShowCount: 2,
    },
  );
  const { user: patUser6, patient: pat6 } = await makePatient(
    {
      name: "Cláudia Mendes",
      cpf: "66600000006",
      email: "claudia.mendes@email.com",
      phone: "11970000006",
    },
    {
      cpf: "66600000006",
      dateOfBirth: new Date("1993-01-05"),
      gender: Gender.FEMALE,
      bloodType: "O-",
      allergies: "Dipirona",
      totalAppointments: 1,
    },
  );

  console.log(`  ✅ 6 pacientes criados\n`);

  // ========================================
  // AGENDAMENTOS — variados status
  // ========================================
  console.log("📅 Criando agendamentos...");

  // Helper para criar agendamento + registro financeiro opcional
  const createAppointment = (data: Parameters<typeof prisma.appointment.create>[0]["data"]) =>
    prisma.appointment.create({ data });

  // -- Passados: COMPLETED
  const apt1 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat1.id,
    professionalId: prof1.id,
    procedureId: proc1.id,
    appointmentDate: daysAgo(30),
    startTime: "09:00",
    endTime: "09:30",
    duration: 30,
    status: AppointmentStatus.COMPLETED,
    channel: AppointmentChannel.PHONE,
    confirmedAt: daysAgo(31),
    confirmedBy: recep1.id,
    notes: "Paciente relatou pressão elevada.",
    createdBy: recep1.id,
  });
  const apt2 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat3.id,
    professionalId: prof1.id,
    procedureId: proc1.id,
    appointmentDate: daysAgo(21),
    startTime: "10:00",
    endTime: "10:30",
    duration: 30,
    status: AppointmentStatus.COMPLETED,
    channel: AppointmentChannel.IN_PERSON,
    confirmedAt: daysAgo(22),
    confirmedBy: recep1.id,
    createdBy: recep1.id,
  });
  const apt3 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat5.id,
    professionalId: prof1.id,
    procedureId: proc2.id,
    appointmentDate: daysAgo(14),
    startTime: "08:00",
    endTime: "08:20",
    duration: 20,
    status: AppointmentStatus.COMPLETED,
    channel: AppointmentChannel.PHONE,
    confirmedAt: daysAgo(15),
    confirmedBy: recep2.id,
    createdBy: recep2.id,
  });
  const apt4 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat2.id,
    professionalId: prof2.id,
    procedureId: proc3.id,
    appointmentDate: daysAgo(25),
    startTime: "14:00",
    endTime: "14:45",
    duration: 45,
    status: AppointmentStatus.COMPLETED,
    channel: AppointmentChannel.ONLINE_PORTAL,
    confirmedAt: daysAgo(26),
    confirmedBy: recep1.id,
    notes: "Primeira avaliação ortodôntica.",
    createdBy: patUser2.id,
  });
  const apt5 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat4.id,
    professionalId: prof2.id,
    procedureId: proc4.id,
    appointmentDate: daysAgo(7),
    startTime: "08:00",
    endTime: "08:30",
    duration: 30,
    status: AppointmentStatus.COMPLETED,
    channel: AppointmentChannel.WHATSAPP,
    confirmedAt: daysAgo(8),
    confirmedBy: recep1.id,
    createdBy: recep1.id,
  });
  const apt6 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat1.id,
    professionalId: prof3.id,
    procedureId: proc6.id,
    appointmentDate: daysAgo(60),
    startTime: "07:00",
    endTime: "08:00",
    duration: 60,
    status: AppointmentStatus.COMPLETED,
    channel: AppointmentChannel.PHONE,
    confirmedAt: daysAgo(61),
    confirmedBy: recep1.id,
    createdBy: recep1.id,
  });
  const apt7 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat3.id,
    professionalId: prof3.id,
    procedureId: proc5.id,
    appointmentDate: daysAgo(10),
    startTime: "13:00",
    endTime: "13:50",
    duration: 50,
    status: AppointmentStatus.COMPLETED,
    channel: AppointmentChannel.IN_PERSON,
    confirmedAt: daysAgo(11),
    confirmedBy: recep2.id,
    createdBy: recep2.id,
  });

  // -- Passados: NO_SHOW e CANCELLED
  const apt8 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat5.id,
    professionalId: prof1.id,
    procedureId: proc1.id,
    appointmentDate: daysAgo(45),
    startTime: "10:00",
    endTime: "10:30",
    duration: 30,
    status: AppointmentStatus.NO_SHOW,
    channel: AppointmentChannel.PHONE,
    createdBy: recep1.id,
  });
  const apt9 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat6.id,
    professionalId: prof2.id,
    procedureId: proc3.id,
    appointmentDate: daysAgo(5),
    startTime: "09:00",
    endTime: "09:45",
    duration: 45,
    status: AppointmentStatus.CANCELLED,
    channel: AppointmentChannel.ONLINE_PORTAL,
    cancelledAt: daysAgo(6),
    cancelledBy: patUser6.id,
    cancellationReason: CancellationReason.PATIENT_REQUEST,
    cancellationNotes: "Paciente teve compromisso de trabalho.",
    createdBy: patUser6.id,
  });

  // -- Hoje: CONFIRMED e WAITING
  const aptHoje1 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat1.id,
    professionalId: prof1.id,
    procedureId: proc1.id,
    appointmentDate: today(),
    startTime: "09:00",
    endTime: "09:30",
    duration: 30,
    status: AppointmentStatus.CONFIRMED,
    channel: AppointmentChannel.PHONE,
    confirmedAt: daysAgo(1),
    confirmedBy: recep1.id,
    notes: "Paciente com histórico de hipertensão.",
    createdBy: recep1.id,
  });
  const aptHoje2 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat3.id,
    professionalId: prof1.id,
    procedureId: proc2.id,
    appointmentDate: today(),
    startTime: "10:00",
    endTime: "10:20",
    duration: 20,
    status: AppointmentStatus.WAITING,
    channel: AppointmentChannel.IN_PERSON,
    confirmedAt: daysAgo(1),
    confirmedBy: recep2.id,
    createdBy: recep2.id,
  });
  const aptHoje3 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat2.id,
    professionalId: prof3.id,
    procedureId: proc5.id,
    appointmentDate: today(),
    startTime: "07:30",
    endTime: "08:20",
    duration: 50,
    status: AppointmentStatus.IN_PROGRESS,
    channel: AppointmentChannel.PHONE,
    confirmedAt: daysAgo(1),
    confirmedBy: recep1.id,
    createdBy: recep1.id,
  });

  // -- Futuros: SCHEDULED e CONFIRMED
  const aptFut1 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat2.id,
    professionalId: prof2.id,
    procedureId: proc4.id,
    appointmentDate: daysFromNow(2),
    startTime: "08:00",
    endTime: "08:30",
    duration: 30,
    status: AppointmentStatus.CONFIRMED,
    channel: AppointmentChannel.ONLINE_PORTAL,
    confirmedAt: new Date(),
    confirmedBy: patUser2.id,
    createdBy: patUser2.id,
  });
  const aptFut2 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat4.id,
    professionalId: prof2.id,
    procedureId: proc3.id,
    appointmentDate: daysFromNow(4),
    startTime: "09:00",
    endTime: "09:45",
    duration: 45,
    status: AppointmentStatus.SCHEDULED,
    channel: AppointmentChannel.WHATSAPP,
    createdBy: recep1.id,
  });
  const aptFut3 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat5.id,
    professionalId: prof1.id,
    procedureId: proc1.id,
    appointmentDate: daysFromNow(7),
    startTime: "11:00",
    endTime: "11:30",
    duration: 30,
    status: AppointmentStatus.SCHEDULED,
    channel: AppointmentChannel.PHONE,
    createdBy: recep2.id,
  });
  const aptFut4 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat6.id,
    professionalId: prof3.id,
    procedureId: proc6.id,
    appointmentDate: daysFromNow(3),
    startTime: "14:00",
    endTime: "15:00",
    duration: 60,
    status: AppointmentStatus.CONFIRMED,
    channel: AppointmentChannel.ONLINE_PORTAL,
    confirmedAt: new Date(),
    confirmedBy: patUser6.id,
    createdBy: patUser6.id,
  });
  const aptFut5 = await createAppointment({
    clinicId: clinic1.id,
    patientId: pat1.id,
    professionalId: prof3.id,
    procedureId: proc5.id,
    appointmentDate: daysFromNow(14),
    startTime: "07:00",
    endTime: "07:50",
    duration: 50,
    status: AppointmentStatus.SCHEDULED,
    channel: AppointmentChannel.PHONE,
    createdBy: recep1.id,
  });

  console.log(
    `  ✅ 17 agendamentos criados (7 COMPLETED, 2 cancelados/no-show, 3 hoje, 5 futuros)\n`,
  );

  // ========================================
  // PRONTUÁRIOS — Consultas concluídas
  // ========================================
  console.log("📋 Criando prontuários...");
  await prisma.medicalRecord.createMany({
    data: [
      {
        appointmentId: apt1.id,
        patientId: pat1.id,
        professionalId: prof1.id,
        chiefComplaint: "Pressão arterial elevada e cansaço frequente",
        symptoms: "Cefaleia, tontura, dispneia aos esforços",
        diagnosis: "Hipertensão arterial estágio 1 (CID I10)",
        treatment: "Orientação sobre dieta hipossódica e prática de atividade física regular",
        prescription: "Losartana 50mg 1x/dia. Retorno em 30 dias.",
        observations: "Monitorar PA diariamente. Solicitar exames de rotina.",
      },
      {
        appointmentId: apt2.id,
        patientId: pat3.id,
        professionalId: prof1.id,
        chiefComplaint: "Controle de diabetes e hiperglicemia em jejum",
        symptoms: "Poliúria, polidipsia, astenia",
        diagnosis: "Diabetes mellitus tipo 2 descompensado (CID E11)",
        treatment: "Ajuste de dose de insulina e orientação dietética",
        prescription: "Metformina 850mg 2x/dia (almoço e jantar). Insulina Glargina 20 UI/noite.",
        observations: "Solicitar HbA1c e perfil lipídico. Encaminhar para nutricionista.",
      },
      {
        appointmentId: apt3.id,
        patientId: pat5.id,
        professionalId: prof1.id,
        chiefComplaint: "Palpitações e dor precordial atípica",
        symptoms: "Taquicardia paroxística, sensação de aperto no peito",
        diagnosis: "Taquicardia supraventricular paroxística (CID I47.1)",
        treatment: "Manobra vagal durante episódio. ECG realizado.",
        prescription: "Atenolol 25mg 1x/dia. Retorno em 15 dias.",
      },
      {
        appointmentId: apt4.id,
        patientId: pat2.id,
        professionalId: prof2.id,
        chiefComplaint: "Estudar opções para correção do alinhamento dentário",
        symptoms: "Apinhamento anterior superior e inferior, mordida cruzada posterior",
        diagnosis: "Má oclusão Classe II divisão 1 (CID K07.2)",
        treatment: "Planejamento ortodôntico com modelos de estudo e radiografias",
        prescription: "Aguardar resultado dos exames para definir protocolo.",
        observations: "Encaminhar para odontopediatria para avaliação. Paciente motivada.",
      },
      {
        appointmentId: apt7.id,
        patientId: pat3.id,
        professionalId: prof3.id,
        chiefComplaint: "Lombalgia crônica com irradiação para MMII",
        symptoms: "Dor lombar intensa, parestesia em MID, limitação de ADM",
        diagnosis: "Hernia discal L4-L5 com comprometimento radicular",
        treatment:
          "TENS, ultrassom terapêutico, mobilização articular e exercícios de estabilização",
        prescription: "Protocolo de 12 sessões 3x/semana.",
        observations: "Boa resposta ao tratamento. Manter atividade física orientada.",
      },
    ],
  });
  console.log("  ✅ 5 prontuários criados\n");

  // ========================================
  // FINANCEIRO
  // ========================================
  console.log("💰 Criando registros financeiros...");

  // Receitas de consultas pagas
  await prisma.financialRecord.createMany({
    data: [
      {
        clinicId: clinic1.id,
        type: TransactionType.INCOME,
        amount: 350.0,
        description: "Consulta Cardiológica — Pedro Almeida",
        category: "Consulta",
        paymentMethod: PaymentMethod.PIX,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(30),
        referenceDate: daysAgo(30),
        appointmentId: apt1.id,
        patientId: pat1.id,
        createdBy: recep1.id,
      },
      {
        clinicId: clinic1.id,
        type: TransactionType.INCOME,
        amount: 350.0,
        description: "Consulta Cardiológica — Roberto Ferreira",
        category: "Consulta",
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(21),
        referenceDate: daysAgo(21),
        appointmentId: apt2.id,
        patientId: pat3.id,
        createdBy: recep1.id,
      },
      {
        clinicId: clinic1.id,
        type: TransactionType.INCOME,
        amount: 150.0,
        description: "ECG — Fernando Souza",
        category: "Exame",
        paymentMethod: PaymentMethod.DEBIT_CARD,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(14),
        referenceDate: daysAgo(14),
        appointmentId: apt3.id,
        patientId: pat5.id,
        createdBy: recep2.id,
      },
      {
        clinicId: clinic1.id,
        type: TransactionType.INCOME,
        amount: 250.0,
        description: "Avaliação Ortodôntica — Juliana Costa",
        category: "Consulta",
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(25),
        referenceDate: daysAgo(25),
        appointmentId: apt4.id,
        patientId: pat2.id,
        createdBy: recep1.id,
      },
      {
        clinicId: clinic1.id,
        type: TransactionType.INCOME,
        amount: 180.0,
        description: "Manutenção de Aparelho — Amanda Lima",
        category: "Procedimento",
        paymentMethod: PaymentMethod.PIX,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(7),
        referenceDate: daysAgo(7),
        appointmentId: apt5.id,
        patientId: pat4.id,
        createdBy: recep1.id,
      },
      {
        clinicId: clinic1.id,
        type: TransactionType.INCOME,
        amount: 280.0,
        description: "Avaliação Fisioterapêutica — Pedro Almeida",
        category: "Consulta",
        paymentMethod: PaymentMethod.PIX,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(60),
        referenceDate: daysAgo(60),
        appointmentId: apt6.id,
        patientId: pat1.id,
        createdBy: recep1.id,
      },
      {
        clinicId: clinic1.id,
        type: TransactionType.INCOME,
        amount: 200.0,
        description: "Sessão de Fisioterapia — Roberto Ferreira",
        category: "Procedimento",
        paymentMethod: PaymentMethod.DEBIT_CARD,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(10),
        referenceDate: daysAgo(10),
        appointmentId: apt7.id,
        patientId: pat3.id,
        createdBy: recep2.id,
      },
      // Receita pendente — consulta futura
      {
        clinicId: clinic1.id,
        type: TransactionType.INCOME,
        amount: 180.0,
        description: "Manutenção de Aparelho — Juliana Costa (pendente)",
        category: "Procedimento",
        paymentStatus: PaymentStatus.PENDING,
        referenceDate: daysFromNow(2),
        dueDate: daysFromNow(2),
        appointmentId: aptFut1.id,
        patientId: pat2.id,
        createdBy: recep1.id,
      },
    ],
  });

  // Despesas da clínica
  await prisma.financialRecord.createMany({
    data: [
      {
        clinicId: clinic1.id,
        type: TransactionType.EXPENSE,
        amount: 3500.0,
        description: "Aluguel — fevereiro/2026",
        category: "Aluguel",
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(28),
        referenceDate: daysAgo(28),
        createdBy: admin1.id,
      },
      {
        clinicId: clinic1.id,
        type: TransactionType.EXPENSE,
        amount: 850.0,
        description: "Conta de energia elétrica — fevereiro/2026",
        category: "Utilidades",
        paymentMethod: PaymentMethod.PIX,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(15),
        referenceDate: daysAgo(15),
        createdBy: admin1.id,
      },
      {
        clinicId: clinic1.id,
        type: TransactionType.EXPENSE,
        amount: 1200.0,
        description: "Material de escritório e consumíveis médicos",
        category: "Materiais",
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(10),
        referenceDate: daysAgo(10),
        createdBy: admin1.id,
      },
      {
        clinicId: clinic1.id,
        type: TransactionType.EXPENSE,
        amount: 3500.0,
        description: "Aluguel — março/2026",
        category: "Aluguel",
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.PENDING,
        referenceDate: daysFromNow(5),
        dueDate: daysFromNow(5),
        createdBy: admin1.id,
      },
    ],
  });
  console.log("  ✅ 12 registros financeiros criados (8 receitas, 4 despesas)\n");

  // ========================================
  // NOTIFICAÇÕES
  // ========================================
  console.log("🔔 Criando notificações...");
  await prisma.notification.createMany({
    data: [
      {
        clinicId: clinic1.id,
        recipientEmail: patUser1.email,
        recipientPhone: patUser1.phone,
        recipientName: patUser1.name,
        type: NotificationType.APPOINTMENT_CONFIRMATION,
        channel: NotificationChannel.EMAIL,
        subject: "Confirmação de Consulta",
        message: `Olá ${patUser1.name}, sua consulta com Dra. Maria Oliveira está confirmada para hoje às 09:00.`,
        status: NotificationStatus.SENT,
        sentAt: daysAgo(1),
        appointmentId: aptHoje1.id,
      },
      {
        clinicId: clinic1.id,
        recipientEmail: patUser3.email,
        recipientPhone: patUser3.phone,
        recipientName: patUser3.name,
        type: NotificationType.APPOINTMENT_REMINDER,
        channel: NotificationChannel.WHATSAPP,
        message: `Lembrete: Você tem consulta amanhã às 10:00 com Dra. Maria Oliveira.`,
        status: NotificationStatus.SENT,
        sentAt: daysAgo(1),
        appointmentId: aptHoje2.id,
      },
      {
        clinicId: clinic1.id,
        recipientEmail: patUser2.email,
        recipientPhone: patUser2.phone,
        recipientName: patUser2.name,
        type: NotificationType.APPOINTMENT_CONFIRMATION,
        channel: NotificationChannel.EMAIL,
        subject: "Confirmação de Consulta",
        message: `Olá ${patUser2.name}, sua consulta com Dr. João Mendes está confirmada para ${daysFromNow(2).toLocaleDateString("pt-BR")} às 08:00.`,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        appointmentId: aptFut1.id,
      },
      {
        clinicId: clinic1.id,
        recipientEmail: patUser6.email,
        recipientPhone: patUser6.phone,
        recipientName: patUser6.name,
        type: NotificationType.APPOINTMENT_CANCELLATION,
        channel: NotificationChannel.EMAIL,
        subject: "Cancelamento de Consulta",
        message: `Olá ${patUser6.name}, confirmamos o cancelamento da sua consulta conforme solicitado.`,
        status: NotificationStatus.SENT,
        sentAt: daysAgo(6),
        appointmentId: apt9.id,
      },
      {
        clinicId: clinic1.id,
        recipientEmail: patUser4.email,
        recipientPhone: patUser4.phone,
        recipientName: patUser4.name,
        type: NotificationType.APPOINTMENT_REMINDER,
        channel: NotificationChannel.EMAIL,
        subject: "Lembrete de Consulta",
        message: `Olá ${patUser4.name}, você tem consulta com Dr. João Mendes em ${daysFromNow(4).toLocaleDateString("pt-BR")} às 09:00.`,
        status: NotificationStatus.PENDING,
        appointmentId: aptFut2.id,
      },
      {
        clinicId: clinic1.id,
        recipientEmail: patUser1.email,
        recipientPhone: patUser1.phone,
        recipientName: patUser1.name,
        type: NotificationType.WELCOME,
        channel: NotificationChannel.EMAIL,
        subject: "Bem-vindo à Clínica Saúde Mais",
        message: `Bem-vindo, ${patUser1.name}! Seu cadastro foi realizado com sucesso.`,
        status: NotificationStatus.READ,
        sentAt: daysAgo(90),
        readAt: daysAgo(89),
      },
    ],
  });
  console.log("  ✅ 6 notificações criadas\n");

  // ========================================
  // AUDITORIA
  // ========================================
  console.log("📝 Criando logs de auditoria...");
  await prisma.auditLog.createMany({
    data: [
      {
        clinicId: clinic1.id,
        userId: admin1.id,
        userName: admin1.name,
        action: "CREATE_CLINIC",
        entity: "Clinic",
        entityId: clinic1.id,
        newData: { tradeName: clinic1.tradeName },
        ipAddress: "192.168.0.1",
      },
      {
        clinicId: clinic1.id,
        userId: admin1.id,
        userName: admin1.name,
        action: "CREATE_PROFESSIONAL",
        entity: "Professional",
        entityId: prof1.id,
        newData: { name: profUser1.name, council: "CRM" },
        ipAddress: "192.168.0.1",
      },
      {
        clinicId: clinic1.id,
        userId: recep1.id,
        userName: recep1.name,
        action: "CREATE_APPOINTMENT",
        entity: "Appointment",
        entityId: apt1.id,
        newData: { patientName: patUser1.name, date: daysAgo(30) },
        ipAddress: "192.168.0.2",
      },
      {
        clinicId: clinic1.id,
        userId: recep1.id,
        userName: recep1.name,
        action: "UPDATE_APPOINTMENT_STATUS",
        entity: "Appointment",
        entityId: apt9.id,
        oldData: { status: "SCHEDULED" },
        newData: { status: "CANCELLED" },
        ipAddress: "192.168.0.2",
      },
      {
        clinicId: clinic1.id,
        userId: admin1.id,
        userName: admin1.name,
        action: "LOGIN",
        entity: "User",
        entityId: admin1.id,
        newData: { at: new Date() },
        ipAddress: "187.45.123.10",
      },
    ],
  });
  console.log("  ✅ 5 logs de auditoria criados\n");

  // ========================================
  // CLÍNICA 2 — OdontoPrime (multi-tenant teste)
  // ========================================
  console.log("🏥 Criando Clínica 2 — OdontoPrime...");
  const clinic2 = await prisma.clinic.create({
    data: {
      legalName: "OdontoPrime Clínica Odontológica LTDA",
      tradeName: "OdontoPrime",
      cnpj: "98765432000110",
      email: "contato@odontoprime.com.br",
      phone: "21987654321",
      subdomain: "odontoprime",
      zipCode: "20040020",
      street: "Avenida Rio Branco",
      number: "200",
      complement: "Sala 1205",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      timezone: "America/Sao_Paulo",
      isActive: true,
    },
  });

  await prisma.clinicSettings.create({
    data: {
      clinicId: clinic2.id,
      minIntervalBetweenAppointments: 30,
      minAdvanceBookingHours: 4,
      maxAdvanceBookingDays: 90,
      maxCancellationHours: 48,
      maxConsecutiveNoShows: 2,
      appointmentToleranceMinutes: 10,
      allowOnlineBooking: true,
      requirePatientConfirmation: false,
      sendAppointmentConfirmation: true,
      sendAppointmentReminder: true,
      reminderHoursBefore: 48,
      sendBirthdayMessage: false,
      primaryColor: "#F59E0B",
      secondaryColor: "#B45309",
      darkMode: false,
    },
  });

  await prisma.clinicWorkingHours.createMany({
    data: [
      {
        clinicId: clinic2.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isOpen: true,
        openTime: "09:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic2.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isOpen: true,
        openTime: "09:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic2.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isOpen: true,
        openTime: "09:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic2.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isOpen: true,
        openTime: "09:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic2.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isOpen: true,
        openTime: "09:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic2.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
      },
      {
        clinicId: clinic2.id,
        dayOfWeek: DayOfWeek.SUNDAY,
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
      },
    ],
  });

  const [specImplante, specEndodontia] = await Promise.all([
    prisma.specialty.create({
      data: {
        clinicId: clinic2.id,
        name: "Implantodontia",
        description: "Implantes dentários",
        icon: "🦷",
        color: "#F59E0B",
        isActive: true,
      },
    }),
    prisma.specialty.create({
      data: {
        clinicId: clinic2.id,
        name: "Endodontia",
        description: "Tratamento de canais radiculares",
        icon: "🔬",
        color: "#10B981",
        isActive: true,
      },
    }),
  ]);

  const admin2 = await prisma.user.create({
    data: {
      clinicId: clinic2.id,
      name: "Dr. Ricardo Alves",
      cpf: "77700000001",
      email: "admin@odontoprime.com.br",
      phone: "21900000001",
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });

  const c2ProfUser = await prisma.user.create({
    data: {
      clinicId: clinic2.id,
      name: "Dra. Beatriz Nunes",
      cpf: "77700000002",
      email: "beatriz.nunes@odontoprime.com.br",
      phone: "21900000002",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c2Prof = await prisma.professional.create({
    data: {
      clinicId: clinic2.id,
      userId: c2ProfUser.id,
      professionalCouncil: "CRO",
      registrationNumber: "111222",
      registrationState: "RJ",
      defaultAppointmentDuration: 60,
      calendarColor: "#F59E0B",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.createMany({
    data: [
      { professionalId: c2Prof.id, specialtyId: specImplante.id, isPrimary: true },
      { professionalId: c2Prof.id, specialtyId: specEndodontia.id, isPrimary: false },
    ],
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c2Prof.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isWorking: true,
        startTime: "09:00",
        endTime: "18:00",
        lunchBreakStart: "13:00",
        lunchBreakEnd: "14:00",
      },
      {
        professionalId: c2Prof.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isWorking: true,
        startTime: "09:00",
        endTime: "18:00",
        lunchBreakStart: "13:00",
        lunchBreakEnd: "14:00",
      },
      {
        professionalId: c2Prof.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isWorking: true,
        startTime: "09:00",
        endTime: "18:00",
        lunchBreakStart: "13:00",
        lunchBreakEnd: "14:00",
      },
    ],
  });

  const [c2Proc1, c2Proc2] = await Promise.all([
    prisma.procedure.create({
      data: {
        clinicId: clinic2.id,
        name: "Implante Dentário",
        code: "IMP-001",
        defaultDuration: 120,
        defaultPrice: 2800.0,
        isActive: true,
        allowOnlineBooking: false,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic2.id,
        name: "Tratamento de Canal",
        code: "ENDO-001",
        defaultDuration: 60,
        defaultPrice: 900.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
  ]);
  await prisma.professionalProcedure.createMany({
    data: [
      { professionalId: c2Prof.id, procedureId: c2Proc1.id },
      { professionalId: c2Prof.id, procedureId: c2Proc2.id },
    ],
  });

  // Pacientes Clínica 2
  const c2PatUser1 = await prisma.user.create({
    data: {
      clinicId: clinic2.id,
      name: "Gustavo Ribeiro",
      cpf: "88800000001",
      email: "gustavo.ribeiro@email.com",
      phone: "21970000001",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c2Pat1 = await prisma.patient.create({
    data: {
      clinicId: clinic2.id,
      userId: c2PatUser1.id,
      cpf: "88800000001",
      dateOfBirth: new Date("1982-04-12"),
      gender: Gender.MALE,
      zipCode: "20040020",
      street: "Rua Central",
      number: "55",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 1,
    },
  });

  const c2PatUser2 = await prisma.user.create({
    data: {
      clinicId: clinic2.id,
      name: "Sofia Martins",
      cpf: "88800000002",
      email: "sofia.martins@email.com",
      phone: "21970000002",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c2Pat2 = await prisma.patient.create({
    data: {
      clinicId: clinic2.id,
      userId: c2PatUser2.id,
      cpf: "88800000002",
      dateOfBirth: new Date("1996-09-08"),
      gender: Gender.FEMALE,
      zipCode: "20040020",
      street: "Avenida Norte",
      number: "200",
      neighborhood: "Tijuca",
      city: "Rio de Janeiro",
      state: "RJ",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 0,
    },
  });

  // Agendamentos Clínica 2
  const c2Apt1 = await prisma.appointment.create({
    data: {
      clinicId: clinic2.id,
      patientId: c2Pat1.id,
      professionalId: c2Prof.id,
      procedureId: c2Proc2.id,
      appointmentDate: daysAgo(14),
      startTime: "10:00",
      endTime: "11:00",
      duration: 60,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.PHONE,
      confirmedAt: daysAgo(15),
      confirmedBy: admin2.id,
      createdBy: admin2.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic2.id,
      patientId: c2Pat2.id,
      professionalId: c2Prof.id,
      procedureId: c2Proc1.id,
      appointmentDate: daysFromNow(5),
      startTime: "09:00",
      endTime: "11:00",
      duration: 120,
      status: AppointmentStatus.CONFIRMED,
      channel: AppointmentChannel.ONLINE_PORTAL,
      confirmedAt: new Date(),
      confirmedBy: c2PatUser2.id,
      createdBy: c2PatUser2.id,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      appointmentId: c2Apt1.id,
      patientId: c2Pat1.id,
      professionalId: c2Prof.id,
      chiefComplaint: "Dor de dente e sensibilidade",
      diagnosis: "Pulpite irreversível no dente 36",
      treatment: "Tratamento endodôntico (biopulpectomia) do elemento 36",
      prescription: "Amoxicilina 500mg 8h/8h por 7 dias. Ibuprofeno 600mg SOS.",
    },
  });
  await prisma.financialRecord.create({
    data: {
      clinicId: clinic2.id,
      type: TransactionType.INCOME,
      amount: 900.0,
      description: "Tratamento de Canal — Gustavo Ribeiro",
      category: "Procedimento",
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentStatus: PaymentStatus.PAID,
      paidAt: daysAgo(14),
      referenceDate: daysAgo(14),
      appointmentId: c2Apt1.id,
      patientId: c2Pat1.id,
      createdBy: admin2.id,
    },
  });

  console.log(`  ✅ ${clinic2.tradeName} criada com 1 profissional, 2 pacientes, 2 agendamentos\n`);

  // ╔══════════════════════════════════════════════════════════╗
  // ║  CLÍNICA 3 — Saúde Total Clínica Médica (São Paulo/SP)  ║
  // ║  "Saúde" — mesma cidade que Clínica 1 e 4               ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🏥 Criando Clínica 3 — Saúde Total...");
  const clinic3 = await prisma.clinic.create({
    data: {
      legalName: "Saúde Total Serviços Médicos LTDA",
      tradeName: "Saúde Total Clínica Médica",
      cnpj: "11222333000144",
      email: "contato@saudetotal.com.br",
      phone: "11933001100",
      website: "https://www.saudetotal.com.br",
      subdomain: "saudetotal",
      zipCode: "04041000",
      street: "Rua Vergueiro",
      number: "3185",
      complement: "Andar 2",
      neighborhood: "Vila Mariana",
      city: "São Paulo",
      state: "SP",
      timezone: "America/Sao_Paulo",
      isActive: true,
    },
  });

  await prisma.clinicSettings.create({
    data: {
      clinicId: clinic3.id,
      minIntervalBetweenAppointments: 15,
      minAdvanceBookingHours: 2,
      maxAdvanceBookingDays: 45,
      maxCancellationHours: 24,
      maxConsecutiveNoShows: 3,
      appointmentToleranceMinutes: 10,
      allowOnlineBooking: true,
      requirePatientConfirmation: true,
      sendAppointmentConfirmation: true,
      sendAppointmentReminder: true,
      reminderHoursBefore: 24,
      sendBirthdayMessage: true,
      primaryColor: "#22C55E",
      secondaryColor: "#15803D",
      darkMode: false,
    },
  });

  await prisma.clinicWorkingHours.createMany({
    data: [
      {
        clinicId: clinic3.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isOpen: true,
        openTime: "07:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic3.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isOpen: true,
        openTime: "07:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic3.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isOpen: true,
        openTime: "07:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic3.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isOpen: true,
        openTime: "07:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic3.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isOpen: true,
        openTime: "07:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic3.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "13:00",
      },
      {
        clinicId: clinic3.id,
        dayOfWeek: DayOfWeek.SUNDAY,
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
      },
    ],
  });

  const [c3SpecClinico, c3SpecPediatria] = await Promise.all([
    prisma.specialty.create({
      data: {
        clinicId: clinic3.id,
        name: "Clínica Geral",
        description: "Atendimento clínico geral",
        icon: "🩺",
        color: "#22C55E",
        isActive: true,
      },
    }),
    prisma.specialty.create({
      data: {
        clinicId: clinic3.id,
        name: "Pediatria",
        description: "Saúde infantil e adolescente",
        icon: "👶",
        color: "#A78BFA",
        isActive: true,
      },
    }),
  ]);

  const c3Admin = await prisma.user.create({
    data: {
      clinicId: clinic3.id,
      name: "Dr. Carlos Drummond",
      cpf: "30000000001",
      email: "admin@saudetotal.com.br",
      phone: "11933001101",
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });
  const c3RecepUser = await prisma.user.create({
    data: {
      clinicId: clinic3.id,
      name: "Luana Borges",
      cpf: "30000000002",
      email: "recepcao@saudetotal.com.br",
      phone: "11933001102",
      password: hashedPassword,
      role: UserRole.RECEPTIONIST,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });

  const c3ProfUser1 = await prisma.user.create({
    data: {
      clinicId: clinic3.id,
      name: "Dr. Paulo Vieira",
      cpf: "30000000003",
      email: "paulo.vieira@saudetotal.com.br",
      phone: "11933001103",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c3Prof1 = await prisma.professional.create({
    data: {
      clinicId: clinic3.id,
      userId: c3ProfUser1.id,
      professionalCouncil: "CRM",
      registrationNumber: "300100",
      registrationState: "SP",
      defaultAppointmentDuration: 20,
      calendarColor: "#22C55E",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: c3Prof1.id, specialtyId: c3SpecClinico.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c3Prof1.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "12:00",
      },
      {
        professionalId: c3Prof1.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "12:00",
      },
      {
        professionalId: c3Prof1.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "12:00",
      },
      {
        professionalId: c3Prof1.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "12:00",
      },
      {
        professionalId: c3Prof1.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "12:00",
      },
    ],
  });

  const c3ProfUser2 = await prisma.user.create({
    data: {
      clinicId: clinic3.id,
      name: "Dra. Renata Campos",
      cpf: "30000000004",
      email: "renata.campos@saudetotal.com.br",
      phone: "11933001104",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c3Prof2 = await prisma.professional.create({
    data: {
      clinicId: clinic3.id,
      userId: c3ProfUser2.id,
      professionalCouncil: "CRM",
      registrationNumber: "300200",
      registrationState: "SP",
      defaultAppointmentDuration: 30,
      calendarColor: "#A78BFA",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: c3Prof2.id, specialtyId: c3SpecPediatria.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c3Prof2.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "19:00",
      },
      {
        professionalId: c3Prof2.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "19:00",
      },
      {
        professionalId: c3Prof2.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "19:00",
      },
      {
        professionalId: c3Prof2.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "13:00",
      },
    ],
  });

  const [c3Proc1, c3Proc2] = await Promise.all([
    prisma.procedure.create({
      data: {
        clinicId: clinic3.id,
        name: "Consulta Clínica Geral",
        code: "CG-001",
        defaultDuration: 20,
        defaultPrice: 180.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic3.id,
        name: "Consulta Pediátrica",
        code: "PED-001",
        defaultDuration: 30,
        defaultPrice: 220.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
  ]);
  await prisma.professionalProcedure.createMany({
    data: [
      { professionalId: c3Prof1.id, procedureId: c3Proc1.id },
      { professionalId: c3Prof2.id, procedureId: c3Proc2.id },
    ],
  });

  // Pacientes Clínica 3
  const c3PatUser1 = await prisma.user.create({
    data: {
      clinicId: clinic3.id,
      name: "Carla Moura",
      cpf: "30000000010",
      email: "carla.moura@email.com",
      phone: "11977001001",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c3Pat1 = await prisma.patient.create({
    data: {
      clinicId: clinic3.id,
      userId: c3PatUser1.id,
      cpf: "30000000010",
      dateOfBirth: new Date("1988-03-14"),
      gender: Gender.FEMALE,
      zipCode: "04041000",
      street: "Rua das Flores",
      number: "45",
      neighborhood: "Vila Mariana",
      city: "São Paulo",
      state: "SP",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 2,
    },
  });

  const c3PatUser2 = await prisma.user.create({
    data: {
      clinicId: clinic3.id,
      name: "Thiago Xavier",
      cpf: "30000000011",
      email: "thiago.xavier@email.com",
      phone: "11977001002",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c3Pat2 = await prisma.patient.create({
    data: {
      clinicId: clinic3.id,
      userId: c3PatUser2.id,
      cpf: "30000000011",
      dateOfBirth: new Date("1995-11-28"),
      gender: Gender.MALE,
      zipCode: "04041000",
      street: "Av. Paulista",
      number: "2000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 1,
    },
  });

  const c3PatUser3 = await prisma.user.create({
    data: {
      clinicId: clinic3.id,
      name: "Patrícia Rocha",
      cpf: "30000000012",
      email: "patricia.rocha@email.com",
      phone: "11977001003",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c3Pat3 = await prisma.patient.create({
    data: {
      clinicId: clinic3.id,
      userId: c3PatUser3.id,
      cpf: "30000000012",
      dateOfBirth: new Date("2015-06-05"),
      gender: Gender.FEMALE,
      zipCode: "04041000",
      street: "Rua Mourato Coelho",
      number: "120",
      neighborhood: "Pinheiros",
      city: "São Paulo",
      state: "SP",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 3,
    },
  });

  // Agendamentos Clínica 3
  const c3Apt1 = await prisma.appointment.create({
    data: {
      clinicId: clinic3.id,
      patientId: c3Pat1.id,
      professionalId: c3Prof1.id,
      procedureId: c3Proc1.id,
      appointmentDate: daysAgo(20),
      startTime: "08:00",
      endTime: "08:20",
      duration: 20,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.PHONE,
      confirmedAt: daysAgo(21),
      confirmedBy: c3RecepUser.id,
      createdBy: c3RecepUser.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic3.id,
      patientId: c3Pat2.id,
      professionalId: c3Prof1.id,
      procedureId: c3Proc1.id,
      appointmentDate: daysAgo(8),
      startTime: "09:00",
      endTime: "09:20",
      duration: 20,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.IN_PERSON,
      confirmedAt: daysAgo(9),
      confirmedBy: c3RecepUser.id,
      createdBy: c3RecepUser.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic3.id,
      patientId: c3Pat3.id,
      professionalId: c3Prof2.id,
      procedureId: c3Proc2.id,
      appointmentDate: daysAgo(5),
      startTime: "14:00",
      endTime: "14:30",
      duration: 30,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.WHATSAPP,
      confirmedAt: daysAgo(6),
      confirmedBy: c3RecepUser.id,
      createdBy: c3RecepUser.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic3.id,
      patientId: c3Pat1.id,
      professionalId: c3Prof1.id,
      procedureId: c3Proc1.id,
      appointmentDate: daysFromNow(3),
      startTime: "08:00",
      endTime: "08:20",
      duration: 20,
      status: AppointmentStatus.SCHEDULED,
      channel: AppointmentChannel.ONLINE_PORTAL,
      createdBy: c3PatUser1.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic3.id,
      patientId: c3Pat3.id,
      professionalId: c3Prof2.id,
      procedureId: c3Proc2.id,
      appointmentDate: today(),
      startTime: "15:30",
      endTime: "16:00",
      duration: 30,
      status: AppointmentStatus.CONFIRMED,
      channel: AppointmentChannel.PHONE,
      confirmedAt: daysAgo(1),
      confirmedBy: c3RecepUser.id,
      createdBy: c3RecepUser.id,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      appointmentId: c3Apt1.id,
      patientId: c3Pat1.id,
      professionalId: c3Prof1.id,
      chiefComplaint: "Gripe com febre há 3 dias",
      symptoms: "Febre 38.2°C, coriza, tosse seca",
      diagnosis: "Influenza (CID J11)",
      treatment: "Repouso, hidratação, antitérmico",
      prescription: "Paracetamol 750mg 6/6h SOS. Retorno se não melhorar em 5 dias.",
    },
  });

  await prisma.financialRecord.createMany({
    data: [
      {
        clinicId: clinic3.id,
        type: TransactionType.INCOME,
        amount: 180.0,
        description: "Consulta CG — Carla Moura",
        category: "Consulta",
        paymentMethod: PaymentMethod.PIX,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(20),
        referenceDate: daysAgo(20),
        appointmentId: c3Apt1.id,
        patientId: c3Pat1.id,
        createdBy: c3RecepUser.id,
      },
      {
        clinicId: clinic3.id,
        type: TransactionType.EXPENSE,
        amount: 2800.0,
        description: "Aluguel — março/2026",
        category: "Aluguel",
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(5),
        referenceDate: daysAgo(5),
        createdBy: c3Admin.id,
      },
    ],
  });

  console.log(
    `  ✅ ${clinic3.tradeName} criada com 2 profissionais, 3 pacientes, 5 agendamentos\n`,
  );

  // ╔══════════════════════════════════════════════════════════╗
  // ║  CLÍNICA 4 — Clínica Saúde & Vida   (São Paulo / SP)   ║
  // ║  "Saúde" — mesma cidade que Clínica 1 e 3               ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🏥 Criando Clínica 4 — Saúde & Vida...");
  const clinic4 = await prisma.clinic.create({
    data: {
      legalName: "Saúde e Vida Centro Médico LTDA",
      tradeName: "Clínica Saúde & Vida",
      cnpj: "22333444000155",
      email: "contato@saudevida.com.br",
      phone: "11944002200",
      subdomain: "saudevida",
      zipCode: "01407000",
      street: "Alameda Santos",
      number: "800",
      complement: "Conj. 302",
      neighborhood: "Jardim Paulista",
      city: "São Paulo",
      state: "SP",
      timezone: "America/Sao_Paulo",
      isActive: true,
    },
  });

  await prisma.clinicSettings.create({
    data: {
      clinicId: clinic4.id,
      minIntervalBetweenAppointments: 20,
      minAdvanceBookingHours: 3,
      maxAdvanceBookingDays: 60,
      maxCancellationHours: 24,
      maxConsecutiveNoShows: 2,
      appointmentToleranceMinutes: 15,
      allowOnlineBooking: true,
      requirePatientConfirmation: false,
      sendAppointmentConfirmation: true,
      sendAppointmentReminder: true,
      reminderHoursBefore: 24,
      sendBirthdayMessage: true,
      primaryColor: "#EC4899",
      secondaryColor: "#9D174D",
      darkMode: false,
    },
  });

  await prisma.clinicWorkingHours.createMany({
    data: [
      {
        clinicId: clinic4.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic4.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic4.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic4.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic4.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic4.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
      },
      {
        clinicId: clinic4.id,
        dayOfWeek: DayOfWeek.SUNDAY,
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
      },
    ],
  });

  const [c4SpecGineco, c4SpecEndocrino] = await Promise.all([
    prisma.specialty.create({
      data: {
        clinicId: clinic4.id,
        name: "Ginecologia",
        description: "Saúde da mulher",
        icon: "🌸",
        color: "#EC4899",
        isActive: true,
      },
    }),
    prisma.specialty.create({
      data: {
        clinicId: clinic4.id,
        name: "Endocrinologia",
        description: "Distúrbios hormonais e metabólicos",
        icon: "⚗️",
        color: "#F97316",
        isActive: true,
      },
    }),
  ]);

  const c4Admin = await prisma.user.create({
    data: {
      clinicId: clinic4.id,
      name: "Dra. Alice Nunes",
      cpf: "40000000001",
      email: "admin@saudevida.com.br",
      phone: "11944002201",
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const c4ProfUser1 = await prisma.user.create({
    data: {
      clinicId: clinic4.id,
      name: "Dra. Alice Nunes",
      cpf: "40000000002",
      email: "alice.nunes@saudevida.com.br",
      phone: "11944002202",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c4Prof1 = await prisma.professional.create({
    data: {
      clinicId: clinic4.id,
      userId: c4ProfUser1.id,
      professionalCouncil: "CRM",
      registrationNumber: "400100",
      registrationState: "SP",
      defaultAppointmentDuration: 40,
      calendarColor: "#EC4899",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: c4Prof1.id, specialtyId: c4SpecGineco.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c4Prof1.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "17:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
      {
        professionalId: c4Prof1.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "17:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
      {
        professionalId: c4Prof1.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "17:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
    ],
  });

  const c4ProfUser2 = await prisma.user.create({
    data: {
      clinicId: clinic4.id,
      name: "Dr. Marcos Pereira",
      cpf: "40000000003",
      email: "marcos.pereira@saudevida.com.br",
      phone: "11944002203",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c4Prof2 = await prisma.professional.create({
    data: {
      clinicId: clinic4.id,
      userId: c4ProfUser2.id,
      professionalCouncil: "CRM",
      registrationNumber: "400200",
      registrationState: "SP",
      defaultAppointmentDuration: 30,
      calendarColor: "#F97316",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: c4Prof2.id, specialtyId: c4SpecEndocrino.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c4Prof2.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "17:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
      {
        professionalId: c4Prof2.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "17:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
    ],
  });

  const [c4Proc1, c4Proc2] = await Promise.all([
    prisma.procedure.create({
      data: {
        clinicId: clinic4.id,
        name: "Consulta Ginecológica",
        code: "GIN-001",
        defaultDuration: 40,
        defaultPrice: 300.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic4.id,
        name: "Consulta Endocrinológica",
        code: "ENDO-001",
        defaultDuration: 30,
        defaultPrice: 320.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
  ]);
  await prisma.professionalProcedure.createMany({
    data: [
      { professionalId: c4Prof1.id, procedureId: c4Proc1.id },
      { professionalId: c4Prof2.id, procedureId: c4Proc2.id },
    ],
  });

  const c4PatUser1 = await prisma.user.create({
    data: {
      clinicId: clinic4.id,
      name: "Lúcia Fonseca",
      cpf: "40000000010",
      email: "lucia.fonseca@email.com",
      phone: "11977002001",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c4Pat1 = await prisma.patient.create({
    data: {
      clinicId: clinic4.id,
      userId: c4PatUser1.id,
      cpf: "40000000010",
      dateOfBirth: new Date("1992-07-18"),
      gender: Gender.FEMALE,
      zipCode: "01407000",
      street: "Rua Augusta",
      number: "500",
      neighborhood: "Jardim Paulista",
      city: "São Paulo",
      state: "SP",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 2,
    },
  });

  const c4PatUser2 = await prisma.user.create({
    data: {
      clinicId: clinic4.id,
      name: "Diego Santos",
      cpf: "40000000011",
      email: "diego.santos@email.com",
      phone: "11977002002",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c4Pat2 = await prisma.patient.create({
    data: {
      clinicId: clinic4.id,
      userId: c4PatUser2.id,
      cpf: "40000000011",
      dateOfBirth: new Date("1980-02-25"),
      gender: Gender.MALE,
      zipCode: "01407000",
      street: "Av. Consolação",
      number: "300",
      neighborhood: "Consolação",
      city: "São Paulo",
      state: "SP",
      allergies: "Sulfas",
      isActive: true,
      noShowCount: 1,
      totalAppointments: 4,
    },
  });

  const c4PatUser3 = await prisma.user.create({
    data: {
      clinicId: clinic4.id,
      name: "Mariana Duarte",
      cpf: "40000000012",
      email: "mariana.duarte@email.com",
      phone: "11977002003",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c4Pat3 = await prisma.patient.create({
    data: {
      clinicId: clinic4.id,
      userId: c4PatUser3.id,
      cpf: "40000000012",
      dateOfBirth: new Date("1975-12-01"),
      gender: Gender.FEMALE,
      zipCode: "01407000",
      street: "Rua Haddock Lobo",
      number: "77",
      neighborhood: "Cerqueira César",
      city: "São Paulo",
      state: "SP",
      conditions: "Hipotireoidismo",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 6,
    },
  });

  const c4Apt1 = await prisma.appointment.create({
    data: {
      clinicId: clinic4.id,
      patientId: c4Pat1.id,
      professionalId: c4Prof1.id,
      procedureId: c4Proc1.id,
      appointmentDate: daysAgo(15),
      startTime: "09:00",
      endTime: "09:40",
      duration: 40,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.ONLINE_PORTAL,
      confirmedAt: daysAgo(16),
      confirmedBy: c4PatUser1.id,
      createdBy: c4PatUser1.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic4.id,
      patientId: c4Pat3.id,
      professionalId: c4Prof2.id,
      procedureId: c4Proc2.id,
      appointmentDate: daysAgo(30),
      startTime: "14:00",
      endTime: "14:30",
      duration: 30,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.PHONE,
      confirmedAt: daysAgo(31),
      confirmedBy: c4Admin.id,
      createdBy: c4Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic4.id,
      patientId: c4Pat2.id,
      professionalId: c4Prof2.id,
      procedureId: c4Proc2.id,
      appointmentDate: daysAgo(3),
      startTime: "09:00",
      endTime: "09:30",
      duration: 30,
      status: AppointmentStatus.NO_SHOW,
      channel: AppointmentChannel.PHONE,
      createdBy: c4Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic4.id,
      patientId: c4Pat1.id,
      professionalId: c4Prof1.id,
      procedureId: c4Proc1.id,
      appointmentDate: daysFromNow(7),
      startTime: "10:00",
      endTime: "10:40",
      duration: 40,
      status: AppointmentStatus.CONFIRMED,
      channel: AppointmentChannel.ONLINE_PORTAL,
      confirmedAt: new Date(),
      confirmedBy: c4PatUser1.id,
      createdBy: c4PatUser1.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic4.id,
      patientId: c4Pat3.id,
      professionalId: c4Prof2.id,
      procedureId: c4Proc2.id,
      appointmentDate: daysFromNow(14),
      startTime: "13:00",
      endTime: "13:30",
      duration: 30,
      status: AppointmentStatus.SCHEDULED,
      channel: AppointmentChannel.PHONE,
      createdBy: c4Admin.id,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      appointmentId: c4Apt1.id,
      patientId: c4Pat1.id,
      professionalId: c4Prof1.id,
      chiefComplaint: "Dor pélvica e irregularidade menstrual",
      diagnosis: "Síndrome dos ovários policísticos (CID E28.2)",
      treatment: "Anticoncepcionais orais e acompanhamento nutricional",
      prescription: "Dienogeste 2mg 1x/dia. Retorno em 60 dias.",
    },
  });

  await prisma.financialRecord.createMany({
    data: [
      {
        clinicId: clinic4.id,
        type: TransactionType.INCOME,
        amount: 300.0,
        description: "Consulta Ginecológica — Lúcia Fonseca",
        category: "Consulta",
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(15),
        referenceDate: daysAgo(15),
        appointmentId: c4Apt1.id,
        patientId: c4Pat1.id,
        createdBy: c4Admin.id,
      },
      {
        clinicId: clinic4.id,
        type: TransactionType.EXPENSE,
        amount: 4200.0,
        description: "Aluguel — março/2026",
        category: "Aluguel",
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(10),
        referenceDate: daysAgo(10),
        createdBy: c4Admin.id,
      },
    ],
  });

  console.log(
    `  ✅ ${clinic4.tradeName} criada com 2 profissionais, 3 pacientes, 5 agendamentos\n`,
  );

  // ╔══════════════════════════════════════════════════════════╗
  // ║  CLÍNICA 5 — Clínica Saúde Integrada  (Curitiba / PR)  ║
  // ║  "Saúde" — mesma cidade que Clínica 8                   ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🏥 Criando Clínica 5 — Saúde Integrada...");
  const clinic5 = await prisma.clinic.create({
    data: {
      legalName: "Clínica Saúde Integrada S/S LTDA",
      tradeName: "Clínica Saúde Integrada",
      cnpj: "33444555000166",
      email: "contato@saudeintegrada.com.br",
      phone: "41933003300",
      subdomain: "saudeintegrada",
      zipCode: "80010020",
      street: "Rua XV de Novembro",
      number: "700",
      complement: "Sala 105",
      neighborhood: "Centro",
      city: "Curitiba",
      state: "PR",
      timezone: "America/Sao_Paulo",
      isActive: true,
    },
  });

  await prisma.clinicSettings.create({
    data: {
      clinicId: clinic5.id,
      minIntervalBetweenAppointments: 10,
      minAdvanceBookingHours: 1,
      maxAdvanceBookingDays: 30,
      maxCancellationHours: 12,
      maxConsecutiveNoShows: 3,
      appointmentToleranceMinutes: 10,
      allowOnlineBooking: true,
      requirePatientConfirmation: true,
      sendAppointmentConfirmation: true,
      sendAppointmentReminder: true,
      reminderHoursBefore: 48,
      sendBirthdayMessage: false,
      primaryColor: "#6366F1",
      secondaryColor: "#4338CA",
      darkMode: false,
    },
  });

  await prisma.clinicWorkingHours.createMany({
    data: [
      {
        clinicId: clinic5.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "20:00",
      },
      {
        clinicId: clinic5.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "20:00",
      },
      {
        clinicId: clinic5.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "20:00",
      },
      {
        clinicId: clinic5.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "20:00",
      },
      {
        clinicId: clinic5.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "20:00",
      },
      {
        clinicId: clinic5.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "14:00",
      },
      {
        clinicId: clinic5.id,
        dayOfWeek: DayOfWeek.SUNDAY,
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
      },
    ],
  });

  const [c5SpecPsico, c5SpecFono] = await Promise.all([
    prisma.specialty.create({
      data: {
        clinicId: clinic5.id,
        name: "Psicologia",
        description: "Saúde mental e bem-estar emocional",
        icon: "🧠",
        color: "#6366F1",
        isActive: true,
      },
    }),
    prisma.specialty.create({
      data: {
        clinicId: clinic5.id,
        name: "Fonoaudiologia",
        description: "Comunicação, linguagem e deglutição",
        icon: "🗣️",
        color: "#14B8A6",
        isActive: true,
      },
    }),
  ]);

  const c5Admin = await prisma.user.create({
    data: {
      clinicId: clinic5.id,
      name: "Dra. Elaine Braga",
      cpf: "50000000001",
      email: "admin@saudeintegrada.com.br",
      phone: "41933003301",
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const c5ProfUser1 = await prisma.user.create({
    data: {
      clinicId: clinic5.id,
      name: "Dr. Rafael Moreira",
      cpf: "50000000002",
      email: "rafael.moreira@saudeintegrada.com.br",
      phone: "41933003302",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c5Prof1 = await prisma.professional.create({
    data: {
      clinicId: clinic5.id,
      userId: c5ProfUser1.id,
      professionalCouncil: "CRP",
      registrationNumber: "500100",
      registrationState: "PR",
      defaultAppointmentDuration: 50,
      calendarColor: "#6366F1",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: c5Prof1.id, specialtyId: c5SpecPsico.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c5Prof1.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "18:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
      {
        professionalId: c5Prof1.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "18:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
      {
        professionalId: c5Prof1.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "18:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
      {
        professionalId: c5Prof1.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "18:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
      {
        professionalId: c5Prof1.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "18:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
    ],
  });

  const c5ProfUser2 = await prisma.user.create({
    data: {
      clinicId: clinic5.id,
      name: "Dra. Natália Aquino",
      cpf: "50000000003",
      email: "natalia.aquino@saudeintegrada.com.br",
      phone: "41933003303",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c5Prof2 = await prisma.professional.create({
    data: {
      clinicId: clinic5.id,
      userId: c5ProfUser2.id,
      professionalCouncil: "CRFa",
      registrationNumber: "500200",
      registrationState: "PR",
      defaultAppointmentDuration: 45,
      calendarColor: "#14B8A6",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: c5Prof2.id, specialtyId: c5SpecFono.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c5Prof2.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "20:00",
      },
      {
        professionalId: c5Prof2.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "20:00",
      },
      {
        professionalId: c5Prof2.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "14:00",
      },
    ],
  });

  const [c5Proc1, c5Proc2] = await Promise.all([
    prisma.procedure.create({
      data: {
        clinicId: clinic5.id,
        name: "Sessão de Psicoterapia",
        code: "PSI-001",
        defaultDuration: 50,
        defaultPrice: 200.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic5.id,
        name: "Sessão de Fonoaudiologia",
        code: "FONO-001",
        defaultDuration: 45,
        defaultPrice: 180.0,
        isActive: true,
        allowOnlineBooking: false,
      },
    }),
  ]);
  await prisma.professionalProcedure.createMany({
    data: [
      { professionalId: c5Prof1.id, procedureId: c5Proc1.id },
      { professionalId: c5Prof2.id, procedureId: c5Proc2.id },
    ],
  });

  const c5PatUser1 = await prisma.user.create({
    data: {
      clinicId: clinic5.id,
      name: "Elisa Brunetti",
      cpf: "50000000010",
      email: "elisa.brunetti@email.com",
      phone: "41977003001",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c5Pat1 = await prisma.patient.create({
    data: {
      clinicId: clinic5.id,
      userId: c5PatUser1.id,
      cpf: "50000000010",
      dateOfBirth: new Date("1998-04-22"),
      gender: Gender.FEMALE,
      zipCode: "80010020",
      street: "Rua Marechal Deodoro",
      number: "200",
      neighborhood: "Centro",
      city: "Curitiba",
      state: "PR",
      conditions: "Ansiedade generalizada",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 8,
    },
  });

  const c5PatUser2 = await prisma.user.create({
    data: {
      clinicId: clinic5.id,
      name: "Gabriel Nogueira",
      cpf: "50000000011",
      email: "gabriel.nogueira@email.com",
      phone: "41977003002",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c5Pat2 = await prisma.patient.create({
    data: {
      clinicId: clinic5.id,
      userId: c5PatUser2.id,
      cpf: "50000000011",
      dateOfBirth: new Date("2010-09-17"),
      gender: Gender.MALE,
      zipCode: "80010020",
      street: "Al. Augusto Stellfeld",
      number: "50",
      neighborhood: "Água Verde",
      city: "Curitiba",
      state: "PR",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 5,
    },
  });

  const c5PatUser3 = await prisma.user.create({
    data: {
      clinicId: clinic5.id,
      name: "Ana Lima",
      cpf: "50000000012",
      email: "ana.lima.cwb@email.com",
      phone: "41977003003",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c5Pat3 = await prisma.patient.create({
    data: {
      clinicId: clinic5.id,
      userId: c5PatUser3.id,
      cpf: "50000000012",
      dateOfBirth: new Date("1973-01-09"),
      gender: Gender.FEMALE,
      zipCode: "80010020",
      street: "Rua Vicente Machado",
      number: "300",
      neighborhood: "Batel",
      city: "Curitiba",
      state: "PR",
      conditions: "Depressão moderada",
      isActive: true,
      noShowCount: 1,
      totalAppointments: 12,
    },
  });

  const c5Apt1 = await prisma.appointment.create({
    data: {
      clinicId: clinic5.id,
      patientId: c5Pat1.id,
      professionalId: c5Prof1.id,
      procedureId: c5Proc1.id,
      appointmentDate: daysAgo(7),
      startTime: "09:00",
      endTime: "09:50",
      duration: 50,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.IN_PERSON,
      confirmedAt: daysAgo(8),
      confirmedBy: c5Admin.id,
      createdBy: c5Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic5.id,
      patientId: c5Pat3.id,
      professionalId: c5Prof1.id,
      procedureId: c5Proc1.id,
      appointmentDate: daysAgo(14),
      startTime: "10:00",
      endTime: "10:50",
      duration: 50,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.IN_PERSON,
      confirmedAt: daysAgo(15),
      confirmedBy: c5Admin.id,
      createdBy: c5Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic5.id,
      patientId: c5Pat2.id,
      professionalId: c5Prof2.id,
      procedureId: c5Proc2.id,
      appointmentDate: daysAgo(10),
      startTime: "14:00",
      endTime: "14:45",
      duration: 45,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.PHONE,
      confirmedAt: daysAgo(11),
      confirmedBy: c5Admin.id,
      createdBy: c5Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic5.id,
      patientId: c5Pat1.id,
      professionalId: c5Prof1.id,
      procedureId: c5Proc1.id,
      appointmentDate: today(),
      startTime: "09:00",
      endTime: "09:50",
      duration: 50,
      status: AppointmentStatus.IN_PROGRESS,
      channel: AppointmentChannel.IN_PERSON,
      confirmedAt: daysAgo(1),
      confirmedBy: c5Admin.id,
      createdBy: c5Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic5.id,
      patientId: c5Pat3.id,
      professionalId: c5Prof1.id,
      procedureId: c5Proc1.id,
      appointmentDate: daysFromNow(7),
      startTime: "11:00",
      endTime: "11:50",
      duration: 50,
      status: AppointmentStatus.SCHEDULED,
      channel: AppointmentChannel.IN_PERSON,
      createdBy: c5Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic5.id,
      patientId: c5Pat2.id,
      professionalId: c5Prof2.id,
      procedureId: c5Proc2.id,
      appointmentDate: daysFromNow(4),
      startTime: "14:00",
      endTime: "14:45",
      duration: 45,
      status: AppointmentStatus.CONFIRMED,
      channel: AppointmentChannel.PHONE,
      confirmedAt: new Date(),
      confirmedBy: c5PatUser2.id,
      createdBy: c5PatUser2.id,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      appointmentId: c5Apt1.id,
      patientId: c5Pat1.id,
      professionalId: c5Prof1.id,
      chiefComplaint: "Crises de pânico recorrentes",
      symptoms: "Taquicardia, sudorese, sensação de sufocamento",
      diagnosis: "Transtorno de pânico (CID F41.0)",
      treatment: "Psicoterapia cognitivo-comportamental (TCC)",
      prescription: "Manter protocolo TCC 1x/semana. Exercícios respiratórios diários.",
    },
  });

  await prisma.financialRecord.createMany({
    data: [
      {
        clinicId: clinic5.id,
        type: TransactionType.INCOME,
        amount: 200.0,
        description: "Psicoterapia — Elisa Brunetti",
        category: "Procedimento",
        paymentMethod: PaymentMethod.PIX,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(7),
        referenceDate: daysAgo(7),
        appointmentId: c5Apt1.id,
        patientId: c5Pat1.id,
        createdBy: c5Admin.id,
      },
      {
        clinicId: clinic5.id,
        type: TransactionType.EXPENSE,
        amount: 2200.0,
        description: "Aluguel — março/2026",
        category: "Aluguel",
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(3),
        referenceDate: daysAgo(3),
        createdBy: c5Admin.id,
      },
    ],
  });

  console.log(
    `  ✅ ${clinic5.tradeName} criada com 2 profissionais, 3 pacientes, 6 agendamentos\n`,
  );

  // ╔══════════════════════════════════════════════════════════╗
  // ║  CLÍNICA 6 — OdontoVita  (Rio de Janeiro / RJ)         ║
  // ║  "Odonto" — mesma cidade que OdontoPrime (#2)           ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🏥 Criando Clínica 6 — OdontoVita...");
  const clinic6 = await prisma.clinic.create({
    data: {
      legalName: "OdontoVita Odontologia Avançada LTDA",
      tradeName: "OdontoVita",
      cnpj: "44555666000177",
      email: "contato@odontovita.com.br",
      phone: "21933004400",
      subdomain: "odontovita",
      zipCode: "22250040",
      street: "Rua Visconde de Pirajá",
      number: "550",
      complement: "Sala 802",
      neighborhood: "Ipanema",
      city: "Rio de Janeiro",
      state: "RJ",
      timezone: "America/Sao_Paulo",
      isActive: true,
    },
  });

  await prisma.clinicSettings.create({
    data: {
      clinicId: clinic6.id,
      minIntervalBetweenAppointments: 30,
      minAdvanceBookingHours: 4,
      maxAdvanceBookingDays: 90,
      maxCancellationHours: 48,
      maxConsecutiveNoShows: 2,
      appointmentToleranceMinutes: 10,
      allowOnlineBooking: false,
      requirePatientConfirmation: true,
      sendAppointmentConfirmation: true,
      sendAppointmentReminder: true,
      reminderHoursBefore: 24,
      sendBirthdayMessage: false,
      primaryColor: "#06B6D4",
      secondaryColor: "#0E7490",
      darkMode: false,
    },
  });

  await prisma.clinicWorkingHours.createMany({
    data: [
      {
        clinicId: clinic6.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic6.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic6.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic6.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic6.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isOpen: true,
        openTime: "09:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic6.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
      },
      {
        clinicId: clinic6.id,
        dayOfWeek: DayOfWeek.SUNDAY,
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
      },
    ],
  });

  const [c6SpecOdontoPed, c6SpecPerio] = await Promise.all([
    prisma.specialty.create({
      data: {
        clinicId: clinic6.id,
        name: "Odontopediatria",
        description: "Saúde bucal infantil",
        icon: "🦷",
        color: "#06B6D4",
        isActive: true,
      },
    }),
    prisma.specialty.create({
      data: {
        clinicId: clinic6.id,
        name: "Periodontia",
        description: "Tratamento das gengivas e estruturas de suporte",
        icon: "🔬",
        color: "#F97316",
        isActive: true,
      },
    }),
  ]);

  const c6Admin = await prisma.user.create({
    data: {
      clinicId: clinic6.id,
      name: "Dr. Henrique Ramos",
      cpf: "60000000001",
      email: "admin@odontovita.com.br",
      phone: "21933004401",
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const c6ProfUser1 = await prisma.user.create({
    data: {
      clinicId: clinic6.id,
      name: "Dra. Isabela Cunha",
      cpf: "60000000002",
      email: "isabela.cunha@odontovita.com.br",
      phone: "21933004402",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c6Prof1 = await prisma.professional.create({
    data: {
      clinicId: clinic6.id,
      userId: c6ProfUser1.id,
      professionalCouncil: "CRO",
      registrationNumber: "600100",
      registrationState: "RJ",
      defaultAppointmentDuration: 45,
      calendarColor: "#06B6D4",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.createMany({
    data: [
      { professionalId: c6Prof1.id, specialtyId: c6SpecOdontoPed.id, isPrimary: true },
      { professionalId: c6Prof1.id, specialtyId: c6SpecPerio.id, isPrimary: false },
    ],
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c6Prof1.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isWorking: true,
        startTime: "09:00",
        endTime: "18:00",
        lunchBreakStart: "13:00",
        lunchBreakEnd: "14:00",
      },
      {
        professionalId: c6Prof1.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isWorking: true,
        startTime: "09:00",
        endTime: "18:00",
        lunchBreakStart: "13:00",
        lunchBreakEnd: "14:00",
      },
      {
        professionalId: c6Prof1.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isWorking: true,
        startTime: "09:00",
        endTime: "18:00",
        lunchBreakStart: "13:00",
        lunchBreakEnd: "14:00",
      },
      {
        professionalId: c6Prof1.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isWorking: true,
        startTime: "09:00",
        endTime: "18:00",
        lunchBreakStart: "13:00",
        lunchBreakEnd: "14:00",
      },
      {
        professionalId: c6Prof1.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isWorking: true,
        startTime: "09:00",
        endTime: "18:00",
        lunchBreakStart: "13:00",
        lunchBreakEnd: "14:00",
      },
    ],
  });

  const [c6Proc1, c6Proc2] = await Promise.all([
    prisma.procedure.create({
      data: {
        clinicId: clinic6.id,
        name: "Consulta Odontopediátrica",
        code: "ODPED-001",
        defaultDuration: 45,
        defaultPrice: 250.0,
        isActive: true,
        allowOnlineBooking: false,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic6.id,
        name: "Raspagem e Alisamento Radicular",
        code: "PERIO-001",
        defaultDuration: 60,
        defaultPrice: 420.0,
        isActive: true,
        allowOnlineBooking: false,
      },
    }),
  ]);
  await prisma.professionalProcedure.createMany({
    data: [
      { professionalId: c6Prof1.id, procedureId: c6Proc1.id },
      { professionalId: c6Prof1.id, procedureId: c6Proc2.id },
    ],
  });

  const c6PatUser1 = await prisma.user.create({
    data: {
      clinicId: clinic6.id,
      name: "Henrique Carvalho",
      cpf: "60000000010",
      email: "henrique.carvalho@email.com",
      phone: "21977004001",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c6Pat1 = await prisma.patient.create({
    data: {
      clinicId: clinic6.id,
      userId: c6PatUser1.id,
      cpf: "60000000010",
      dateOfBirth: new Date("2014-08-30"),
      gender: Gender.MALE,
      zipCode: "22250040",
      street: "Rua Farme de Amoedo",
      number: "10",
      neighborhood: "Ipanema",
      city: "Rio de Janeiro",
      state: "RJ",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 4,
    },
  });

  const c6PatUser2 = await prisma.user.create({
    data: {
      clinicId: clinic6.id,
      name: "Vanessa Teixeira",
      cpf: "60000000011",
      email: "vanessa.teixeira@email.com",
      phone: "21977004002",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c6Pat2 = await prisma.patient.create({
    data: {
      clinicId: clinic6.id,
      userId: c6PatUser2.id,
      cpf: "60000000011",
      dateOfBirth: new Date("1987-05-16"),
      gender: Gender.FEMALE,
      zipCode: "22250040",
      street: "Av. Vieira Souto",
      number: "300",
      neighborhood: "Ipanema",
      city: "Rio de Janeiro",
      state: "RJ",
      conditions: "Gengivite crônica",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 3,
    },
  });

  const c6Apt1 = await prisma.appointment.create({
    data: {
      clinicId: clinic6.id,
      patientId: c6Pat2.id,
      professionalId: c6Prof1.id,
      procedureId: c6Proc2.id,
      appointmentDate: daysAgo(20),
      startTime: "10:00",
      endTime: "11:00",
      duration: 60,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.PHONE,
      confirmedAt: daysAgo(21),
      confirmedBy: c6Admin.id,
      createdBy: c6Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic6.id,
      patientId: c6Pat1.id,
      professionalId: c6Prof1.id,
      procedureId: c6Proc1.id,
      appointmentDate: daysAgo(6),
      startTime: "09:00",
      endTime: "09:45",
      duration: 45,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.PHONE,
      confirmedAt: daysAgo(7),
      confirmedBy: c6Admin.id,
      createdBy: c6Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic6.id,
      patientId: c6Pat2.id,
      professionalId: c6Prof1.id,
      procedureId: c6Proc2.id,
      appointmentDate: daysFromNow(10),
      startTime: "11:00",
      endTime: "12:00",
      duration: 60,
      status: AppointmentStatus.SCHEDULED,
      channel: AppointmentChannel.PHONE,
      createdBy: c6Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic6.id,
      patientId: c6Pat1.id,
      professionalId: c6Prof1.id,
      procedureId: c6Proc1.id,
      appointmentDate: daysFromNow(21),
      startTime: "09:00",
      endTime: "09:45",
      duration: 45,
      status: AppointmentStatus.SCHEDULED,
      channel: AppointmentChannel.PHONE,
      createdBy: c6Admin.id,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      appointmentId: c6Apt1.id,
      patientId: c6Pat2.id,
      professionalId: c6Prof1.id,
      chiefComplaint: "Sangramento gengival ao escovar",
      diagnosis: "Doença periodontal leve a moderada (CID K05.3)",
      treatment: "Raspagem supragengival e instruções de higiene bucal",
      prescription: "Clorexidina 0,12% bochecho 2x/dia por 14 dias.",
    },
  });

  await prisma.financialRecord.createMany({
    data: [
      {
        clinicId: clinic6.id,
        type: TransactionType.INCOME,
        amount: 420.0,
        description: "Raspagem — Vanessa Teixeira",
        category: "Procedimento",
        paymentMethod: PaymentMethod.DEBIT_CARD,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(20),
        referenceDate: daysAgo(20),
        appointmentId: c6Apt1.id,
        patientId: c6Pat2.id,
        createdBy: c6Admin.id,
      },
      {
        clinicId: clinic6.id,
        type: TransactionType.EXPENSE,
        amount: 5500.0,
        description: "Aluguel — março/2026 (Ipanema)",
        category: "Aluguel",
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(8),
        referenceDate: daysAgo(8),
        createdBy: c6Admin.id,
      },
    ],
  });

  console.log(`  ✅ ${clinic6.tradeName} criada com 1 profissional, 2 pacientes, 4 agendamentos\n`);

  // ╔══════════════════════════════════════════════════════════╗
  // ║  CLÍNICA 7 — Centro Médico Bem Estar (Belo Horizonte)   ║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🏥 Criando Clínica 7 — Centro Médico Bem Estar...");
  const clinic7 = await prisma.clinic.create({
    data: {
      legalName: "Centro Médico Bem Estar LTDA",
      tradeName: "Centro Médico Bem Estar",
      cnpj: "55666777000188",
      email: "contato@bemestarcm.com.br",
      phone: "31933005500",
      subdomain: "bemestarcm",
      zipCode: "30130010",
      street: "Avenida Afonso Pena",
      number: "3500",
      complement: "Bloco B, Sala 110",
      neighborhood: "Serra",
      city: "Belo Horizonte",
      state: "MG",
      timezone: "America/Sao_Paulo",
      isActive: true,
    },
  });

  await prisma.clinicSettings.create({
    data: {
      clinicId: clinic7.id,
      minIntervalBetweenAppointments: 20,
      minAdvanceBookingHours: 2,
      maxAdvanceBookingDays: 60,
      maxCancellationHours: 24,
      maxConsecutiveNoShows: 3,
      appointmentToleranceMinutes: 15,
      allowOnlineBooking: true,
      requirePatientConfirmation: false,
      sendAppointmentConfirmation: true,
      sendAppointmentReminder: true,
      reminderHoursBefore: 24,
      sendBirthdayMessage: true,
      primaryColor: "#D97706",
      secondaryColor: "#92400E",
      darkMode: false,
    },
  });

  await prisma.clinicWorkingHours.createMany({
    data: [
      {
        clinicId: clinic7.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isOpen: true,
        openTime: "07:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic7.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isOpen: true,
        openTime: "07:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic7.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isOpen: true,
        openTime: "07:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic7.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isOpen: true,
        openTime: "07:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic7.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isOpen: true,
        openTime: "07:00",
        closeTime: "19:00",
      },
      {
        clinicId: clinic7.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isOpen: true,
        openTime: "08:00",
        closeTime: "12:00",
      },
      {
        clinicId: clinic7.id,
        dayOfWeek: DayOfWeek.SUNDAY,
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
      },
    ],
  });

  const [c7SpecOrto, c7SpecNeuro] = await Promise.all([
    prisma.specialty.create({
      data: {
        clinicId: clinic7.id,
        name: "Ortopedia",
        description: "Sistema musculoesquelético",
        icon: "🦴",
        color: "#D97706",
        isActive: true,
      },
    }),
    prisma.specialty.create({
      data: {
        clinicId: clinic7.id,
        name: "Neurologia",
        description: "Sistema nervoso central e periférico",
        icon: "🧬",
        color: "#7C3AED",
        isActive: true,
      },
    }),
  ]);

  const c7Admin = await prisma.user.create({
    data: {
      clinicId: clinic7.id,
      name: "Dr. Fábio Monteiro",
      cpf: "70000000001",
      email: "admin@bemestarcm.com.br",
      phone: "31933005501",
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const c7ProfUser1 = await prisma.user.create({
    data: {
      clinicId: clinic7.id,
      name: "Dr. Fábio Monteiro",
      cpf: "70000000002",
      email: "fabio.monteiro@bemestarcm.com.br",
      phone: "31933005502",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c7Prof1 = await prisma.professional.create({
    data: {
      clinicId: clinic7.id,
      userId: c7ProfUser1.id,
      professionalCouncil: "CRM",
      registrationNumber: "700100",
      registrationState: "MG",
      defaultAppointmentDuration: 30,
      calendarColor: "#D97706",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: c7Prof1.id, specialtyId: c7SpecOrto.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c7Prof1.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "13:00",
      },
      {
        professionalId: c7Prof1.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "13:00",
      },
      {
        professionalId: c7Prof1.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "13:00",
      },
    ],
  });

  const c7ProfUser2 = await prisma.user.create({
    data: {
      clinicId: clinic7.id,
      name: "Dra. Silvana Prado",
      cpf: "70000000003",
      email: "silvana.prado@bemestarcm.com.br",
      phone: "31933005503",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c7Prof2 = await prisma.professional.create({
    data: {
      clinicId: clinic7.id,
      userId: c7ProfUser2.id,
      professionalCouncil: "CRM",
      registrationNumber: "700200",
      registrationState: "MG",
      defaultAppointmentDuration: 40,
      calendarColor: "#7C3AED",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: c7Prof2.id, specialtyId: c7SpecNeuro.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c7Prof2.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "19:00",
      },
      {
        professionalId: c7Prof2.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "19:00",
      },
      {
        professionalId: c7Prof2.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "12:00",
      },
    ],
  });

  const [c7Proc1, c7Proc2] = await Promise.all([
    prisma.procedure.create({
      data: {
        clinicId: clinic7.id,
        name: "Consulta Ortopédica",
        code: "ORT-001",
        defaultDuration: 30,
        defaultPrice: 290.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic7.id,
        name: "Consulta Neurológica",
        code: "NEU-001",
        defaultDuration: 40,
        defaultPrice: 350.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
  ]);
  await prisma.professionalProcedure.createMany({
    data: [
      { professionalId: c7Prof1.id, procedureId: c7Proc1.id },
      { professionalId: c7Prof2.id, procedureId: c7Proc2.id },
    ],
  });

  const c7PatUser1 = await prisma.user.create({
    data: {
      clinicId: clinic7.id,
      name: "Wellington Brito",
      cpf: "70000000010",
      email: "wellington.brito@email.com",
      phone: "31977005001",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c7Pat1 = await prisma.patient.create({
    data: {
      clinicId: clinic7.id,
      userId: c7PatUser1.id,
      cpf: "70000000010",
      dateOfBirth: new Date("1970-06-14"),
      gender: Gender.MALE,
      zipCode: "30130010",
      street: "Rua da Bahia",
      number: "400",
      neighborhood: "Centro",
      city: "Belo Horizonte",
      state: "MG",
      conditions: "Gonartrose bilateral",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 5,
    },
  });

  const c7PatUser2 = await prisma.user.create({
    data: {
      clinicId: clinic7.id,
      name: "Flávia Sousa",
      cpf: "70000000011",
      email: "flavia.sousa@email.com",
      phone: "31977005002",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c7Pat2 = await prisma.patient.create({
    data: {
      clinicId: clinic7.id,
      userId: c7PatUser2.id,
      cpf: "70000000011",
      dateOfBirth: new Date("1960-10-28"),
      gender: Gender.FEMALE,
      zipCode: "30130010",
      street: "Av. do Contorno",
      number: "1000",
      neighborhood: "Santo Agostinho",
      city: "Belo Horizonte",
      state: "MG",
      conditions: "Enxaqueca crônica",
      isActive: true,
      noShowCount: 1,
      totalAppointments: 7,
    },
  });

  const c7Apt1 = await prisma.appointment.create({
    data: {
      clinicId: clinic7.id,
      patientId: c7Pat1.id,
      professionalId: c7Prof1.id,
      procedureId: c7Proc1.id,
      appointmentDate: daysAgo(18),
      startTime: "08:00",
      endTime: "08:30",
      duration: 30,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.PHONE,
      confirmedAt: daysAgo(19),
      confirmedBy: c7Admin.id,
      createdBy: c7Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic7.id,
      patientId: c7Pat2.id,
      professionalId: c7Prof2.id,
      procedureId: c7Proc2.id,
      appointmentDate: daysAgo(11),
      startTime: "14:00",
      endTime: "14:40",
      duration: 40,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.IN_PERSON,
      confirmedAt: daysAgo(12),
      confirmedBy: c7Admin.id,
      createdBy: c7Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic7.id,
      patientId: c7Pat1.id,
      professionalId: c7Prof1.id,
      procedureId: c7Proc1.id,
      appointmentDate: daysFromNow(5),
      startTime: "07:00",
      endTime: "07:30",
      duration: 30,
      status: AppointmentStatus.CONFIRMED,
      channel: AppointmentChannel.PHONE,
      confirmedAt: new Date(),
      confirmedBy: c7Admin.id,
      createdBy: c7Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic7.id,
      patientId: c7Pat2.id,
      professionalId: c7Prof2.id,
      procedureId: c7Proc2.id,
      appointmentDate: daysFromNow(12),
      startTime: "14:00",
      endTime: "14:40",
      duration: 40,
      status: AppointmentStatus.SCHEDULED,
      channel: AppointmentChannel.ONLINE_PORTAL,
      createdBy: c7PatUser2.id,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      appointmentId: c7Apt1.id,
      patientId: c7Pat1.id,
      professionalId: c7Prof1.id,
      chiefComplaint: "Dor no joelho direito ao subir escadas",
      symptoms: "Dor mecânica, crepitação, limitação de flexão",
      diagnosis: "Gonartrose grau II (CID M17.1)",
      treatment: "Fisioterapia, infiltração e exercícios de fortalecimento",
      prescription:
        "Encaminhar para fisioterapia. Meloxicam 15mg 1x/dia por 10 dias. Retorno em 30 dias.",
    },
  });

  await prisma.financialRecord.createMany({
    data: [
      {
        clinicId: clinic7.id,
        type: TransactionType.INCOME,
        amount: 290.0,
        description: "Consulta Ortopédica — Wellington Brito",
        category: "Consulta",
        paymentMethod: PaymentMethod.CASH,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(18),
        referenceDate: daysAgo(18),
        appointmentId: c7Apt1.id,
        patientId: c7Pat1.id,
        createdBy: c7Admin.id,
      },
      {
        clinicId: clinic7.id,
        type: TransactionType.EXPENSE,
        amount: 3800.0,
        description: "Aluguel — março/2026",
        category: "Aluguel",
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(12),
        referenceDate: daysAgo(12),
        createdBy: c7Admin.id,
      },
    ],
  });

  console.log(
    `  ✅ ${clinic7.tradeName} criada com 2 profissionais, 2 pacientes, 4 agendamentos\n`,
  );

  // ╔══════════════════════════════════════════════════════════╗
  // ║  CLÍNICA 8 — VitaSaúde Clínica  (Curitiba / PR)        ║
  // ║  "Saúde" — mesma cidade que Clínica Saúde Integrada (#5)║
  // ╚══════════════════════════════════════════════════════════╝
  console.log("🏥 Criando Clínica 8 — VitaSaúde...");
  const clinic8 = await prisma.clinic.create({
    data: {
      legalName: "VitaSaúde Clínica de Saúde e Esporte LTDA",
      tradeName: "VitaSaúde Clínica",
      cnpj: "66777888000199",
      email: "contato@vitasaude.com.br",
      phone: "41933006600",
      subdomain: "vitasaude",
      zipCode: "80250200",
      street: "Av. Batel",
      number: "1400",
      complement: "Sala 201",
      neighborhood: "Batel",
      city: "Curitiba",
      state: "PR",
      timezone: "America/Sao_Paulo",
      isActive: true,
    },
  });

  await prisma.clinicSettings.create({
    data: {
      clinicId: clinic8.id,
      minIntervalBetweenAppointments: 15,
      minAdvanceBookingHours: 2,
      maxAdvanceBookingDays: 60,
      maxCancellationHours: 24,
      maxConsecutiveNoShows: 3,
      appointmentToleranceMinutes: 10,
      allowOnlineBooking: true,
      requirePatientConfirmation: true,
      sendAppointmentConfirmation: true,
      sendAppointmentReminder: true,
      reminderHoursBefore: 24,
      sendBirthdayMessage: true,
      primaryColor: "#10B981",
      secondaryColor: "#065F46",
      darkMode: false,
    },
  });

  await prisma.clinicWorkingHours.createMany({
    data: [
      {
        clinicId: clinic8.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isOpen: true,
        openTime: "06:00",
        closeTime: "20:00",
      },
      {
        clinicId: clinic8.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isOpen: true,
        openTime: "06:00",
        closeTime: "20:00",
      },
      {
        clinicId: clinic8.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isOpen: true,
        openTime: "06:00",
        closeTime: "20:00",
      },
      {
        clinicId: clinic8.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isOpen: true,
        openTime: "06:00",
        closeTime: "20:00",
      },
      {
        clinicId: clinic8.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isOpen: true,
        openTime: "06:00",
        closeTime: "20:00",
      },
      {
        clinicId: clinic8.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isOpen: true,
        openTime: "07:00",
        closeTime: "15:00",
      },
      {
        clinicId: clinic8.id,
        dayOfWeek: DayOfWeek.SUNDAY,
        isOpen: false,
        openTime: "00:00",
        closeTime: "00:00",
      },
    ],
  });

  const [c8SpecEsporte, c8SpecReuma] = await Promise.all([
    prisma.specialty.create({
      data: {
        clinicId: clinic8.id,
        name: "Medicina do Esporte",
        description: "Desempenho atlético e prevenção de lesões",
        icon: "🏋️",
        color: "#10B981",
        isActive: true,
      },
    }),
    prisma.specialty.create({
      data: {
        clinicId: clinic8.id,
        name: "Reumatologia",
        description: "Doenças articulares e autoimunes",
        icon: "🦾",
        color: "#3B82F6",
        isActive: true,
      },
    }),
  ]);

  const c8Admin = await prisma.user.create({
    data: {
      clinicId: clinic8.id,
      name: "Dr. Igor Pinheiro",
      cpf: "80000000001",
      email: "admin@vitasaude.com.br",
      phone: "41933006601",
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const c8ProfUser1 = await prisma.user.create({
    data: {
      clinicId: clinic8.id,
      name: "Dr. Igor Pinheiro",
      cpf: "80000000002",
      email: "igor.pinheiro@vitasaude.com.br",
      phone: "41933006602",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c8Prof1 = await prisma.professional.create({
    data: {
      clinicId: clinic8.id,
      userId: c8ProfUser1.id,
      professionalCouncil: "CRM",
      registrationNumber: "800100",
      registrationState: "PR",
      defaultAppointmentDuration: 30,
      calendarColor: "#10B981",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: c8Prof1.id, specialtyId: c8SpecEsporte.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c8Prof1.id,
        dayOfWeek: DayOfWeek.MONDAY,
        isWorking: true,
        startTime: "06:00",
        endTime: "12:00",
      },
      {
        professionalId: c8Prof1.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isWorking: true,
        startTime: "06:00",
        endTime: "12:00",
      },
      {
        professionalId: c8Prof1.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        isWorking: true,
        startTime: "06:00",
        endTime: "12:00",
      },
      {
        professionalId: c8Prof1.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isWorking: true,
        startTime: "06:00",
        endTime: "12:00",
      },
      {
        professionalId: c8Prof1.id,
        dayOfWeek: DayOfWeek.FRIDAY,
        isWorking: true,
        startTime: "06:00",
        endTime: "12:00",
      },
      {
        professionalId: c8Prof1.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isWorking: true,
        startTime: "07:00",
        endTime: "12:00",
      },
    ],
  });

  const c8ProfUser2 = await prisma.user.create({
    data: {
      clinicId: clinic8.id,
      name: "Dra. Camila Whitfield",
      cpf: "80000000003",
      email: "camila.whitfield@vitasaude.com.br",
      phone: "41933006603",
      password: hashedPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c8Prof2 = await prisma.professional.create({
    data: {
      clinicId: clinic8.id,
      userId: c8ProfUser2.id,
      professionalCouncil: "CRM",
      registrationNumber: "800200",
      registrationState: "PR",
      defaultAppointmentDuration: 40,
      calendarColor: "#3B82F6",
      isActive: true,
    },
  });
  await prisma.professionalSpecialty.create({
    data: { professionalId: c8Prof2.id, specialtyId: c8SpecReuma.id, isPrimary: true },
  });
  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: c8Prof2.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "19:00",
      },
      {
        professionalId: c8Prof2.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        isWorking: true,
        startTime: "13:00",
        endTime: "19:00",
      },
      {
        professionalId: c8Prof2.id,
        dayOfWeek: DayOfWeek.SATURDAY,
        isWorking: true,
        startTime: "08:00",
        endTime: "13:00",
      },
    ],
  });

  const [c8Proc1, c8Proc2] = await Promise.all([
    prisma.procedure.create({
      data: {
        clinicId: clinic8.id,
        name: "Avaliação Medicina do Esporte",
        code: "ESP-001",
        defaultDuration: 30,
        defaultPrice: 280.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
    prisma.procedure.create({
      data: {
        clinicId: clinic8.id,
        name: "Consulta Reumatológica",
        code: "REU-001",
        defaultDuration: 40,
        defaultPrice: 340.0,
        isActive: true,
        allowOnlineBooking: true,
      },
    }),
  ]);
  await prisma.professionalProcedure.createMany({
    data: [
      { professionalId: c8Prof1.id, procedureId: c8Proc1.id },
      { professionalId: c8Prof2.id, procedureId: c8Proc2.id },
    ],
  });

  const c8PatUser1 = await prisma.user.create({
    data: {
      clinicId: clinic8.id,
      name: "Igor Pinheiro Jr",
      cpf: "80000000010",
      email: "igorjr.pinheiro@email.com",
      phone: "41977006001",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c8Pat1 = await prisma.patient.create({
    data: {
      clinicId: clinic8.id,
      userId: c8PatUser1.id,
      cpf: "80000000010",
      dateOfBirth: new Date("1995-08-12"),
      gender: Gender.MALE,
      zipCode: "80250200",
      street: "Rua Comendador Araújo",
      number: "100",
      neighborhood: "Batel",
      city: "Curitiba",
      state: "PR",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 3,
    },
  });

  const c8PatUser2 = await prisma.user.create({
    data: {
      clinicId: clinic8.id,
      name: "Camila Silva Porto",
      cpf: "80000000011",
      email: "camila.porto@email.com",
      phone: "41977006002",
      password: hashedPassword,
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  const c8Pat2 = await prisma.patient.create({
    data: {
      clinicId: clinic8.id,
      userId: c8PatUser2.id,
      cpf: "80000000011",
      dateOfBirth: new Date("1982-03-20"),
      gender: Gender.FEMALE,
      zipCode: "80250200",
      street: "Av. Sete de Setembro",
      number: "4800",
      neighborhood: "Bigorrilho",
      city: "Curitiba",
      state: "PR",
      conditions: "Artrite reumatoide",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 6,
    },
  });

  const c8Apt1 = await prisma.appointment.create({
    data: {
      clinicId: clinic8.id,
      patientId: c8Pat1.id,
      professionalId: c8Prof1.id,
      procedureId: c8Proc1.id,
      appointmentDate: daysAgo(9),
      startTime: "07:00",
      endTime: "07:30",
      duration: 30,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.IN_PERSON,
      confirmedAt: daysAgo(10),
      confirmedBy: c8Admin.id,
      createdBy: c8Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic8.id,
      patientId: c8Pat2.id,
      professionalId: c8Prof2.id,
      procedureId: c8Proc2.id,
      appointmentDate: daysAgo(25),
      startTime: "14:00",
      endTime: "14:40",
      duration: 40,
      status: AppointmentStatus.COMPLETED,
      channel: AppointmentChannel.PHONE,
      confirmedAt: daysAgo(26),
      confirmedBy: c8Admin.id,
      createdBy: c8Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic8.id,
      patientId: c8Pat1.id,
      professionalId: c8Prof1.id,
      procedureId: c8Proc1.id,
      appointmentDate: today(),
      startTime: "08:00",
      endTime: "08:30",
      duration: 30,
      status: AppointmentStatus.WAITING,
      channel: AppointmentChannel.IN_PERSON,
      confirmedAt: daysAgo(1),
      confirmedBy: c8Admin.id,
      createdBy: c8Admin.id,
    },
  });
  await prisma.appointment.create({
    data: {
      clinicId: clinic8.id,
      patientId: c8Pat2.id,
      professionalId: c8Prof2.id,
      procedureId: c8Proc2.id,
      appointmentDate: daysFromNow(8),
      startTime: "13:00",
      endTime: "13:40",
      duration: 40,
      status: AppointmentStatus.SCHEDULED,
      channel: AppointmentChannel.PHONE,
      createdBy: c8Admin.id,
    },
  });

  await prisma.medicalRecord.create({
    data: {
      appointmentId: c8Apt1.id,
      patientId: c8Pat1.id,
      professionalId: c8Prof1.id,
      chiefComplaint: "Avaliação para retorno ao esporte após lesão no ombro",
      symptoms: "Dor residual grau 2/10, amplitude de movimento preservada",
      diagnosis: "Pós-operatório de lesão do manguito rotador (CID M75.1)",
      treatment: "Liberação para treinamento progressivo",
      prescription: "Protocolo de retorno ao esporte — fase 3. Reavaliação em 30 dias.",
    },
  });

  await prisma.financialRecord.createMany({
    data: [
      {
        clinicId: clinic8.id,
        type: TransactionType.INCOME,
        amount: 280.0,
        description: "Avaliação Esporte — Igor Pinheiro Jr",
        category: "Consulta",
        paymentMethod: PaymentMethod.PIX,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(9),
        referenceDate: daysAgo(9),
        appointmentId: c8Apt1.id,
        patientId: c8Pat1.id,
        createdBy: c8Admin.id,
      },
      {
        clinicId: clinic8.id,
        type: TransactionType.EXPENSE,
        amount: 3100.0,
        description: "Aluguel — março/2026 (Batel)",
        category: "Aluguel",
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.PAID,
        paidAt: daysAgo(7),
        referenceDate: daysAgo(7),
        createdBy: c8Admin.id,
      },
    ],
  });

  console.log(
    `  ✅ ${clinic8.tradeName} criada com 2 profissionais, 2 pacientes, 4 agendamentos\n`,
  );

  // ========================================
  // RESUMO FINAL
  // ========================================
  console.log("=".repeat(65));
  console.log("✨  SEED CONCLUÍDO COM SUCESSO! — 8 CLÍNICAS CRIADAS");
  console.log("=".repeat(65));
  console.log("\n📍 DISTRIBUIÇÃO POR CIDADE:");
  console.log("   São Paulo/SP    → Clínica Saúde Mais | Saúde Total | Saúde & Vida");
  console.log("   Rio de Janeiro/RJ → OdontoPrime | OdontoVita");
  console.log("   Curitiba/PR     → Saúde Integrada | VitaSaúde");
  console.log("   Belo Horizonte/MG → Bem Estar");
  console.log("\n🔤 PALAVRA EM COMUM NOS NOMES:");
  console.log(
    '   "Saúde" (5 clínicas): Saúde Mais · Saúde Total · Saúde & Vida · Saúde Integrada · VitaSaúde',
  );
  console.log('   "Odonto" (2 clínicas): OdontoPrime · OdontoVita');
  console.log("\n📊 DADOS CRIADOS POR CLÍNICA:");
  console.log("\n [#1] Clínica Saúde Mais — São Paulo/SP");
  console.log("   • 5 especialidades | 6 procedimentos | 6 pacientes | 17 agendamentos");
  console.log("   • 5 prontuários | 12 registros financeiros | 6 notificações | 5 audit logs");
  console.log("\n [#2] OdontoPrime — Rio de Janeiro/RJ");
  console.log("   • 2 especialidades | 2 procedimentos | 2 pacientes | 2 agendamentos");
  console.log("\n [#3] Saúde Total Clínica Médica — São Paulo/SP");
  console.log("   • 2 especialidades | 2 procedimentos | 3 pacientes | 5 agendamentos");
  console.log("\n [#4] Clínica Saúde & Vida — São Paulo/SP");
  console.log("   • 2 especialidades | 2 procedimentos | 3 pacientes | 5 agendamentos");
  console.log("\n [#5] Clínica Saúde Integrada — Curitiba/PR");
  console.log("   • 2 especialidades | 2 procedimentos | 3 pacientes | 6 agendamentos");
  console.log("\n [#6] OdontoVita — Rio de Janeiro/RJ");
  console.log("   • 2 especialidades | 2 procedimentos | 2 pacientes | 4 agendamentos");
  console.log("\n [#7] Centro Médico Bem Estar — Belo Horizonte/MG");
  console.log("   • 2 especialidades | 2 procedimentos | 2 pacientes | 4 agendamentos");
  console.log("\n [#8] VitaSaúde Clínica — Curitiba/PR");
  console.log("   • 2 especialidades | 2 procedimentos | 2 pacientes | 4 agendamentos");
  console.log("\n🔑 CREDENCIAIS DE ACESSO (todas com senha: Senha123!):");
  console.log("\n   [#1 — Saúde Mais]");
  console.log("   admin@saudemais.com.br | recepcao@saudemais.com.br | recepcao2@saudemais.com.br");
  console.log(
    "   maria.oliveira@saudemais.com.br | joao.mendes@saudemais.com.br | fernanda.lima@saudemais.com.br",
  );
  console.log("   pedro.almeida@email.com | juliana.costa@email.com | roberto.ferreira@email.com");
  console.log("   amanda.lima@email.com | fernando.souza@email.com | claudia.mendes@email.com");
  console.log("\n   [#2 — OdontoPrime]");
  console.log("   admin@odontoprime.com.br | beatriz.nunes@odontoprime.com.br");
  console.log("   gustavo.ribeiro@email.com | sofia.martins@email.com");
  console.log("\n   [#3 — Saúde Total]");
  console.log("   admin@saudetotal.com.br | recepcao@saudetotal.com.br");
  console.log("   paulo.vieira@saudetotal.com.br | renata.campos@saudetotal.com.br");
  console.log("   carla.moura@email.com | thiago.xavier@email.com | patricia.rocha@email.com");
  console.log("\n   [#4 — Saúde & Vida]");
  console.log(
    "   admin@saudevida.com.br | alice.nunes@saudevida.com.br | marcos.pereira@saudevida.com.br",
  );
  console.log("   lucia.fonseca@email.com | diego.santos@email.com | mariana.duarte@email.com");
  console.log("\n   [#5 — Saúde Integrada]");
  console.log(
    "   admin@saudeintegrada.com.br | rafael.moreira@saudeintegrada.com.br | natalia.aquino@saudeintegrada.com.br",
  );
  console.log("   elisa.brunetti@email.com | gabriel.nogueira@email.com | ana.lima.cwb@email.com");
  console.log("\n   [#6 — OdontoVita]");
  console.log("   admin@odontovita.com.br | isabela.cunha@odontovita.com.br");
  console.log("   henrique.carvalho@email.com | vanessa.teixeira@email.com");
  console.log("\n   [#7 — Bem Estar]");
  console.log(
    "   admin@bemestarcm.com.br | fabio.monteiro@bemestarcm.com.br | silvana.prado@bemestarcm.com.br",
  );
  console.log("   wellington.brito@email.com | flavia.sousa@email.com");
  console.log("\n   [#8 — VitaSaúde]");
  console.log(
    "   admin@vitasaude.com.br | igor.pinheiro@vitasaude.com.br | camila.whitfield@vitasaude.com.br",
  );
  console.log("   igorjr.pinheiro@email.com | camila.porto@email.com");
  console.log("=".repeat(65));
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
