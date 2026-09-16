import type { Request, Response } from "express";
import {
  AcceptInviteService,
  CancelInviteService,
  DeclineInviteService,
  GetInviteByTokenService,
  GetInvitePrefillService,
  RegisterFromInviteService,
  ResendInviteService,
} from "../services/invites/inviteService";
import { handleControllerError } from "../utils/controllerUtils";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class InviteController {
  /**
   * GET /api/invites/:token
   */
  async getByToken(req: Request, res: Response): Promise<void> {
    try {
      const result = await new GetInviteByTokenService().execute(req.params.token as string);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao carregar convite");
    }
  }

  /**
   * GET /api/invites/:token/prefill
   */
  async prefill(req: Request, res: Response): Promise<void> {
    try {
      const result = await new GetInvitePrefillService().execute(
        req.userId as string,
        req.params.token as string,
      );
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao carregar convite");
    }
  }

  /**
   * POST /api/invites/:token/accept
   */
  async accept(req: Request, res: Response): Promise<void> {
    try {
      const result = await new AcceptInviteService().execute(
        req.userId as string,
        req.params.token as string,
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao aceitar convite");
    }
  }

  /**
   * POST /api/invites/:token/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await new RegisterFromInviteService().execute(
        req.params.token as string,
        req.body,
      );
      res.status(201).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao concluir cadastro");
    }
  }

  /**
   * POST /api/invites/:token/decline
   */
  async decline(req: Request, res: Response): Promise<void> {
    try {
      const result = await new DeclineInviteService().execute(req.params.token as string);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao recusar convite");
    }
  }

  /**
   * POST /api/invites/:id/resend
   */
  async resend(req: Request, res: Response): Promise<void> {
    try {
      const inviteId = req.params.id as string;
      if (!UUID_REGEX.test(inviteId) || !req.clinicId) {
        res.status(400).json({ error: "Convite inválido" });
        return;
      }
      const result = await new ResendInviteService().execute(
        req.userId as string,
        req.clinicId,
        inviteId,
      );
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao reenviar convite");
    }
  }

  /**
   * DELETE /api/invites/:id
   */
  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const inviteId = req.params.id as string;
      if (!UUID_REGEX.test(inviteId) || !req.clinicId) {
        res.status(400).json({ error: "Convite inválido" });
        return;
      }
      const result = await new CancelInviteService().execute(
        req.userId as string,
        req.clinicId,
        inviteId,
      );
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao cancelar convite");
    }
  }
}
