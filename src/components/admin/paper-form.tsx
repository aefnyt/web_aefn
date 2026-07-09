"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Paper } from "@/lib/types";

/**
 * Formulario de paper / publicación científica (Crear / Editar)
 * ===========================================
 * Modal con todos los campos de un paper:
 * - title (requerido)
 * - authors (lista dinámica de strings)
 * - year (número, requerido)
 * - abstract (textarea)
 * - link (URL opcional)
 * - published (checkbox)
 *
 * 📚 Concepto: Papers SIN campo `id`
 * A diferencia de profesores/clubes/grupos, los papers en el JSON original
 * no tienen un campo `id`. Usamos el `title` como identificador natural.
 * Al EDITAR, mandamos `oldTitle` (el título original antes de cambiarlo en
 * el formulario) para que la API pueda encontrar el registro a reemplazar.
 *
 * Sigue el mismo patrón que professor-form.tsx (DynamicListInput de strings).
 */

interface PaperFormProps {
  /** True para mostrar el modal */
  open: boolean;
  /** Modo: "create" o "edit" */
  mode: "create" | "edit";
  /** Paper a editar (null en modo create) */
  paper?: Paper | null;
  /** Clave de acceso */
  accessKey: string;
  /** Callback cuando se guarda exitosamente */
  onSaved: (paper: Paper) => void;
  /** Callback para cerrar el modal */
  onOpenChange: (open: boolean) => void;
}

/**
 * Estado inicial del formulario (todos los campos vacíos).
 */
function getEmptyPaper(): Paper {
  return {
    title: "",
    authors: [],
    year: new Date().getFullYear(),
    abstract: "",
    link: "",
    published: true,
  };
}

export function PaperForm({
  open,
  mode,
  paper,
  accessKey,
  onSaved,
  onOpenChange,
}: PaperFormProps) {
  const [formData, setFormData] = useState<Paper>(getEmptyPaper());
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del paper al abrir el modal
  useEffect(() => {
    if (open) {
      if (paper) {
        // Modo edit: copiar datos y asegurar arrays definidos
        setFormData({
          ...paper,
          authors: Array.isArray(paper.authors) ? paper.authors : [],
          abstract: paper.abstract || "",
          link: paper.link || "",
          published: typeof paper.published === "boolean" ? paper.published : true,
        });
      } else {
        // Modo create: formulario vacío
        setFormData(getEmptyPaper());
      }
    }
  }, [open, paper]);

  // === Helper para actualizar campos simples ===
  function updateField<K extends keyof Paper>(field: K, value: Paper[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // === Helpers para lista dinámica de AUTHORS (strings) ===

  function updateAuthor(index: number, value: string) {
    setFormData((prev) => {
      const authors = [...(prev.authors || [])];
      authors[index] = value;
      return { ...prev, authors };
    });
  }

  function addAuthor() {
    setFormData((prev) => ({
      ...prev,
      authors: [...(prev.authors || []), ""],
    }));
  }

  function removeAuthor(index: number) {
    setFormData((prev) => {
      const authors = [...(prev.authors || [])];
      authors.splice(index, 1);
      return { ...prev, authors };
    });
  }

  // === Guardar ===

  async function handleSave() {
    // Validación básica
    if (!formData.title.trim()) {
      toast.error("El título del paper es obligatorio.");
      return;
    }
    if (typeof formData.year !== "number" || Number.isNaN(formData.year)) {
      toast.error("El año debe ser un número válido.");
      return;
    }

    setIsSaving(true);

    try {
      const isEditing = mode === "edit" && paper?.title;
      const url = "/api/papers";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing
        ? JSON.stringify({ oldTitle: paper!.title, paper: formData })
        : JSON.stringify({ paper: formData });

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
        onSaved(data.paper);
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
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <DialogTitle>
            {mode === "create" ? "Agregar paper" : "Editar paper"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa los datos de la publicación científica. Los cambios se guardan en GitHub."
              : "Modifica los datos del paper. Los cambios se guardan en GitHub."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* === TÍTULO === */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Ej: Quantum Efficiency in Organic Photovoltaics"
                disabled={isSaving}
              />
            </div>

            {/* === AÑO === */}
            <div className="space-y-2">
              <Label htmlFor="year">
                Año <span className="text-red-500">*</span>
              </Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  updateField("year", Number(e.target.value))
                }
                placeholder="2025"
                disabled={isSaving}
                min={1900}
                max={2100}
              />
            </div>

            {/* === AUTORES (lista dinámica de strings) === */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Autores</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addAuthor}
                  disabled={isSaving}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar autor
                </Button>
              </div>
              <div className="space-y-2">
                {(formData.authors || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No hay autores. Clic en &quot;Agregar autor&quot; para añadir uno.
                  </p>
                )}
                {(formData.authors || []).map((author, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={author}
                      onChange={(e) => updateAuthor(i, e.target.value)}
                      placeholder="Ej: Duncan Mowbray"
                      disabled={isSaving}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAuthor(i)}
                      disabled={isSaving}
                      className="flex-shrink-0 text-slate-400 hover:text-red-600"
                      title="Eliminar autor"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* === ABSTRACT === */}
            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea
                id="abstract"
                value={formData.abstract || ""}
                onChange={(e) => updateField("abstract", e.target.value)}
                placeholder="Resumen del paper..."
                rows={5}
                disabled={isSaving}
              />
            </div>

            {/* === LINK === */}
            <div className="space-y-2">
              <Label htmlFor="link">Enlace (DOI / URL)</Label>
              <Input
                id="link"
                type="url"
                value={formData.link || ""}
                onChange={(e) => updateField("link", e.target.value)}
                placeholder="https://doi.org/10.1000/..."
                disabled={isSaving}
              />
            </div>

            {/* === PUBLICADO === */}
            <div className="flex items-center gap-2 p-3 rounded-md bg-slate-50 border border-slate-100">
              <Checkbox
                id="published"
                checked={formData.published === true}
                onCheckedChange={(checked) =>
                  updateField("published", checked === true)
                }
                disabled={isSaving}
              />
              <Label htmlFor="published" className="cursor-pointer">
                <span className="font-medium">Publicado</span>
                <span className="block text-xs text-slate-500">
                  Si está marcado, el paper se mostrará como publicado. Si no,
                  se mostrará como borrador.
                </span>
              </Label>
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
