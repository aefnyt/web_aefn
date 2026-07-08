"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { AlbumGaleria } from "@/lib/types";

/**
 * Formulario de álbum de galería (Crear / Editar)
 * ===========================================
 * Modal con todos los campos de un álbum:
 * - Datos básicos: nombre del álbum, categoría, fecha, descripción
 * - Fotos: lista dinámica de fotos (id + título + ruta de imagen + descripción)
 *
 * 📚 Concepto: Ruta de imagen manual
 * En esta fase, el admin escribe manualmente la ruta de cada foto (ej:
 * "images/gallery/nanogal/1.png"). NO hay UI de subida de fotos individuales.
 * Esto mantiene el formulario simple: las fotos ya existen en el repo (o se
 * suben por separado) y solo se enlazan aquí.
 *
 * 📚 Concepto: Preview condicional
 * Para cada foto, si el campo "image" tiene texto, mostramos una miniatura
 * cuadrada con la imagen (cargada desde /public). Si está vacío, mostramos
 * un icono placeholder. Esto ayuda al admin a verificar que la ruta es
 * correcta antes de guardar.
 *
 * 📚 Concepto: ID de foto autogenerado
 * Cada foto necesita un `id` único dentro del álbum. Lo generamos en el
 * cliente con un timestamp + número aleatorio. Si la foto ya tenía un id
 * (al editar), se conserva.
 */

interface GalleryFormProps {
  /** True para mostrar el modal */
  open: boolean;
  /** Modo: "create" o "edit" */
  mode: "create" | "edit";
  /** Álbum a editar (null en modo create) */
  album?: AlbumGaleria | null;
  /** Clave de acceso */
  accessKey: string;
  /** Callback cuando se guarda exitosamente */
  onSaved: (album: AlbumGaleria) => void;
  /** Callback para cerrar el modal */
  onOpenChange: (open: boolean) => void;
}

/** Tipo interno para una foto del álbum */
type Foto = AlbumGaleria["photos"][number];

/** Genera un ID único para una foto nueva */
function generatePhotoId(): string {
  return `foto-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/** Devuelve una foto vacía con un ID autogenerado */
function getEmptyPhoto(): Foto {
  return {
    id: generatePhotoId(),
    title: "",
    image: "",
    description: "",
  };
}

/**
 * Estado inicial del formulario (todos los campos vacíos).
 */
function getEmptyAlbum(): AlbumGaleria {
  return {
    id: "",
    album: "",
    category: "",
    date: "",
    description: "",
    photos: [],
  };
}

export function GalleryForm({
  open,
  mode,
  album,
  accessKey,
  onSaved,
  onOpenChange,
}: GalleryFormProps) {
  const [formData, setFormData] = useState<AlbumGaleria>(getEmptyAlbum());
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del álbum al abrir el modal
  useEffect(() => {
    if (open) {
      if (album) {
        // Modo edit: copiar datos y asegurar arrays definidos
        setFormData({
          ...album,
          category: album.category || "",
          date: album.date || "",
          description: album.description || "",
          photos: Array.isArray(album.photos)
            ? album.photos.map((p) => ({
                ...p,
                title: p.title || "",
                description: p.description || "",
              }))
            : [],
        });
      } else {
        // Modo create: formulario vacío
        setFormData(getEmptyAlbum());
      }
    }
  }, [open, album]);

  // === Helper para actualizar campos simples ===
  function updateField<K extends keyof AlbumGaleria>(field: K, value: AlbumGaleria[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // === Helpers para lista DINÁMICA de FOTOS (id + title + image + description) ===

  function updatePhotoItem(
    index: number,
    campo: "title" | "image" | "description",
    value: string
  ) {
    setFormData((prev) => {
      const photos = [...(prev.photos || [])];
      photos[index] = { ...photos[index], [campo]: value };
      return { ...prev, photos };
    });
  }

  function addPhoto() {
    setFormData((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), getEmptyPhoto()],
    }));
  }

  function removePhoto(index: number) {
    setFormData((prev) => {
      const photos = [...(prev.photos || [])];
      photos.splice(index, 1);
      return { ...prev, photos };
    });
  }

  // === Guardar ===

  async function handleSave() {
    // Validación básica
    if (!formData.album.trim()) {
      toast.error("El nombre del álbum es obligatorio.");
      return;
    }

    setIsSaving(true);

    try {
      const isEditing = mode === "edit" && album?.id;
      const url = "/api/galeria";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing
        ? JSON.stringify({ id: album!.id, album: formData })
        : JSON.stringify({ album: formData });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        onSaved(data.album);
      } else {
        toast.error(data.error || data.message || "Error al guardar.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <DialogTitle>
            {mode === "create" ? "Agregar álbum" : "Editar álbum"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa los datos del nuevo álbum. Los cambios se guardan en GitHub."
              : "Modifica los datos del álbum. Los cambios se guardan en GitHub."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* === DATOS BÁSICOS === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="album">
                  Nombre del álbum <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="album"
                  value={formData.album}
                  onChange={(e) => updateField("album", e.target.value)}
                  placeholder="Ej: Nano Gallery 2025"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  value={formData.category || ""}
                  onChange={(e) => updateField("category", e.target.value)}
                  placeholder="Arte, Evento, Concurso..."
                  disabled={isSaving}
                />
                <p className="text-xs text-slate-500">
                  Categoría libre para agrupar álbumes.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) => updateField("date", e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Breve descripción del álbum..."
                  rows={3}
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* === FOTOS (lista dinámica de objetos) === */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Fotos del álbum</Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cada foto necesita un título, la ruta de la imagen y una
                    descripción opcional.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addPhoto}
                  disabled={isSaving}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar foto
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.photos || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No hay fotos. Clic en &quot;Agregar foto&quot; para añadir una.
                  </p>
                )}
                {(formData.photos || []).map((foto, i) => (
                  <PhotoItem
                    key={foto.id || i}
                    foto={foto}
                    index={i}
                    disabled={isSaving}
                    onUpdate={updatePhotoItem}
                    onRemove={removePhoto}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ====================================================================
// Componente auxiliar: item de foto con preview
// ====================================================================

interface PhotoItemProps {
  foto: Foto;
  index: number;
  disabled?: boolean;
  onUpdate: (
    index: number,
    campo: "title" | "image" | "description",
    value: string
  ) => void;
  onRemove: (index: number) => void;
}

function PhotoItem({ foto, index, disabled, onUpdate, onRemove }: PhotoItemProps) {
  const hasImage = Boolean(foto.image && foto.image.trim());

  return (
    <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
      <div className="flex gap-3">
        {/* Miniatura / preview */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
            {hasImage ? (
              <img
                src={`/${foto.image.replace(/^\//, "")}`}
                alt={foto.title || `Foto ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Si la imagen no carga, ocultamos el img y mostramos el icono
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-300" />
            )}
          </div>
          {hasImage && (
            <Badge
              variant="secondary"
              className="mt-1 text-[10px] bg-slate-200 text-slate-600 hover:bg-slate-200 block text-center w-16 sm:w-20 truncate"
              title={foto.image}
            >
              {foto.image.split("/").pop() || foto.image}
            </Badge>
          )}
        </div>

        {/* Campos de la foto */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-5 space-y-1">
            <Label className="text-xs text-slate-500">Título</Label>
            <Input
              value={foto.title || ""}
              onChange={(e) => onUpdate(index, "title", e.target.value)}
              placeholder="Ej: Nano Bosque"
              disabled={disabled}
            />
          </div>
          <div className="sm:col-span-6 space-y-1">
            <Label className="text-xs text-slate-500">Ruta de imagen</Label>
            <Input
              value={foto.image || ""}
              onChange={(e) => onUpdate(index, "image", e.target.value)}
              placeholder="images/gallery/nanogal/1.png"
              disabled={disabled}
              className="font-mono text-xs"
            />
          </div>
          <div className="sm:col-span-1 flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              disabled={disabled}
              title="Eliminar foto"
              className="w-full text-slate-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="sm:col-span-12 space-y-1">
            <Label className="text-xs text-slate-500">Descripción</Label>
            <Textarea
              value={foto.description || ""}
              onChange={(e) => onUpdate(index, "description", e.target.value)}
              placeholder="Descripción técnica o artística de la foto..."
              rows={2}
              disabled={disabled}
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
