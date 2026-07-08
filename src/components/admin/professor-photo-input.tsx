"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Input de foto de profesor
 * ===========================================
 * Permite:
 * 1. Ver la foto actual (o un avatar con iniciales si no tiene)
 * 2. Subir una foto nueva (o reemplazar la existente)
 * 3. Eliminar la foto
 *
 * Llama a la API /api/profesores/foto para persistir los cambios.
 *
 * 📚 Concepto: input type="file" oculto + botón personalizado
 * El input nativo de archivos es feo y difícil de estilizar. El patrón
 * estándar es: creamos un input oculto (display:none) y un botón visible.
 * Cuando el usuario hace clic en el botón, llamamos inputRef.current.click()
 * para abrir el selector de archivos. El usuario nunca ve el input nativo.
 */

interface ProfessorPhotoInputProps {
  /** ID del profesor (necesario para llamar a la API) */
  profesorId: string;
  /** Nombre del profesor (para generar iniciales y mensajes) */
  profesorName: string;
  /** Ruta relativa de la foto actual (ej: "images/profesores/gema.webp") o "" */
  currentFoto: string;
  /** Clave de acceso (se envía en el header Authorization) */
  accessKey: string;
  /** Callback cuando la foto se actualiza exitosamente */
  onFotoChange: (newFoto: string) => void;
}

/** Genera iniciales de un nombre: "Gema Gonzáles, Ph.D" → "GG" */
function getInitials(name: string): string {
  const cleanName = name.replace(/,.*$/, "").trim(); // Quitar ", Ph.D"
  const parts = cleanName.split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ProfessorPhotoInput({
  profesorId,
  profesorName,
  currentFoto,
  accessKey,
  onFotoChange,
}: ProfessorPhotoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // URL para mostrar (preview temporal o foto actual)
  const fotoUrl = preview ?? (currentFoto ? `/${currentFoto}` : "");

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación básica en cliente
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen es demasiado grande. Máximo 10 MB.");
      return;
    }

    setIsUploading(true);

    try {
      // Crear preview temporal para mostrar inmediatamente
      const tempPreview = URL.createObjectURL(file);
      setPreview(tempPreview);

      // Preparar FormData para multipart upload
      const formData = new FormData();
      formData.append("id", profesorId);
      formData.append("file", file);

      const response = await fetch("/api/profesores/foto", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessKey}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Foto actualizada correctamente.");
        onFotoChange(data.foto);
        // El preview ya no es necesario, usaremos la URL real
        setPreview(null);
      } else {
        toast.error(data.error || data.message || "Error al subir la foto.");
        setPreview(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de conexión.");
      setPreview(null);
    } finally {
      setIsUploading(false);
      // Limpiar el input para permitir subir el mismo archivo otra vez
      if (inputRef.current) inputRef.current.value = "";
      // Liberar memoria del preview temporal
      if (preview) URL.revokeObjectURL(preview);
    }
  }

  async function handleDelete() {
    if (!currentFoto) {
      toast.info("Este profesor no tiene foto para eliminar.");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/profesores/foto", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body: JSON.stringify({ id: profesorId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Foto eliminada correctamente.");
        onFotoChange("");
      } else {
        toast.error(data.error || data.message || "Error al eliminar la foto.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar / Foto */}
      <div className="relative">
        <Avatar className="w-32 h-32 border-2 border-slate-200 shadow-sm">
          <AvatarImage src={fotoUrl} alt={profesorName} />
          <AvatarFallback className="bg-slate-100 text-slate-500 text-2xl font-semibold">
            {getInitials(profesorName)}
          </AvatarFallback>
        </Avatar>

        {/* Overlay de loading */}
        {(isUploading || isDeleting) && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Input file oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || isDeleting}
      />

      {/* Botones */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading || isDeleting}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-1" />
              {currentFoto ? "Reemplazar" : "Subir foto"}
            </>
          )}
        </Button>

        {currentFoto && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading || isDeleting}
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-1" />
            )}
            Eliminar
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-500 text-center max-w-xs">
        La imagen se optimiza automáticamente a 600×600 px en formato WebP.
      </p>
    </div>
  );
}
