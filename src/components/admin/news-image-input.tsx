"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";

/**
 * Input de imagen de noticia
 * ===========================================
 * Similar al ProfessorPhotoInput pero para noticias:
 * 1. Muestra preview de la imagen actual
 * 2. Permite subir una imagen nueva (1200px de ancho, WebP)
 * 3. Permite eliminarla
 *
 * A diferencia de las fotos de profesor (cuadradas), las imágenes de noticia
 * mantienen su proporción original (16:9, 4:3, etc.).
 */

interface NewsImageInputProps {
  noticiaId: string;
  currentImagen?: string;
  accessKey: string;
  onImagenChange: (newImagen: string | undefined) => void;
}

export function NewsImageInput({
  noticiaId,
  currentImagen,
  accessKey,
  onImagenChange,
}: NewsImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const imagenUrl = preview ?? (currentImagen ? `/${currentImagen}` : "");

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
      const tempPreview = URL.createObjectURL(file);
      setPreview(tempPreview);

      const formData = new FormData();
      formData.append("id", noticiaId);
      formData.append("file", file);

      const response = await fetch("/api/noticias/imagen", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessKey}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Imagen actualizada.");
        onImagenChange(data.imagen);
        setPreview(null);
      } else {
        toast.error(data.error || data.message || "Error al subir la imagen.");
        setPreview(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de conexión.");
      setPreview(null);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      if (preview) URL.revokeObjectURL(preview);
    }
  }

  async function handleDelete() {
    if (!currentImagen) {
      toast.info("Esta noticia no tiene imagen para eliminar.");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/noticias/imagen", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body: JSON.stringify({ id: noticiaId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Imagen eliminada.");
        onImagenChange(undefined);
      } else {
        toast.error(data.error || data.message || "Error al eliminar la imagen.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || isDeleting}
      />

      {/* Preview */}
      <div className="relative w-full aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt="Vista previa"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <ImageIcon className="w-10 h-10 mb-2" />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}

        {(isUploading || isDeleting) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

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
              {currentImagen ? "Reemplazar" : "Subir imagen"}
            </>
          )}
        </Button>

        {currentImagen && (
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

      <p className="text-xs text-slate-500">
        La imagen se optimiza a 1200px de ancho en formato WebP. Proporción libre (16:9 recomendada).
      </p>
    </div>
  );
}
