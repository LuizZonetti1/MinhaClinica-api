import type { Request, Response } from "express";
import { handleControllerError } from "../utils/controllerUtils";
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
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao realizar cadastro" });
      }
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
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao completar cadastro" });
      }
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
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar pacientes" });
      }
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
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao buscar resumo de pacientes" });
      }
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
      if (error instanceof Error) {
        if (error.message === "Paciente nao encontrado") {
          res.status(404).json({ error: error.message });
          return;
        }
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao buscar detalhes do paciente" });
      }
    }
  }
}
