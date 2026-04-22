import { Router } from "express";
import { DocumentController } from "../controller/documentController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import {
  createAddendumSchema,
  createDocumentSchema,
  updateDocumentSchema,
} from "../schemas/documentSchema";
import { UserRole } from "../types/enums";

const router = Router({ mergeParams: true });
const controller = new DocumentController();

const allRoles = [UserRole.PROFESSIONAL, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT];
const staffAndProfessional = [UserRole.PROFESSIONAL, UserRole.ADMIN, UserRole.RECEPTIONIST];

/**
 * POST /api/appointments/:id/documents
 * Cria um documento na consulta (status: rascunho)
 * Apenas PROFESSIONAL dono da consulta
 */
router.post(
  "/:id/documents",
  authMiddleware,
  checkRole(UserRole.PROFESSIONAL),
  validate(createDocumentSchema),
  (req, res) => controller.createDocument(req, res),
);

/**
 * PUT /api/appointments/:id/documents/:docId
 * Edita documento (só rascunho/finalizado e consulta em andamento)
 * Apenas PROFESSIONAL dono
 */
router.put(
  "/:id/documents/:docId",
  authMiddleware,
  checkRole(UserRole.PROFESSIONAL),
  validate(updateDocumentSchema),
  (req, res) => controller.updateDocument(req, res),
);

/**
 * PATCH /api/appointments/:id/documents/:docId/finalize
 * Finaliza documento (rascunho → finalizado)
 * Apenas PROFESSIONAL dono
 */
router.patch(
  "/:id/documents/:docId/finalize",
  authMiddleware,
  checkRole(UserRole.PROFESSIONAL),
  (req, res) => controller.finalizeDocument(req, res),
);

/**
 * POST /api/appointments/:id/conclude
 * Conclui consulta — envia todos os finalizados em transação atômica
 * Apenas PROFESSIONAL dono
 */
router.post("/:id/conclude", authMiddleware, checkRole(UserRole.PROFESSIONAL), (req, res) =>
  controller.concludeAppointment(req, res),
);

/**
 * POST /api/appointments/:id/addendum
 * Cria adendo (só se consulta concluída)
 * Apenas PROFESSIONAL dono
 */
router.post(
  "/:id/addendum",
  authMiddleware,
  checkRole(UserRole.PROFESSIONAL),
  validate(createAddendumSchema),
  (req, res) => controller.createAddendum(req, res),
);

/**
 * DELETE /api/appointments/:id/documents/:docId
 * Soft delete (só rascunho, só profissional dono)
 */
router.delete(
  "/:id/documents/:docId",
  authMiddleware,
  checkRole(UserRole.PROFESSIONAL),
  (req, res) => controller.deleteDocument(req, res),
);

/**
 * GET /api/appointments/:id/documents
 * Lista documentos (respeita permissão por papel)
 */
router.get("/:id/documents", authMiddleware, checkRole(...allRoles), (req, res) =>
  controller.listDocuments(req, res),
);

/**
 * GET /api/appointments/:id/documents/:docId
 * Visualiza documento + gera log de visualização
 */
router.get("/:id/documents/:docId", authMiddleware, checkRole(...allRoles), (req, res) =>
  controller.viewDocument(req, res),
);

/**
 * GET /api/appointments/:id/documents/:docId/print
 * Registra impressão e retorna dados do documento
 */
router.get(
  "/:id/documents/:docId/print",
  authMiddleware,
  checkRole(...staffAndProfessional),
  (req, res) => controller.printDocument(req, res),
);

export default router;
