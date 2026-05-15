import type { Request, Response } from "express";
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
import { UserRole } from "../types/enums";
import { fileToUrl, uploadAvatar } from "../utils/uploadUtils";
import { UpdateProfessionalProfileInput } from "../types/profile";

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
   * GET /api/reception/me
   * Retorna o perfil da recepcionista autenticada
   */
  async getReceptionMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId as string;

      const service = new GetReceptionProfileService();
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
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message === "Profissional não encontrado") {
        res.status(404).json({ message: err.message });
        return;
      }
      res.status(500).json({ message: err.message || "Erro ao buscar perfil" });
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
      const err = error as { name?: string; errors?: string[]; message?: string };
      if (err.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: err.errors });
        return;
      }
      if (err.message === "Profissional não encontrado") {
        res.status(404).json({ message: err.message });
        return;
      }
      res.status(500).json({ message: err.message || "Erro ao atualizar perfil" });
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
    } catch (error: unknown) {
      const err = error as { message?: string; statusCode?: number };
      const status = err.statusCode ?? 500;
      res.status(status).json({ message: err.message || "Erro ao buscar perfil" });
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
      const err = error as {
        name?: string;
        errors?: string[];
        message?: string;
        statusCode?: number;
      };
      if (err.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: err.errors });
        return;
      }
      const status = err.statusCode ?? 500;
      res.status(status).json({ message: err.message || "Erro ao atualizar perfil" });
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
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message === "Usuário não encontrado") {
        res.status(404).json({ message: err.message });
        return;
      }
      res.status(400).json({ message: err.message || "Erro ao atualizar papéis" });
    }
  }
}
