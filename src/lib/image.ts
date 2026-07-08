import sharp from "sharp";
import { IMAGE_CONFIG } from "./config";

/**
 * Procesamiento de imágenes
 * ===========================================
 * Antes de subir cualquier imagen a GitHub, la pasamos por sharp para:
 * 1. Redimensionarla (no necesitamos imágenes de 4000px de ancho)
 * 2. Convertirla a WebP (formato moderno, ~70% más liviano que JPG)
 *
 * 📚 Concepto: WebP
 * WebP es un formato de imagen moderno creado por Google. Una misma foto en
 * WebP pesa aproximadamente 70% menos que en JPG con la misma calidad visual.
 * Todos los navegadores modernos (Chrome, Firefox, Safari, Edge) lo soportan.
 * Usar WebP mantiene tu repositorio pequeño y tu sitio web rápido.
 *
 * 📚 Concepto: ¿Por qué optimizar en el backend, no en el navegador?
 * Podríamos pedirle al navegador que reduzca la imagen antes de subirla, pero:
 * - El navegador no convierte a WebP de forma nativa
 * - Si un usuario "malo" desactiva el JS, podría subir una imagen gigante
 * Hacerlo en el backend es más seguro y consistente.
 */

/**
 * Procesa una imagen para uso en noticias.
 * - Redimensiona a máximo 1200px de ancho (mantiene proporción)
 * - Convierte a WebP con calidad 80
 *
 * @param input Buffer con la imagen original (JPG, PNG, etc.)
 * @returns Buffer con la imagen optimizada en formato WebP
 */
export async function processNewsImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize({
      width: IMAGE_CONFIG.newsMaxWidth,
      withoutEnlargement: true, // No agrandar imágenes pequeñas
      fit: "inside", // Mantener proporción
    })
    .webp({ quality: IMAGE_CONFIG.webpQuality })
    .toBuffer();
}

/**
 * Procesa una foto de profesor.
 * - Redimensiona a máximo 600px de ancho (suficiente para un avatar)
 * - Recorta a cuadrado (1:1) para consistencia visual
 * - Convierte a WebP con calidad 80
 *
 * @param input Buffer con la imagen original
 * @returns Buffer con la imagen optimizada en formato WebP
 */
export async function processProfessorPhoto(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize({
      width: IMAGE_CONFIG.professorMaxWidth,
      height: IMAGE_CONFIG.professorMaxWidth,
      fit: "cover", // Recorta para llenar el cuadrado
      position: "center", // Centra el recorte (mejor para rostros)
      withoutEnlargement: true,
    })
    .webp({ quality: IMAGE_CONFIG.webpQuality })
    .toBuffer();
}

/**
 * Procesa una imagen genérica (para galería, etc.).
 * - Redimensiona a máximo 1200px de ancho
 * - Convierte a WebP
 */
export async function processGenericImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize({
      width: IMAGE_CONFIG.newsMaxWidth,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: IMAGE_CONFIG.webpQuality })
    .toBuffer();
}

/**
 * Valida que un archivo subido sea una imagen válida y no exceda el tamaño máximo.
 *
 * @param buffer Buffer del archivo subido
 * @param mimeType MIME type reportado por el navegador
 * @throws Error si el archivo no es válido
 */
export function validateImage(buffer: Buffer, mimeType: string): void {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(mimeType.toLowerCase())) {
    throw new Error(
      `Tipo de archivo no permitido: ${mimeType}. ` +
        `Solo se aceptan: JPG, PNG, WebP y GIF.`
    );
  }

  if (buffer.length > IMAGE_CONFIG.maxUploadBytes) {
    throw new Error(
      `La imagen es demasiado grande: ${(buffer.length / 1024 / 1024).toFixed(1)} MB. ` +
        `El máximo es ${IMAGE_CONFIG.maxUploadBytes / 1024 / 1024} MB.`
    );
  }
}
