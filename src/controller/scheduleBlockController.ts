import type { Request, Response } from "express";
import { ScheduleBlockService } from "../services/professionals/scheduleBlockService";
import { handleControllerError } from "../utils/controllerUtils";

export class ScheduleBlockController {
  /** GET /api/professionals/me/schedule-blocks */
  async listMine(req: Request, res: Response): Promise<void> {
    try {
      const items = await new ScheduleBlockService().listMine(req.userId!, req.clinicId!);
      res.status(200).json({ items });
    } catch (error) {
      handleControllerError(res, error, "Erro ao listar bloqueios de agenda");
    }
  }

  /** POST /api/professionals/me/schedule-blocks */
  async createMine(req: Request, res: Response): Promise<void> {
    try {
      const block = await new ScheduleBlockService().createMine(
        req.userId!,
        req.clinicId!,
        req.body,
      );
      res.status(201).json(block);
    } catch (error) {
      handleControllerError(res, error, "Erro ao criar bloqueio de agenda");
    }
  }

  /** DELETE /api/professionals/me/schedule-blocks/:blockId */
  async deleteMine(req: Request, res: Response): Promise<void> {
    try {
      await new ScheduleBlockService().deleteMine(
        req.userId!,
        req.clinicId!,
        req.params.blockId as string,
      );
      res.status(204).send();
    } catch (error) {
      handleControllerError(res, error, "Erro ao excluir bloqueio de agenda");
    }
  }

  /** GET /api/professionals/:id/schedule-blocks */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const items = await new ScheduleBlockService().list(req.params.id as string, req.clinicId!);
      res.status(200).json({ items });
    } catch (error) {
      handleControllerError(res, error, "Erro ao listar bloqueios de agenda");
    }
  }

  /** POST /api/professionals/:id/schedule-blocks */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const block = await new ScheduleBlockService().create(
        req.params.id as string,
        req.clinicId!,
        req.body,
      );
      res.status(201).json(block);
    } catch (error) {
      handleControllerError(res, error, "Erro ao criar bloqueio de agenda");
    }
  }

  /** DELETE /api/professionals/:id/schedule-blocks/:blockId */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      await new ScheduleBlockService().delete(
        req.params.id as string,
        req.clinicId!,
        req.params.blockId as string,
      );
      res.status(204).send();
    } catch (error) {
      handleControllerError(res, error, "Erro ao excluir bloqueio de agenda");
    }
  }
}
