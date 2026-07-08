"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Club } from "@/lib/types";

/**
 * Formulario de club (Crear / Editar)
 * ===========================================
 * Modal con todos los campos de un club:
 * - Datos básicos: nombre, icono (Bootstrap Icons class), descripción corta,
 *   descripción larga, email de contacto
 * - Directiva: lista dinámica de miembros (cargo + nombre + email)
 * - Actividades: lista dinámica de actividades (fecha + titulo + descripción)
 *
 * 📚 Concepto: Listas dinámicas con objetos (no solo strings)
 * A diferencia del formulario de profesores (donde cada item de "educación"
 * es un simple string), aquí cada item de "directiva" y "actividades" es un
 * OBJETO con varios campos. El patrón es similar: usamos .map() para renderizar
 * cada item y un índice para identificarlo, pero cada item tiene varios inputs
 * en vez de uno solo.
 *
 * 📚 Concepto: Clases de Bootstrap Icons
 * El campo "icono" guarda una clase CSS de Bootstrap Icons, ej: "bi-stars".
 * El sitio público incluye la hoja de estilos de Bootstrap Icons y renderiza
 * estas clases como iconos reales. En el admin solo pedimos el nombre de la
 * clase como texto y damos un enlace a la documentación para que el usuario
 * pueda buscar el icono que quiera.
 */

interface ClubFormProps {
  /** True para mostrar el modal */
  open: boolean;
  /** Modo: "create" o "edit" */
  mode: "create" | "edit";
  /** Club a editar (null en modo create) */
  club?: Club | null;
  /** Clave de acceso */
  accessKey: string;
  /** Callback cuando se guarda exitosamente */
  onSaved: (club: Club) => void;
  /** Callback para cerrar el modal */
  onOpenChange: (open: boolean) => void;
}

/** Tipo interno para un miembro de directiva vacío */
function getEmptyDirectivaMember(): { cargo: string; nombre: string; email?: string } {
  return { cargo: "", nombre: "", email: "" };
}

/** Tipo interno para una actividad vacía */
function getEmptyActividad(): { fecha?: string; titulo?: string; descripcion?: string } {
  return { fecha: "", titulo: "", descripcion: "" };
}

/**
 * Estado inicial del formulario (todos los campos vacíos).
 */
function getEmptyClub(): Club {
  return {
    id: "",
    nombre: "",
    icono: "",
    descripcion: "",
    descripcion_larga: "",
    contacto_email: "",
    directiva: [],
    actividades: [],
  };
}

export function ClubForm({
  open,
  mode,
  club,
  accessKey,
  onSaved,
  onOpenChange,
}: ClubFormProps) {
  const [formData, setFormData] = useState<Club>(getEmptyClub());
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del club al abrir el modal
  useEffect(() => {
    if (open) {
      if (club) {
        // Modo edit: copiar datos y asegurar arrays definidos
        setFormData({
          ...club,
          icono: club.icono || "",
          descripcion: club.descripcion || "",
          descripcion_larga: club.descripcion_larga || "",
          contacto_email: club.contacto_email || "",
          directiva: Array.isArray(club.directiva) ? club.directiva : [],
          actividades: Array.isArray(club.actividades) ? club.actividades : [],
        });
      } else {
        // Modo create: formulario vacío
        setFormData(getEmptyClub());
      }
    }
  }, [open, club]);

  // === Helper para actualizar campos simples ===
  function updateField<K extends keyof Club>(field: K, value: Club[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // === Helpers para lista DINÁMICA de DIRECTIVA (cargo + nombre + email) ===

  function updateDirectivaItem(
    index: number,
    campo: "cargo" | "nombre" | "email",
    value: string
  ) {
    setFormData((prev) => {
      const directiva = [...(prev.directiva || [])];
      directiva[index] = { ...directiva[index], [campo]: value };
      return { ...prev, directiva };
    });
  }

  function addDirectivaItem() {
    setFormData((prev) => ({
      ...prev,
      directiva: [...(prev.directiva || []), getEmptyDirectivaMember()],
    }));
  }

  function removeDirectivaItem(index: number) {
    setFormData((prev) => {
      const directiva = [...(prev.directiva || [])];
      directiva.splice(index, 1);
      return { ...prev, directiva };
    });
  }

  // === Helpers para lista DINÁMICA de ACTIVIDADES (fecha + titulo + descripcion) ===

  function updateActividadItem(
    index: number,
    campo: "fecha" | "titulo" | "descripcion",
    value: string
  ) {
    setFormData((prev) => {
      const actividades = [...(prev.actividades || [])];
      actividades[index] = { ...actividades[index], [campo]: value };
      return { ...prev, actividades };
    });
  }

  function addActividadItem() {
    setFormData((prev) => ({
      ...prev,
      actividades: [...(prev.actividades || []), getEmptyActividad()],
    }));
  }

  function removeActividadItem(index: number) {
    setFormData((prev) => {
      const actividades = [...(prev.actividades || [])];
      actividades.splice(index, 1);
      return { ...prev, actividades };
    });
  }

  // === Guardar ===

  async function handleSave() {
    // Validación básica
    if (!formData.nombre.trim()) {
      toast.error("El nombre del club es obligatorio.");
      return;
    }

    setIsSaving(true);

    try {
      const isEditing = mode === "edit" && club?.id;
      const url = "/api/clubes";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing
        ? JSON.stringify({ id: club!.id, club: formData })
        : JSON.stringify({ club: formData });

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
        onSaved(data.club);
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
            {mode === "create" ? "Agregar club" : "Editar club"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa los datos del nuevo club. Los cambios se guardan en GitHub."
              : "Modifica los datos del club. Los cambios se guardan en GitHub."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* === DATOS BÁSICOS === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nombre">
                  Nombre del club <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => updateField("nombre", e.target.value)}
                  placeholder="Ej: Club de Astronomía"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="icono">Icono (clase Bootstrap Icons)</Label>
                <Input
                  id="icono"
                  value={formData.icono || ""}
                  onChange={(e) => updateField("icono", e.target.value)}
                  placeholder="bi-stars"
                  disabled={isSaving}
                  className="font-mono"
                />
                <p className="text-xs text-slate-500">
                  Nombre de la clase Bootstrap Icons que se mostrará en el sitio
                  público. Ej: <code className="bg-slate-100 px-1 rounded">bi-stars</code>,{" "}
                  <code className="bg-slate-100 px-1 rounded">bi-code-square</code>,{" "}
                  <code className="bg-slate-100 px-1 rounded">bi-microscope</code>.
                  Busca más en{" "}
                  <a
                    href="https://icons.getbootstrap.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-700 underline hover:text-slate-900"
                  >
                    icons.getbootstrap.com
                  </a>
                  .
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="descripcion">Descripción corta</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion || ""}
                  onChange={(e) => updateField("descripcion", e.target.value)}
                  placeholder="Resumen breve que aparece en la lista de clubes..."
                  rows={2}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="descripcion_larga">Descripción larga</Label>
                <Textarea
                  id="descripcion_larga"
                  value={formData.descripcion_larga || ""}
                  onChange={(e) => updateField("descripcion_larga", e.target.value)}
                  placeholder="Descripción detallada del club, sus actividades y objetivos..."
                  rows={5}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contacto_email">Email de contacto</Label>
                <Input
                  id="contacto_email"
                  type="email"
                  value={formData.contacto_email || ""}
                  onChange={(e) => updateField("contacto_email", e.target.value)}
                  placeholder="club-astronomia@aefn.local"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* === DIRECTIVA (lista dinámica de objetos) === */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Directiva del club</Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Miembros del comité ejecutivo (cargo, nombre y email).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addDirectivaItem}
                  disabled={isSaving}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar miembro
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.directiva || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No hay miembros. Clic en &quot;Agregar miembro&quot; para añadir uno.
                  </p>
                )}
                {(formData.directiva || []).map((miembro, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-md bg-slate-50 border border-slate-100"
                  >
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-xs text-slate-500">Cargo</Label>
                      <Input
                        value={miembro.cargo || ""}
                        onChange={(e) =>
                          updateDirectivaItem(i, "cargo", e.target.value)
                        }
                        placeholder="Presidente"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-xs text-slate-500">Nombre</Label>
                      <Input
                        value={miembro.nombre || ""}
                        onChange={(e) =>
                          updateDirectivaItem(i, "nombre", e.target.value)
                        }
                        placeholder="Nombre completo"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-xs text-slate-500">Email</Label>
                      <Input
                        type="email"
                        value={miembro.email || ""}
                        onChange={(e) =>
                          updateDirectivaItem(i, "email", e.target.value)
                        }
                        placeholder="email@yachaytech.edu.ec"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDirectivaItem(i)}
                        disabled={isSaving}
                        title="Eliminar miembro"
                        className="w-full text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* === ACTIVIDADES (lista dinámica de objetos) === */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Actividades del club</Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reuniones, talleres y eventos del club (fecha, título y descripción).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addActividadItem}
                  disabled={isSaving}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar actividad
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.actividades || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No hay actividades. Clic en &quot;Agregar actividad&quot; para añadir una.
                  </p>
                )}
                {(formData.actividades || []).map((actividad, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-md bg-slate-50 border border-slate-100"
                  >
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-xs text-slate-500">Fecha</Label>
                      <Input
                        value={actividad.fecha || ""}
                        onChange={(e) =>
                          updateActividadItem(i, "fecha", e.target.value)
                        }
                        placeholder="2025-09-15"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-xs text-slate-500">Título</Label>
                      <Input
                        value={actividad.titulo || ""}
                        onChange={(e) =>
                          updateActividadItem(i, "titulo", e.target.value)
                        }
                        placeholder="Observación lunar"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-xs text-slate-500">Descripción</Label>
                      <Input
                        value={actividad.descripcion || ""}
                        onChange={(e) =>
                          updateActividadItem(i, "descripcion", e.target.value)
                        }
                        placeholder="Breve descripción"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeActividadItem(i)}
                        disabled={isSaving}
                        title="Eliminar actividad"
                        className="w-full text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
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
