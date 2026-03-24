import { prisma } from "../database/prisma";

export class ProfessionalDashboardRepository {
  /** Resolve userId → Professional (verificando clinicId por segurança) */
  async findProfessionalByUserId(userId: string, clinicId: string) {
    return prisma.professional.findFirst({
      where: { userId, clinicId },
      select: { id: true },
    });
  }

  /**
   * Total de agendamentos do dia — TODOS os status incluídos.
   * Conta tudo que está na agenda (inclusive CANCELLED, NO_SHOW, RESCHEDULED)
   * para ser consistente com a listagem da tabela "Agenda de Hoje".
   */
  async countTodayAppointments(professionalId: string, startOfDay: Date, endOfDay: Date) {
    return prisma.appointment.count({
      where: {
        professionalId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
      },
    });
  }

  /** Consultas confirmadas hoje */
  async countConfirmedToday(professionalId: string, startOfDay: Date, endOfDay: Date) {
    return prisma.appointment.count({
      where: {
        professionalId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: "CONFIRMED",
      },
    });
  }

  /** Pacientes com consultas COMPLETED no mês (distintos) */
  async countCompletedPatientsThisMonth(
    professionalId: string,
    startOfMonth: Date,
    endOfMonth: Date,
  ) {
    const result = await prisma.appointment.findMany({
      where: {
        professionalId,
        appointmentDate: { gte: startOfMonth, lte: endOfMonth },
        status: "COMPLETED",
      },
      select: { patientId: true },
      distinct: ["patientId"],
    });

    return result.length;
  }

  /**
   * Lista agendamentos do profissional em um dia — TODOS os status incluídos.
   * O front-end exibe a linha com a cor/badge correspondente ao status,
   * inclusive CANCELLED e NO_SHOW, para o profissional ver o histórico completo do dia.
   */
  async listAppointmentsByDate(professionalId: string, startOfDay: Date, endOfDay: Date) {
    return prisma.appointment.findMany({
      where: {
        professionalId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        type: true,
        status: true,
        notes: true,
        patient: {
          select: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }
}
