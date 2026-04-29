import type { Request, Response } from "express";
import { ListClinicProfessionalsService } from "../services/clinicDirectory/listClinicProfessionalsService";
import { ListClinicsService } from "../services/clinicDirectory/listClinicsService";

export class ClinicDirectoryController {
    /**
     * GET /api/clinic-directory?q=
     * Lista clínicas ativas, podendo filtrar por nome fantasia, razão social ou cidade
     */
    async listClinics(req: Request, res: Response): Promise<void> {
        try {
            const q = String(req.query.q ?? "");

            const service = new ListClinicsService();
            const data = await service.execute(q);

            res.status(200).json({ data });
        } catch (error: unknown) {
            const err = error as { message?: string };
            res.status(500).json({ message: err.message ?? "Erro ao buscar clínicas" });
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
            const err = error as { message?: string; statusCode?: number };
            const status = err.statusCode ?? 500;
            res.status(status).json({ message: err.message ?? "Erro ao listar profissionais" });
        }
    }
}
