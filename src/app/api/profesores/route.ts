import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile, slugify, readJsonForWrite } from "@/lib/github";
import { hasPermission, extractKeyFromRequest } from "@/lib/auth";
import { MODULES } from "@/lib/config";
import type { Profesor } from "@/lib/types";

/**
 * API CRUD para Profesores
 * ===========================================
 * Endpoints:
 * - GET    /api/profesores       → listar todos los profesores
 * - POST   /api/profesores       → crear un profesor nuevo
 * - PUT    /api/profesores       → actualizar un profesor existente
 * - DELETE /api/profesores       → eliminar un profesor
 *
 * 📚 Concepto: Verbos HTTP
 * - GET: leer (no modifica nada)
 * - POST: crear algo nuevo
 * - PUT: actualizar algo existente
 * - DELETE: borrar algo
 * Usar el verbo correcto para cada acción es una buena práctica REST.
 *
 * 📚 Concepto: REST (Representational State Transfer)
 * Es un estilo de diseño de APIs donde la URL identifica un "recurso" (profesores)
 * y el verbo HTTP indica qué hacer con él. Es el estilo más usado en la web.
 */

const MODULE_KEY = "profesores" as const;
const JSON_PATH = MODULES[MODULE_KEY].jsonPath;

/**
 * GET /api/profesores
 * Lista todos los profesores. NO requiere autenticación (es lectura pública).
 */
export async function GET() {
  try {
    const { data, sha } = await readJsonFile<Profesor[]>(JSON_PATH);
    console.log(`[api/profesores GET] data length: ${data?.length ?? "null"}, sha: ${sha ? "yes" : "null"}`);
    return NextResponse.json({
      data: data ?? [],
      sha,
    });
  } catch (error) {
    console.error("[api/profesores GET] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al leer profesores", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profesores
 * Crea un profesor nuevo. Requiere clave con permiso "profesores" o "admin".
 *
 * Body: { profesor: Profesor } (sin id, se autogenera)
 * Response: { success: true, profesor, commitSha }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar profesores." },
        { status: 403 }
      );
    }

    // 2. Leer body
    const body = await request.json();
    const nuevoProfesor: Profesor = body.profesor;

    if (!nuevoProfesor || !nuevoProfesor.nombre || !nuevoProfesor.titulo) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: nombre, titulo." },
        { status: 400 }
      );
    }

    // 3. Leer JSON actual
    const { data: profesores, sha } = await readJsonForWrite<Profesor[]>(JSON_PATH, "id");
    const lista = profesores ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (profesores === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    // SAFEGUARD: Si la lectura falló (data es null), NO continuar con el write
    // porque sobrescribiría el archivo con solo el profesor nuevo, borrando los existentes.
    if (profesores === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los profesores existentes. Por favor, recarga la página e inténtalo de nuevo. Si el problema persiste, verifica que el GITHUB_TOKEN esté configurado correctamente en Vercel.",
        },
        { status: 500 }
      );
    }

    // 4. Generar ID único (slug del nombre + sufijo si hay colisión)
    const baseId = slugify(nuevoProfesor.nombre);
    let id = baseId;
    let suffix = 2;
    while (lista.some((p) => p.id === id)) {
      id = `${baseId}-${suffix}`;
      suffix++;
    }
    nuevoProfesor.id = id;

    // 5. Asegurar campos por defecto
    if (!Array.isArray(nuevoProfesor.area)) nuevoProfesor.area = [];
    if (!Array.isArray(nuevoProfesor.areas_investigacion)) nuevoProfesor.areas_investigacion = [];
    if (typeof nuevoProfesor.foto !== "string") nuevoProfesor.foto = "";

    // 6. Agregar al final
    lista.push(nuevoProfesor);

    // 7. Guardar en GitHub (genera commit)
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Add profesor: ${nuevoProfesor.nombre}`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profesor: nuevoProfesor,
      commitSha: result.commitSha,
      message: `Profesor "${nuevoProfesor.nombre}" creado correctamente.`,
    });
  } catch (error) {
    console.error("[api/profesores POST] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear profesor", detail: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profesores
 * Actualiza un profesor existente. Requiere permiso.
 *
 * Body: { id: string, profesor: Profesor }
 */
export async function PUT(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar profesores." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, profesor } = body as { id: string; profesor: Profesor };

    if (!id || !profesor) {
      return NextResponse.json(
        { error: "Faltan campos: id, profesor." },
        { status: 400 }
      );
    }

    const { data: profesores, sha } = await readJsonForWrite<Profesor[]>(JSON_PATH, "id");
    const lista = profesores ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (profesores === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    // Buscar por id, o por nombre si no tiene id (profesores originales sin id)
    let index = lista.findIndex((p) => p.id === id);
    if (index === -1) {
      // Fallback: buscar por nombre (para profesores originales que no tienen id)
      // El id temporal tiene formato "temp-N-{slug-del-nombre}"
      // Extraer el nombre del id temporal
      const tempMatch = id.match(/^temp-\d+-(.+)$/);
      if (tempMatch) {
        const slugFromId = tempMatch[1];
        index = lista.findIndex((p) => {
          if (p.id) return false; // ya tiene id real, no matchear
          const pSlug = slugify(p.nombre);
          return pSlug === slugFromId || pSlug.startsWith(slugFromId.slice(0, 20));
        });
      }
    }
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró profesor con id "${id}".` },
        { status: 404 }
      );
    }

    // Asignar id real (si el profesor original no tenía, ahora tendrá uno permanente)
    profesor.id = id.startsWith("temp-") ? slugify(profesor.nombre) : id;
    if (!profesor.foto) profesor.foto = lista[index].foto;

    lista[index] = profesor;

    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Update profesor: ${profesor.nombre}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profesor,
      commitSha: result.commitSha,
      message: `Profesor "${profesor.nombre}" actualizado correctamente.`,
    });
  } catch (error) {
    console.error("[api/profesores PUT] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al actualizar profesor", detail: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profesores
 * Elimina un profesor. También elimina su foto si existe. Requiere permiso.
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar profesores." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "Falta el campo: id." }, { status: 400 });
    }

    const { data: profesores, sha } = await readJsonForWrite<Profesor[]>(JSON_PATH, "id");
    const lista = profesores ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (profesores === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    // Buscar por id, o por nombre si no tiene id (profesores originales sin id)
    let index = lista.findIndex((p) => p.id === id);
    if (index === -1) {
      const tempMatch = id.match(/^temp-\d+-(.+)$/);
      if (tempMatch) {
        const slugFromId = tempMatch[1];
        index = lista.findIndex((p) => {
          if (p.id) return false;
          const pSlug = slugify(p.nombre);
          return pSlug === slugFromId || pSlug.startsWith(slugFromId.slice(0, 20));
        });
      }
    }
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró profesor con id "${id}".` },
        { status: 404 }
      );
    }

    const profesorEliminado = lista[index];
    lista.splice(index, 1);

    // Guardar JSON actualizado
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Delete profesor: ${profesorEliminado.nombre}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    // Si el profesor tenía foto, intentar eliminarla del repo (best-effort)
    if (profesorEliminado.foto) {
      const { deleteFile } = await import("@/lib/github");
      await deleteFile(profesorEliminado.foto, `Delete photo: ${profesorEliminado.foto}`);
    }

    return NextResponse.json({
      success: true,
      message: `Profesor "${profesorEliminado.nombre}" eliminado correctamente.`,
    });
  } catch (error) {
    console.error("[api/profesores DELETE] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al eliminar profesor", detail: message },
      { status: 500 }
    );
  }
}
