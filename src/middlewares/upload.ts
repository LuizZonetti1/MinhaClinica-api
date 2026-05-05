import path from "node:path";
import { randomUUID } from "node:crypto";
import multer, { type StorageEngine } from "multer";
import type { Request } from "express";

const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage: StorageEngine = multer.diskStorage({
    destination(_req, _file, cb) {
        cb(null, path.join(process.cwd(), "src", "uploads", "documents"));
    },
    filename(_req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${randomUUID()}${ext}`);
    },
});

export const uploadDocumentAttachment = multer({
    storage,
    limits: { fileSize: MAX_SIZE_BYTES },
    fileFilter(_req: Request, file, cb) {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Tipo de arquivo não permitido. Use JPEG, PNG, GIF, WEBP ou PDF."));
        }
    },
}).single("file");
