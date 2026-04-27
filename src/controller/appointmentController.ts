import type { Request, Response } from "express";
import { handleControllerError } from "../utils/controllerUtils";
import { CreateAppointmentService } from "../services/appointments/createAppointmentService";
import { GetAppointmentByIdService } from "../services/appointments/getAppointmentByIdService";
import { GetAvailableSlotsService } from "../services/appointments/getAvailableSlotsService";
import { ListAppointmentsByDayService } from "../services/appointments/listAppointmentsByDayService";
import { ListCompletedPatientsService } from "../services/appointments/listCompletedPatientsService";
import { ListProfessionalsService } from "../services/appointments/listProfessionalsService";
import { PatchAppointmentStatusService } from "../services/appointments/patchAppointmentStatusService";
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
      handleControllerError(res, error, "Erro ao buscar pacientes");
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
      handleControllerError(res, error, "Erro ao buscar horários disponíveis");
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
      handleControllerError(res, error, "Erro ao criar agendamento");
    }
  }

  /**
   * GET /api/appointments/calendar
   * Lista todos os agendamentos agrupados por dia (±6 meses a partir de hoje)
   */
  async listByDay(req: Request, res: Response): Promise<void> {
    try {
      const { userId, clinicId } = req;
      if (!userId || !clinicId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const service = new ListAppointmentsByDayService();
      const result = await service.execute(userId, clinicId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar consultas" });
      }
    }
  }

  /**
   * GET /api/professionals/me/patients/completed
   * Lista pacientes distintos com pelo menos uma consulta COMPLETED com este profissional
   * Retorna: [{ patientId, name, avatarUrl, lastCompletedAt }]
   */
  async listCompletedPatients(req: Request, res: Response): Promise<void> {
    try {
      const { userId, clinicId } = req;
      if (!userId || !clinicId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const service = new ListCompletedPatientsService();
      const result = await service.execute(userId, clinicId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 500;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar pacientes" });
      }
    }
  }

  /**
   * GET /api/appointments/:id
   * Retorna a consulta completa com patient, professional e clinic aninhados.
   * Necessário para o frontend carregar o contexto da tela de documentos.
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      if (!clinicId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const appointmentId = req.params.id as string;
      const service = new GetAppointmentByIdService();
      const result = await service.execute(appointmentId, clinicId, {
        userId: req.userId,
        userRole: req.userRole,
      });
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao carregar consulta");
    }
  }

  /**
   * PATCH /api/appointments/:id/status
   * Permite ao profissional autenticado fazer a transição WAITING → IN_PROGRESS.
   * Qualquer outra transição retorna 400.
   */
  async patchStatus(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      const userId = req.userId;
      if (!clinicId || !userId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const appointmentId = req.params.id as string;
      const { status } = req.body as { status?: string };
      if (!status) {
        res.status(400).json({ error: "Campo 'status' é obrigatório no body" });
        return;
      }

      const service = new PatchAppointmentStatusService();
      const result = await service.execute(appointmentId, status, userId, clinicId);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao atualizar status da consulta");
    }
  }
}
