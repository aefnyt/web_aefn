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
import type { GrupoInvestigacion } from "@/lib/types";

/**
 * Formulario de grupo de investigación (Crear / Editar)
 * ===========================================
 * Modal con todos los campos de un grupo:
 * - Datos básicos: título, slug (auto si vacío), descripción corta,
 *   imagen (ruta), descripción larga, email de contacto
 * - Participantes: lista dinámica de objetos {name, role}
 * - Proyectos: lista dinámica de objetos {title, year}
 *
 * 📚 Concepto: Slug auto-generado
 * El campo "slug" es opcional. Si el usuario lo deja vacío, la API lo
 * autogenera a partir del título (ej: "Sistemas Cuánticos" →
 * "sistemas-cuanticos"). Mostramos una vista previa en vivo para que
 * el usuario sepa qué slug se usará si no lo rellena manualmente.
 *
 * Sigue el mismo patrón que club-form.tsx (listas dinámicas de objetos).
 */

interface GroupFormProps {
  /** True para mostrar el modal */
  open: boolean;
  /** Modo: "create" o "edit" */
  mode: "create" | "edit";
  /** Grupo a editar (null en modo create) */
  grupo?: GrupoInvestigacion | null;
  /** Clave de acceso */
  accessKey: string;
  /** Callback cuando se guarda exitosamente */
  onSaved: (grupo: GrupoInvestigacion) => void;
  /** Callback para cerrar el modal */
  onOpenChange: (open: boolean) => void;
}

/** Genera un slug a partir de un texto (versión local para el preview). */
function localSlugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Tipo interno para un participante vacío */
function getEmptyParticipant(): { name: string; role?: string } {
  return { name: "", role: "" };
}

/** Tipo interno para un proyecto vacío */
function getEmptyProject(): { title: string; year?: number } {
  return { title: "", year: undefined };
}

/**
 * Estado inicial del formulario (todos los campos vacíos).
 */
function getEmptyGrupo(): GrupoInvestigacion {
  return {
    id: "",
    title: "",
    slug: "",
    short_description: "",
    image: "",
    long_description: "",
    contact_email: "",
    participants: [],
    projects: [],
  };
}

export function GroupForm({
  open,
  mode,
  grupo,
  accessKey,
  onSaved,
  onOpenChange,
}: GroupFormProps) {
  const [formData, setFormData] = useState<GrupoInvestigacion>(getEmptyGrupo());
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del grupo al abrir el modal
  useEffect(() => {
    if (open) {
      if (grupo) {
        // Modo edit: copiar datos y asegurar arrays definidos
        setFormData({
          ...grupo,
          slug: grupo.slug || "",
          short_description: grupo.short_description || "",
          image: grupo.image || "",
          long_description: grupo.long_description || "",
          contact_email: grupo.contact_email || "",
          participants: Array.isArray(grupo.participants) ? grupo.participants : [],
          projects: Array.isArray(grupo.projects) ? grupo.projects : [],
        });
      } else {
        // Modo create: formulario vacío
        setFormData(getEmptyGrupo());
      }
    }
  }, [open, grupo]);

  // === Helper para actualizar campos simples ===
  function updateField<K extends keyof GrupoInvestigacion>(
    field: K,
    value: GrupoInvestigacion[K]
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // === Helpers para lista DINÁMICA de PARTICIPANTS (name + role) ===

  function updateParticipantItem(
    index: number,
    campo: "name" | "role",
    value: string
  ) {
    setFormData((prev) => {
      const participants = [...(prev.participants || [])];
      participants[index] = { ...participants[index], [campo]: value };
      return { ...prev, participants };
    });
  }

  function addParticipantItem() {
    setFormData((prev) => ({
      ...prev,
      participants: [...(prev.participants || []), getEmptyParticipant()],
    }));
  }

  function removeParticipantItem(index: number) {
    setFormData((prev) => {
      const participants = [...(prev.participants || [])];
      participants.splice(index, 1);
      return { ...prev, participants };
    });
  }

  // === Helpers para lista DINÁMICA de PROJECTS (title + year) ===

  function updateProjectItem(
    index: number,
    campo: "title" | "year",
    value: string
  ) {
    setFormData((prev) => {
      const projects = [...(prev.projects || [])];
      if (campo === "year") {
        // El año es opcional: vacío = undefined, si no parsear a número
        const num = value === "" ? undefined : Number(value);
        projects[index] = {
          ...projects[index],
          year: typeof num === "number" && !Number.isNaN(num) ? num : undefined,
        };
      } else {
        projects[index] = { ...projects[index], [campo]: value };
      }
      return { ...prev, projects };
    });
  }

  function addProjectItem() {
    setFormData((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), getEmptyProject()],
    }));
  }

  function removeProjectItem(index: number) {
    setFormData((prev) => {
      const projects = [...(prev.projects || [])];
      projects.splice(index, 1);
      return { ...prev, projects };
    });
  }

  // === Guardar ===

  async function handleSave() {
    // Validación básica
    if (!formData.title.trim()) {
      toast.error("El título del grupo es obligatorio.");
      return;
    }

    setIsSaving(true);

    try {
      const isEditing = mode === "edit" && grupo?.id;
      const url = "/api/grupos";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing
        ? JSON.stringify({ id: grupo!.id, grupo: formData })
        : JSON.stringify({ grupo: formData });

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
        onSaved(data.grupo);
      } else {
        toast.error(data.error || data.message || "Error al guardar.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setIsSaving(false);
    }
  }

  // Vista previa del slug si el usuario dejó el campo vacío
  const slugPreview = formData.slug ? formData.slug : localSlugify(formData.title);

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <DialogTitle>
            {mode === "create" ? "Agregar grupo de investigación" : "Editar grupo de investigación"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa los datos del nuevo grupo. Los cambios se guardan en GitHub."
              : "Modifica los datos del grupo. Los cambios se guardan en GitHub."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* === DATOS BÁSICOS === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">
                  Título del grupo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Ej: Nanomateriales y Caracterización"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="slug">Slug (opcional)</Label>
                <Input
                  id="slug"
                  value={formData.slug || ""}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="Se autogenera desde el título si lo dejas vacío"
                  disabled={isSaving}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  Identificador legible para URLs. Vista previa:{" "}
                  <code className="bg-slate-100 px-1 rounded text-slate-700">
                    {slugPreview || "(vacío)"}
                  </code>
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="short_description">Descripción corta</Label>
                <Textarea
                  id="short_description"
                  value={formData.short_description || ""}
                  onChange={(e) => updateField("short_description", e.target.value)}
                  placeholder="Resumen breve que aparece en la lista de grupos..."
                  rows={2}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="image">Imagen (ruta relativa)</Label>
                <Input
                  id="image"
                  value={formData.image || ""}
                  onChange={(e) => updateField("image", e.target.value)}
                  placeholder="Ej: images/topics/mi-grupo.png"
                  disabled={isSaving}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  Ruta de la imagen dentro del repositorio (sin barra inicial).
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="long_description">Descripción larga</Label>
                <Textarea
                  id="long_description"
                  value={formData.long_description || ""}
                  onChange={(e) => updateField("long_description", e.target.value)}
                  placeholder="Descripción detallada del grupo, líneas de investigación, objetivos..."
                  rows={5}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contact_email">Email de contacto</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email || ""}
                  onChange={(e) => updateField("contact_email", e.target.value)}
                  placeholder="grupo@aefn.local"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* === PARTICIPANTS (lista dinámica de objetos) === */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Participantes</Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Miembros del grupo (nombre y rol).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addParticipantItem}
                  disabled={isSaving}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar participante
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.participants || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No hay participantes. Clic en &quot;Agregar participante&quot; para añadir uno.
                  </p>
                )}
                {(formData.participants || []).map((p, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-md bg-slate-50 border border-slate-100"
                  >
                    <div className="sm:col-span-7 space-y-1">
                      <Label className="text-xs text-slate-500">Nombre</Label>
                      <Input
                        value={p.name || ""}
                        onChange={(e) =>
                          updateParticipantItem(i, "name", e.target.value)
                        }
                        placeholder="Dra. Clara Rojas"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-xs text-slate-500">Rol</Label>
                      <Input
                        value={p.role || ""}
                        onChange={(e) =>
                          updateParticipantItem(i, "role", e.target.value)
                        }
                        placeholder="Coordinadora"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeParticipantItem(i)}
                        disabled={isSaving}
                        title="Eliminar participante"
                        className="w-full text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* === PROJECTS (lista dinámica de objetos) === */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Proyectos</Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proyectos de investigación del grupo (título y año).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addProjectItem}
                  disabled={isSaving}
                  className="h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar proyecto
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.projects || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No hay proyectos. Clic en &quot;Agregar proyecto&quot; para añadir uno.
                  </p>
                )}
                {(formData.projects || []).map((proj, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-md bg-slate-50 border border-slate-100"
                  >
                    <div className="sm:col-span-8 space-y-1">
                      <Label className="text-xs text-slate-500">Título del proyecto</Label>
                      <Input
                        value={proj.title || ""}
                        onChange={(e) =>
                          updateProjectItem(i, "title", e.target.value)
                        }
                        placeholder="Nanocompuestos para baterías de alta densidad"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-xs text-slate-500">Año</Label>
                      <Input
                        type="number"
                        value={proj.year ?? ""}
                        onChange={(e) =>
                          updateProjectItem(i, "year", e.target.value)
                        }
                        placeholder="2025"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProjectItem(i)}
                        disabled={isSaving}
                        title="Eliminar proyecto"
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
