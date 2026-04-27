import type { Request, Response } from "express";
import { ConfirmAppointmentService } from "../services/patients/confirmAppointmentService";
import { GetPatientAppointmentDetailService } from "../services/patients/getPatientAppointmentDetailService";
import { ListPatientAppointmentsService } from "../services/patients/listPatientAppointmentsService";
import { PatientDashboardService } from "../services/patients/patientDashboardService";
import { RescheduleAppointmentService } from "../services/patients/rescheduleAppointmentService";
import type { PatientRescheduleInput } from "../types/patient";

export class PatientDashboardController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;

      const service = new PatientDashboardService();
      const data = await service.execute(userId);

      res.status(200).json({ data });
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message === "Paciente não encontrado") {
        res.status(404).json({ message: err.message });
        return;
      }
      res.status(500).json({ message: err.message || "Erro ao carregar dashboard" });
    }
  }

  async confirmAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;
      const { id } = req.params as { id: string };

      const service = new ConfirmAppointmentService();
      await service.execute(id, userId);

      res.status(200).json({ message: "Presença confirmada com sucesso" });
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message === "Consulta não encontrada") {
        res.status(404).json({ message: err.message });
        return;
      }
      if (err.message?.includes("SCHEDULED")) {
        res.status(400).json({ message: err.message });
        return;
      }
      res.status(500).json({ message: err.message || "Erro ao confirmar presença" });
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
    } catch (error: unknown) {
      const err = error as { message?: string; statusCode?: number };
      const status = err.statusCode ?? 500;
      res.status(status).json({ message: err.message || "Erro ao listar consultas" });
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
    } catch (error: unknown) {
      const err = error as { message?: string; statusCode?: number };
      const status = err.statusCode ?? 500;
      res.status(status).json({ message: err.message || "Erro ao remarcar consulta" });
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
    } catch (error: unknown) {
      const err = error as { message?: string; statusCode?: number };
      const status = err.statusCode ?? 500;
      res.status(status).json({ error: err.message || "Erro ao carregar consulta" });
    }
  }
}
