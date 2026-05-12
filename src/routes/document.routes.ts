import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { DocumentController } from "../controller/documentController";
import { authMiddleware, checkRole } from "../middlewares/auth";
import { uploadDocumentAttachment } from "../middlewares/upload";
import { validate } from "../middlewares/validation";
import { prisma } from "../database/prisma";
import { UPLOADS_DIR } from "../utils/uploadUtils";
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

/**
 * POST /api/appointments/:id/documents/:docId/attachments
 * Faz upload de um arquivo e associa ao documento
 * Profissional, Admin e Recepção podem anexar
 */
router.post(
  "/:id/documents/:docId/attachments",
  authMiddleware,
  checkRole(...staffAndProfessional),
  uploadDocumentAttachment,
  (req, res) => controller.uploadAttachment(req, res),
);

/**
 * DELETE /api/appointments/:id/documents/:docId/attachments/:attachmentId
 * Remove um anexo do documento
 * Profissional, Admin e Recepção podem remover
 */
router.delete(
  "/:id/documents/:docId/attachments/:attachmentId",
  authMiddleware,
  checkRole(...staffAndProfessional),
  (req, res) => controller.deleteAttachment(req, res),
);

/**
 * PATCH /api/appointments/:id/documents/:docId/attachments/:attachmentId/caption
 * Atualiza a legenda/comentário de um anexo
 * Profissional, Admin e Recepção podem editar
 */
router.patch(
  "/:id/documents/:docId/attachments/:attachmentId/caption",
  authMiddleware,
  checkRole(...staffAndProfessional),
  (req, res) => controller.updateAttachmentCaption(req, res),
);

/**
 * GET /api/appointments/:id/documents/:docId/attachments/:attachmentId/file
 * Serve o arquivo do anexo com verificação de autenticação e ownership.
 * - Staff (ADMIN, RECEPTIONIST, PROFESSIONAL): acessa documentos da própria clínica
 * - PATIENT: acessa apenas documentos das próprias consultas
 */
router.get(
  "/:id/documents/:docId/attachments/:attachmentId/file",
  authMiddleware,
  checkRole(...allRoles),
  async (req, res) => {
    try {
      const attachmentId = String(req.params.attachmentId);
      const userId = req.userId as string;
      const clinicId = req.clinicId as string | null;
      const role = req.userRole as string;

      const attachment = await prisma.documentAttachment.findUnique({
        where: { id: attachmentId },
        include: {
          document: {
            include: {
              appointment: {
                include: {
                  patient: { select: { userId: true } },
                },
              },
            },
          },
        },
      });

      if (!attachment) {
        return res.status(404).json({ message: "Arquivo não encontrado." });
      }

      const doc = attachment.document;
      const isStaff = ["ADMIN", "RECEPTIONIST", "PROFESSIONAL"].includes(role);
      const allowed = isStaff
        ? doc.clinicId === clinicId
        : doc.appointment.patient.userId === userId;

      if (!allowed) {
        return res.status(403).json({ message: "Acesso negado." });
      }

      const filePath = path.join(UPLOADS_DIR, "documents", attachment.storedName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Arquivo não encontrado no servidor." });
      }

      res.sendFile(filePath);
    } catch {
      res.status(500).json({ message: "Erro ao servir arquivo." });
    }
  },
);

export default router;
