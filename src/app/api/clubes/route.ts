import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile, slugify, readJsonForWrite } from "@/lib/github";
import { hasPermission, extractKeyFromRequest } from "@/lib/auth";
import { MODULES } from "@/lib/config";
import type { Club } from "@/lib/types";

/**
 * API CRUD para Clubes
 * ===========================================
 * Endpoints:
 * - GET    /api/clubes       → listar todos los clubes
 * - POST   /api/clubes       → crear un club nuevo
 * - PUT    /api/clubes       → actualizar un club existente
 * - DELETE /api/clubes       → eliminar un club
 *
 * Sigue el mismo patrón que /api/profesores y /api/eventos:
 * la URL identifica el "recurso" (clubes) y el verbo HTTP indica la acción.
 *
 * 📚 Concepto: ID autogenerado legible
 * Para los clubes usamos como ID el slug del nombre (ej: "Club de Astronomía"
 * → "club-de-astronomia"). Si ya existe, añadimos un sufijo numérico (-2, -3...).
 * Esto produce URLs más amigables y facilita buscar un club en el JSON.
 */

const MODULE_KEY = "clubes" as const;
const JSON_PATH = MODULES[MODULE_KEY].jsonPath;

/**
 * GET /api/clubes
 * Lista todos los clubes. NO requiere autenticación (es lectura pública).
 */
export async function GET() {
  try {
    const { data, sha } = await readJsonFile<Club[]>(JSON_PATH);
    return NextResponse.json({
      data: data ?? [],
      sha,
    });
  } catch (error) {
    console.error("[api/clubes GET] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al leer clubes", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clubes
 * Crea un club nuevo. Requiere clave con permiso "clubes" o "admin".
 *
 * Body: { club: Club } (sin id, se autogenera)
 * Response: { success: true, club, commitSha }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar clubes." },
        { status: 403 }
      );
    }

    // 2. Leer body
    const body = await request.json();
    const nuevoClub: Club = body.club;

    if (!nuevoClub || !nuevoClub.nombre) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: nombre." },
        { status: 400 }
      );
    }

    // 3. Leer JSON actual
    const { data: clubes, sha } = await readJsonForWrite<Club[]>(JSON_PATH, "id");
    const lista = clubes ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (clubes === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    // 4. Generar ID único (slug del nombre + sufijo si hay colisión)
    const baseId = slugify(nuevoClub.nombre);
    let id = baseId;
    let suffix = 2;
    while (lista.some((c) => c.id === id)) {
      id = `${baseId}-${suffix}`;
      suffix++;
    }
    nuevoClub.id = id;

    // 5. Asegurar campos por defecto (arrays siempre definidos)
    if (!Array.isArray(nuevoClub.directiva)) nuevoClub.directiva = [];
    if (!Array.isArray(nuevoClub.actividades)) nuevoClub.actividades = [];

    // 6. Agregar al final
    lista.push(nuevoClub);

    // 7. Guardar en GitHub (genera commit)
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Add club: ${nuevoClub.nombre}`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      club: nuevoClub,
      commitSha: result.commitSha,
      message: `Club "${nuevoClub.nombre}" creado correctamente.`,
    });
  } catch (error) {
    console.error("[api/clubes POST] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear club", detail: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/clubes
 * Actualiza un club existente. Requiere permiso.
 *
 * Body: { id: string, club: Club }
 */
export async function PUT(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar clubes." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, club } = body as { id: string; club: Club };

    if (!id || !club) {
      return NextResponse.json(
        { error: "Faltan campos: id, club." },
        { status: 400 }
      );
    }

    const { data: clubes, sha } = await readJsonForWrite<Club[]>(JSON_PATH, "id");
    const lista = clubes ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (clubes === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró club con id "${id}".` },
        { status: 404 }
      );
    }

    // Mantener el id y asegurar arrays definidos
    club.id = id;
    if (!Array.isArray(club.directiva)) club.directiva = [];
    if (!Array.isArray(club.actividades)) club.actividades = [];

    lista[index] = club;

    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Update club: ${club.nombre}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      club,
      commitSha: result.commitSha,
      message: `Club "${club.nombre}" actualizado correctamente.`,
    });
  } catch (error) {
    console.error("[api/clubes PUT] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al actualizar club", detail: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clubes
 * Elimina un club. Requiere permiso.
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar clubes." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "Falta el campo: id." }, { status: 400 });
    }

    const { data: clubes, sha } = await readJsonForWrite<Club[]>(JSON_PATH, "id");
    const lista = clubes ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (clubes === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró club con id "${id}".` },
        { status: 404 }
      );
    }

    const clubEliminado = lista[index];
    lista.splice(index, 1);

    // Guardar JSON actualizado
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Delete club: ${clubEliminado.nombre}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Club "${clubEliminado.nombre}" eliminado correctamente.`,
    });
  } catch (error) {
    console.error("[api/clubes DELETE] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al eliminar club", detail: message },
      { status: 500 }
    );
  }
}
