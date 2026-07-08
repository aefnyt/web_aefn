import { NextRequest, NextResponse } from "next/server";
import { readJsonFile } from "@/lib/github";
import { MODULES } from "@/lib/config";
import type { ModuleKey } from "@/lib/types";

/**
 * GET /api/data/[modulo]
 * ===========================================
 * Lee el archivo JSON del módulo solicitado directamente desde GitHub.
 * El frontend usa esta ruta para obtener datos siempre frescos.
 *
 * Ejemplos:
 *   GET /api/data/profesores → lee data/profesores.json
 *   GET /api/data/noticias   → lee data/noticias.json
 *   GET /api/data/eventos    → lee data/events.json
 *
 * Response 200:
 *   { "module": "profesores", "data": [...], "sha": "abc123" }
 *
 * Response 404:
 *   { "error": "Módulo no encontrado" }
 *
 * 📚 Concepto: Rutas dinámicas en Next.js
 * La carpeta [modulo] (con corchetes) es una "ruta dinámica": captura cualquier
 * valor de la URL y lo pone disponible en params.modulo. Así, un solo archivo
 * maneja /api/data/profesores, /api/data/noticias, etc., sin duplicar código.
 *
 * 📚 Concepto: ¿Por qué leemos de GitHub en vez de public/?
 * Después de un commit, los archivos en public/ pueden tardar ~30s en
 * actualizarse en Vercel. Pero raw.githubusercontent.com se actualiza al
 * instante. Por eso, para DATOS EDITABLES, leemos siempre de GitHub vía esta
 * ruta. Para archivos estáticos (CSS, JS), usamos public/ normalmente.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modulo: string }> }
) {
  try {
    const { modulo } = await params;

    // Validar que el módulo exista
    if (!modulo || !(modulo in MODULES)) {
      return NextResponse.json(
        {
          error: `Módulo no encontrado: ${modulo}`,
          available: Object.keys(MODULES),
        },
        { status: 404 }
      );
    }

    const moduleConfig = MODULES[modulo as ModuleKey];

    // Leer el JSON desde GitHub
    const { data, sha } = await readJsonFile<unknown>(moduleConfig.jsonPath);

    return NextResponse.json({
      module: modulo,
      data: data ?? [],
      sha: sha,
      path: moduleConfig.jsonPath,
    });
  } catch (error) {
    console.error("[api/data] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al leer datos", detail: message },
      { status: 500 }
    );
  }
}
