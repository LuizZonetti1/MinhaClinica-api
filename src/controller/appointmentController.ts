import type { Request, Response } from "express";
import { CreateAppointmentService } from "../services/appointments/createAppointmentService";
import { GetAvailableSlotsService } from "../services/appointments/getAvailableSlotsService";
import { ListProfessionalsService } from "../services/appointments/listProfessionalsService";
import { SearchPatientsService } from "../services/appointments/searchPatientsService";

export class AppointmentController {
  /**
   * GET /api/appointments/patients/search?q=
   * Busca pacientes globais por nome ou CPF (Etapa 1)
   */
  async searchPatients(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const q = String(req.query.q ?? "");

      const service = new SearchPatientsService();
      const result = await service.execute(q, clinicId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao buscar pacientes" });
      }
    }
  }

  /**
   * GET /api/appointments/professionals
   * Lista profissionais ativos da clínica (Etapa 2)
   */
  async listProfessionals(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const service = new ListProfessionalsService();
      const result = await service.execute(clinicId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar profissionais" });
      }
    }
  }

  /**
   * GET /api/appointments/professionals/:id/slots?date=YYYY-MM-DD
   * Retorna todos os slots do dia marcando disponibilidade (Etapa 2)
   */
  async getSlots(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const professionalId = req.params.id as string;
      const date = String(req.query.date ?? "");

      if (!date) {
        res.status(400).json({ error: "Parâmetro 'date' é obrigatório (YYYY-MM-DD)" });
        return;
      }

      const service = new GetAvailableSlotsService();
      const result = await service.execute(professionalId, clinicId, date);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao buscar horários disponíveis" });
      }
    }
  }

  /**
   * POST /api/appointments
   * Cria um agendamento (Etapa 3)
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      const createdBy = req.userId;

      if (!clinicId || !createdBy) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const service = new CreateAppointmentService();
      const result = await service.execute(req.body, clinicId, createdBy);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao criar agendamento" });
      }
    }
  }
}
