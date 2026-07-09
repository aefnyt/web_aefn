import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile, slugify, readJsonForWrite } from "@/lib/github";
import { hasPermission, extractKeyFromRequest } from "@/lib/auth";
import { MODULES } from "@/lib/config";
import type { Evento } from "@/lib/types";

/**
 * API CRUD para Eventos
 * ===========================================
 * Endpoints:
 * - GET    /api/eventos       → listar todos los eventos
 * - POST   /api/eventos       → crear un evento nuevo
 * - PUT    /api/eventos       → actualizar un evento existente
 * - DELETE /api/eventos       → eliminar un evento
 *
 * Sigue el mismo patrón que /api/profesores pero para el módulo "eventos".
 * El JSON de eventos vive en data/events.json (definido en config.ts).
 *
 * 📚 Concepto: ID autogenerado para eventos
 * El ID se arma combinando:
 *   "evento-" + slugify(titulo) + primeros 10 chars de la fecha
 * Ej: "evento-asamblea-general-aefn-2025-09-02"
 * Esto hace que el ID sea legible y único para cada combinación título+fecha.
 */

const MODULE_KEY = "eventos" as const;
const JSON_PATH = MODULES[MODULE_KEY].jsonPath;

/**
 * Genera un ID único para un evento a partir del título y la fecha.
 * Formato: "evento-{slug-titulo}-{primeros-10-chars-de-fecha}"
 * Ej: "evento-asamblea-general-aefn-2025-09-02"
 */
function generateEventId(titulo: string, fecha: string): string {
  const slug = slugify(titulo);
  // fecha viene como "2025-09-02T10:00:00", tomamos los primeros 10 chars: "2025-09-02"
  const fechaCorta = (fecha || "").slice(0, 10);
  return `evento-${slug}-${fechaCorta}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/**
 * GET /api/eventos
 * Lista todos los eventos. NO requiere autenticación (es lectura pública).
 */
export async function GET() {
  try {
    const { data, sha } = await readJsonFile<Evento[]>(JSON_PATH);
    return NextResponse.json({
      data: data ?? [],
      sha,
    });
  } catch (error) {
    console.error("[api/eventos GET] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al leer eventos", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/eventos
 * Crea un evento nuevo. Requiere clave con permiso "eventos" o "admin".
 *
 * Body: { evento: Evento } (sin id, se autogenera)
 * Response: { success: true, evento, commitSha }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar eventos." },
        { status: 403 }
      );
    }

    // 2. Leer body
    const body = await request.json();
    const nuevoEvento: Evento = body.evento;

    if (!nuevoEvento || !nuevoEvento.titulo || !nuevoEvento.fecha) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: titulo, fecha." },
        { status: 400 }
      );
    }

    // 3. Leer JSON actual
    const { data: eventos, sha } = await readJsonForWrite<Evento[]>(JSON_PATH, "id");
    const lista = eventos ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (eventos === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    // 4. Generar ID único (slug del título + primeros 10 chars de la fecha)
    const baseId = generateEventId(nuevoEvento.titulo, nuevoEvento.fecha);
    let id = baseId;
    let suffix = 2;
    while (lista.some((e) => e.id === id)) {
      id = `${baseId}-${suffix}`;
      suffix++;
    }
    nuevoEvento.id = id;

    // 5. Asegurar campos por defecto
    if (typeof nuevoEvento.descripcion !== "string") nuevoEvento.descripcion = "";
    if (typeof nuevoEvento.ubicacion !== "string") nuevoEvento.ubicacion = "";
    if (typeof nuevoEvento.tipo !== "string") nuevoEvento.tipo = "otro";
    if (typeof nuevoEvento.estado !== "string") nuevoEvento.estado = "proximo";
    if (typeof nuevoEvento.link !== "string") nuevoEvento.link = "";

    // 6. Agregar al final
    lista.push(nuevoEvento);

    // 7. Guardar en GitHub (genera commit)
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Add evento: ${nuevoEvento.titulo}`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      evento: nuevoEvento,
      commitSha: result.commitSha,
      message: `Evento "${nuevoEvento.titulo}" creado correctamente.`,
    });
  } catch (error) {
    console.error("[api/eventos POST] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear evento", detail: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/eventos
 * Actualiza un evento existente. Requiere permiso.
 *
 * Body: { id: string, evento: Evento }
 */
export async function PUT(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar eventos." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, evento } = body as { id: string; evento: Evento };

    if (!id || !evento) {
      return NextResponse.json(
        { error: "Faltan campos: id, evento." },
        { status: 400 }
      );
    }

    const { data: eventos, sha } = await readJsonForWrite<Evento[]>(JSON_PATH, "id");
    const lista = eventos ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (eventos === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((e) => e.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró evento con id "${id}".` },
        { status: 404 }
      );
    }

    // Mantener el id (no se puede cambiar desde el formulario)
    evento.id = id;

    lista[index] = evento;

    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Update evento: ${evento.titulo}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      evento,
      commitSha: result.commitSha,
      message: `Evento "${evento.titulo}" actualizado correctamente.`,
    });
  } catch (error) {
    console.error("[api/eventos PUT] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al actualizar evento", detail: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/eventos
 * Elimina un evento. Requiere permiso.
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar eventos." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "Falta el campo: id." }, { status: 400 });
    }

    const { data: eventos, sha } = await readJsonForWrite<Evento[]>(JSON_PATH, "id");
    const lista = eventos ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (eventos === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((e) => e.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró evento con id "${id}".` },
        { status: 404 }
      );
    }

    const eventoEliminado = lista[index];
    lista.splice(index, 1);

    // Guardar JSON actualizado
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Delete evento: ${eventoEliminado.titulo}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Evento "${eventoEliminado.titulo}" eliminado correctamente.`,
    });
  } catch (error) {
    console.error("[api/eventos DELETE] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al eliminar evento", detail: message },
      { status: 500 }
    );
  }
}
