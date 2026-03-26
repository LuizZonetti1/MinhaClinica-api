import type { Request, Response } from "express";
import { ConfirmAppointmentService } from "../services/patients/confirmAppointmentService";
import { ListPatientAppointmentsService } from "../services/patients/listPatientAppointmentsService";
import { PatientDashboardService } from "../services/patients/patientDashboardService";

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
}
