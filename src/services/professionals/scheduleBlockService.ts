import { prisma } from "../../database/prisma";
import { ScheduleBlockRepository } from "../../repository/scheduleBlockRepository";

export interface CreateScheduleBlockInput {
  startDateTime: Date;
  endDateTime: Date;
  reason: string;
  isAllDay?: boolean;
}

/**
 * CRUD de ProfessionalScheduleBlock — antes desta classe não existia nenhum
 * service/controller/rota para criar, editar ou excluir um bloqueio de agenda
 * via API (só o seed populava a tabela), apesar de getAvailableSlotsService já
 * ler e respeitar os bloqueios existentes. Ver V5 do PLANO_CORRECOES_RODADA5.md.
 */
export class ScheduleBlockService {
  private repository = new ScheduleBlockRepository();

  /** Resolve professionalId a partir do próprio usuário autenticado (rotas /me). */
  private async resolveOwnProfessionalId(userId: string, clinicId: string): Promise<string> {
    const professional = await prisma.professional.findFirst({
      where: { userId, clinicId },
      select: { id: true },
    });
    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }
    return professional.id;
  }

  /** Confirma que professionalId pertence à clínica (rotas /:id, uso por ADMIN/RECEPTIONIST). */
  private async assertProfessionalInClinic(
    professionalId: string,
    clinicId: string,
  ): Promise<void> {
    const professional = await this.repository.findProfessionalInClinic(professionalId, clinicId);
    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }
  }

  async list(professionalId: string, clinicId: string) {
    await this.assertProfessionalInClinic(professionalId, clinicId);
    return this.repository.findByProfessional(professionalId);
  }

  async listMine(userId: string, clinicId: string) {
    const professionalId = await this.resolveOwnProfessionalId(userId, clinicId);
    return this.repository.findByProfessional(professionalId);
  }

  async create(professionalId: string, clinicId: string, input: CreateScheduleBlockInput) {
    await this.assertProfessionalInClinic(professionalId, clinicId);
    return this.createValidated(professionalId, input);
  }

  async createMine(userId: string, clinicId: string, input: CreateScheduleBlockInput) {
    const professionalId = await this.resolveOwnProfessionalId(userId, clinicId);
    return this.createValidated(professionalId, input);
  }

  private async createValidated(professionalId: string, input: CreateScheduleBlockInput) {
    if (input.endDateTime <= input.startDateTime) {
      throw Object.assign(new Error("O término deve ser depois do início"), { statusCode: 400 });
    }
    return this.repository.create({
      professionalId,
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
      reason: input.reason,
      isAllDay: input.isAllDay ?? false,
    });
  }

  async delete(professionalId: string, clinicId: string, blockId: string): Promise<void> {
    await this.assertProfessionalInClinic(professionalId, clinicId);
    await this.deleteValidated(professionalId, blockId);
  }

  async deleteMine(userId: string, clinicId: string, blockId: string): Promise<void> {
    const professionalId = await this.resolveOwnProfessionalId(userId, clinicId);
    await this.deleteValidated(professionalId, blockId);
  }

  private async deleteValidated(professionalId: string, blockId: string): Promise<void> {
    const block = await this.repository.findById(blockId);
    if (!block || block.professionalId !== professionalId) {
      throw Object.assign(new Error("Bloqueio não encontrado"), { statusCode: 404 });
    }
    await this.repository.delete(blockId);
  }
}
