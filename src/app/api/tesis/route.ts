import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile, readJsonForWrite } from "@/lib/github";
import { hasPermission, extractKeyFromRequest } from "@/lib/auth";
import type { Tesis } from "@/lib/types";

/**
 * API CRUD para Tesis
 * ===========================================
 * Endpoints:
 * - GET    /api/tesis       → listar todas las tesis
 * - POST   /api/tesis       → crear una tesis nueva
 * - PUT    /api/tesis       → actualizar una tesis existente
 * - DELETE /api/tesis       → eliminar una tesis
 *
 * Igual que /api/papers: el JSON original NO tiene campo `id`, usamos `title`
 * como identificador natural. Al editar mandamos `oldTitle` para encontrar
 * el registro original (por si el usuario cambió el título en el formulario).
 *
 * Mismo módulo de permiso que /api/grupos ("grupos" o "admin").
 * Ruta del JSON: "data/theses.json".
 */

const MODULE_KEY = "grupos" as const;
const JSON_PATH = "data/theses.json";

/**
 * GET /api/tesis
 * Lista todas las tesis. NO requiere autenticación (lectura pública).
 */
export async function GET() {
  try {
    const { data, sha } = await readJsonFile<Tesis[]>(JSON_PATH);
    return NextResponse.json({
      data: data ?? [],
      sha,
    });
  } catch (error) {
    console.error("[api/tesis GET] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al leer tesis", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tesis
 * Crea una tesis nueva. Requiere clave con permiso "grupos" o "admin".
 *
 * Body: { tesis: Tesis }
 * Response: { success: true, tesis, commitSha }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar tesis." },
        { status: 403 }
      );
    }

    // 2. Leer body
    const body = await request.json();
    const nuevaTesis: Tesis = body.tesis;

    if (
      !nuevaTesis ||
      !nuevaTesis.title ||
      !nuevaTesis.author ||
      typeof nuevaTesis.year !== "number"
    ) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: title, author, year." },
        { status: 400 }
      );
    }

    // 3. Leer JSON actual
    const { data: tesis, sha } = await readJsonForWrite<Tesis[]>(JSON_PATH, "title");
    const lista = tesis ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (tesis === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    // 4. Validar que no exista una tesis con el mismo título
    if (lista.some((t) => t.title === nuevaTesis.title)) {
      return NextResponse.json(
        { error: `Ya existe una tesis con el título "${nuevaTesis.title}".` },
        { status: 409 }
      );
    }

    // 5. Asegurar estado por defecto
    if (!nuevaTesis.status) nuevaTesis.status = "en curso";

    // 6. Agregar al final
    lista.push(nuevaTesis);

    // 7. Guardar en GitHub (genera commit)
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Add tesis: ${nuevaTesis.title}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tesis: nuevaTesis,
      commitSha: result.commitSha,
      message: `Tesis "${nuevaTesis.title}" creada correctamente.`,
    });
  } catch (error) {
    console.error("[api/tesis POST] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear tesis", detail: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tesis
 * Actualiza una tesis existente. Requiere permiso.
 *
 * Body: { oldTitle: string, tesis: Tesis }
 * - `oldTitle`: título original (para encontrar el registro)
 * - `tesis`: nuevos datos (puede tener un title diferente)
 */
export async function PUT(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar tesis." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { oldTitle, tesis } = body as { oldTitle: string; tesis: Tesis };

    if (!oldTitle || !tesis || !tesis.title) {
      return NextResponse.json(
        { error: "Faltan campos: oldTitle, tesis.title." },
        { status: 400 }
      );
    }

    const { data: tesisList, sha } = await readJsonForWrite<Tesis[]>(JSON_PATH, "title");
    const lista = tesisList ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (tesisList === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((t) => t.title === oldTitle);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró tesis con título "${oldTitle}".` },
        { status: 404 }
      );
    }

    // Si el título cambió, validar que el nuevo título no colisione con otro
    if (tesis.title !== oldTitle && lista.some((t) => t.title === tesis.title)) {
      return NextResponse.json(
        { error: `Ya existe una tesis con el título "${tesis.title}".` },
        { status: 409 }
      );
    }

    // Asegurar estado por defecto
    if (!tesis.status) tesis.status = "en curso";

    lista[index] = tesis;

    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Update tesis: ${tesis.title}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tesis,
      commitSha: result.commitSha,
      message: `Tesis "${tesis.title}" actualizada correctamente.`,
    });
  } catch (error) {
    console.error("[api/tesis PUT] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al actualizar tesis", detail: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tesis
 * Elimina una tesis. Requiere permiso.
 *
 * Body: { title: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar tesis." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title } = body as { title: string };

    if (!title) {
      return NextResponse.json({ error: "Falta el campo: title." }, { status: 400 });
    }

    const { data: tesisList, sha } = await readJsonForWrite<Tesis[]>(JSON_PATH, "title");
    const lista = tesisList ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (tesisList === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((t) => t.title === title);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró tesis con título "${title}".` },
        { status: 404 }
      );
    }

    const tesisEliminada = lista[index];
    lista.splice(index, 1);

    // Guardar JSON actualizado
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Delete tesis: ${tesisEliminada.title}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Tesis "${tesisEliminada.title}" eliminada correctamente.`,
    });
  } catch (error) {
    console.error("[api/tesis DELETE] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al eliminar tesis", detail: message },
      { status: 500 }
    );
  }
}
