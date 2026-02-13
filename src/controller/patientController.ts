import type { Request, Response } from "express";
import {
  CompletePatientService,
  RegisterPatientService,
} from "../services/patients/patientRegistrationService";

export class PatientController {
  /**
   * POST /api/patients/register
   * Registro inicial de paciente (público)
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId, name, email } = req.body;

      const service = new RegisterPatientService();
      const result = await service.execute({ clinicId, name, email });

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
}
