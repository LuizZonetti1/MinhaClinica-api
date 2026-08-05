import type { Request, Response } from "express";
import { uploadProfile } from "../config/multer";
import { updatePatientProfileSchema } from "../schemas/patientProfileSchema";
import {
  changePasswordSchema,
  updateProfessionalProfileSchema,
  updateProfileSchema,
} from "../schemas/profileSchema";
import {
  ChangePasswordService,
  GetPatientProfileService,
  GetProfessionalProfileService,
  GetProfileService,
  GetReceptionProfileService,
  UpdatePatientProfileService,
  UpdateProfessionalProfileService,
  UpdateProfileService,
} from "../services/users/profileService";
import { UpdateUserRolesService } from "../services/users/updateUserRolesService";
import type { UserRole } from "../types/enums";
import type { UpdateProfessionalProfileInput } from "../types/profile";
import { deleteFromCloudinary, extractPublicId } from "../utils/cloudinaryHelper";
import { handleControllerError } from "../utils/controllerUtils";

export class ProfileController {
  /**
   * GET /api/users/me
   * Retorna o perfil completo do usuário autenticado
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;

      const service = new GetProfileService();
      const data = await service.execute(userId);

      res.status(200).json({ data });
    } catch (error) {
      // profileService lança Error puro (sem statusCode) para "não encontrado"
      // — sempre foi 404, preserva o status.
      if (error instanceof Error && error.message === "Usuário não encontrado") {
        res.status(404).json({ message: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao buscar perfil");
    }
  }

  /**
   * GET /api/reception/me
   * Retorna o perfil da recepcionista autenticada
   */
  async getReceptionMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;

      const service = new GetReceptionProfileService();
      const data = await service.execute(userId);

      res.status(200).json({ data });
    } catch (error) {
      if (error instanceof Error && error.message === "Usuário não encontrado") {
        res.status(404).json({ message: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao buscar perfil");
    }
  }

  /**
   * GET /api/professionals/me/profile
   * Retorna o perfil completo do profissional autenticado
   */
  async getProfessionalMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;
      const clinicId = req.clinicId as string;

      const service = new GetProfessionalProfileService();
      const data = await service.execute(userId, clinicId);

      res.status(200).json({ data });
    } catch (error) {
      if (error instanceof Error && error.message === "Profissional não encontrado") {
        res.status(404).json({ message: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao buscar perfil");
    }
  }

  /**
   * PATCH /api/professionals/me/profile
   * Atualiza dados do perfil do profissional autenticado
   */
  async patchProfessionalMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;
      const clinicId = req.clinicId as string;

      const validatedData = await updateProfessionalProfileSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (Object.keys(validatedData).length === 0) {
        res.status(400).json({ message: "Nenhum dado enviado para atualização." });
        return;
      }

      const service = new UpdateProfessionalProfileService();
      await service.execute(userId, clinicId, validatedData as UpdateProfessionalProfileInput);

      res.status(200).json({ message: "Perfil atualizado com sucesso" });
    } catch (error: unknown) {
      const err = error as { name?: string; errors?: string[] };
      if (err.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: err.errors });
        return;
      }
      if (error instanceof Error && error.message === "Profissional não encontrado") {
        res.status(404).json({ message: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar perfil");
    }
  }

  /**
   * PATCH /api/staff/me
   * Atualiza nome, telefone e/ou foto de perfil do admin — tudo opcional.
   * Content-Type: multipart/form-data
   * Campos: name (texto), phone (texto), avatar (arquivo de imagem)
   */
  async updateMe(req: Request, res: Response): Promise<void> {
    // Processa upload via Cloudinary (arquivo opcional)
    const uploadError = await new Promise<Error | null>((resolve) => {
      uploadProfile(req, res, (err) => resolve(err instanceof Error ? err : null));
    });

    if (uploadError) {
      if ((uploadError as NodeJS.ErrnoException).code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "Arquivo muito grande. Máximo: 2 MB." });
      } else {
        handleControllerError(res, uploadError, "Erro no upload do arquivo.");
      }
      return;
    }

    try {
      const userId = req.userId as string;

      // Valida campos de texto (name, phone) — ambos opcionais
      const validatedData = await updateProfileSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const updateData: Record<string, unknown> = {};
      if (validatedData.name !== undefined) updateData.name = validatedData.name;
      if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;

      // Se veio arquivo, deleta o avatar antigo e salva a nova URL pública
      if (req.file) {
        const profileService = new GetProfileService();
        const existing = await profileService.execute(userId);
        if (existing?.personal?.avatarUrl) {
          const oldPublicId = extractPublicId(existing.personal.avatarUrl);
          if (oldPublicId) await deleteFromCloudinary(oldPublicId);
        }
        // req.file.path = URL pública | req.file.filename = public_id
        updateData.avatarUrl = req.file.path;
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ message: "Nenhum dado enviado para atualização." });
        return;
      }

      const service = new UpdateProfileService();
      const updated = await service.execute(userId, updateData);

      res.status(200).json({
        message: "Perfil atualizado com sucesso",
        data: updated,
      });
    } catch (error: unknown) {
      const err = error as { name?: string; errors?: string[] };
      if (err.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: err.errors });
        return;
      }
      // UpdateProfileService lança Error puro (sem statusCode) — este método
      // sempre mapeou qualquer erro (não só "Usuário não encontrado") para
      // 400, preserva o status.
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar perfil");
    }
  }

  /**
   * PATCH /api/staff/me/password
   * Altera a senha do admin autenticado
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;

      const validatedData = await changePasswordSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const service = new ChangePasswordService();
      await service.execute(userId, {
        currentPassword: validatedData.currentPassword,
        newPassword: validatedData.newPassword,
      });

      res.status(200).json({ message: "Senha alterada com sucesso" });
    } catch (error: unknown) {
      const err = error as { name?: string; errors?: string[] };
      if (err.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: err.errors });
        return;
      }
      if (error instanceof Error && error.message === "Senha atual incorreta") {
        res.status(401).json({ message: error.message });
        return;
      }
      // ChangePasswordService só lança essas duas mensagens conhecidas; a
      // segunda ("Usuário não encontrado") sempre caiu no fallback 400.
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao alterar senha");
    }
  }

  /**
   * GET /api/patients/me/profile
   * Retorna o perfil completo do paciente autenticado
   */
  async getPatientMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;

      const service = new GetPatientProfileService();
      const data = await service.execute(userId);

      res.status(200).json({ data });
    } catch (error) {
      handleControllerError(res, error, "Erro ao buscar perfil");
    }
  }

  /**
   * PATCH /api/patients/me/profile
   * Atualiza dados pessoais e de endereço do paciente autenticado
   */
  async patchPatientMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;

      const validatedData = await updatePatientProfileSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (Object.keys(validatedData).length === 0) {
        res.status(400).json({ message: "Nenhum dado enviado para atualização." });
        return;
      }

      const service = new UpdatePatientProfileService();
      await service.execute(userId, validatedData);

      res.status(200).json({ message: "Perfil atualizado com sucesso" });
    } catch (error: unknown) {
      const err = error as { name?: string; errors?: string[] };
      if (err.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: err.errors });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar perfil");
    }
  }

  /**
   * PATCH /api/staff/me/roles
   * Atualiza os papéis cumulativos do usuário autenticado
   */
  async updateRoles(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;
      const { roles } = req.body as { roles: UserRole[] };

      if (!Array.isArray(roles) || roles.length === 0) {
        res.status(400).json({ message: "O campo 'roles' deve ser um array não vazio." });
        return;
      }

      const service = new UpdateUserRolesService();
      const result = await service.execute(userId, roles);

      res.status(200).json({ message: "Papéis atualizados com sucesso", ...result });
    } catch (error) {
      if (error instanceof Error && error.message === "Usuário não encontrado") {
        res.status(404).json({ message: error.message });
        return;
      }
      // CPF duplicado é a única regra aqui com statusCode explícito (409) —
      // as demais mensagens de negócio (papel primário, papéis não
      // permitidos) sempre caíram no fallback 400.
      if (error instanceof Error && "statusCode" in error) {
        handleControllerError(res, error, "Erro ao atualizar papéis");
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar papéis");
    }
  }
}
