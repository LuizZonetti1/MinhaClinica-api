import { prisma } from "../database/prisma";

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  patientId: true,
  professionalId: true,
  createdBy: true,
  patient: {
    select: {
      user: { select: { name: true, avatarUrl: true } },
    },
  },
  professional: {
    select: {
      id: true,
      user: { select: { name: true } },
    },
  },
} as const;

export class PatientCommentRepository {
  /** Lista todos os comentários da clínica (todos os pacientes do profissional) */
  async listByClinic(clinicId: string, professionalId: string) {
    return prisma.patientComment.findMany({
      where: { clinicId, professionalId },
      select: commentSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  /** Cria um comentário */
  async create(data: {
    clinicId: string;
    patientId: string;
    professionalId: string;
    content: string;
    createdBy: string;
  }) {
    return prisma.patientComment.create({
      data,
      select: commentSelect,
    });
  }

  /** Busca comentário por ID */
  async findById(id: string) {
    return prisma.patientComment.findUnique({ where: { id }, select: commentSelect });
  }

  /** Atualiza conteúdo do comentário */
  async update(id: string, content: string) {
    return prisma.patientComment.update({
      where: { id },
      data: { content },
      select: commentSelect,
    });
  }

  /** Remove comentário */
  async delete(id: string) {
    return prisma.patientComment.delete({ where: { id } });
  }
}
