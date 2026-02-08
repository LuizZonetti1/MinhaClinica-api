import { CreateClinicService } from "../services/createClinicService";
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
}
