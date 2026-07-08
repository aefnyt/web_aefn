"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Tesis } from "@/lib/types";

/**
 * Formulario de tesis (Crear / Editar)
 * ===========================================
 * Modal con todos los campos de una tesis:
 * - title (requerido)
 * - author (requerido)
 * - year (número, requerido)
 * - abstract (textarea)
 * - link (URL opcional)
 * - status (select: "en curso" / "defendida")
 *
 * 📚 Concepto: Tesis SIN campo `id`
 * Igual que los papers, las tesis en el JSON original no tienen un campo
 * `id`. Usamos el `title` como identificador natural. Al EDITAR, mandamos
 * `oldTitle` (el título original) para que la API pueda encontrar el
 * registro a reemplazar.
 */

interface ThesisFormProps {
  /** True para mostrar el modal */
  open: boolean;
  /** Modo: "create" o "edit" */
  mode: "create" | "edit";
  /** Tesis a editar (null en modo create) */
  tesis?: Tesis | null;
  /** Clave de acceso */
  accessKey: string;
  /** Callback cuando se guarda exitosamente */
  onSaved: (tesis: Tesis) => void;
  /** Callback para cerrar el modal */
  onOpenChange: (open: boolean) => void;
}

/**
 * Estado inicial del formulario (todos los campos vacíos).
 */
function getEmptyTesis(): Tesis {
  return {
    title: "",
    author: "",
    year: new Date().getFullYear(),
    abstract: "",
    link: "",
    status: "en curso",
  };
}

export function ThesisForm({
  open,
  mode,
  tesis,
  accessKey,
  onSaved,
  onOpenChange,
}: ThesisFormProps) {
  const [formData, setFormData] = useState<Tesis>(getEmptyTesis());
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos de la tesis al abrir el modal
  useEffect(() => {
    if (open) {
      if (tesis) {
        // Modo edit: copiar datos y asegurar valores por defecto
        setFormData({
          ...tesis,
          abstract: tesis.abstract || "",
          link: tesis.link || "",
          status: tesis.status || "en curso",
        });
      } else {
        // Modo create: formulario vacío
        setFormData(getEmptyTesis());
      }
    }
  }, [open, tesis]);

  // === Helper para actualizar campos simples ===
  function updateField<K extends keyof Tesis>(field: K, value: Tesis[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // === Guardar ===

  async function handleSave() {
    // Validación básica
    if (!formData.title.trim()) {
      toast.error("El título de la tesis es obligatorio.");
      return;
    }
    if (!formData.author.trim()) {
      toast.error("El autor de la tesis es obligatorio.");
      return;
    }
    if (typeof formData.year !== "number" || Number.isNaN(formData.year)) {
      toast.error("El año debe ser un número válido.");
      return;
    }

    setIsSaving(true);

    try {
      const isEditing = mode === "edit" && tesis?.title;
      const url = "/api/tesis";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing
        ? JSON.stringify({ oldTitle: tesis!.title, tesis: formData })
        : JSON.stringify({ tesis: formData });

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
        onSaved(data.tesis);
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
            {mode === "create" ? "Agregar tesis" : "Editar tesis"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa los datos de la tesis. Los cambios se guardan en GitHub."
              : "Modifica los datos de la tesis. Los cambios se guardan en GitHub."}
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
                placeholder="Ej: Modelado numérico de nanoestructuras fotónicas"
                disabled={isSaving}
              />
            </div>

            {/* === AUTOR === */}
            <div className="space-y-2">
              <Label htmlFor="author">
                Autor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => updateField("author", e.target.value)}
                placeholder="Ej: María Pérez"
                disabled={isSaving}
              />
            </div>

            {/* === AÑO + ESTADO (en la misma fila en pantallas medianas) === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status || "en curso"}
                  onValueChange={(v) => updateField("status", v)}
                  disabled={isSaving}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en curso">En curso</SelectItem>
                    <SelectItem value="defendida">Defendida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* === ABSTRACT === */}
            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea
                id="abstract"
                value={formData.abstract || ""}
                onChange={(e) => updateField("abstract", e.target.value)}
                placeholder="Resumen de la tesis..."
                rows={5}
                disabled={isSaving}
              />
            </div>

            {/* === LINK === */}
            <div className="space-y-2">
              <Label htmlFor="link">Enlace (URL del repositorio / PDF)</Label>
              <Input
                id="link"
                type="url"
                value={formData.link || ""}
                onChange={(e) => updateField("link", e.target.value)}
                placeholder="https://repositorio.yachaytech.edu.ec/..."
                disabled={isSaving}
              />
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
