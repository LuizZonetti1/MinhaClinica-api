import type { NextFunction, Request, Response } from "express";
import type { ObjectSchema } from "yup";

/**
 * Middleware genérico de validação usando Yup
 *
 * @param schema - Schema Yup para validação
 * @returns Middleware do Express
 */
export const validate = (schema: ObjectSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Valida o body da requisição
      const validatedData = await schema.validate(req.body, {
        abortEarly: false, // Retorna todos os erros
        stripUnknown: true, // Remove campos não definidos no schema
      });

      // Substitui o body pelos dados validados
      req.body = validatedData;

      next();
    } catch (error: any) {
      if (error.name === "ValidationError") {
        // Formata os erros do Yup
        const errors = error.inner.map((err: any) => ({
          field: err.path,
          message: err.message,
        }));

        res.status(400).json({
          error: "Erro de validação",
          details: errors,
        });
        return;
      }

      // Erro desconhecido
      res.status(500).json({
        error: "Erro ao validar dados",
      });
    }
  };
};
