import { UserRole } from "../../types/enums";
import { TransactionRepository } from "../../repository/transactionRepository";
import type { UpdateTransactionInput } from "../../types/transaction";

export class UpdateTransactionService {
  private repository = new TransactionRepository();

  async execute(
    id: string,
    clinicId: string,
    input: UpdateTransactionInput,
    currentUser?: { userId: string; userRoles: UserRole[] },
  ) {
    const existing = await this.repository.findByIdAndClinic(id, clinicId);

    if (!existing) {
      throw new Error("Transação não encontrada");
    }

    if (
      currentUser &&
      !currentUser.userRoles.includes(UserRole.ADMIN) &&
      existing.createdBy !== currentUser.userId
    ) {
      throw new Error("Acesso negado: você não pode editar transações de outros usuários");
    }

    const updated = await this.repository.update(id, input);

    // Notificar paciente sobre pagamento confirmado (fire-and-forget)
    if (
      input.paymentStatus === "PAID" &&
      existing.paymentStatus !== "PAID" &&
      existing.patientId
    ) {
      void (async () => {
        try {
          const { prisma } = await import("../../database/prisma");
          const patient = await prisma.patient.findUnique({
            where: { id: existing.patientId as string },
            select: { user: { select: { id: true, name: true, email: true, phone: true } } },
          });
          if (!patient?.user) return;
          const { NotificationRepository } = await import("../../repository/notificationRepository");
          const notifRepo = new NotificationRepository();
          const n = await notifRepo.create({
            clinicId,
            recipientEmail: patient.user.email,
            recipientPhone: patient.user.phone ?? undefined,
            recipientName: patient.user.name,
            recipientUserId: patient.user.id,
            type: "PAYMENT_CONFIRMED",
            channel: "IN_APP",
            subject: "Pagamento confirmado",
            message: "Seu pagamento foi confirmado. Obrigado!",
          });
          await notifRepo.markAsSent(n.id);
        } catch {
          // fire-and-forget: não propaga erro
        }
      })();
    }

    return updated;
  }
}
