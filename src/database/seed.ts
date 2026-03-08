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

  // ========================================
  // RESUMO FINAL
  // ========================================
  console.log("=".repeat(55));
  console.log("✨  SEED CONCLUÍDO COM SUCESSO!");
  console.log("=".repeat(55));
  console.log("\n📊 DADOS CRIADOS:");
  console.log("\n [Clínica 1] Saúde Mais — São Paulo");
  console.log("   • 5 especialidades");
  console.log("   • 6 procedimentos");
  console.log(
    "   • 8 usuários internos (admin, 2 recepcionistas, 3 profissionais, 2 usuários aux)",
  );
  console.log("   • 6 pacientes");
  console.log("   • 17 agendamentos (vários status: COMPLETED, CONFIRMED, SCHEDULED,");
  console.log("     WAITING, IN_PROGRESS, CANCELLED, NO_SHOW)");
  console.log("   • 5 prontuários médicos");
  console.log("   • 12 registros financeiros (receitas + despesas)");
  console.log("   • 6 notificações");
  console.log("   • 5 logs de auditoria");
  console.log("   • 1 bloqueio de agenda (férias da fisioterapeuta)");
  console.log("   • 4 feriados cadastrados");
  console.log("\n [Clínica 2] OdontoPrime — Rio de Janeiro");
  console.log("   • 2 especialidades");
  console.log("   • 2 procedimentos");
  console.log("   • 2 usuários internos (admin, 1 profissional)");
  console.log("   • 2 pacientes");
  console.log("   • 2 agendamentos");
  console.log("   • 1 prontuário médico");
  console.log("   • 1 registro financeiro");
  console.log("\n🔑 CREDENCIAIS DE ACESSO:");
  console.log("\n   [CLÍNICA 1 — Saúde Mais]");
  console.log("   Admin       → admin@saudemais.com.br         / Senha123!");
  console.log("   Recepção 1  → recepcao@saudemais.com.br      / Senha123!");
  console.log("   Recepção 2  → recepcao2@saudemais.com.br     / Senha123!");
  console.log("   Cardiolog.  → maria.oliveira@saudemais.com.br / Senha123!");
  console.log("   Ortodont.   → joao.mendes@saudemais.com.br   / Senha123!");
  console.log("   Fisioter.   → fernanda.lima@saudemais.com.br / Senha123!");
  console.log("   Paciente 1  → pedro.almeida@email.com        / Senha123!");
  console.log("   Paciente 2  → juliana.costa@email.com        / Senha123!");
  console.log("   Paciente 3  → roberto.ferreira@email.com     / Senha123!");
  console.log("   Paciente 4  → amanda.lima@email.com          / Senha123!");
  console.log("   Paciente 5  → fernando.souza@email.com       / Senha123!");
  console.log("   Paciente 6  → claudia.mendes@email.com       / Senha123!");
  console.log("\n   [CLÍNICA 2 — OdontoPrime]");
  console.log("   Admin       → admin@odontoprime.com.br       / Senha123!");
  console.log("   Profissional → beatriz.nunes@odontoprime.com.br / Senha123!");
  console.log("   Paciente 1  → gustavo.ribeiro@email.com      / Senha123!");
  console.log("   Paciente 2  → sofia.martins@email.com        / Senha123!");
  console.log("=".repeat(55));
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
