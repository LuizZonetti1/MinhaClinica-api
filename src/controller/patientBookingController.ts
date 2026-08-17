import type { Request, Response } from "express";
import { GetAvailableSlotsService } from "../services/appointments/getAvailableSlotsService";
import { ListProfessionalsService } from "../services/appointments/listProfessionalsService";
import { PatientCreateAppointmentService } from "../services/patients/patientCreateAppointmentService";
import { SearchClinicsService } from "../services/patients/searchClinicsService";
import type { PatientBookingInput } from "../types/patient";
import { handleControllerError } from "../utils/controllerUtils";

export class PatientBookingController {
  /**
   * GET /api/patient-booking/clinics?q=
   * Busca clínicas ativas por nome fantasia, razão social ou cidade
   */
  async searchClinics(req: Request, res: Response): Promise<void> {
    try {
      const q = String(req.query.q ?? "");

      const service = new SearchClinicsService();
      const data = await service.execute(q);

      res.status(200).json({ data });
    } catch (error: unknown) {
      handleControllerError(res, error, "Erro ao buscar clínicas");
    }
  }

  /**
   * GET /api/patient-booking/clinics/:clinicId/professionals
   * Lista profissionais ativos da clínica escolhida
   */
  async listProfessionals(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId } = req.params as { clinicId: string };

      const service = new ListProfessionalsService();
      const data = await service.execute(clinicId);

      res.status(200).json({ data });
    } catch (error: unknown) {
      handleControllerError(res, error, "Erro ao listar profissionais");
    }
  }

  /**
   * GET /api/patient-booking/clinics/:clinicId/professionals/:professionalId/slots?date=YYYY-MM-DD
   * Retorna os slots do dia com flag de disponibilidade
   */
  async getSlots(req: Request, res: Response): Promise<void> {
    try {
      const { clinicId, professionalId } = req.params as {
        clinicId: string;
        professionalId: string;
      };
      const date = String(req.query.date ?? "");

      if (!date) {
        res.status(400).json({ message: "Parâmetro 'date' é obrigatório (YYYY-MM-DD)" });
        return;
      }

      const service = new GetAvailableSlotsService();
      // isOnlineBooking=true: aplica allowOnlineBooking e minAdvanceBookingHours,
      // as mesmas regras que a criação pelo portal impõe.
      const data = await service.execute(professionalId, clinicId, date, undefined, true);

      res.status(200).json({ data });
    } catch (error: unknown) {
      handleControllerError(res, error, "Erro ao buscar horários");
    }
  }

  /**
   * POST /api/patient-booking/appointments
   * Cria o agendamento — patientId resolvido do token
   */
  async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;
      const input = req.body as PatientBookingInput;

      const service = new PatientCreateAppointmentService();
      const data = await service.execute(input, userId);

      res.status(201).json({ data });
    } catch (error: unknown) {
      handleControllerError(res, error, "Erro ao criar agendamento");
    }
  }
}
