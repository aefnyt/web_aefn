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
import { PROFESSOR_AREAS, type Profesor } from "@/lib/types";
import { ProfessorPhotoInput } from "./professor-photo-input";

/**
 * Formulario de profesor (Crear / Editar)
 * ===========================================
 * Modal con todos los campos de un profesor:
 * - Datos básicos: nombre, título, email, teléfono, oficina
 * - Áreas (checkboxes múltiples)
 * - Áreas de investigación (lista editable)
 * - Biografía
 * - Educación, publicaciones, proyectos (listas editables)
 * - Redes sociales
 * - Foto (solo en modo editar; al crear, primero se guarda y luego se sube foto)
 *
 * 📚 Concepto: Formulario controlado
 * Cada campo del formulario está "controlado" por React: el valor viene del
 * estado (useState) y al cambiar, actualiza el estado. React es la "fuente
 * de verdad" del formulario. Esto facilita validación, pre-fill al editar,
 * y transformaciones de datos.
 *
 * 📚 Concepto: Listas dinámicas
 * Campos como "educacion" o "publicaciones" son arrays de strings. En el
 * formulario, los mostramos como una lista de inputs donde el usuario puede
 * agregar/quitar elementos. Cada input tiene su propio estado.
 */

interface ProfessorFormProps {
  /** True para mostrar el modal */
  open: boolean;
  /** Modo: "create" o "edit" */
  mode: "create" | "edit";
  /** Profesor a editar (null en modo create) */
  profesor?: Profesor | null;
  /** Clave de acceso */
  accessKey: string;
  /** Callback cuando se guarda exitosamente */
  onSaved: (profesor: Profesor) => void;
  /** Callback para cerrar el modal */
  onOpenChange: (open: boolean) => void;
}

/**
 * Estado inicial del formulario (todos los campos vacíos).
 */
function getEmptyProfesor(): Profesor {
  return {
    nombre: "",
    titulo: "",
    area: [],
    areas_investigacion: [],
    foto: "",
    email: "",
    telefono: "",
    oficina: "",
    bio: "",
    educacion: [],
    publicaciones: [],
    proyectos: [],
    social: {
      linkedin: "",
      google_scholar: "",
      github: "",
    },
  };
}

export function ProfessorForm({
  open,
  mode,
  profesor,
  accessKey,
  onSaved,
  onOpenChange,
}: ProfessorFormProps) {
  const [formData, setFormData] = useState<Profesor>(getEmptyProfesor());
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del profesor al abrir el modal en modo edit
  useEffect(() => {
    if (open) {
      setFormData(profesor ? { ...profesor } : getEmptyProfesor());
    }
  }, [open, profesor]);

  // === Helpers para actualizar campos ===

  function updateField<K extends keyof Profesor>(field: K, value: Profesor[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function updateSocial(field: keyof NonNullable<Profesor["social"]>, value: string) {
    setFormData((prev) => ({
      ...prev,
      social: { ...prev.social, [field]: value },
    }));
  }

  function toggleArea(areaCode: string) {
    setFormData((prev) => {
      const areas = prev.area || [];
      const newAreas = areas.includes(areaCode)
        ? areas.filter((a) => a !== areaCode)
        : [...areas, areaCode];
      return { ...prev, area: newAreas };
    });
  }

  // === Helpers para listas dinámicas (educacion, publicaciones, etc.) ===

  function updateListItem(
    field: "educacion" | "publicaciones" | "proyectos" | "areas_investigacion",
    index: number,
    value: string
  ) {
    setFormData((prev) => {
      const list = [...(prev[field] || [])];
      list[index] = value;
      return { ...prev, [field]: list };
    });
  }

  function addListItem(
    field: "educacion" | "publicaciones" | "proyectos" | "areas_investigacion"
  ) {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ""],
    }));
  }

  function removeListItem(
    field: "educacion" | "publicaciones" | "proyectos" | "areas_investigacion",
    index: number
  ) {
    setFormData((prev) => {
      const list = [...(prev[field] || [])];
      list.splice(index, 1);
      return { ...prev, [field]: list };
    });
  }

  // === Guardar ===

  async function handleSave() {
    // Validación básica
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    if (!formData.titulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }

    setIsSaving(true);

    try {
      const isEditing = mode === "edit" && profesor?.id;
      const url = "/api/profesores";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing
        ? JSON.stringify({ id: profesor!.id, profesor: formData })
        : JSON.stringify({ profesor: formData });

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
        onSaved(data.profesor);
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
            {mode === "create" ? "Agregar profesor" : "Editar profesor"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa los datos del nuevo profesor. Los cambios se guardan en GitHub."
              : "Modifica los datos del profesor. Los cambios se guardan en GitHub."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* === FOTO (solo en modo edit) === */}
            {mode === "edit" && profesor?.id && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  Fotografía
                </h4>
                <ProfessorPhotoInput
                  profesorId={profesor.id}
                  profesorName={formData.nombre || "Profesor"}
                  currentFoto={formData.foto || ""}
                  accessKey={accessKey}
                  onFotoChange={(newFoto) => updateField("foto", newFoto)}
                />
              </div>
            )}

            {/* === DATOS BÁSICOS === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nombre">
                  Nombre completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => updateField("nombre", e.target.value)}
                  placeholder="Ej: Gema Gonzáles, Ph.D"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="titulo">
                  Título / Cargo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => updateField("titulo", e.target.value)}
                  placeholder="Ej: Decana de la Escuela..."
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="profesor@yachaytech.edu.ec"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono || ""}
                  onChange={(e) => updateField("telefono", e.target.value)}
                  placeholder="Opcional"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="oficina">Oficina</Label>
                <Input
                  id="oficina"
                  value={formData.oficina || ""}
                  onChange={(e) => updateField("oficina", e.target.value)}
                  placeholder="Ej: Decanato ECFN"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* === ÁREAS === */}
            <div className="space-y-2">
              <Label>Áreas (selecciona una o varias)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-md bg-slate-50 border border-slate-100">
                {Object.entries(PROFESSOR_AREAS).map(([code, label]) => {
                  const checked = (formData.area || []).includes(code);
                  return (
                    <label
                      key={code}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleArea(code)}
                        disabled={isSaving}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* === ÁREAS DE INVESTIGACIÓN === */}
            <DynamicListInput
              label="Áreas de investigación"
              items={formData.areas_investigacion || []}
              onChange={(i, v) => updateListItem("areas_investigacion", i, v)}
              onAdd={() => addListItem("areas_investigacion")}
              onRemove={(i) => removeListItem("areas_investigacion", i)}
              placeholder="Ej: Síntesis de materiales"
              disabled={isSaving}
            />

            {/* === BIOGRAFÍA === */}
            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                value={formData.bio || ""}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Breve biografía del profesor..."
                rows={4}
                disabled={isSaving}
              />
            </div>

            {/* === EDUCACIÓN === */}
            <DynamicListInput
              label="Educación"
              items={formData.educacion || []}
              onChange={(i, v) => updateListItem("educacion", i, v)}
              onAdd={() => addListItem("educacion")}
              onRemove={(i) => removeListItem("educacion", i)}
              placeholder="Ej: PhD en Física - Imperial College"
              disabled={isSaving}
            />

            {/* === PUBLICACIONES === */}
            <DynamicListInput
              label="Publicaciones destacadas"
              items={formData.publicaciones || []}
              onChange={(i, v) => updateListItem("publicaciones", i, v)}
              onAdd={() => addListItem("publicaciones")}
              onRemove={(i) => removeListItem("publicaciones", i)}
              placeholder="Ej: Título de la publicación (año)"
              disabled={isSaving}
            />

            {/* === PROYECTOS === */}
            <DynamicListInput
              label="Proyectos de investigación"
              items={formData.proyectos || []}
              onChange={(i, v) => updateListItem("proyectos", i, v)}
              onAdd={() => addListItem("proyectos")}
              onRemove={(i) => removeListItem("proyectos", i)}
              placeholder="Ej: Proyecto de investigación - SENESCYT"
              disabled={isSaving}
            />

            {/* === REDES SOCIALES === */}
            <div className="space-y-3">
              <Label>Redes académicas</Label>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="linkedin" className="text-xs text-slate-500">
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    value={formData.social?.linkedin || ""}
                    onChange={(e) => updateSocial("linkedin", e.target.value)}
                    placeholder="https://ec.linkedin.com/in/..."
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="google_scholar" className="text-xs text-slate-500">
                    Google Scholar
                  </Label>
                  <Input
                    id="google_scholar"
                    value={formData.social?.google_scholar || ""}
                    onChange={(e) => updateSocial("google_scholar", e.target.value)}
                    placeholder="https://scholar.google.com/..."
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="github" className="text-xs text-slate-500">
                    GitHub
                  </Label>
                  <Input
                    id="github"
                    value={formData.social?.github || ""}
                    onChange={(e) => updateSocial("github", e.target.value)}
                    placeholder="https://github.com/..."
                    disabled={isSaving}
                  />
                </div>
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
// Componente auxiliar: lista dinámica de inputs de texto
// ====================================================================

interface DynamicListInputProps {
  label: string;
  items: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

function DynamicListInput({
  label,
  items,
  onChange,
  onAdd,
  onRemove,
  placeholder,
  disabled,
}: DynamicListInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAdd}
          disabled={disabled}
          className="h-7 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Agregar
        </Button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-xs text-slate-400 italic">
            No hay elementos. Clic en "Agregar" para añadir uno.
          </p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(i)}
              disabled={disabled}
              className="flex-shrink-0 text-slate-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
