"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { NEWS_CATEGORIES } from "@/lib/config";
import type { Noticia, NewsCategory } from "@/lib/types";
import { NewsImageInput } from "./news-image-input";

/**
 * Formulario de noticia (Crear / Editar)
 * ===========================================
 * Modal con todos los campos:
 * - Imagen principal (subir/reemplazar/eliminar — solo en modo edit)
 * - Título (obligatorio)
 * - Fecha (obligatorio, por defecto hoy)
 * - Autor (por defecto "AEFN")
 * - Categoría (select con las 9 categorías)
 * - Resumen corto (máx 200 caracteres recomendados)
 * - Contenido completo (Markdown)
 * - Etiquetas (lista dinámica de chips)
 * - Destacada (checkbox)
 * - Publicada (checkbox)
 *
 * 📚 Concepto: Markdown
 * Markdown es un formato de texto simple para escribir contenido con formato.
 * Ej: **negrita**, *cursiva*, [enlace](url), ## subtítulo, - lista.
 * Lo guardamos como texto plano en el JSON, y al mostrar la noticia pública
 * lo convertimos a HTML con react-markdown.
 */

interface NewsFormProps {
  open: boolean;
  mode: "create" | "edit";
  noticia?: Noticia | null;
  accessKey: string;
  onSaved: (noticia: Noticia) => void;
  onOpenChange: (open: boolean) => void;
}

function getEmptyNoticia(): Noticia {
  return {
    id: "",
    titulo: "",
    resumen: "",
    contenido: "",
    imagen: undefined,
    fecha: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    autor: "AEFN",
    categoria: "otra",
    etiquetas: [],
    destacada: false,
    publicada: true,
    creadaEn: "",
    actualizadaEn: "",
  };
}

export function NewsForm({
  open,
  mode,
  noticia,
  accessKey,
  onSaved,
  onOpenChange,
}: NewsFormProps) {
  const [formData, setFormData] = useState<Noticia>(getEmptyNoticia());
  const [isSaving, setIsSaving] = useState(false);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");

  useEffect(() => {
    if (open) {
      setFormData(noticia ? { ...noticia } : getEmptyNoticia());
      setNuevaEtiqueta("");
    }
  }, [open, noticia]);

  function updateField<K extends keyof Noticia>(field: K, value: Noticia[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function addEtiqueta() {
    const tag = nuevaEtiqueta.trim().toLowerCase();
    if (!tag) return;
    if ((formData.etiquetas || []).includes(tag)) {
      toast.info("Esa etiqueta ya existe.");
      return;
    }
    updateField("etiquetas", [...(formData.etiquetas || []), tag]);
    setNuevaEtiqueta("");
  }

  function removeEtiqueta(tag: string) {
    updateField(
      "etiquetas",
      (formData.etiquetas || []).filter((t) => t !== tag)
    );
  }

  async function handleSave() {
    if (!formData.titulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }
    if (!formData.contenido.trim()) {
      toast.error("El contenido es obligatorio.");
      return;
    }
    if (!formData.fecha) {
      toast.error("La fecha es obligatoria.");
      return;
    }

    setIsSaving(true);

    try {
      const isEditing = mode === "edit" && noticia?.id;
      const response = await fetch("/api/noticias", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body: JSON.stringify(
          isEditing
            ? { id: noticia!.id, noticia: formData }
            : { noticia: formData }
        ),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        onSaved(data.noticia);
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
            {mode === "create" ? "Nueva noticia" : "Editar noticia"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crea una nueva noticia para publicar en el sitio."
              : "Edita los datos de la noticia."}
            {formData.destacada && (
              <span className="block mt-1 text-amber-600 font-medium">
                ⭐ Esta noticia está marcada como destacada
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 pt-4 space-y-5">
            {/* === IMAGEN (solo en modo edit) === */}
            {mode === "edit" && noticia?.id && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  Imagen principal
                </h4>
                <NewsImageInput
                  noticiaId={noticia.id}
                  currentImagen={formData.imagen}
                  accessKey={accessKey}
                  onImagenChange={(img) => updateField("imagen", img)}
                />
              </div>
            )}

            {/* === TÍTULO === */}
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => updateField("titulo", e.target.value)}
                placeholder="Ej: Estudiante gana premio nacional de física"
                disabled={isSaving}
              />
            </div>

            {/* === FECHA Y AUTOR === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">
                  Fecha de publicación <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => updateField("fecha", e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="autor">Autor</Label>
                <Input
                  id="autor"
                  value={formData.autor}
                  onChange={(e) => updateField("autor", e.target.value)}
                  placeholder="AEFN"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* === CATEGORÍA === */}
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={formData.categoria}
                onValueChange={(v) => updateField("categoria", v as NewsCategory)}
                disabled={isSaving}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NEWS_CATEGORIES).map(([slug, label]) => (
                    <SelectItem key={slug} value={slug}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* === RESUMEN === */}
            <div className="space-y-2">
              <Label htmlFor="resumen">
                Resumen corto{" "}
                <span className="text-xs text-slate-400">
                  ({(formData.resumen || "").length}/200)
                </span>
              </Label>
              <Textarea
                id="resumen"
                value={formData.resumen}
                onChange={(e) => updateField("resumen", e.target.value)}
                placeholder="Una o dos frases que aparezcan en la lista de noticias..."
                rows={2}
                maxLength={300}
                disabled={isSaving}
              />
            </div>

            {/* === CONTENIDO === */}
            <div className="space-y-2">
              <Label htmlFor="contenido">
                Contenido completo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="contenido"
                value={formData.contenido}
                onChange={(e) => updateField("contenido", e.target.value)}
                placeholder="Escribe el contenido en formato Markdown...&#10;&#10;**Negrita**, *cursiva*, [enlace](url), ## Subtítulo, - Lista"
                rows={10}
                className="font-mono text-sm"
                disabled={isSaving}
              />
              <p className="text-xs text-slate-500">
                Puedes usar Markdown: <code>**negrita**</code>,{" "}
                <code>*cursiva*</code>, <code>[texto](url)</code>,{" "}
                <code>## subtítulo</code>, <code>- lista</code>
              </p>
            </div>

            {/* === ETIQUETAS === */}
            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <div className="flex gap-2">
                <Input
                  value={nuevaEtiqueta}
                  onChange={(e) => setNuevaEtiqueta(e.target.value)}
                  placeholder="Escribe una etiqueta y presiona +"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEtiqueta();
                    }
                  }}
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addEtiqueta}
                  disabled={isSaving || !nuevaEtiqueta.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {(formData.etiquetas || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(formData.etiquetas || []).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-slate-100 text-slate-700 gap-1 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeEtiqueta(tag)}
                        disabled={isSaving}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* === DESTACADA Y PUBLICADA === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.destacada}
                  onCheckedChange={(v) => updateField("destacada", v === true)}
                  disabled={isSaving}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-medium">Mostrar como destacada ⭐</span>
                  <p className="text-xs text-slate-500">
                    Solo una noticia puede estar destacada a la vez. Las demás se desmarcan automáticamente.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.publicada}
                  onCheckedChange={(v) => updateField("publicada", v === true)}
                  disabled={isSaving}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-medium">Publicada</span>
                  <p className="text-xs text-slate-500">
                    Si no está marcada, la noticia existe pero no se muestra en el sitio público (borrador).
                  </p>
                </div>
              </label>
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
              "Guardar noticia"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
