import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile, writeBinaryFile, deleteFile, slugify } from "@/lib/github";
import { hasPermission, extractKeyFromRequest } from "@/lib/auth";
import { MODULES } from "@/lib/config";
import { processNewsImage, validateImage } from "@/lib/image";
import type { Noticia } from "@/lib/types";

/**
 * API para gestión de imágenes de noticias
 * ===========================================
 * Endpoints:
 * - POST   /api/noticias/imagen   → subir o reemplazar la imagen de una noticia
 * - DELETE /api/noticias/imagen   → eliminar la imagen de una noticia
 *
 * Las imágenes se optimizan a 1200px de ancho y formato WebP.
 * Es menos restrictiva que la foto de profesor (no se recorta a cuadrado)
 * porque las imágenes de noticia pueden tener cualquier proporción (16:9, 4:3, etc.)
 */

const MODULE_KEY = "noticias" as const;
const JSON_PATH = MODULES[MODULE_KEY].jsonPath;
const IMAGES_PATH = MODULES[MODULE_KEY].imagesPath!; // "images/noticias"

/**
 * POST /api/noticias/imagen
 * Sube o reemplaza la imagen de una noticia.
 *
 * Form data:
 * - id: string (id de la noticia)
 * - file: File (la imagen)
 */
export async function POST(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar imágenes de noticias." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const id = formData.get("id") as string | null;
    const file = formData.get("file") as File | null;

    if (!id) {
      return NextResponse.json({ error: "Falta el campo: id." }, { status: 400 });
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo: file." }, { status: 400 });
    }

    // Validar tipo y tamaño
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    validateImage(buffer, file.type);

    // Procesar imagen con sharp (1200px + WebP)
    const optimizedBuffer = await processNewsImage(buffer);

    // Leer JSON actual
    const { data: noticias, sha } = await readJsonFile<Noticia[]>(JSON_PATH);
    const lista = noticias ?? [];
    const index = lista.findIndex((n) => n.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró noticia con id "${id}".` },
        { status: 404 }
      );
    }

    const noticia = lista[index];
    const imagenAnterior = noticia.imagen;

    // Generar nombre de archivo: {id}.webp
    const nuevoNombreArchivo = `${slugify(id) || `noticia-${Date.now()}`}.webp`;
    // Ruta completa en el repo (con public/): public/images/noticias/x.webp
    const nuevaRutaRepo = `${IMAGES_PATH}/${nuevoNombreArchivo}`;
    // Ruta pública (sin public/): images/noticias/x.webp
    const nuevaRutaPublica = nuevaRutaRepo.replace(/^public\//, "");

    // Subir la nueva imagen
    const uploadResult = await writeBinaryFile(
      nuevaRutaRepo,
      optimizedBuffer,
      `Upload news image: ${noticia.titulo}`
    );

    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.message }, { status: 500 });
    }

    // Actualizar el campo "imagen" en el JSON (con ruta pública)
    noticia.imagen = nuevaRutaPublica;
    lista[index] = noticia;

    const updateResult = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Update noticia image: ${noticia.titulo}`
    );

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.message }, { status: 500 });
    }

    // Eliminar la imagen anterior si existía y es diferente
    if (imagenAnterior && imagenAnterior !== nuevaRutaPublica) {
      const rutaRepoAnterior = imagenAnterior.startsWith("public/")
        ? imagenAnterior
        : `public/${imagenAnterior}`;
      await deleteFile(rutaRepoAnterior, `Delete old news image: ${imagenAnterior}`);
    }

    return NextResponse.json({
      success: true,
      imagen: nuevaRutaPublica,
      commitSha: updateResult.commitSha,
      message: `Imagen de "${noticia.titulo}" actualizada correctamente.`,
    });
  } catch (error) {
    console.error("[api/noticias/imagen POST] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al subir imagen", detail: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/noticias/imagen
 * Elimina la imagen de una noticia.
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar imágenes de noticias." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "Falta el campo: id." }, { status: 400 });
    }

    const { data: noticias, sha } = await readJsonFile<Noticia[]>(JSON_PATH);
    const lista = noticias ?? [];
    const index = lista.findIndex((n) => n.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró noticia con id "${id}".` },
        { status: 404 }
      );
    }

    const noticia = lista[index];
    const imagenAEliminar = noticia.imagen;

    if (!imagenAEliminar) {
      return NextResponse.json({
        success: true,
        message: "La noticia no tenía imagen. No se requiere acción.",
      });
    }

    // Eliminar el archivo (añadir public/ si no lo tiene)
    const rutaRepoAEliminar = imagenAEliminar.startsWith("public/")
      ? imagenAEliminar
      : `public/${imagenAEliminar}`;
    await deleteFile(rutaRepoAEliminar, `Delete news image: ${noticia.titulo}`);

    // Actualizar el JSON
    noticia.imagen = undefined;
    lista[index] = noticia;

    const updateResult = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Remove noticia image: ${noticia.titulo}`
    );

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Imagen de "${noticia.titulo}" eliminada correctamente.`,
    });
  } catch (error) {
    console.error("[api/noticias/imagen DELETE] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al eliminar imagen", detail: message },
      { status: 500 }
    );
  }
}
