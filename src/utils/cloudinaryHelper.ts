import cloudinary from "../config/cloudinary";

/**
 * Deleta um arquivo do Cloudinary pelo seu public_id.
 * Aceita tanto imagens quanto arquivos raw (PDFs).
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  // Tenta deletar como imagem primeiro; se falhar, tenta como raw
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    if (result.result === "not found") {
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    }
  } catch {
    // Falha silenciosa — o arquivo pode já ter sido removido ou nunca existiu
  }
}

/**
 * Extrai o public_id de uma URL do Cloudinary.
 *
 * Exemplo de URL:
 *   https://res.cloudinary.com/denxi3qo0/image/upload/v1234567890/minhaclinica/profiles/1234-foto.jpg
 *
 * Retorna: "minhaclinica/profiles/1234-foto"
 * Retorna null se a URL não for do Cloudinary.
 */
export function extractPublicId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("cloudinary.com")) return null;

    // Remove a extensão e tudo antes de "/upload/v<version>/"
    const match = parsed.pathname.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^/.]+)?$/);
    if (!match) return null;

    return match[1];
  } catch {
    return null;
  }
}
