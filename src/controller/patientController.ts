import type { Request, Response } from "express";
import {
  GetPatientDetailsService,
  GetPatientsService,
  GetPatientsSummaryService,
} from "../services/patients/getPatientsService";
import {
  CompletePatientService,
  RegisterPatientService,
} from "../services/patients/patientRegistrationService";
import { ReceptionPatientRegistrationService } from "../services/patients/receptionPatientRegistrationService";
import { UnblockPatientService } from "../services/patients/unblockPatientService";
import type { AuditContext } from "../types/document";
import { handleControllerError } from "../utils/controllerUtils";

function buildAuditContext(req: Request): AuditContext {
  return {
    userId: req.userId!,
    userName: req.userName ?? "Desconhecido",
    clinicId: req.clinicId!,
    ipAddress: req.ip ?? req.socket?.remoteAddress ?? null,
    userAgent: req.headers["user-agent"] ?? null,
  };
}

export class PatientController {
  /**
   * POST /api/patients/register
   * Registro inicial de paciente (público)
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;

      const service = new RegisterPatientService();
      const result = await service.execute({ name, email });

      res.status(201).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao realizar cadastro");
    }
  }

  /**
   * POST /api/patients/complete
   * Completar cadastro de paciente (após verificar email)
   */
  async complete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId; // Vem do token de verificação

      if (!userId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const service = new CompletePatientService();
      const result = await service.execute(userId, req.body);

      res.status(200).json(result);
    } catch (error) {
      // CompletePatientService lança Error puro (sem statusCode) para várias
      // regras de negócio ("CPF inválido", "Tipo de usuário inválido", etc)
      // — sempre foi 400, preserva o status.
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao completar cadastro");
    }
  }

  /**
   * POST /api/patients/register-by-reception
   * Cadastro de paciente pela recepção (ADMIN | RECEPTIONIST)
   */
  async registerByReception(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const service = new ReceptionPatientRegistrationService();
      const result = await service.execute(req.body, clinicId);
      res.status(201).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao cadastrar paciente");
    }
  }

  /**
   * GET /api/patients
   * Lista pacientes da clínica
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;

      if (!clinicId) {
        res.status(400).json({ error: "Clinica nao identificada no token" });
        return;
      }

      const service = new GetPatientsService();
      const patients = await service.execute(clinicId);

      res.status(200).json({
        count: patients.length,
        items: patients,
      });
    } catch (error) {
      handleControllerError(res, error, "Erro ao listar pacientes");
    }
  }

  /**
   * GET /api/patients/summary
   * Resumo estatístico de pacientes da clínica
   */
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;

      if (!clinicId) {
        res.status(400).json({ error: "Clinica nao identificada no token" });
        return;
      }

      const service = new GetPatientsSummaryService();
      const summary = await service.execute(clinicId);

      res.status(200).json(summary);
    } catch (error) {
      handleControllerError(res, error, "Erro ao buscar resumo de pacientes");
    }
  }

  /**
   * GET /api/patients/:id/details
   * Detalhes completos do paciente para auditoria (somente leitura)
   */
  async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      const paramPatientId = req.params.id;
      const patientId = Array.isArray(paramPatientId) ? paramPatientId[0] : paramPatientId;

      if (!clinicId) {
        res.status(400).json({ error: "Clinica nao identificada no token" });
        return;
      }

      if (!patientId?.trim()) {
        res.status(400).json({ error: "Paciente nao identificado" });
        return;
      }

      const service = new GetPatientDetailsService();
      const details = await service.execute(clinicId, patientId);

      res.status(200).json(details);
    } catch (error) {
      // GetPatientDetailsService lança Error puro (sem statusCode) para paciente
      // não encontrado — sempre foi 404, preserva o status.
      if (error instanceof Error && error.message === "Paciente nao encontrado") {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao buscar detalhes do paciente");
    }
  }

  /**
   * PATCH /api/patients/:id/unblock
   * Reverte o bloqueio automático por excesso de faltas (ADMIN | RECEPTIONIST)
   */
  async unblock(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;
      const paramPatientId = req.params.id;
      const patientId = Array.isArray(paramPatientId) ? paramPatientId[0] : paramPatientId;

      if (!clinicId) {
        res.status(400).json({ error: "Clinica nao identificada no token" });
        return;
      }

      if (!patientId?.trim()) {
        res.status(400).json({ error: "Paciente nao identificado" });
        return;
      }

      const service = new UnblockPatientService();
      const result = await service.execute(clinicId, patientId, buildAuditContext(req));

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "Paciente nao encontrado") {
        res.status(404).json({ error: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao desbloquear paciente");
    }
  }
}
