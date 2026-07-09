import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile, readJsonForWrite } from "@/lib/github";
import { hasPermission, extractKeyFromRequest } from "@/lib/auth";
import type { Paper } from "@/lib/types";

/**
 * API CRUD para Papers (publicaciones científicas)
 * ===========================================
 * Endpoints:
 * - GET    /api/papers       → listar todos los papers
 * - POST   /api/papers       → crear un paper nuevo
 * - PUT    /api/papers       → actualizar un paper existente
 * - DELETE /api/papers       → eliminar un paper
 *
 * 📚 Concepto: Identificador natural vs ID autogenerado
 * A diferencia de profesores/clubes/grupos (que generan un `id` único), los
 * papers en el JSON original NO tienen un campo `id`. Usamos el `title` como
 * identificador natural (es único dentro del JSON). Al editar, mandamos el
 * título ORIGINAL (`oldTitle`) para encontrar el registro a reemplazar,
 * porque el usuario podría haber cambiado el título en el formulario.
 *
 * Mismo módulo de permiso que /api/grupos ("grupos" o "admin").
 * Ruta del JSON: "data/papers.json".
 */

const MODULE_KEY = "grupos" as const;
const JSON_PATH = "data/papers.json";

/**
 * GET /api/papers
 * Lista todos los papers. NO requiere autenticación (lectura pública).
 */
export async function GET() {
  try {
    const { data, sha } = await readJsonFile<Paper[]>(JSON_PATH);
    return NextResponse.json({
      data: data ?? [],
      sha,
    });
  } catch (error) {
    console.error("[api/papers GET] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al leer papers", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/papers
 * Crea un paper nuevo. Requiere clave con permiso "grupos" o "admin".
 *
 * Body: { paper: Paper }
 * Response: { success: true, paper, commitSha }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar papers." },
        { status: 403 }
      );
    }

    // 2. Leer body
    const body = await request.json();
    const nuevoPaper: Paper = body.paper;

    if (!nuevoPaper || !nuevoPaper.title || typeof nuevoPaper.year !== "number") {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: title, year." },
        { status: 400 }
      );
    }

    // 3. Leer JSON actual
    const { data: papers, sha } = await readJsonForWrite<Paper[]>(JSON_PATH, "title");
    const lista = papers ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (papers === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    // 4. Validar que no exista un paper con el mismo título
    if (lista.some((p) => p.title === nuevoPaper.title)) {
      return NextResponse.json(
        { error: `Ya existe un paper con el título "${nuevoPaper.title}".` },
        { status: 409 }
      );
    }

    // 5. Asegurar campos por defecto
    if (!Array.isArray(nuevoPaper.authors)) nuevoPaper.authors = [];
    if (typeof nuevoPaper.published !== "boolean") nuevoPaper.published = true;

    // 6. Agregar al final
    lista.push(nuevoPaper);

    // 7. Guardar en GitHub (genera commit)
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Add paper: ${nuevoPaper.title}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paper: nuevoPaper,
      commitSha: result.commitSha,
      message: `Paper "${nuevoPaper.title}" creado correctamente.`,
    });
  } catch (error) {
    console.error("[api/papers POST] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear paper", detail: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/papers
 * Actualiza un paper existente. Requiere permiso.
 *
 * Body: { oldTitle: string, paper: Paper }
 * - `oldTitle`: título original (para encontrar el registro)
 * - `paper`: nuevos datos del paper (puede tener un title diferente)
 */
export async function PUT(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar papers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { oldTitle, paper } = body as { oldTitle: string; paper: Paper };

    if (!oldTitle || !paper || !paper.title) {
      return NextResponse.json(
        { error: "Faltan campos: oldTitle, paper.title." },
        { status: 400 }
      );
    }

    const { data: papers, sha } = await readJsonForWrite<Paper[]>(JSON_PATH, "title");
    const lista = papers ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (papers === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((p) => p.title === oldTitle);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró paper con título "${oldTitle}".` },
        { status: 404 }
      );
    }

    // Si el título cambió, validar que el nuevo título no colisione con otro
    if (paper.title !== oldTitle && lista.some((p) => p.title === paper.title)) {
      return NextResponse.json(
        { error: `Ya existe un paper con el título "${paper.title}".` },
        { status: 409 }
      );
    }

    // Asegurar arrays/valores por defecto
    if (!Array.isArray(paper.authors)) paper.authors = [];
    if (typeof paper.published !== "boolean") paper.published = true;

    lista[index] = paper;

    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Update paper: ${paper.title}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paper,
      commitSha: result.commitSha,
      message: `Paper "${paper.title}" actualizado correctamente.`,
    });
  } catch (error) {
    console.error("[api/papers PUT] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al actualizar paper", detail: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/papers
 * Elimina un paper. Requiere permiso.
 *
 * Body: { title: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar papers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title } = body as { title: string };

    if (!title) {
      return NextResponse.json({ error: "Falta el campo: title." }, { status: 400 });
    }

    const { data: papers, sha } = await readJsonForWrite<Paper[]>(JSON_PATH, "title");
    const lista = papers ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (papers === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((p) => p.title === title);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró paper con título "${title}".` },
        { status: 404 }
      );
    }

    const paperEliminado = lista[index];
    lista.splice(index, 1);

    // Guardar JSON actualizado
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Delete paper: ${paperEliminado.title}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Paper "${paperEliminado.title}" eliminado correctamente.`,
    });
  } catch (error) {
    console.error("[api/papers DELETE] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al eliminar paper", detail: message },
      { status: 500 }
    );
  }
}
