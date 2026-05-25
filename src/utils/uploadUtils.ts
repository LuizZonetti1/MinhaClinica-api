/**
 * @deprecated Este módulo não é mais utilizado.
 * O armazenamento de uploads foi migrado para o Cloudinary.
 * Use os storages exportados em src/config/multer.ts:
 *   - uploadProfile  — fotos de perfil
 *   - uploadDocument — anexos de documentos clínicos
 *   - uploadClinic   — logo e imagens de clínica
 *
 * Para deletar arquivos antigos use deleteFromCloudinary() em src/utils/cloudinaryHelper.ts
 */

// Exportado somente para não quebrar imports legados; não possui lógica de disco.
export const UPLOADS_DIR = "";
