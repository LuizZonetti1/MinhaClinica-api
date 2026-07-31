import { ProcedureRepository } from "../../repository/procedureRepository";
import type { AuditContext } from "../../types/document";
import type { AppointmentType } from "../../types/enums";
import { AuditService } from "../audit/auditService";

const procedureRepository = new ProcedureRepository();
const auditService = new AuditService();

interface UpdateProcedureInput {
  name?: string;
  defaultDuration?: number;
  isActive?: boolean;
  defaultType?: AppointmentType;
}

export class UpdateProcedureService {
  async execute(id: string, input: UpdateProcedureInput, context: AuditContext) {
    const existing = await procedureRepository.findById(id, context.clinicId);
    if (!existing) {
      throw Object.assign(new Error("Procedimento não encontrado"), { statusCode: 404 });
    }

    try {
      const updated = await procedureRepository.update(id, input);

      await auditService.log({
        context,
        action: "UPDATED",
        entity: "Procedure",
        entityId: id,
        oldData: {
          name: existing.name,
          defaultDuration: existing.defaultDuration,
          defaultType: existing.defaultType,
          isActive: existing.isActive,
        },
        newData: {
          name: updated.name,
          defaultDuration: updated.defaultDuration,
          defaultType: updated.defaultType,
          isActive: updated.isActive,
        },
      });

      return updated;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw Object.assign(new Error("Já existe um procedimento com este nome nesta clínica"), {
          statusCode: 409,
        });
      }
      throw error;
    }
  }
}
