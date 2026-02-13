import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // ========================================
  // CLEANUP - Limpar dados existentes
  // ========================================
  console.log("🧹 Limpando dados existentes...");

  await prisma.appointment.deleteMany({});
  await prisma.professionalProcedure.deleteMany({});
  await prisma.procedure.deleteMany({});
  await prisma.financialRecord.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.professionalScheduleBlock.deleteMany({});
  await prisma.professionalWorkingHours.deleteMany({});
  await prisma.professionalSpecialty.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.specialty.deleteMany({});
  await prisma.clinicHoliday.deleteMany({});
  await prisma.clinicWorkingHours.deleteMany({});
  await prisma.clinicSettings.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.clinic.deleteMany({});

  console.log("✅ Dados limpos com sucesso\n");

  // ========================================
  // 1. CRIAR CLÍNICA DE EXEMPLO
  // ========================================
  console.log("📍 Criando clínica...");

  const clinic = await prisma.clinic.create({
    data: {
      legalName: "Clínica Saúde Mais LTDA",
      tradeName: "Clínica Saúde Mais",
      cnpj: "12345678000190",
      email: "contato@saudemais.com.br",
      phone: "11987654321",
      website: "https://www.saudemais.com.br",
      subdomain: "saudemais",

      // Endereço
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

  console.log(`✅ Clínica criada: ${clinic.tradeName} (ID: ${clinic.id})\n`);

  // ========================================
  // 2. CONFIGURAÇÕES DA CLÍNICA
  // ========================================
  console.log("⚙️  Criando configurações da clínica...");

  await prisma.clinicSettings.create({
    data: {
      clinicId: clinic.id,
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

  console.log("✅ Configurações criadas\n");

  // ========================================
  // 3. HORÁRIO DE FUNCIONAMENTO
  // ========================================
  console.log("🕐 Criando horário de funcionamento...");

  await prisma.clinicWorkingHours.createMany({
    data: [
      {
        clinicId: clinic.id,
        dayOfWeek: "MONDAY",
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic.id,
        dayOfWeek: "TUESDAY",
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic.id,
        dayOfWeek: "WEDNESDAY",
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic.id,
        dayOfWeek: "THURSDAY",
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic.id,
        dayOfWeek: "FRIDAY",
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        clinicId: clinic.id,
        dayOfWeek: "SATURDAY",
        isOpen: false,
        openTime: "08:00",
        closeTime: "12:00",
      },
      {
        clinicId: clinic.id,
        dayOfWeek: "SUNDAY",
        isOpen: false,
        openTime: "08:00",
        closeTime: "12:00",
      },
    ],
  });

  console.log("✅ Horário de funcionamento criado\n");

  // ========================================
  // 4. ESPECIALIDADES
  // ========================================
  console.log("🏥 Criando especialidades...");

  const cardiology = await prisma.specialty.create({
    data: {
      clinicId: clinic.id,
      name: "Cardiologia",
      description: "Especialidade médica que cuida do coração e sistema cardiovascular",
      icon: "❤️",
      color: "#EF4444",
      isActive: true,
    },
  });

  const orthodontics = await prisma.specialty.create({
    data: {
      clinicId: clinic.id,
      name: "Ortodontia",
      description: "Especialidade odontológica que corrige a posição dos dentes",
      icon: "😁",
      color: "#10B981",
      isActive: true,
    },
  });

  const physiotherapy = await prisma.specialty.create({
    data: {
      clinicId: clinic.id,
      name: "Fisioterapia",
      description: "Tratamento e reabilitação de lesões e disfunções",
      icon: "🏃",
      color: "#8B5CF6",
      isActive: true,
    },
  });

  console.log("✅ 3 Especialidades criadas\n");

  // ========================================
  // 5. USUÁRIOS E PROFISSIONAIS
  // ========================================
  console.log("👥 Criando usuários...");

  const hashedPassword = await bcrypt.hash("Senha123!", 10);

  // Admin (Dono da Clínica)
  const adminUser = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Dr. Carlos Silva",
      cpf: "12345678901",
      email: "admin@saudemais.com.br",
      phone: "11987654321",
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  console.log(`✅ Admin criado: ${adminUser.name}`);

  // Recepcionista
  const receptionistUser = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Ana Paula Santos",
      cpf: "23456789012",
      email: "recepcao@saudemais.com.br",
      phone: "11987654322",
      password: hashedPassword,
      role: "RECEPTIONIST",
      status: "ACTIVE",
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });
  console.log(`✅ Recepcionista criada: ${receptionistUser.name}`);

  // Profissional 1 - Cardiologista
  const profUser1 = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Dra. Maria Oliveira",
      cpf: "34567890123",
      email: "maria.oliveira@saudemais.com.br",
      phone: "11987654323",
      password: hashedPassword,
      role: "PROFESSIONAL",
      status: "ACTIVE",
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });

  const professional1 = await prisma.professional.create({
    data: {
      clinicId: clinic.id,
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
    data: {
      professionalId: professional1.id,
      specialtyId: cardiology.id,
      isPrimary: true,
    },
  });

  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: professional1.id,
        dayOfWeek: "MONDAY",
        isWorking: true,
        startTime: "08:00",
        endTime: "12:00",
      },
      {
        professionalId: professional1.id,
        dayOfWeek: "WEDNESDAY",
        isWorking: true,
        startTime: "14:00",
        endTime: "18:00",
      },
      {
        professionalId: professional1.id,
        dayOfWeek: "FRIDAY",
        isWorking: true,
        startTime: "08:00",
        endTime: "12:00",
      },
    ],
  });

  console.log(`✅ Profissional criado: ${profUser1.name} (Cardiologista)`);

  // Profissional 2 - Ortodontista
  const profUser2 = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Dr. João Mendes",
      cpf: "45678901234",
      email: "joao.mendes@saudemais.com.br",
      phone: "11987654324",
      password: hashedPassword,
      role: "PROFESSIONAL",
      status: "ACTIVE",
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });

  const professional2 = await prisma.professional.create({
    data: {
      clinicId: clinic.id,
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
    data: {
      professionalId: professional2.id,
      specialtyId: orthodontics.id,
      isPrimary: true,
    },
  });

  await prisma.professionalWorkingHours.createMany({
    data: [
      {
        professionalId: professional2.id,
        dayOfWeek: "TUESDAY",
        isWorking: true,
        startTime: "08:00",
        endTime: "18:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
      {
        professionalId: professional2.id,
        dayOfWeek: "THURSDAY",
        isWorking: true,
        startTime: "08:00",
        endTime: "18:00",
        lunchBreakStart: "12:00",
        lunchBreakEnd: "13:00",
      },
    ],
  });

  console.log(`✅ Profissional criado: ${profUser2.name} (Ortodontista)\n`);

  // ========================================
  // 6. PACIENTES (SEM CONVÊNIO)
  // ========================================
  console.log("🧑‍⚕️ Criando pacientes...");

  const patient1User = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Pedro Almeida",
      cpf: "56789012345",
      email: "pedro.almeida@email.com",
      phone: "11987654325",
      password: hashedPassword,
      role: "PATIENT",
      status: "ACTIVE",
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });

  const patient1 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      userId: patient1User.id,
      cpf: "12345678901",
      dateOfBirth: new Date("1985-05-15"),
      gender: "MALE",
      zipCode: "01310100",
      street: "Rua Augusta",
      number: "500",
      neighborhood: "Consolação",
      city: "São Paulo",
      state: "SP",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 0,
    },
  });
  console.log(`✅ Paciente criado: ${patient1User.name}`);

  const patient2User = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Juliana Costa",
      cpf: "67890123456",
      email: "juliana.costa@email.com",
      phone: "11987654326",
      password: hashedPassword,
      role: "PATIENT",
      status: "ACTIVE",
      mustChangePassword: false,
      loginAttempts: 0,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      userId: patient2User.id,
      cpf: "67890123456",
      dateOfBirth: new Date("1990-08-20"),
      gender: "FEMALE",
      zipCode: "04543010",
      street: "Avenida Brigadeiro Faria Lima",
      number: "2000",
      neighborhood: "Itaim Bibi",
      city: "São Paulo",
      state: "SP",
      isActive: true,
      noShowCount: 0,
      totalAppointments: 0,
    },
  });
  console.log(`✅ Paciente criado: ${patient2User.name}\n`);

  // ========================================
  // 7. PROCEDIMENTOS
  // ========================================
  console.log("💉 Criando procedimentos...");

  const procedure1 = await prisma.procedure.create({
    data: {
      clinicId: clinic.id,
      name: "Consulta Cardiológica",
      code: "CARD-001",
      description: "Consulta de rotina com cardiologista",
      defaultDuration: 30,
      defaultPrice: 300.0,
      isActive: true,
      allowOnlineBooking: true,
    },
  });

  const procedure2 = await prisma.procedure.create({
    data: {
      clinicId: clinic.id,
      name: "Avaliação Ortodôntica",
      code: "ORTO-001",
      description: "Primeira consulta para avaliação ortodôntica",
      defaultDuration: 45,
      defaultPrice: 200.0,
      isActive: true,
      allowOnlineBooking: true,
    },
  });

  const procedure3 = await prisma.procedure.create({
    data: {
      clinicId: clinic.id,
      name: "Manutenção de Aparelho",
      code: "ORTO-002",
      description: "Manutenção mensal de aparelho ortodôntico",
      defaultDuration: 30,
      defaultPrice: 150.0,
      isActive: true,
      allowOnlineBooking: true,
    },
  });

  // Vincular procedimentos aos profissionais
  await prisma.professionalProcedure.create({
    data: {
      professionalId: professional1.id,
      procedureId: procedure1.id,
    },
  });

  await prisma.professionalProcedure.createMany({
    data: [
      {
        professionalId: professional2.id,
        procedureId: procedure2.id,
      },
      {
        professionalId: professional2.id,
        procedureId: procedure3.id,
      },
    ],
  });

  console.log(`✅ 3 Procedimentos criados e vinculados aos profissionais\n`);

  // ========================================
  // 8. AGENDAMENTOS
  // ========================================
  console.log("📅 Criando agendamentos de exemplo...");

  // Agendamento 1 - Hoje às 10:00
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointment1 = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: patient1.id,
      professionalId: professional1.id,
      procedureId: procedure1.id,
      appointmentDate: today,
      startTime: "10:00",
      endTime: "10:30",
      duration: 30,
      status: "CONFIRMED",
      channel: "PHONE",
      confirmedAt: new Date(),
      confirmedBy: receptionistUser.id,
      notes: "Paciente com histórico de hipertensão",
      createdBy: receptionistUser.id,
    },
  });
  console.log(`✅ Agendamento criado: ${patient1User.name} com ${profUser1.name}`);

  // Agendamento 2 - Amanhã às 14:00
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointment2 = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: patient2.id,
      professionalId: professional2.id,
      procedureId: procedure2.id,
      appointmentDate: tomorrow,
      startTime: "14:00",
      endTime: "14:45",
      duration: 45,
      status: "SCHEDULED",
      channel: "ONLINE_PORTAL",
      notes: "Primeira consulta",
      createdBy: patient2User.id,
    },
  });
  console.log(`✅ Agendamento criado: ${patient2User.name} com ${profUser2.name}\n`);

  // ========================================
  // 9. LOG DE AUDITORIA
  // ========================================
  console.log("📝 Criando logs de auditoria...");

  await prisma.auditLog.create({
    data: {
      clinicId: clinic.id,
      userId: adminUser.id,
      userName: adminUser.name,
      action: "CREATE_CLINIC",
      entity: "Clinic",
      entityId: clinic.id,
      newData: { tradeName: clinic.tradeName },
      ipAddress: "192.168.1.1",
    },
  });

  console.log("✅ Logs de auditoria criados\n");

  console.log("✨ Seed concluído com sucesso!\n");
  console.log("📊 Resumo:");
  console.log(`   - 1 clínica criada`);
  console.log(`   - 3 especialidades criadas`);
  console.log(`   - 4 usuários criados (1 admin, 1 recepcionista, 2 profissionais)`);
  console.log(`   - 2 pacientes criados (SEM convênio)`);
  console.log(`   - 3 procedimentos criados`);
  console.log(`   - 2 agendamentos criados`);
  console.log("\n🔑 Credenciais de acesso:");
  console.log("   Email: admin@saudemais.com.br");
  console.log("   Senha: Senha123!");
  console.log("\n💡 Próximos passos:");
  console.log("   1. npx prisma studio (para visualizar os dados)");
  console.log("   2. Iniciar o backend: yarn dev");
  console.log("   3. Fazer login com as credenciais acima\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
