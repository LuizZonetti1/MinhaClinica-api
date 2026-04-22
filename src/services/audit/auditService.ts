import { AuditLogRepository } from "../../repository/auditLogRepository";
import type { AuditContext } from "../../types/document";

const auditLogRepository = new AuditLogRepository();

interface AuditLogParams {
  context: AuditContext;
  action: string;
  entity: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
}

export class AuditService {
  async log(params: AuditLogParams): Promise<void> {
    await auditLogRepository.create({
      clinicId: params.context.clinicId,
      userId: params.context.userId,
      userName: params.context.userName,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      oldData: params.oldData,
      newData: params.newData,
      ipAddress: params.context.ipAddress,
      userAgent: params.context.userAgent,
    });
  }
}
