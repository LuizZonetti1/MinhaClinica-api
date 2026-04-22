import { DocumentRepository } from "../../repository/documentRepository";
import { generateIntegrityHash } from "../../utils/hashUtils";

const documentRepository = new DocumentRepository();

export class VerifyIntegrityService {
  async execute(docId: string, clinicId: string) {
    const document = await documentRepository.findByIdIncludeDeleted(docId);

    if (!document) {
      throw Object.assign(new Error("Documento não encontrado"), { statusCode: 404 });
    }

    if (document.clinicId !== clinicId) {
      throw Object.assign(new Error("Acesso negado"), { statusCode: 403 });
    }

    if (!document.integrityHash) {
      throw Object.assign(
        new Error("Documento ainda não possui hash de integridade (não foi enviado)"),
        { statusCode: 400 },
      );
    }

    const computedHash = generateIntegrityHash(document.content);
    const isIntact = computedHash === document.integrityHash;

    return {
      documentId: document.id,
      documentNumber: document.documentNumber,
      isIntact,
      storedHash: document.integrityHash,
      computedHash,
    };
  }
}
