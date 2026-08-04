import type { Request, Response } from "express";
import { ListClinicProfessionalsService } from "../services/clinicDirectory/listClinicProfessionalsService";
import { ListClinicsService } from "../services/clinicDirectory/listClinicsService";
import { handleControllerError } from "../utils/controllerUtils";

export class ClinicDirectoryController {
  /**
   * GET /api/clinic-directory?name=...&city=...&specialty=...
   * Lista clínicas ativas, podendo filtrar por nome, cidade e especialidade
   */
  async listClinics(req: Request, res: Response): Promise<void> {
    try {
      const name = String(req.query.name ?? "");
      const city = String(req.query.city ?? "");
      const specialty = String(req.query.specialty ?? "");

      const service = new ListClinicsService();
      const data = await service.execute({ name, city, specialty });

      res.status(200).json({ data });
    } catch (error: unknown) {
      handleControllerError(res, error, "Erro ao buscar clínicas");
    }
  }

  /**
   * GET /api/clinic-directory/:clinicId/professionals
   * Lista profissionais ativos da clínica com dados completos de perfil
   */
  async listProfessionals(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req.params as { clinicId: string };

      const service = new ListClinicProfessionalsService();
      const data = await service.execute(clinicId);

      res.status(200).json({ data });
    } catch (error: unknown) {
      handleControllerError(res, error, "Erro ao listar profissionais");
    }
  }
}
