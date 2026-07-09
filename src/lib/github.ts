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
 * Estrategia de lectura con MERGE INTELIGENTE:
 * 1. Intenta todas las fuentes (GitHub API, archivo local, fetch estático)
 * 2. Devuelve la fuente con MÁS datos (para evitar pérdida de datos)
 * 3. El SHA viene de GitHub (necesario para writes)
 *
 * Esto previene el bug donde un POST sobrescribe el JSON con menos datos
 * de los que realmente existen.
 *
 * @param path - Ruta del archivo dentro del repo, ej: "data/profesores.json"
 */
export async function readJsonFile<T>(path: string): Promise<{ data: T | null; sha: string | null }> {
  const token = getGithubToken();

  let githubData: T | null = null;
  let githubSha: string | null = null;
  let localData: T | null = null;

  // 1. Intentar GitHub API (para obtener datos + SHA)
  if (token) {
    try {
      const url = `${API_BASE}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}?ref=${GITHUB_CONFIG.branch}`;
      const response = await fetch(url, {
        headers: githubHeaders(token),
        method: "GET",
      });

      if (response.ok) {
        const fileData = await response.json();
        const content = Buffer.from(fileData.content, "base64").toString("utf-8");
        githubData = JSON.parse(content) as T;
        githubSha = fileData.sha as string;
      } else if (response.status !== 404) {
        const errorText = await response.text();
        console.warn(`[github.ts] GitHub API error ${response.status} para ${path}: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.warn(`[github.ts] Error leyendo de GitHub: ${path}`, error instanceof Error ? error.message : error);
    }
  }

  // 2. Intentar archivo local
  localData = (await readLocalJsonFile<T>(path)).data;

  // 3. MERGE INTELIGENTE: devolver la fuente con MÁS datos
  // Esto previene pérdida de datos si GitHub tiene una versión vieja/incompleta
  const githubCount = Array.isArray(githubData) ? githubData.length : githubData ? 1 : 0;
  const localCount = Array.isArray(localData) ? localData.length : localData ? 1 : 0;

  console.log(`[github.ts] ${path}: GitHub=${githubCount} items, Local=${localCount} items`);

  if (githubData && localData) {
    // Ambas fuentes tienen datos: devolver la que tenga MÁS
    if (githubCount >= localCount) {
      return { data: githubData, sha: githubSha };
    } else {
      // Local tiene más datos que GitHub (GitHub está incompleto)
      // Devolver local pero SIN sha (los writes fallarán, lo cual es seguro)
      console.warn(`[github.ts] Local tiene más datos (${localCount}) que GitHub (${githubCount}). Usando local.`);
      return { data: localData, sha: null };
    }
  }

  if (githubData) {
    return { data: githubData, sha: githubSha };
  }

  if (localData) {
    return { data: localData, sha: null };
  }

  // 4. Último recurso: fetch estático
  console.warn(`[github.ts] GitHub y local fallaron. Intentando fetch estático.`);
  return await readStaticJsonFile<T>(path);
}

/**
 * Lee un archivo JSON para ESCRITURA: combina datos de GitHub y local,
 * fusionándolos para evitar pérdida de datos.
 *
 * Esta función está diseñada específicamente para operaciones POST/PUT/DELETE.
 * Devuelve:
 * - data: el array fusionado (GitHub + local, sin duplicados)
 * - sha: el SHA de GitHub (si se obtuvo), necesario para el write
 *
 * Si GitHub tiene menos items que local, los fusiona (añade los de local que no estén en GitHub).
 *
 * @param path - Ruta del archivo
 * @param idField - Campo usado para detectar duplicados (ej: "id", "nombre", "title")
 */
export async function readJsonForWrite<T>(
  path: string,
  idField: string = "id"
): Promise<{ data: T[] | null; sha: string | null }> {
  // 1. Leer de GitHub (para obtener SHA + datos de GitHub)
  const githubResult = await readJsonFromGithubOnly<T[]>(path);
  // 2. Leer de local (para obtener datos completos)
  const localResult = await readLocalJsonFile<T[]>(path);

  const githubData = githubResult.data;
  const localData = localResult.data;
  const sha = githubResult.sha;

  // Si ambos son null, no hay datos
  if (!githubData && !localData) {
    return { data: null, sha: null };
  }

  // Si solo hay de GitHub, usarlo
  if (githubData && !localData) {
    return { data: githubData, sha };
  }

  // Si solo hay local, usarlo (sin SHA, los writes fallarán)
  if (!githubData && localData) {
    return { data: localData, sha: null };
  }

  // Ambos existen: FUSIONAR
  const merged = [...githubData!];
  for (const localItem of localData!) {
    const localIdValue = (localItem as Record<string, unknown>)[idField];
    const existe = merged.some((m) => {
      const mIdValue = (m as Record<string, unknown>)[idField];
      // Comparar por idField, o por nombre/title si idField no existe
      if (localIdValue && mIdValue) {
        return localIdValue === mIdValue;
      }
      // Fallback: comparar por campos comunes
      const localName = (localItem as Record<string, unknown>).nombre ||
        (localItem as Record<string, unknown>).title ||
        (localItem as Record<string, unknown>).album;
      const mName = (m as Record<string, unknown>).nombre ||
        (m as Record<string, unknown>).title ||
        (m as Record<string, unknown>).album;
      return localName && mName && localName === mName;
    });
    if (!existe) {
      merged.push(localItem);
    }
  }

  console.log(`[github.ts] readJsonForWrite ${path}: GitHub=${githubData!.length}, Local=${localData!.length}, Merged=${merged.length}`);
  return { data: merged, sha };
}

/**
 * Lee un archivo JSON SOLO desde GitHub API (ignora fallbacks locales).
 * Útil cuando necesitas el SHA real de GitHub para hacer un write,
 * incluso si readJsonFile devolvió datos del archivo local.
 *
 * @param path - Ruta del archivo dentro del repo
 */
export async function readJsonFromGithubOnly<T>(path: string): Promise<{ data: T | null; sha: string | null }> {
  const token = getGithubToken();
  if (!token) {
    return { data: null, sha: null };
  }

  try {
    const url = `${API_BASE}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}?ref=${GITHUB_CONFIG.branch}`;
    const response = await fetch(url, {
      headers: githubHeaders(token),
      method: "GET",
    });

    if (response.status === 404) {
      return { data: null, sha: null };
    }

    if (!response.ok) {
      return { data: null, sha: null };
    }

    const fileData = await response.json();
    const content = Buffer.from(fileData.content, "base64").toString("utf-8");
    const parsed = JSON.parse(content) as T;
    return { data: parsed, sha: fileData.sha as string };
  } catch {
    return { data: null, sha: null };
  }
}

/**
 * Lee un archivo JSON desde el sistema de archivos local (public/).
 * Intenta múltiples rutas posibles (para compatibilidad con Vercel standalone).
 */
async function readLocalJsonFile<T>(path: string): Promise<{ data: T | null; sha: string | null }> {
  const fs = await import("fs/promises");
  const pathModule = await import("path");

  // Normalizar el path: si ya empieza con "public/", no duplicar
  const cleanPath = path.replace(/^public\//, "");

  // Múltiples rutas posibles (Vercel standalone puede tener diferentes estructuras)
  const possiblePaths = [
    `${process.cwd()}/public/${cleanPath}`,
    `${process.cwd()}/./public/${cleanPath}`,
    pathModule.join(process.cwd(), "public", cleanPath),
    // También probar con el path tal como viene (por si incluye public/)
    `${process.cwd()}/${path}`,
  ];

  for (const localPath of possiblePaths) {
    try {
      const content = await fs.readFile(localPath, "utf-8");
      const parsed = JSON.parse(content) as T;
      return { data: parsed, sha: null };
    } catch {
      // Intentar siguiente ruta
    }
  }

  return { data: null, sha: null };
}

/**
 * Lee un archivo JSON desde la URL estática (Vercel sirve public/ en /).
 * Este es el fallback más confiable en producción.
 */
async function readStaticJsonFile<T>(path: string): Promise<{ data: T | null; sha: string | null }> {
  try {
    // Construir URL base según el entorno
    let baseUrl: string;
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NODE_ENV === "production") {
      baseUrl = `https://${process.env.HOST || "localhost"}`;
    } else {
      baseUrl = "http://localhost:3000";
    }

    // Vercel sirve public/ en la raíz, así que quitar "public/" del path
    const cleanPath = path.replace(/^public\//, "");
    const url = `${baseUrl}/${cleanPath}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[github.ts] Fetch estático falló: ${url} (HTTP ${response.status})`);
      return { data: null, sha: null };
    }

    const content = await response.text();
    const parsed = JSON.parse(content) as T;
    return { data: parsed, sha: null };
  } catch (error) {
    console.warn(`[github.ts] Fetch estático error:`, error instanceof Error ? error.message : error);
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
