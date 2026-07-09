import { NextRequest, NextResponse } from "next/server";
import { readJsonFile, writeJsonFile, writeBinaryFile, deleteFile, slugify } from "@/lib/github";
import { hasPermission, extractKeyFromRequest } from "@/lib/auth";
import { MODULES } from "@/lib/config";
import { processProfessorPhoto, validateImage } from "@/lib/image";
import type { Profesor } from "@/lib/types";

/**
 * API para gestión de fotos de profesores
 * ===========================================
 * Endpoints:
 * - POST   /api/profesores/foto   → subir o reemplazar la foto de un profesor
 * - DELETE /api/profesores/foto   → eliminar la foto de un profesor
 *
 * 📚 Concepto: Subida de archivos (multipart/form-data)
 * Cuando un formulario envía un archivo, el navegador lo empaqueta como
 * "multipart/form-data" en vez de JSON. Cada campo del formulario (incluido
 * el archivo binario) se separa con un "boundary" único. Next.js nos da
 * request.formData() para parsear esto fácilmente.
 *
 * 📚 Concepto: ¿Por qué procesamos la imagen antes de guardarla?
 * Una foto de profesor tomada con un teléfono puede pesar 5-10 MB y tener
 * 4000x3000 píxeles. Para un avatar de 200x200, eso es exagerado. La pasamos
 * por `sharp` que:
 * 1. La redimensiona a 600x600 (suficiente para cualquier uso)
 * 2. La recorta a cuadrado (consistencia visual)
 * 3. La convierte a WebP (~70% más liviana que JPG)
 * Resultado: una foto de 30-50 KB en vez de 5 MB. El repo queda pequeño.
 */

const MODULE_KEY = "profesores" as const;
const JSON_PATH = MODULES[MODULE_KEY].jsonPath;
const IMAGES_PATH = MODULES[MODULE_KEY].imagesPath!; // "images/profesores"

/**
 * POST /api/profesores/foto
 * Sube o reemplaza la foto de un profesor.
 *
 * Form data:
 * - id: string (id del profesor)
 * - file: File (la imagen, JPG/PNG/WebP/GIF)
 *
 * Response: { success, foto, commitSha }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para editar fotos de profesores." },
        { status: 403 }
      );
    }

    // 2. Parsear multipart form data
    const formData = await request.formData();
    const id = formData.get("id") as string | null;
    const file = formData.get("file") as File | null;

    if (!id) {
      return NextResponse.json({ error: "Falta el campo: id." }, { status: 400 });
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo: file." }, { status: 400 });
    }

    // 3. Validar tipo y tamaño
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    validateImage(buffer, file.type);

    // 4. Procesar imagen con sharp (redimensionar + WebP)
    const optimizedBuffer = await processProfessorPhoto(buffer);

    // 5. Leer JSON actual para encontrar al profesor
    const { data: profesores, sha } = await readJsonFile<Profesor[]>(JSON_PATH);
    const lista = profesores ?? [];
    const index = lista.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró profesor con id "${id}".` },
        { status: 404 }
      );
    }

    const profesor = lista[index];
    const fotoAnterior = profesor.foto;

    // 6. Generar nombre de archivo: {id}.webp
    const nuevoNombreArchivo = `${slugify(id) || `profesor-${Date.now()}`}.webp`;
    // Ruta completa en el repo (con public/): public/images/profesores/andrey.webp
    const nuevaRutaRepo = `${IMAGES_PATH}/${nuevoNombreArchivo}`;
    // Ruta pública (sin public/): images/profesores/andrey.webp
    // Esta es la que se guarda en el JSON y se usa en el frontend
    const nuevaRutaPublica = nuevaRutaRepo.replace(/^public\//, "");

    // 7. Subir la nueva imagen a GitHub
    const uploadResult = await writeBinaryFile(
      nuevaRutaRepo,
      optimizedBuffer,
      `Upload photo: ${profesor.nombre}`
    );

    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.message }, { status: 500 });
    }

    // 8. Actualizar el campo "foto" en el JSON (con la ruta pública)
    profesor.foto = nuevaRutaPublica;
    lista[index] = profesor;

    const updateResult = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Update profesor photo: ${profesor.nombre}`
    );

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.message }, { status: 500 });
    }

    // 9. Eliminar la foto anterior del repo (si existía y es diferente)
    if (fotoAnterior && fotoAnterior !== nuevaRutaPublica) {
      // La foto anterior está guardada como ruta pública (sin public/)
      // Necesitamos añadir public/ para eliminarla del repo
      const rutaRepoAnterior = fotoAnterior.startsWith("public/")
        ? fotoAnterior
        : `public/${fotoAnterior}`;
      await deleteFile(rutaRepoAnterior, `Delete old photo: ${fotoAnterior}`);
    }

    return NextResponse.json({
      success: true,
      foto: nuevaRutaPublica,
      commitSha: updateResult.commitSha,
      message: `Foto de "${profesor.nombre}" actualizada correctamente.`,
    });
  } catch (error) {
    console.error("[api/profesores/foto POST] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al subir foto", detail: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profesores/foto
 * Elimina la foto de un profesor.
 *
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);
    if (!key || !hasPermission(key, MODULE_KEY)) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar fotos de profesores." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "Falta el campo: id." }, { status: 400 });
    }

    const { data: profesores, sha } = await readJsonFile<Profesor[]>(JSON_PATH);
    const lista = profesores ?? [];
    const index = lista.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: `No se encontró profesor con id "${id}".` },
        { status: 404 }
      );
    }

    const profesor = lista[index];
    const fotoAEliminar = profesor.foto;

    if (!fotoAEliminar) {
      return NextResponse.json({
        success: true,
        message: "El profesor no tenía foto. No se requiere acción.",
      });
    }

    // La foto está guardada como ruta pública (sin public/)
    // Necesitamos añadir public/ para eliminarla del repo
    const rutaRepoAEliminar = fotoAEliminar.startsWith("public/")
      ? fotoAEliminar
      : `public/${fotoAEliminar}`;

    // 1. Eliminar el archivo de imagen del repo
    const deleteResult = await deleteFile(
      rutaRepoAEliminar,
      `Delete photo: ${profesor.nombre}`
    );

    // 2. Actualizar el JSON para quitar la referencia a la foto
    profesor.foto = "";
    lista[index] = profesor;

    const updateResult = await writeJsonFile(
      JSON_PATH,
      lista,
      sha,
      `Remove profesor photo: ${profesor.nombre}`
    );

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Foto de "${profesor.nombre}" eliminada correctamente.`,
      deleteResult,
    });
  } catch (error) {
    console.error("[api/profesores/foto DELETE] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al eliminar foto", detail: message },
      { status: 500 }
    );
  }
}
