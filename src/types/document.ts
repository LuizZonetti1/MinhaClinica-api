import type { DocumentStatus, DocumentType } from "./enums";

export interface CreateDocumentInput {
  type: DocumentType;
  content: Record<string, unknown>;
  internalNotes?: string | null;
}

export interface UpdateDocumentInput {
  content: Record<string, unknown>;
  internalNotes?: string | null;
}

export interface CreateAddendumInput {
  type: DocumentType;
  content: Record<string, unknown>;
  originalDocumentId?: string | null;
  internalNotes?: string | null;
}

export interface DocumentResponse {
  id: string;
  clinicId: string;
  appointmentId: string;
  type: DocumentType;
  status: DocumentStatus;
  content: unknown;
  internalNotes: string | null;
  documentNumber: string;
  version: number;
  originalDocumentId: string | null;
  integrityHash: string | null;
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface DocumentListItem {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  documentNumber: string;
  version: number;
  originalDocumentId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditContext {
  userId: string;
  userName: string;
  clinicId: string;
  ipAddress: string | null;
  userAgent: string | null;
}
