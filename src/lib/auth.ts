import { timingSafeEqual } from "crypto";
import type { ModuleKey } from "./types";

/**
 * Sistema de autenticación por claves
 * ===========================================
 * En vez de usuarios con login/contraseña tradicional, usamos CLAVES POR MÓDULO.
 * Cada clave da permiso solo sobre un módulo (profesores, eventos, etc.)
 * Hay una clave "admin" que tiene acceso a todos los módulos.
 *
 * 📚 Concepto: Variable de entorno
 * Las claves viven en variables de entorno (process.env), NO en el código.
 * - En desarrollo local: se definen en un archivo .env.local (que NO se sube a git)
 * - En producción (Vercel): se configuran en el panel web de Vercel
 * Cambiar una clave = cambiar la variable en Vercel + redeploy. No tocas código.
 *
 * 📚 Concepto: timingSafeEqual
 * Comparamos las claves con timingSafeEqual (no con ===) para evitar ataques de
 * "timing attack". Un atacante que mida milisegundos de respuesta podría adivinar
 * una contraseña carácter por carácter si usamos ===. timingSafeEqual tarda lo
 * mismo sin importar dónde esté la diferencia. Es una buena práctica de seguridad.
 */

/** Estructura de las claves almacenadas en variables de entorno */
interface AccessKeysConfig {
  admin: string;
  profesores: string;
  eventos: string;
  grupos: string;
  noticias: string;
  clubes: string;
  galeria: string;
}

/**
 * Lee las claves desde la variable de entorno ACCESS_KEYS.
 * El formato esperado es un JSON string:
 * {"admin":"xxx","profesores":"yyy",...}
 *
 * Si no está definida o es inválida, usa valores por defecto (solo para desarrollo).
 * En producción, SIEMPRE debe estar definida en Vercel.
 */
function loadAccessKeys(): AccessKeysConfig {
  const raw = process.env.ACCESS_KEYS;

  if (!raw) {
    // En desarrollo, si no hay variable de entorno, usamos claves por defecto.
    // Esto NUNCA debe pasar en producción.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ACCESS_KEYS no está configurada en producción. " +
          "Configúrala en Vercel → Settings → Environment Variables."
      );
    }
    console.warn(
      "⚠️  ACCESS_KEYS no configurada. Usando claves por defecto (solo desarrollo)."
    );
    return {
      admin: "admin2025",
      profesores: "prof-aefn-2025",
      eventos: "eventos-aefn-2025",
      grupos: "grupos-aefn-2025",
      noticias: "noticias-aefn-2025",
      clubes: "clubes-aefn-2025",
      galeria: "galeria-aefn-2025",
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed as AccessKeysConfig;
  } catch {
    throw new Error(
      "ACCESS_KEYS tiene formato inválido. Debe ser un JSON válido: " +
        '{"admin":"...","profesores":"..."}'
    );
  }
}

/**
 * Compara dos strings de forma segura (timing-safe).
 * Evita ataques de timing attack.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // Si tienen distinta longitud, timingSafeEqual fallaría. Comparamos igual.
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifica una clave y devuelve la lista de módulos a los que da acceso.
 *
 * @param key - La clave que envía el usuario
 * @returns Objeto con `valid` (bool) y `modules` (array de ModuleKey)
 *
 * Lógica:
 * - Si la clave es la de "admin" → tiene acceso a TODOS los módulos
 * - Si la clave corresponde a un módulo específico → solo ese módulo
 * - Si no coincide con ninguna → inválida
 */
export function verifyKey(key: string): {
  valid: boolean;
  modules: ModuleKey[];
} {
  if (!key || typeof key !== "string") {
    return { valid: false, modules: [] };
  }

  const keys = loadAccessKeys();

  // 1. ¿Es la clave de admin?
  if (safeCompare(key, keys.admin)) {
    return {
      valid: true,
      modules: ["profesores", "eventos", "grupos", "noticias", "clubes", "galeria"],
    };
  }

  // 2. ¿Es la clave de un módulo específico?
  // Iteramos sobre cada módulo y comparamos su clave.
  const moduleKeys: ModuleKey[] = [
    "profesores",
    "eventos",
    "grupos",
    "noticias",
    "clubes",
    "galeria",
  ];

  for (const mk of moduleKeys) {
    if (safeCompare(key, keys[mk])) {
      return { valid: true, modules: [mk] };
    }
  }

  // 3. No coincide con ninguna
  return { valid: false, modules: [] };
}

/**
 * Verifica si una clave tiene permiso sobre un módulo específico.
 * Útil para validar antes de una operación de escritura.
 */
export function hasPermission(key: string, module: ModuleKey): boolean {
  const { valid, modules } = verifyKey(key);
  return valid && modules.includes(module);
}

/**
 * Extrae la clave del header Authorization de una petición HTTP.
 * El formato esperado es: "Bearer <clave>"
 * o simplemente: "<clave>"
 */
export function extractKeyFromRequest(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth) return null;

  // Quitar prefijo "Bearer " si existe
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return auth.trim();
}
