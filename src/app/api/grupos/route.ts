import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile, slugify, readJsonForWrite } from "@/lib/github";
import { hasPermission, extractKeyFromRequest } from "@/lib/auth";
import { MODULES } from "@/lib/config";
import type { GrupoInvestigacion } from "@/lib/types";

/**
 * API CRUD para Grupos de Investigación
 * ===========================================
 * Endpoints:
 * - GET    /api/grupos       → listar todos los grupos
 * - POST   /api/grupos       → crear un grupo nuevo
 * - PUT    /api/grupos       → actualizar un grupo existente
 * - DELETE /api/grupos       → eliminar un grupo
 *
 * Módulo "grupos": también cubre papers y tesis (mismo permiso).
 * Cada uno tiene su propio endpoint (/api/papers, /api/tesis) pero comparten
 * la clave de acceso "grupos".
 *
 * Sigue el mismo patrón que /api/profesores y /api/clubes.
 * ID autogenerado = slugify(title) + sufijo numérico si colisiona.
 */

const MODULE_KEY = "grupos" as const;
const JSON_PATH = MODULES[MODULE_KEY].jsonPath;

/**
 * GET /api/grupos
 * Lista todos los grupos de investigación. NO requiere autenticación (lectura pública).
 */
export async function GET() {
  try {
    const { data, sha } = await readJsonFile<GrupoInvestigacion[]>(JSON_PATH);
    return NextResponse.json({
      data: data ?? [],
      sha,
    });
  } catch (error) {
    console.error("[api/grupos GET] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al leer grupos de investigación", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/grupos
 * Crea un grupo nuevo. Requiere clave con permiso "grupos" o "admin".
 *
 * Body: { grupo: GrupoInvestigacion } (sin id, se autogenera)
 * Response: { success: true, grupo, commitSha }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar grupos de investigación." },
        { status: 403 }
      );
    }

    // 2. Leer body
    const body = await request.json();
    const nuevoGrupo: GrupoInvestigacion = body.grupo;

    if (!nuevoGrupo || !nuevoGrupo.title) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: title." },
        { status: 400 }
      );
    }

    // 3. Leer JSON actual
    const { data: grupos, sha } = await readJsonForWrite<GrupoInvestigacion[]>(JSON_PATH, "id");
    const lista = grupos ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (grupos === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    // 4. Generar ID único (slug del título + sufijo si hay colisión)
    const baseId = slugify(nuevoGrupo.title);
    let id = baseId;
    let suffix = 2;
    while (lista.some((g) => g.id === id)) {
      id = `${baseId}-${suffix}`;
      suffix++;
    }
    nuevoGrupo.id = id;

    // 5. Asegurar slug y arrays por defecto
    if (!nuevoGrupo.slug) nuevoGrupo.slug = id;
    if (!Array.isArray(nuevoGrupo.participants)) nuevoGrupo.participants = [];
    if (!Array.isArray(nuevoGrupo.projects)) nuevoGrupo.projects = [];

    // 6. Agregar al final
    lista.push(nuevoGrupo);

    // 7. Guardar en GitHub (genera commit)
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Add grupo: ${nuevoGrupo.title}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      grupo: nuevoGrupo,
      commitSha: result.commitSha,
      message: `Grupo "${nuevoGrupo.title}" creado correctamente.`,
    });
  } catch (error) {
    console.error("[api/grupos POST] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear grupo", detail: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/grupos
 * Actualiza un grupo existente. Requiere permiso.
 *
 * Body: { id: string, grupo: GrupoInvestigacion }
 */
export async function PUT(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar grupos de investigación." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, grupo } = body as { id: string; grupo: GrupoInvestigacion };

    if (!id || !grupo) {
      return NextResponse.json(
        { error: "Faltan campos: id, grupo." },
        { status: 400 }
      );
    }

    const { data: grupos, sha } = await readJsonForWrite<GrupoInvestigacion[]>(JSON_PATH, "id");
    const lista = grupos ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (grupos === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((g) => g.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró grupo con id "${id}".` },
        { status: 404 }
      );
    }

    // Mantener el id y asegurar arrays definidos
    grupo.id = id;
    if (!grupo.slug) grupo.slug = id;
    if (!Array.isArray(grupo.participants)) grupo.participants = [];
    if (!Array.isArray(grupo.projects)) grupo.projects = [];

    lista[index] = grupo;

    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Update grupo: ${grupo.title}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      grupo,
      commitSha: result.commitSha,
      message: `Grupo "${grupo.title}" actualizado correctamente.`,
    });
  } catch (error) {
    console.error("[api/grupos PUT] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al actualizar grupo", detail: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/grupos
 * Elimina un grupo. Requiere permiso.
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar grupos de investigación." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "Falta el campo: id." }, { status: 400 });
    }

    const { data: grupos, sha } = await readJsonForWrite<GrupoInvestigacion[]>(JSON_PATH, "id");
    const lista = grupos ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (grupos === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((g) => g.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró grupo con id "${id}".` },
        { status: 404 }
      );
    }

    const grupoEliminado = lista[index];
    lista.splice(index, 1);

    // Guardar JSON actualizado
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Delete grupo: ${grupoEliminado.title}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Grupo "${grupoEliminado.title}" eliminado correctamente.`,
    });
  } catch (error) {
    console.error("[api/grupos DELETE] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al eliminar grupo", detail: message },
      { status: 500 }
    );
  }
}
