import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile, slugify, readJsonForWrite } from "@/lib/github";
import { hasPermission, extractKeyFromRequest } from "@/lib/auth";
import { MODULES } from "@/lib/config";
import type { Noticia } from "@/lib/types";

/**
 * API CRUD para Noticias
 * ===========================================
 * Endpoints:
 * - GET    /api/noticias       → listar todas las noticias
 * - POST   /api/noticias       → crear una noticia nueva
 * - PUT    /api/noticias       → actualizar una noticia existente
 * - DELETE /api/noticias       → eliminar una noticia
 *
 * 📚 Concepto: Lógica de "noticia destacada"
 * Solo una noticia puede estar destacada a la vez. Si una noticia nueva se
 * marca como destacada, el backend automáticamente desmarca las demás.
 * Esto evita que el admin tenga que acordarse de desmarcar la anterior.
 */

const MODULE_KEY = "noticias" as const;
const JSON_PATH = MODULES[MODULE_KEY].jsonPath;

/**
 * GET /api/noticias
 * Lista todas las noticias. NO requiere autenticación.
 * Ordena por fecha descendente (más recientes primero).
 */
export async function GET() {
  try {
    const { data } = await readJsonFile<Noticia[]>(JSON_PATH);
    const noticias = data ?? [];

    // Ordenar por fecha descendente (más recientes primero)
    noticias.sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ data: noticias });
  } catch (error) {
    console.error("[api/noticias GET] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al leer noticias", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/noticias
 * Crea una noticia nueva. Requiere permiso "noticias" o "admin".
 *
 * Body: { noticia: Noticia }
 * Si noticia.destacada === true, desmarca las demás.
 */
export async function POST(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar noticias." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const nuevaNoticia: Noticia = body.noticia;

    // Validación
    if (!nuevaNoticia || !nuevaNoticia.titulo || !nuevaNoticia.contenido) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: titulo, contenido." },
        { status: 400 }
      );
    }

    const { data: noticias, sha } = await readJsonForWrite<Noticia[]>(JSON_PATH, "id");
    const lista = noticias ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (noticias === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    // Generar ID único
    const baseId = `${nuevaNoticia.fecha}-${slugify(nuevaNoticia.titulo)}`;
    let id = baseId;
    let suffix = 2;
    while (lista.some((n) => n.id === id)) {
      id = `${baseId}-${suffix}`;
      suffix++;
    }
    nuevaNoticia.id = id;

    // Campos por defecto
    const ahora = new Date().toISOString();
    nuevaNoticia.creadaEn = nuevaNoticia.creadaEn || ahora;
    nuevaNoticia.actualizadaEn = ahora;
    nuevaNoticia.destacada = nuevaNoticia.destacada ?? false;
    nuevaNoticia.publicada = nuevaNoticia.publicada ?? true;
    nuevaNoticia.etiquetas = nuevaNoticia.etiquetas || [];
    nuevaNoticia.autor = nuevaNoticia.autor || "AEFN";

    // Si la nueva noticia es destacada, desmarcar las demás
    if (nuevaNoticia.destacada) {
      lista.forEach((n) => {
        n.destacada = false;
      });
    }

    lista.push(nuevaNoticia);

    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Add noticia: ${nuevaNoticia.titulo}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      noticia: nuevaNoticia,
      commitSha: result.commitSha,
      message: `Noticia "${nuevaNoticia.titulo}" creada correctamente.`,
    });
  } catch (error) {
    console.error("[api/noticias POST] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear noticia", detail: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/noticias
 * Actualiza una noticia existente.
 *
 * Body: { id: string, noticia: Noticia }
 */
export async function PUT(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar noticias." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, noticia } = body as { id: string; noticia: Noticia };

    if (!id || !noticia) {
      return NextResponse.json(
        { error: "Faltan campos: id, noticia." },
        { status: 400 }
      );
    }

    const { data: noticias, sha } = await readJsonForWrite<Noticia[]>(JSON_PATH, "id");
    const lista = noticias ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (noticias === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((n) => n.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró noticia con id "${id}".` },
        { status: 404 }
      );
    }

    noticia.id = id;
    noticia.actualizadaEn = new Date().toISOString();
    // Mantener la imagen (se gestiona en endpoint separado)
    if (!noticia.imagen) noticia.imagen = lista[index].imagen;
    // Mantener creadaEn
    noticia.creadaEn = lista[index].creadaEn || noticia.creadaEn;

    // Si esta noticia se está marcando como destacada, desmarcar las demás
    if (noticia.destacada) {
      lista.forEach((n, i) => {
        if (i !== index) n.destacada = false;
      });
    }

    lista[index] = noticia;

    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Update noticia: ${noticia.titulo}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      noticia,
      commitSha: result.commitSha,
      message: `Noticia "${noticia.titulo}" actualizada correctamente.`,
    });
  } catch (error) {
    console.error("[api/noticias PUT] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al actualizar noticia", detail: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/noticias
 * Elimina una noticia y su imagen si existe.
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar noticias." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "Falta el campo: id." }, { status: 400 });
    }

    const { data: noticias, sha } = await readJsonForWrite<Noticia[]>(JSON_PATH, "id");
    const lista = noticias ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (noticias === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((n) => n.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró noticia con id "${id}".` },
        { status: 404 }
      );
    }

    const noticiaEliminada = lista[index];
    lista.splice(index, 1);

    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Delete noticia: ${noticiaEliminada.titulo}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    // Eliminar la imagen asociada si existe (best-effort)
    if (noticiaEliminada.imagen) {
      const { deleteFile } = await import("@/lib/github");
      await deleteFile(noticiaEliminada.imagen, `Delete news image: ${noticiaEliminada.imagen}`);
    }

    return NextResponse.json({
      success: true,
      message: `Noticia "${noticiaEliminada.titulo}" eliminada correctamente.`,
    });
  } catch (error) {
    console.error("[api/noticias DELETE] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al eliminar noticia", detail: message },
      { status: 500 }
    );
  }
}
