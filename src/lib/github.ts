import { GITHUB_CONFIG } from "./config";
import type { GitHubCommitResult } from "./types";

/**
 * Cliente de la API de GitHub
 * ===========================================
 * Este módulo sabe cómo:
 * 1. Leer archivos JSON del repositorio (GET Contents API)
 * 2. Actualizar archivos JSON creando un commit (PUT Contents API)
 * 3. Subir imágenes al repositorio (PUT Contents API)
 * 4. Eliminar archivos (DELETE Contents API)
 *
 * 📚 Concepto: GitHub Contents API
 * GitHub expone una API REST para manipular archivos del repositorio.
 * Documentación: https://docs.github.com/rest/repos/contents
 *
 * Los endpoints principales son:
 * - GET  /repos/{owner}/{repo}/contents/{path}  → lee un archivo (devuelve base64 + sha)
 * - PUT  /repos/{owner}/{repo}/contents/{path}  → crea o actualiza (requiere sha si existe)
 * - DELETE /repos/{owner}/{repo}/contents/{path} → borra (requiere sha)
 *
 * Cada PUT/DELETE genera automáticamente un commit en GitHub.
 *
 * 📚 Concepto: SHA (Secure Hash Algorithm)
 * El SHA es un hash (cadena única) que identifica una versión específica de un
 * archivo. GitHub lo requiere al actualizar/borrar para evitar condiciones de
 * carrera: si alguien más editó el archivo entre que lo leíste y lo guardaste,
 * el SHA no coincidirá y la API rechazará tu petición. Es un mecanismo de
 * seguridad llamado "optimistic concurrency control".
 */

const API_BASE = "https://api.github.com";

/**
 * Obtiene el token de GitHub desde las variables de entorno.
 * El token NUNCA debe estar en el código fuente.
 *
 * Devuelve null si el token es un placeholder o no está configurado.
 * Esto permite que las operaciones de lectura usen el fallback local,
 * mientras que las de escritura dan un error claro.
 */
function getGithubToken(): string | null {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token === "dev-placeholder-replace-with-real-token") {
    return null;
  }
  return token;
}

/**
 * Obtiene el token o lanza un error claro si no está configurado.
 * Usar en operaciones de ESCRITURA (no hay fallback para writes).
 */
function requireGithubToken(): string {
  const token = getGithubToken();
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN no está configurado. Para guardar cambios, configura tu " +
        "Personal Access Token en el archivo .env.local (desarrollo) o en " +
        "Vercel → Settings → Environment Variables (producción)."
    );
  }
  return token;
}

/**
 * Headers comunes para todas las peticiones a la API de GitHub.
 */
function githubHeaders(token: string, extra: Record<string, string> = {}): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "AEFN-Web-Editor",
    ...extra,
  };
}

/** Respuesta al leer un archivo de GitHub */
interface GitHubFile {
  /** Contenido del archivo decodificado de base64 */
  content: string;
  /** SHA del archivo (necesario para actualizarlo/borrarlo) */
  sha: string;
}

/**
 * Lee un archivo JSON del repositorio y lo devuelve como objeto.
 * Si el archivo no existe, devuelve null.
 *
 * Incluye un FALLBACK a archivos locales en public/ para desarrollo:
 * Si la API de GitHub falla (token placeholder o sin conexión), intenta
 * leer el archivo desde el sistema de archivos local. Esto permite probar
 * la UI sin necesidad de un token real configurado.
 *
 * @param path - Ruta del archivo dentro del repo, ej: "data/profesores.json"
 */
export async function readJsonFile<T>(path: string): Promise<{ data: T | null; sha: string | null }> {
  const token = getGithubToken();

  // Si no hay token configurado, ir directo al fallback local
  if (!token) {
    console.warn(
      `[github.ts] GITHUB_TOKEN no configurado. Usando fallback local para: ${path}`
    );
    return await readLocalJsonFile<T>(path);
  }

  const url = `${API_BASE}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}?ref=${GITHUB_CONFIG.branch}`;

  try {
    const response = await fetch(url, {
      headers: githubHeaders(token),
      method: "GET",
    });

    // 404 = el archivo no existe todavía (es válido, devolvemos null)
    if (response.status === 404) {
      return { data: null, sha: null };
    }

    if (!response.ok) {
      const errorText = await response.text();
      // Si es 401 (Bad credentials), intentar fallback a archivo local
      if (response.status === 401) {
        console.warn(
          `[github.ts] Token inválido. Intentando fallback local para: ${path}`
        );
        return await readLocalJsonFile<T>(path);
      }
      throw new Error(
        `GitHub API: error al leer ${path} (HTTP ${response.status}): ${errorText}`
      );
    }

    const fileData = await response.json();

    // El contenido viene en base64. Lo decodificamos.
    const content = Buffer.from(fileData.content, "base64").toString("utf-8");
    const parsed = JSON.parse(content) as T;

    return { data: parsed, sha: fileData.sha as string };
  } catch (error) {
    // Si el error es de red o el token es inválido, intentar fallback local
    if (error instanceof Error && (error.message.includes("Bad credentials") || error.message.includes("401"))) {
      console.warn(`[github.ts] Fallback local para: ${path}`);
      return await readLocalJsonFile<T>(path);
    }
    throw error;
  }
}

/**
 * Lee un archivo JSON desde el sistema de archivos local (public/).
 * Es un fallback para desarrollo cuando no hay token de GitHub configurado.
 *
 * 📚 Concepto: File System API (Node.js)
 * Node.js puede leer archivos del sistema de archivos con fs.readFile.
 * En Next.js, process.cwd() devuelve el directorio raíz del proyecto.
 * Así podemos leer public/data/profesores.json directamente del disco.
 *
 * IMPORTANTE: Esto NO funciona en Vercel (producción) porque ahí no hay
 * sistema de archivos persistente. Por eso es solo un fallback de desarrollo.
 */
async function readLocalJsonFile<T>(path: string): Promise<{ data: T | null; sha: string | null }> {
  try {
    const fs = await import("fs/promises");
    const localPath = `${process.cwd()}/public/${path}`;
    const content = await fs.readFile(localPath, "utf-8");
    const parsed = JSON.parse(content) as T;
    return { data: parsed, sha: null }; // sha=null: los writes fallarán (esperado en dev sin token)
  } catch {
    // Archivo local no existe
    return { data: null, sha: null };
  }
}

/**
 * Escribe un objeto como JSON en el repositorio, creando un commit.
 *
 * @param path - Ruta del archivo, ej: "data/profesores.json"
 * @param data - Objeto a guardar (se serializa a JSON con indentación de 2 espacios)
 * @param sha - SHA del archivo actual (null si es nuevo)
 * @param commitMessage - Mensaje del commit
 */
export async function writeJsonFile<T>(
  path: string,
  data: T,
  sha: string | null,
  commitMessage: string
): Promise<GitHubCommitResult> {
  const token = requireGithubToken();
  const url = `${API_BASE}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;

  const content = JSON.stringify(data, null, 2) + "\n";
  const contentBase64 = Buffer.from(content, "utf-8").toString("base64");

  const body = {
    message: commitMessage,
    content: contentBase64,
    branch: GITHUB_CONFIG.branch,
    ...(sha ? { sha } : {}), // Si el archivo existe, mandamos el sha
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: githubHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `GitHub API: error al escribir ${path} (HTTP ${response.status}): ${errorText}`,
    };
  }

  const result = await response.json();

  return {
    success: true,
    commitSha: result.commit?.sha,
    commitUrl: result.commit?.html_url,
    message: `Commit creado: ${commitMessage}`,
  };
}

/**
 * Sube una imagen binaria al repositorio (como base64).
 * Usado para fotos de profesores e imágenes de noticias.
 *
 * @param path - Ruta completa, ej: "images/noticias/mi-imagen.webp"
 * @param binaryData - Datos binarios de la imagen (Buffer)
 * @param commitMessage - Mensaje del commit
 */
export async function writeBinaryFile(
  path: string,
  binaryData: Buffer,
  commitMessage: string
): Promise<GitHubCommitResult> {
  const token = requireGithubToken();
  const url = `${API_BASE}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;

  const contentBase64 = binaryData.toString("base64");

  const body = {
    message: commitMessage,
    content: contentBase64,
    branch: GITHUB_CONFIG.branch,
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: githubHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // 422 = el archivo ya existe. Necesitamos su SHA para sobrescribir.
    if (response.status === 422) {
      const existing = await getFileSha(path);
      if (existing) {
        // Reintentar con el SHA
        const bodyWithSha = { ...body, sha: existing };
        const retryResponse = await fetch(url, {
          method: "PUT",
          headers: githubHeaders(token),
          body: JSON.stringify(bodyWithSha),
        });

        if (retryResponse.ok) {
          const result = await retryResponse.json();
          return {
            success: true,
            commitSha: result.commit?.sha,
            commitUrl: result.commit?.html_url,
            message: `Imagen actualizada: ${path}`,
          };
        }
      }
    }
    const errorText = await response.text();
    return {
      success: false,
      message: `GitHub API: error al subir imagen ${path} (HTTP ${response.status}): ${errorText}`,
    };
  }

  const result = await response.json();
  return {
    success: true,
    commitSha: result.commit?.sha,
    commitUrl: result.commit?.html_url,
    message: `Imagen subida: ${path}`,
  };
}

/**
 * Obtiene solo el SHA de un archivo (sin descargar el contenido completo).
 * Útil para verificar si un archivo existe antes de subirlo.
 */
export async function getFileSha(path: string): Promise<string | null> {
  const token = getGithubToken();
  if (!token) return null; // Sin token, no podemos obtener SHA (modo desarrollo)

  const url = `${API_BASE}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}?ref=${GITHUB_CONFIG.branch}`;

  const response = await fetch(url, {
    headers: githubHeaders(token),
    method: "GET",
  });

  if (response.status === 404) return null;
  if (!response.ok) return null;

  const data = await response.json();
  return data.sha as string;
}

/**
 * Elimina un archivo del repositorio (crea un commit de borrado).
 * Usado para eliminar fotos de profesores o imágenes de noticias.
 *
 * @param path - Ruta del archivo a eliminar
 * @param commitMessage - Mensaje del commit
 */
export async function deleteFile(
  path: string,
  commitMessage: string
): Promise<GitHubCommitResult> {
  const token = requireGithubToken();

  // Primero necesitamos el SHA del archivo
  const sha = await getFileSha(path);
  if (!sha) {
    return {
      success: false,
      message: `No se puede eliminar ${path}: el archivo no existe.`,
    };
  }

  const url = `${API_BASE}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;

  const body = {
    message: commitMessage,
    sha: sha,
    branch: GITHUB_CONFIG.branch,
  };

  const response = await fetch(url, {
    method: "DELETE",
    headers: githubHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: `GitHub API: error al eliminar ${path} (HTTP ${response.status}): ${errorText}`,
    };
  }

  return {
    success: true,
    message: `Archivo eliminado: ${path}`,
  };
}

/**
 * Genera un slug amigable para URLs a partir de un texto.
 * Ej: "¡Hola Mundo!" → "hola-mundo"
 * Usado para generar IDs de noticias y nombres de archivos de imagen.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quita acentos
    .replace(/[^a-z0-9\s-]/g, "") // Solo letras, números, espacios, guiones
    .trim()
    .replace(/\s+/g, "-") // Espacios → guiones
    .replace(/-+/g, "-") // Sin guiones duplicados
    .slice(0, 80); // Máximo 80 caracteres
}
