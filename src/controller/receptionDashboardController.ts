import type { Request, Response } from "express";
import { handleControllerError } from "../utils/controllerUtils";
import { GetProfessionalsAgendaService } from "../services/reception/agendaService";
import {
  ReceptionDashboardService,
  UpdateCheckinStatusService,
} from "../services/reception/receptionDashboardService";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ReceptionDashboardController {
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const service = new ReceptionDashboardService();
      const data = await service.getSummary(clinicId);

      res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao carregar dados da recepção" });
      }
    }
  }

  async getAppointmentsToday(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const date = req.query.date ? String(req.query.date) : undefined;

      const service = new ReceptionDashboardService();
      const data = await service.getAppointmentsToday(clinicId, date);

      res.status(200).json(data);
    } catch (error) {
      handleControllerError(res, error, "Erro ao carregar consultas da recepção");
    }
  }

  async patchAppointmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;
      const appointmentId = String(req.params.id);

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      if (!UUID_REGEX.test(appointmentId)) {
        res.status(400).json({ error: "ID do agendamento inválido" });
        return;
      }

      const { status } = req.body as { status: string };

      const service = new UpdateCheckinStatusService();
      const result = await service.execute(clinicId, appointmentId, status);

      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao atualizar status do agendamento");
    }
  }

  async getAgenda(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const date = req.query.date ? String(req.query.date) : undefined;

      const service = new GetProfessionalsAgendaService();
      const data = await service.execute(clinicId, date);

      res.status(200).json(data);
    } catch (error) {
      handleControllerError(res, error, "Erro ao carregar agendas dos profissionais");
    }
  }
}
