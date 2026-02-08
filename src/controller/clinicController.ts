import { CreateClinicService } from "../services/clinics/createClinicService";
import { UpdateClinicService } from "../services/clinics/updateClinicService";
import { Request, Response } from "express";
import { ClinicSchema } from "../schemas/clinicSchema";

export class ClinicController {
    async createClinic(req: Request, res: Response): Promise<void> {
        try {
            //Validação dos dados recebidos usando o schema Yup
            const validatedData = await ClinicSchema.create.validate(req.body, {
                abortEarly: false,    // Retorna todos os erros de uma vez
                stripUnknown: true,   // Remove campos que não estão no schema
            });

            //Executa o serviço de criação com os dados validados
            const createClinicService = new CreateClinicService();

            // Remove campos vazios/null antes de enviar
            const dataToSend = {
                ...validatedData,
                subdomain: validatedData.subdomain || undefined,
                customDomain: validatedData.customDomain || undefined,
            };

            const clinic = await createClinicService.execute(dataToSend);

            // 3. Retorna sucesso
            res.status(201).json({
                message: "Clínica criada com sucesso",
                data: clinic,
            });
        } catch (error: any) {
            // Trata erros de validação do Yup
            if (error.name === 'ValidationError') {
                res.status(400).json({
                    message: "Erro de validação",
                    errors: error.errors, // Array com todas as mensagens de erro
                });
                return;
            }

            // Trata outros erros (ex: clínica duplicada)
            res.status(400).json({
                message: error.message || "Erro ao criar clínica",
            });
        }
    }

    async updateClinic(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params; // ID é string (UUID)

            // Valida se o ID é um UUID válido
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                res.status(400).json({
                    message: "ID da clínica inválido"
                });
                return;
            }

            // Validação dos dados recebidos usando o schema Yup
            const validatedData = await ClinicSchema.update.validate(req.body, {
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
            if (error.name === 'ValidationError') {
                res.status(400).json({
                    message: "Erro de validação",
                    errors: error.errors,
                });
                return;
            }

            // Trata outros erros
            res.status(400).json({
                message: error.message || "Erro ao atualizar clínica",
            });
        }
    }
}
