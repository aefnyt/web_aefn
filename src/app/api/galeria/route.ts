import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile, slugify, readJsonForWrite } from "@/lib/github";
import { hasPermission, extractKeyFromRequest } from "@/lib/auth";
import { MODULES } from "@/lib/config";
import type { AlbumGaleria } from "@/lib/types";

/**
 * API CRUD para Galería (álbumes)
 * ===========================================
 * Endpoints:
 * - GET    /api/galeria       → listar todos los álbumes
 * - POST   /api/galeria       → crear un álbum nuevo
 * - PUT    /api/galeria       → actualizar un álbum existente
 * - DELETE /api/galeria       → eliminar un álbum
 *
 * Sigue el mismo patrón que /api/profesores, /api/eventos y /api/clubes.
 *
 * 📚 Concepto: Álbumes vs fotos individuales
 * En esta fase, el recurso que se gestiona es el ÁLBUM (no las fotos sueltas).
 * Cada álbum contiene un arreglo de fotos con {id, title, image, description}.
 * El admin escribe la ruta de cada foto manualmente (ej: "images/gallery/nanogal/1.png").
 * No hay UI de subida de fotos individuales todavía — se mantiene simple.
 *
 * 📚 Concepto: ID autogenerado legible
 * Para los álbumes usamos como ID el slug del nombre (ej: "Nano Gallery"
 * → "nano-gallery"). Si ya existe, añadimos un sufijo numérico (-2, -3...).
 */

const MODULE_KEY = "galeria" as const;
const JSON_PATH = MODULES[MODULE_KEY].jsonPath;

/**
 * GET /api/galeria
 * Lista todos los álbumes. NO requiere autenticación (es lectura pública).
 */
export async function GET() {
  try {
    const { data, sha } = await readJsonFile<AlbumGaleria[]>(JSON_PATH);
    return NextResponse.json({
      data: data ?? [],
      sha,
    });
  } catch (error) {
    console.error("[api/galeria GET] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al leer álbumes de galería", detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/galeria
 * Crea un álbum nuevo. Requiere clave con permiso "galeria" o "admin".
 *
 * Body: { album: AlbumGaleria } (sin id, se autogenera)
 * Response: { success: true, album, commitSha }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar la galería." },
        { status: 403 }
      );
    }

    // 2. Leer body
    const body = await request.json();
    const nuevoAlbum: AlbumGaleria = body.album;

    if (!nuevoAlbum || !nuevoAlbum.album) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: album (nombre del álbum)." },
        { status: 400 }
      );
    }

    // 3. Leer JSON actual
    const { data: albumes, sha } = await readJsonForWrite<AlbumGaleria[]>(JSON_PATH, "id");
    const lista = albumes ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (albumes === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    // 4. Generar ID único (slug del nombre del álbum + sufijo si hay colisión)
    const baseId = slugify(nuevoAlbum.album);
    let id = baseId;
    let suffix = 2;
    while (lista.some((a) => a.id === id)) {
      id = `${baseId}-${suffix}`;
      suffix++;
    }
    nuevoAlbum.id = id;

    // 5. Asegurar campos por defecto (photos siempre es un arreglo)
    if (!Array.isArray(nuevoAlbum.photos)) nuevoAlbum.photos = [];

    // 6. Agregar al final
    lista.push(nuevoAlbum);

    // 7. Guardar en GitHub (genera commit)
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Add album: ${nuevoAlbum.album}`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      album: nuevoAlbum,
      commitSha: result.commitSha,
      message: `Álbum "${nuevoAlbum.album}" creado correctamente.`,
    });
  } catch (error) {
    console.error("[api/galeria POST] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al crear álbum", detail: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/galeria
 * Actualiza un álbum existente. Requiere permiso.
 *
 * Body: { id: string, album: AlbumGaleria }
 */
export async function PUT(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar la galería." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, album } = body as { id: string; album: AlbumGaleria };

    if (!id || !album) {
      return NextResponse.json(
        { error: "Faltan campos: id, album." },
        { status: 400 }
      );
    }

    const { data: albumes, sha } = await readJsonForWrite<AlbumGaleria[]>(JSON_PATH, "id");
    const lista = albumes ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (albumes === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((a) => a.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró álbum con id "${id}".` },
        { status: 404 }
      );
    }

    // Mantener el id y asegurar que photos sea un arreglo
    album.id = id;
    if (!Array.isArray(album.photos)) album.photos = [];

    lista[index] = album;

    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Update album: ${album.album}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      album,
      commitSha: result.commitSha,
      message: `Álbum "${album.album}" actualizado correctamente.`,
    });
  } catch (error) {
    console.error("[api/galeria PUT] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al actualizar álbum", detail: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/galeria
 * Elimina un álbum. Requiere permiso.
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar álbumes de la galería." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "Falta el campo: id." }, { status: 400 });
    }

    const { data: albumes, sha } = await readJsonForWrite<AlbumGaleria[]>(JSON_PATH, "id");
    const lista = albumes ?? [];

    // SAFEGUARD: Si la lectura falló, NO sobrescribir
    if (albumes === null) {
      return NextResponse.json(
        {
          error:
            "No se pudieron leer los datos existentes. Recarga la página e inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    const index = lista.findIndex((a) => a.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró álbum con id "${id}".` },
        { status: 404 }
      );
    }

    const albumEliminado = lista[index];
    lista.splice(index, 1);

    // Guardar JSON actualizado
    const result = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Delete album: ${albumEliminado.album}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Álbum "${albumEliminado.album}" eliminado correctamente.`,
    });
  } catch (error) {
    console.error("[api/galeria DELETE] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al eliminar álbum", detail: message },
      { status: 500 }
    );
  }
}
