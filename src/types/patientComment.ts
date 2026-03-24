// ── Input de criação ─────────────────────────────────────────────────────────

export interface CreatePatientCommentInput {
  patientId: string;
  content: string;
}

// ── Input de atualização ──────────────────────────────────────────────────────

export interface UpdatePatientCommentInput {
  content: string;
}

// ── Item de resposta ──────────────────────────────────────────────────────────

export interface PatientCommentItem {
  id: string;
  content: string;
  patientId: string;
  patientName: string;
  patientAvatarUrl: string | null;
  professionalId: string;
  professionalName: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// ── Listagem ──────────────────────────────────────────────────────────────────

export interface PatientCommentListResult {
  total: number;
  comments: PatientCommentItem[];
}
