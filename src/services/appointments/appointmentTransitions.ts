import { AppointmentStatus } from "../../types/enums";

/**
 * Matriz única de transições de status de consulta, compartilhada entre o
 * fluxo do profissional (PatchAppointmentStatusService, mais restrito) e o
 * da recepção (UpdateCheckinStatusService, mais permissivo — cobre
 * confirmação, check-in, falta e cancelamento).
 */
export const ALLOWED_APPOINTMENT_TRANSITIONS: Record<string, string[]> = {
  [AppointmentStatus.SCHEDULED]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.WAITING,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.RESCHEDULED,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.WAITING,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.RESCHEDULED,
  ],
  [AppointmentStatus.WAITING]: [
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.COMPLETED]: [AppointmentStatus.COMPLETED_WITH_ADDENDUM],
  [AppointmentStatus.COMPLETED_WITH_ADDENDUM]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
  [AppointmentStatus.RESCHEDULED]: [],
};

const STATUS_LABELS: Record<string, string> = {
  [AppointmentStatus.SCHEDULED]: "Agendada",
  [AppointmentStatus.CONFIRMED]: "Confirmada",
  [AppointmentStatus.WAITING]: "Check-in feito",
  [AppointmentStatus.IN_PROGRESS]: "Em atendimento",
  [AppointmentStatus.COMPLETED]: "Concluída",
  [AppointmentStatus.COMPLETED_WITH_ADDENDUM]: "Concluída com adendo",
  [AppointmentStatus.CANCELLED]: "Cancelada",
  [AppointmentStatus.NO_SHOW]: "Não compareceu",
  [AppointmentStatus.RESCHEDULED]: "Remarcada",
};

const label = (status: string): string => STATUS_LABELS[status] ?? status;

/**
 * Valida se a transição de `from` para `to` é permitida pela matriz.
 * Lança um erro com statusCode 400 e mensagem legível em português quando não é.
 */
export function assertValidTransition(from: string, to: string): void {
  const allowed = ALLOWED_APPOINTMENT_TRANSITIONS[from];

  if (allowed === undefined) {
    throw Object.assign(new Error(`Status atual '${from}' desconhecido`), { statusCode: 400 });
  }

  if (!allowed.includes(to)) {
    const allowedLabels =
      allowed.length > 0 ? allowed.map(label).join(", ") : "nenhuma (status final)";
    throw Object.assign(
      new Error(
        `Não é possível mudar de "${label(from)}" para "${label(to)}". ` +
          `A partir de "${label(from)}", os próximos status possíveis são: ${allowedLabels}.`,
      ),
      { statusCode: 400 },
    );
  }
}
