import type { Request, Response } from "express";
import {
  clinicInfoUpdateSchema,
  clinicNotificationsUpdateSchema,
  clinicPolicyUpdateSchema,
  clinicRegisterCompleteSchema,
  clinicRegisterStartSchema,
  clinicScheduleUpdateSchema,
  clinicSecurityUpdateSchema,
  clinicUpdateSchema,
  clinicWorkingHoursUpdateSchema,
  createClinicHolidaySchema,
} from "../schemas/clinicSchema";
import { VerifyEmailService } from "../services/auth/verifyEmailService";
import {
  CompleteClinicOwnerService,
  RegisterClinicService,
  ResendClinicVerificationService,
} from "../services/clinics/clinicRegistrationService";
import {
  CreateClinicHolidayService,
  DeleteClinicHolidayService,
  GetClinicHolidaysService,
  GetClinicSettingsService,
  GetClinicWorkingHoursService,
  UpdateClinicInfoService,
  UpdateClinicNotificationsService,
  UpdateClinicPolicyService,
  UpdateClinicScheduleService,
  UpdateClinicSecurityService,
  UpdateClinicWorkingHoursService,
} from "../services/clinics/clinicSettingsService";
import { DeleteClinicService } from "../services/clinics/deleteClinicService";
import { GetClinicService } from "../services/clinics/getClinicService";
import { UpdateClinicService } from "../services/clinics/updateClinicService";
import type { WorkingDaysPreset } from "../types/clinic";
import type { AuditContext } from "../types/document";
import type { CompleteClinicOwnerInput } from "../types/user";
import { handleControllerError } from "../utils/controllerUtils";
import { resolveVerifyRedirect } from "../utils/verifyRedirectUtils";

function buildAuditContext(req: Request): AuditContext {
  return {
    userId: req.userId!,
    userName: req.userName ?? "Desconhecido",
    clinicId: req.clinicId!,
    ipAddress: req.ip ?? req.socket?.remoteAddress ?? null,
    userAgent: req.headers["user-agent"] ?? null,
  };
}

export class ClinicController {
  async updateClinic(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      // Valida se o ID é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          message: "ID da clínica inválido",
        });
        return;
      }

      // Validação dos dados recebidos usando o schema Yup
      const validatedData = await clinicUpdateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Executa o serviço de atualização com os dados validados
      const updateClinicService = new UpdateClinicService();

      // Remove campos vazios/null antes de enviar
      const dataToSend = {
        ...validatedData,
        subdomain: validatedData.subdomain || undefined,
        customDomain: validatedData.customDomain || undefined,
      };

      const clinic = await updateClinicService.execute(id, dataToSend);

      res.status(200).json({
        message: "Clínica atualizada com sucesso",
        data: clinic,
      });
    } catch (error: any) {
      // Trata erros de validação do Yup
      if (error.name === "ValidationError") {
        res.status(400).json({
          message: "Erro de validação",
          errors: error.errors,
        });
        return;
      }

      // Trata outros erros
      handleControllerError(res, error, "Erro ao atualizar clínica");
    }
  }

  // Listar as clínicas visíveis ao usuário autenticado.
  // ADMIN é dono de uma única clínica, então o resultado tem no máximo um
  // item — sempre o clinicId do token, nunca um id vindo da requisição.
  // Antes chamava getAll() e devolvia a base inteira para quem pedisse.
  async listClinics(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId;

      if (!clinicId) {
        res.status(403).json({ message: "Acesso negado" });
        return;
      }

      const getClinicService = new GetClinicService();
      const clinic = await getClinicService.getById(clinicId);

      res.status(200).json({
        message: "Clínicas listadas com sucesso",
        total: 1,
        data: [clinic],
      });
    } catch (error) {
      handleControllerError(res, error, "Erro ao listar clínicas");
    }
  }

  // Buscar clínica por ID
  async getClinicById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      // Valida se o ID é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          message: "ID da clínica inválido",
        });
        return;
      }

      const getClinicService = new GetClinicService();
      const clinic = await getClinicService.getById(id);

      res.status(200).json({
        message: "Clínica encontrada",
        data: clinic,
      });
    } catch (error) {
      // GetClinicService lança Error puro (sem statusCode) para clínica não
      // encontrada — sempre foi 404, preserva o status.
      if (error instanceof Error && error.message === "Clínica não encontrada") {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao buscar clínica");
    }
  }

  async deleteClinic(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      // Valida se o ID é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          message: "ID da clínica inválido",
        });
        return;
      }

      const deleteClinicService = new DeleteClinicService();
      await deleteClinicService.execute(id);

      res.status(200).json({
        message: "Clínica deletada com sucesso",
      });
    } catch (error) {
      handleControllerError(res, error, "Erro ao deletar clínica");
    }
  }

  // ── Fluxo de cadastro em etapas ─────────────────────────────────────────────

  /**
   * POST /api/clinics/register/start — Etapa 1
   * Recebe dados da clínica + nome/e-mail do dono → envia e-mail de verificação
   */
  async registerStart(req: Request, res: Response): Promise<void> {
    try {
      const validated = await clinicRegisterStartSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const service = new RegisterClinicService();
      const result = await service.execute(validated as any);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: error.errors });
        return;
      }
      handleControllerError(res, error, "Erro ao iniciar cadastro da clínica");
    }
  }

  /**
   * POST /api/clinics/register/verify — Etapa 2
   * Reutiliza o mesmo serviço de verificação de e-mail dos pacientes
   */
  async registerVerify(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ error: "Token não fornecido" });
        return;
      }
      const service = new VerifyEmailService();
      const result = await service.execute(token);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao verificar e-mail");
    }
  }

  /**
   * POST /api/clinics/register/resend-verification
   * Reenvia o e-mail de verificação para o dono
   */
  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const service = new ResendClinicVerificationService();
      const result = await service.execute({ email });
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error, "Erro ao reenviar verificação");
    }
  }

  /**
   * GET /api/clinics/verify-email/:token — link clicado no e-mail
   * Detecta a role do usuário e redireciona para a tela correta no frontend.
   * Para ADMIN redireciona para /clinica/registro/completo
   */
  async verifyEmailLink(req: Request, res: Response): Promise<void> {
    return resolveVerifyRedirect(req, res);
  }

  /**
   * POST /api/clinics/register/complete — Etapa 3
   * Protegido por JWT temporário — completa dados do dono e ativa a clínica
   */
  async registerComplete(req: Request, res: Response): Promise<void> {
    try {
      const validated = await clinicRegisterCompleteSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const userId = req.userId as string;
      const service = new CompleteClinicOwnerService();
      const result = await service.execute(userId, validated as CompleteClinicOwnerInput);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: error.errors });
        return;
      }
      handleControllerError(res, error, "Erro ao completar cadastro da clínica");
    }
  }

  // ── Configurações da clínica (página de Configurações) ──────────────────────

  /**
   * GET /api/clinics/settings
   * Retorna as configurações completas da clínica do admin autenticado
   */
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId as string;

      const service = new GetClinicSettingsService();
      const data = await service.execute(clinicId);

      res.status(200).json({ data });
    } catch (error) {
      // GetClinicSettingsService lança Error puro (sem statusCode) para clínica
      // não encontrada — sempre foi 404, preserva o status.
      if (error instanceof Error && error.message === "Clínica não encontrada") {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }
      handleControllerError(res, error, "Erro ao buscar configurações");
    }
  }

  /**
   * PATCH /api/clinics/settings/info
   * Atualiza os dados básicos (nome, CNPJ, telefone, e-mail, endereço)
   */
  async updateInfo(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId as string;

      const validatedData = await clinicInfoUpdateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const service = new UpdateClinicInfoService();
      const clinic = await service.execute(clinicId, validatedData, buildAuditContext(req));

      res.status(200).json({ message: "Informações atualizadas com sucesso", data: clinic });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: error.errors });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar informações");
    }
  }

  /**
   * PATCH /api/clinics/settings/schedule
   * Atualiza as configurações de horário e agenda
   */
  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId as string;

      const validatedData = await clinicScheduleUpdateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const service = new UpdateClinicScheduleService();
      const settings = await service.execute(
        clinicId,
        {
          ...validatedData,
          workingDaysPreset: validatedData.workingDaysPreset as WorkingDaysPreset | undefined,
        },
        buildAuditContext(req),
      );

      res
        .status(200)
        .json({ message: "Configurações de agenda atualizadas com sucesso", data: settings });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: error.errors });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar configurações de agenda");
    }
  }

  /**
   * PATCH /api/clinics/settings/notifications
   * Atualiza as preferências de notificações
   */
  async updateNotifications(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId as string;

      const validatedData = await clinicNotificationsUpdateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const service = new UpdateClinicNotificationsService();
      const settings = await service.execute(clinicId, validatedData, buildAuditContext(req));

      res
        .status(200)
        .json({ message: "Configurações de notificações atualizadas com sucesso", data: settings });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: error.errors });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar notificações");
    }
  }

  /**
   * PATCH /api/clinics/settings/security
   * Atualiza as configurações de segurança
   */
  async updateSecurity(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId as string;

      const validatedData = await clinicSecurityUpdateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const service = new UpdateClinicSecurityService();
      const settings = await service.execute(clinicId, validatedData, buildAuditContext(req));

      res
        .status(200)
        .json({ message: "Configurações de segurança atualizadas com sucesso", data: settings });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: error.errors });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar configurações de segurança");
    }
  }

  /**
   * PATCH /api/clinics/settings/policy
   * Atualiza as regras de agendamento (antecedência, cancelamento, faltas, online booking)
   */
  async updatePolicy(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId as string;

      const validatedData = await clinicPolicyUpdateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const service = new UpdateClinicPolicyService();
      const settings = await service.execute(clinicId, validatedData, buildAuditContext(req));

      res
        .status(200)
        .json({ message: "Regras de agendamento atualizadas com sucesso", data: settings });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: error.errors });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar regras de agendamento");
    }
  }

  /**
   * GET /api/clinics/settings/working-hours
   * Lista o horário de funcionamento por dia da semana
   */
  async getWorkingHours(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId as string;
      const service = new GetClinicWorkingHoursService();
      const items = await service.execute(clinicId);
      res.status(200).json({ data: items });
    } catch (error) {
      handleControllerError(res, error, "Erro ao buscar horário de funcionamento");
    }
  }

  /**
   * PUT /api/clinics/settings/working-hours
   * Substitui o horário de funcionamento dos dias enviados
   */
  async updateWorkingHours(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId as string;

      const validatedData = await clinicWorkingHoursUpdateSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const service = new UpdateClinicWorkingHoursService();
      const items = await service.execute(
        clinicId,
        validatedData.days as never,
        buildAuditContext(req),
      );

      res
        .status(200)
        .json({ message: "Horário de funcionamento atualizado com sucesso", data: items });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: error.errors });
        return;
      }
      handleControllerError(res, error, "Erro ao atualizar horário de funcionamento");
    }
  }

  /**
   * GET /api/clinics/settings/holidays
   * Lista feriados/dias sem atendimento cadastrados
   */
  async getHolidays(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId as string;
      const service = new GetClinicHolidaysService();
      const items = await service.execute(clinicId);
      res.status(200).json({ data: items });
    } catch (error) {
      handleControllerError(res, error, "Erro ao buscar feriados");
    }
  }

  /**
   * POST /api/clinics/settings/holidays
   * Cadastra um feriado/dia sem atendimento
   */
  async createHoliday(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId as string;

      const validatedData = await createClinicHolidaySchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const service = new CreateClinicHolidayService();
      const holiday = await service.execute(
        clinicId,
        validatedData as { date: Date; description: string; isRecurring: boolean },
        buildAuditContext(req),
      );

      res.status(201).json({ message: "Feriado cadastrado com sucesso", data: holiday });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        res.status(400).json({ message: "Erro de validação", errors: error.errors });
        return;
      }
      handleControllerError(res, error, "Erro ao cadastrar feriado");
    }
  }

  /**
   * DELETE /api/clinics/settings/holidays/:id
   * Remove um feriado/dia sem atendimento
   */
  async deleteHoliday(req: Request, res: Response): Promise<void> {
    try {
      const clinicId = req.clinicId as string;
      const holidayId = req.params.id as string;

      const service = new DeleteClinicHolidayService();
      await service.execute(clinicId, holidayId, buildAuditContext(req));

      res.status(204).send();
    } catch (error) {
      handleControllerError(res, error, "Erro ao remover feriado");
    }
  }
}
