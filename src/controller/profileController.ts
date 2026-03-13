import type { Request, Response } from "express";
import { changePasswordSchema, updateProfileSchema } from "../schemas/profileSchema";
import {
  ChangePasswordService,
  GetProfileService,
  UpdateProfileService,
} from "../services/users/profileService";
import { fileToUrl, uploadAvatar } from "../utils/uploadUtils";

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
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message === "Usuário não encontrado") {
        res.status(404).json({ message: err.message });
        return;
      }
      res.status(500).json({ message: err.message || "Erro ao buscar perfil" });
    }
  }

  /**
   * PATCH /api/staff/me
   * Atualiza nome, telefone e/ou foto de perfil do admin — tudo opcional.
   * Content-Type: multipart/form-data
   * Campos: name (texto), phone (texto), avatar (arquivo de imagem)
   */
  async updateMe(req: Request, res: Response): Promise<void> {
    // Processa upload (arquivo opcional — multer não rejeita se não vier)
    const uploadError = await new Promise<Error | null>((resolve) => {
      uploadAvatar(req, res, (err) => resolve(err instanceof Error ? err : null));
    });

    if (uploadError) {
      if ((uploadError as NodeJS.ErrnoException).code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "Arquivo muito grande. Máximo: 5 MB." });
      } else {
        res.status(400).json({ message: uploadError.message || "Erro no upload do arquivo." });
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

      // Se veio arquivo, gera URL e adiciona ao update
      if (req.file) {
        updateData.avatarUrl = fileToUrl(req, req.file.filename, "avatars");
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
      const err = error as { name?: string; errors?: string[]; message?: string };
      if (err.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: err.errors });
        return;
      }
      res.status(400).json({ message: err.message || "Erro ao atualizar perfil" });
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
      const err = error as { name?: string; errors?: string[]; message?: string };
      if (err.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: err.errors });
        return;
      }
      if (err.message === "Senha atual incorreta") {
        res.status(401).json({ message: err.message });
        return;
      }
      res.status(400).json({ message: err.message || "Erro ao alterar senha" });
    }
  }
}
