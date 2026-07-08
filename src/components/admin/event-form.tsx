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
import type { Evento } from "@/lib/types";

/**
 * Formulario de evento (Crear / Editar)
 * ===========================================
 * Modal con todos los campos de un evento:
 * - Título (obligatorio)
 * - Descripción (textarea, opcional)
 * - Fecha y hora (datetime-local, obligatorio)
 * - Ubicación (texto, opcional)
 * - Tipo (select: reunion, seminario, taller, charla, congreso, otro)
 * - Estado (select: proximo, en-curso, finalizado, cancelado)
 * - Link (texto, opcional — para URL del evento como Zoom/Meet)
 *
 * 📚 Concepto: input type="datetime-local"
 * Es un input nativo de HTML que permite elegir fecha y hora en una sola pieza.
 * El valor que maneja es un string con formato "YYYY-MM-DDTHH:mm" (o "YYYY-MM-DDTHH:mm:ss").
 * Lo guardamos tal cual en el JSON porque ya es un formato ISO válido y fácil de leer.
 */

interface EventFormProps {
  /** True para mostrar el modal */
  open: boolean;
  /** Modo: "create" o "edit" */
  mode: "create" | "edit";
  /** Evento a editar (null en modo create) */
  evento?: Evento | null;
  /** Clave de acceso */
  accessKey: string;
  /** Callback cuando se guarda exitosamente */
  onSaved: (evento: Evento) => void;
  /** Callback para cerrar el modal */
  onOpenChange: (open: boolean) => void;
}

/** Opciones de tipo de evento (código → label legible) */
const TIPO_OPCIONES: Array<{ value: string; label: string }> = [
  { value: "reunion", label: "Reunión" },
  { value: "seminario", label: "Seminario" },
  { value: "taller", label: "Taller" },
  { value: "charla", label: "Charla" },
  { value: "congreso", label: "Congreso" },
  { value: "otro", label: "Otro" },
];

/** Opciones de estado de evento (código → label legible) */
const ESTADO_OPCIONES: Array<{ value: string; label: string }> = [
  { value: "proximo", label: "Próximo" },
  { value: "en-curso", label: "En curso" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
];

/**
 * Estado inicial del formulario (todos los campos vacíos/por defecto).
 * La fecha por defecto es hoy a las 10:00 local para que el usuario no
 * tenga que escribir todo desde cero.
 */
function getEmptyEvento(): Evento {
  // Generar fecha por defecto: hoy a las 10:00 en formato datetime-local
  const ahora = new Date();
  ahora.setHours(10, 0, 0, 0);
  const fechaDefault = toDatetimeLocalValue(ahora.toISOString());

  return {
    id: "",
    titulo: "",
    descripcion: "",
    fecha: fechaDefault,
    ubicacion: "",
    tipo: "reunion",
    estado: "proximo",
    link: "",
  };
}

/**
 * Convierte un ISO string ("2025-09-02T10:00:00.000Z") al formato
 * que espera el input datetime-local ("2025-09-02T10:00").
 * El input no acepta segundos ni milisegundos.
 */
function toDatetimeLocalValue(iso: string): string {
  if (!iso) return "";
  // Tomar hasta los minutos (16 caracteres): "YYYY-MM-DDTHH:mm"
  return iso.slice(0, 16);
}

export function EventForm({
  open,
  mode,
  evento,
  accessKey,
  onSaved,
  onOpenChange,
}: EventFormProps) {
  const [formData, setFormData] = useState<Evento>(getEmptyEvento());
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del evento al abrir el modal en modo edit
  useEffect(() => {
    if (open) {
      if (evento) {
        // Modo edit: copiar datos del evento y normalizar fecha al formato del input
        setFormData({
          ...evento,
          descripcion: evento.descripcion || "",
          ubicacion: evento.ubicacion || "",
          tipo: evento.tipo || "otro",
          estado: evento.estado || "proximo",
          link: evento.link || "",
          fecha: toDatetimeLocalValue(evento.fecha),
        });
      } else {
        // Modo create: formulario vacío
        setFormData(getEmptyEvento());
      }
    }
  }, [open, evento]);

  // === Helper para actualizar campos ===
  function updateField<K extends keyof Evento>(field: K, value: Evento[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // === Guardar ===
  async function handleSave() {
    // Validación básica
    if (!formData.titulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }
    if (!formData.fecha) {
      toast.error("La fecha y hora son obligatorias.");
      return;
    }

    setIsSaving(true);

    try {
      const isEditing = mode === "edit" && evento?.id;
      const url = "/api/eventos";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing
        ? JSON.stringify({ id: evento!.id, evento: formData })
        : JSON.stringify({ evento: formData });

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
        onSaved(data.evento);
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
            {mode === "create" ? "Agregar evento" : "Editar evento"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa los datos del nuevo evento. Los cambios se guardan en GitHub."
              : "Modifica los datos del evento. Los cambios se guardan en GitHub."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 pt-4 space-y-5">
            {/* === TÍTULO === */}
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => updateField("titulo", e.target.value)}
                placeholder="Ej: Asamblea General AEFN"
                disabled={isSaving}
              />
            </div>

            {/* === FECHA Y UBICACIÓN === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">
                  Fecha y hora <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fecha"
                  type="datetime-local"
                  value={formData.fecha}
                  onChange={(e) => updateField("fecha", e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input
                  id="ubicacion"
                  value={formData.ubicacion || ""}
                  onChange={(e) => updateField("ubicacion", e.target.value)}
                  placeholder="Ej: ECFN - Yachay Tech"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* === TIPO Y ESTADO === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de evento</Label>
                <Select
                  value={formData.tipo || "otro"}
                  onValueChange={(v) => updateField("tipo", v)}
                  disabled={isSaving}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_OPCIONES.map((opcion) => (
                      <SelectItem key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado || "proximo"}
                  onValueChange={(v) => updateField("estado", v)}
                  disabled={isSaving}
                >
                  <SelectTrigger id="estado">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADO_OPCIONES.map((opcion) => (
                      <SelectItem key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* === DESCRIPCIÓN === */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion || ""}
                onChange={(e) => updateField("descripcion", e.target.value)}
                placeholder="Información adicional sobre el evento (expositor, agenda, etc.)..."
                rows={4}
                disabled={isSaving}
              />
            </div>

            {/* === LINK === */}
            <div className="space-y-2">
              <Label htmlFor="link">Enlace del evento</Label>
              <Input
                id="link"
                type="url"
                value={formData.link || ""}
                onChange={(e) => updateField("link", e.target.value)}
                placeholder="Ej: https://meet.google.com/... o https://zoom.us/j/..."
                disabled={isSaving}
              />
              <p className="text-xs text-slate-500">
                Enlace para reuniones virtuales (Zoom, Meet) o página del evento.
              </p>
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
