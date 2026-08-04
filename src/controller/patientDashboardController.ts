import type { Request, Response } from "express";
import { CancelAppointmentService } from "../services/patients/cancelAppointmentService";
import { ConfirmAppointmentService } from "../services/patients/confirmAppointmentService";
import { GetPatientAppointmentDetailService } from "../services/patients/getPatientAppointmentDetailService";
import { ListPatientAppointmentsService } from "../services/patients/listPatientAppointmentsService";
import { PatientDashboardService } from "../services/patients/patientDashboardService";
import { RescheduleAppointmentService } from "../services/patients/rescheduleAppointmentService";
import type { PatientRescheduleInput } from "../types/patient";
import { handleControllerError } from "../utils/controllerUtils";

export class PatientDashboardController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;

      const service = new PatientDashboardService();
      const data = await service.execute(userId);

      res.status(200).json({ data });
    } catch (error) {
      // PatientDashboardService lança Error puro (sem statusCode) para paciente
      // não encontrado — sempre foi 404, preserva o status.
      if (error instanceof Error && error.message === "Paciente não encontrado") {
        res.status(404).json({ message: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao carregar dashboard");
    }
  }

  async confirmAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;
      const { id } = req.params as { id: string };

      const service = new ConfirmAppointmentService();
      await service.execute(id, userId);

      res.status(200).json({ message: "Presença confirmada com sucesso" });
    } catch (error) {
      // ConfirmAppointmentService lança Error puro (sem statusCode) para estas
      // duas regras de negócio conhecidas — preserva o status já esperado.
      if (error instanceof Error && error.message === "Consulta não encontrada") {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error instanceof Error && error.message.includes("SCHEDULED")) {
        res.status(400).json({ message: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao confirmar presença");
    }
  }

  /**
   * GET /api/patients/me/appointments?status=COMPLETED
   * Lista todas as consultas do paciente (futuras e passadas)
   */
  async listAppointments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;
      const status = req.query.status ? String(req.query.status) : undefined;

      const service = new ListPatientAppointmentsService();
      const data = await service.execute(userId, status);

      res.status(200).json({ data });
    } catch (error) {
      handleControllerError(res, error, "Erro ao listar consultas");
    }
  }

  /**
   * PATCH /api/patients/me/appointments/:id/cancel
   * Cancela agendamento do paciente (somente SCHEDULED, CONFIRMED ou WAITING)
   */
  async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;
      const { id } = req.params as { id: string };

      const service = new CancelAppointmentService();
      const data = await service.execute(id, userId);

      res.status(200).json({ data });
    } catch (error) {
      handleControllerError(res, error, "Erro ao cancelar consulta");
    }
  }

  /**
   * PATCH /api/patients/me/appointments/:appointmentId
   * Remarcar agendamento (somente SCHEDULED ou CONFIRMED)
   */
  async rescheduleAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;
      const { appointmentId } = req.params as { appointmentId: string };
      const input = req.body as PatientRescheduleInput;

      const service = new RescheduleAppointmentService();
      const result = await service.execute(appointmentId, userId, input);

      res.status(200).json({ data: result });
    } catch (error) {
      handleControllerError(res, error, "Erro ao remarcar consulta");
    }
  }

  /**
   * GET /api/patients/me/appointments/:id
   * Retorna detalhes de uma consulta do paciente (sem depender de clinicId)
   */
  async getAppointmentDetail(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;
      const { id } = req.params as { id: string };

      const service = new GetPatientAppointmentDetailService();
      const data = await service.execute(id, userId);

      res.status(200).json({ data });
    } catch (error) {
      handleControllerError(res, error, "Erro ao carregar consulta");
    }
  }
}
