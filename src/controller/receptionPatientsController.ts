import type { Request, Response } from "express";
import { GetPatientsService } from "../services/patients/getPatientsService";
import { ListReceptionPatientAppointmentsService } from "../services/reception/receptionPatientsService";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ReceptionPatientsController {
  async listPatients(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      const service = new GetPatientsService();
      const patients = await service.execute(clinicId);

      res.status(200).json({ count: patients.length, items: patients });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar pacientes" });
      }
    }
  }

  async listPatientAppointments(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req;
      const patientId = String(req.params.patientId);

      if (!clinicId) {
        res.status(400).json({ error: "Clínica não identificada no token" });
        return;
      }

      if (!UUID_REGEX.test(patientId)) {
        res.status(400).json({ error: "ID do paciente inválido" });
        return;
      }

      const service = new ListReceptionPatientAppointmentsService();
      const data = await service.execute(clinicId, patientId);

      res.status(200).json(data);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 400;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar consultas do paciente" });
      }
    }
  }
}
