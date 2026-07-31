import { ProcedureRepository } from "../../repository/procedureRepository";
import type { AuditContext } from "../../types/document";
import { AppointmentType } from "../../types/enums";
import { AuditService } from "../audit/auditService";

const procedureRepository = new ProcedureRepository();
const auditService = new AuditService();

// Preço fora de escopo nesta fase (sem tela/módulo financeiro ainda) — placeholder
// até o módulo financeiro existir.
const DEFAULT_PROCEDURE_PRICE = 0;

interface CreateProcedureInput {
  name: string;
  defaultDuration: number;
  defaultType?: AppointmentType;
}

export class CreateProcedureService {
  async execute(input: CreateProcedureInput, context: AuditContext) {
    try {
      const procedure = await procedureRepository.create({
        clinicId: context.clinicId,
        name: input.name,
        defaultDuration: input.defaultDuration,
        defaultPrice: DEFAULT_PROCEDURE_PRICE,
        defaultType: input.defaultType ?? AppointmentType.CONSULTATION,
      });

      await auditService.log({
        context,
        action: "CREATED",
        entity: "Procedure",
        entityId: procedure.id,
        newData: {
          name: procedure.name,
          defaultDuration: procedure.defaultDuration,
          defaultType: procedure.defaultType,
          isActive: procedure.isActive,
        },
      });

      return procedure;
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
