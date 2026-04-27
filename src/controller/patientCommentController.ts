import type { Request, Response } from "express";
import { handleControllerError } from "../utils/controllerUtils";
import {
  CreatePatientCommentService,
  DeletePatientCommentService,
  ListPatientCommentsService,
  UpdatePatientCommentService,
} from "../services/professionals/patientCommentService";

export class PatientCommentController {
  /**
   * GET /api/professionals/me/comments
   * Lista todos os comentários do profissional autenticado
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { userId, clinicId } = req;
      if (!userId || !clinicId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const service = new ListPatientCommentsService();
      const result = await service.execute(userId, clinicId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          "statusCode" in error ? (error as Error & { statusCode: number }).statusCode : 500;
        res.status(statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao listar comentários" });
      }
    }
  }

  /**
   * POST /api/professionals/me/comments
   * Cria um comentário para um paciente
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, clinicId } = req;
      if (!userId || !clinicId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const service = new CreatePatientCommentService();
      const result = await service.execute(req.body, userId, clinicId);
      res.status(201).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao criar comentário");
    }
  }

  /**
   * PATCH /api/professionals/me/comments/:id
   * Edita o conteúdo de um comentário do próprio profissional
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { userId, clinicId } = req;
      if (!userId || !clinicId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const commentId = req.params.id as string;

      const service = new UpdatePatientCommentService();
      const result = await service.execute(commentId, req.body, userId, clinicId);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao editar comentário");
    }
  }

  /**
   * DELETE /api/professionals/me/comments/:id
   * Remove um comentário do próprio profissional
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { userId, clinicId } = req;
      if (!userId || !clinicId) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }

      const commentId = req.params.id as string;

      const service = new DeletePatientCommentService();
      await service.execute(commentId, userId, clinicId);
      res.status(204).send();
    } catch (error) {
      handleControllerError(res, error, "Erro ao excluir comentário");
    }
  }
}
