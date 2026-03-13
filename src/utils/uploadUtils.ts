import fs from "node:fs";
import path from "node:path";
import multer, { type StorageEngine } from "multer";

// ── Pasta raiz de uploads (fora de src, na raiz do projeto) ─────────────────
export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 5;

// ── Helper: garante que o diretório existe ───────────────────────────────────
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ── Storage factory ──────────────────────────────────────────────────────────
// Estrutura de diretórios: uploads/clinics/{clinicId}/{type}/
// Cada clínica possui sua própria pasta isolada.
function createDiskStorage(type: "avatars" | "reports"): StorageEngine {
  return multer.diskStorage({
    destination: (req, _file, cb) => {
      const clinicId = (req as { clinicId?: string | null }).clinicId ?? "shared";
      const dest = path.join(UPLOADS_DIR, "clinics", clinicId, type);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
      cb(null, unique);
    },
  });
}

// ── File filter — apenas imagens ─────────────────────────────────────────────
const imageFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato inválido. Envie uma imagem JPEG, PNG ou WebP."));
  }
};

// ── Instâncias de upload ─────────────────────────────────────────────────────

/**
 * Upload de avatar (foto de perfil)
 * Campo: "avatar"  |  Destino: uploads/clinics/{clinicId}/avatars/
 */
export const uploadAvatar = multer({
  storage: createDiskStorage("avatars"),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
}).single("avatar");

/**
 * Upload de imagem para relatório
 * Campo: "report"  |  Destino: uploads/clinics/{clinicId}/reports/
 */
export const uploadReport = multer({
  storage: createDiskStorage("reports"),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
}).single("report");

// ── Helper: converte caminho local para URL pública ──────────────────────────
export function fileToUrl(
  req: { protocol: string; get: (h: string) => string | undefined; clinicId?: string | null },
  filename: string,
  type: "avatars" | "reports",
): string {
  const baseUrl = process.env.APP_URL ?? `${req.protocol}://${req.get("host")}`;
  const clinicId = req.clinicId ?? "shared";
  return `${baseUrl}/uploads/clinics/${clinicId}/${type}/${filename}`;
}
