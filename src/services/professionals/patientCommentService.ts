import { prisma } from "../../database/prisma";
import { PatientCommentRepository } from "../../repository/patientCommentRepository";
import type {
  CreatePatientCommentInput,
  PatientCommentItem,
  PatientCommentListResult,
  UpdatePatientCommentInput,
} from "../../types/patientComment";

function formatComment(row: {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  patientId: string;
  professionalId: string;
  patient: { user: { name: string; avatarUrl: string | null } };
  professional: { id: string; user: { name: string } };
}): PatientCommentItem {
  return {
    id: row.id,
    content: row.content,
    patientId: row.patientId,
    patientName: row.patient.user.name,
    patientAvatarUrl: row.patient.user.avatarUrl,
    professionalId: row.professional.id,
    professionalName: row.professional.user.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class ListPatientCommentsService {
  private repository = new PatientCommentRepository();

  async execute(userId: string, clinicId: string): Promise<PatientCommentListResult> {
    const professional = await prisma.professional.findFirst({
      where: { userId, clinicId },
      select: { id: true },
    });

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }

    const rows = await this.repository.listByClinic(clinicId, professional.id);
    return {
      total: rows.length,
      comments: rows.map(formatComment),
    };
  }
}

export class CreatePatientCommentService {
  private repository = new PatientCommentRepository();

  async execute(
    input: CreatePatientCommentInput,
    userId: string,
    clinicId: string,
  ): Promise<PatientCommentItem> {
    const professional = await prisma.professional.findFirst({
      where: { userId, clinicId },
      select: { id: true },
    });

    if (!professional) {
      throw Object.assign(new Error("Profissional não encontrado"), { statusCode: 404 });
    }

    // Verifica se o paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    });

    if (!patient) {
      throw Object.assign(new Error("Paciente não encontrado"), { statusCode: 404 });
    }

    // Garante que o profissional tem histórico clínico com este paciente nesta clínica.
    // Sem uma consulta concluída, não é permitido criar comentários clínicos.
    const link = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        professionalId: professional.id,
        clinicId,
        status: { in: ["COMPLETED", "COMPLETED_WITH_ADDENDUM"] },
      },
      select: { id: true },
    });

    if (!link) {
      throw Object.assign(
        new Error("Profissional não possui histórico clínico com este paciente."),
        { statusCode: 403 },
      );
    }

    const row = await this.repository.create({
      clinicId,
      patientId: input.patientId,
      professionalId: professional.id,
      content: input.content,
      createdBy: userId,
    });

    return formatComment(row);
  }
}

export class UpdatePatientCommentService {
  private repository = new PatientCommentRepository();

  async execute(
    commentId: string,
    input: UpdatePatientCommentInput,
    userId: string,
    clinicId: string,
  ): Promise<PatientCommentItem> {
    const comment = await this.repository.findById(commentId);

    if (!comment) {
      throw Object.assign(new Error("Comentário não encontrado"), { statusCode: 404 });
    }

    // Garante que o comentário pertence à clínica e ao profissional logado
    const professional = await prisma.professional.findFirst({
      where: { userId, clinicId },
      select: { id: true },
    });

    if (!professional || comment.professionalId !== professional.id) {
      throw Object.assign(new Error("Sem permissão para editar este comentário"), {
        statusCode: 403,
      });
    }

    const updated = await this.repository.update(commentId, input.content);
    return formatComment(updated);
  }
}

export class DeletePatientCommentService {
  private repository = new PatientCommentRepository();

  async execute(commentId: string, userId: string, clinicId: string): Promise<void> {
    const comment = await this.repository.findById(commentId);

    if (!comment) {
      throw Object.assign(new Error("Comentário não encontrado"), { statusCode: 404 });
    }

    const professional = await prisma.professional.findFirst({
      where: { userId, clinicId },
      select: { id: true },
    });

    if (!professional || comment.professionalId !== professional.id) {
      throw Object.assign(new Error("Sem permissão para excluir este comentário"), {
        statusCode: 403,
      });
    }

    await this.repository.delete(commentId);
  }
}
