import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "node:path";
import cloudinary from "./cloudinary";

// ── Tipos aceitos por categoria ───────────────────────────────────────────────

const PROFILE_FORMATS = new Set(["jpg", "jpeg", "png", "webp"]);
const DOCUMENT_FORMATS = new Set(["jpg", "jpeg", "png", "pdf"]);
const CLINIC_FORMATS = new Set(["jpg", "jpeg", "png", "webp", "svg"]);

// ── Helper: extrai extensão sem ponto, em lower-case ──────────────────────────
function getExt(filename: string): string {
  return path.extname(filename).replace(".", "").toLowerCase();
}

// ── Storage: fotos de perfil ──────────────────────────────────────────────────
// Pasta: minhaclinica/profiles
// Formatos: jpg, jpeg, png, webp
// Transformação: crop fill 400×400 com gravity face
// Limite: 2 MB
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "minhaclinica/profiles",
    resource_type: "image",
    public_id: (_req, file) => {
      const nameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
      return `${Date.now()}-${nameWithoutExt}`;
    },
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  },
});

export const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ext = getExt(file.originalname);
    if (!PROFILE_FORMATS.has(ext)) {
      return cb(new Error("Formato inválido. Use JPG, JPEG, PNG ou WebP para foto de perfil."));
    }
    cb(null, true);
  },
}).single("avatar");

// ── Storage: anexos de documentos clínicos ────────────────────────────────────
// Pasta: minhaclinica/documents/{tipo}
// Formatos: jpg, jpeg, png, pdf
// PDF → resource_type raw; imagem → resource_type image
// Limite: 5 MB
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: (req) => {
      const docType = (req as { body?: { type?: string } }).body?.type ?? "other";
      const validTypes = ["prescription", "exam", "certificate", "other"];
      const folder = validTypes.includes(docType) ? docType : "other";
      return `minhaclinica/documents/${folder}`;
    },
    resource_type: (_req, file) => {
      const ext = getExt(file.originalname);
      return ext === "pdf" ? "raw" : "image";
    },
    public_id: (_req, file) => {
      const nameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
      return `${Date.now()}-${nameWithoutExt}`;
    },
  },
});

export const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ext = getExt(file.originalname);
    if (!DOCUMENT_FORMATS.has(ext)) {
      return cb(
        new Error("Formato inválido. Use JPG, JPEG, PNG ou PDF para documentos clínicos."),
      );
    }
    cb(null, true);
  },
}).single("file");

// ── Storage: logo e fotos de clínica ─────────────────────────────────────────
// Pasta: minhaclinica/clinic
// Formatos: jpg, jpeg, png, webp, svg
// Limite: 3 MB
const clinicStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "minhaclinica/clinic",
    resource_type: "image",
    public_id: (_req, file) => {
      const nameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
      return `${Date.now()}-${nameWithoutExt}`;
    },
  },
});

export const uploadClinic = multer({
  storage: clinicStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ext = getExt(file.originalname);
    if (!CLINIC_FORMATS.has(ext)) {
      return cb(
        new Error("Formato inválido. Use JPG, JPEG, PNG, WebP ou SVG para imagens de clínica."),
      );
    }
    cb(null, true);
  },
}).single("logo");
