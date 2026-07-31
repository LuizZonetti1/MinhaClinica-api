import { ProcedureRepository } from "../../repository/procedureRepository";
import type { AuditContext } from "../../types/document";
import { AuditService } from "../audit/auditService";

const procedureRepository = new ProcedureRepository();
const auditService = new AuditService();

export class DeleteProcedureService {
  async execute(id: string, context: AuditContext): Promise<{ deactivated: boolean }> {
    const existing = await procedureRepository.findById(id, context.clinicId);
    if (!existing) {
      throw Object.assign(new Error("Procedimento não encontrado"), { statusCode: 404 });
    }

    // Appointment.procedureId usa onDelete: Restrict — checar antes evita que o
    // erro de FK vaze como 500 ao tentar excluir um procedimento em uso.
    const appointmentsCount = await procedureRepository.countAppointments(id);

    if (appointmentsCount > 0) {
      await procedureRepository.update(id, { isActive: false });

      await auditService.log({
        context,
        action: "DEACTIVATED",
        entity: "Procedure",
        entityId: id,
        oldData: { isActive: existing.isActive },
        newData: { isActive: false },
      });

      return { deactivated: true };
    }

    await procedureRepository.delete(id);

    await auditService.log({
      context,
      action: "DELETED",
      entity: "Procedure",
      entityId: id,
      oldData: { name: existing.name, defaultDuration: existing.defaultDuration },
    });

    return { deactivated: false };
  }
}
