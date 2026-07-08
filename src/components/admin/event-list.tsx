"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Calendar, MapPin, ExternalLink } from "lucide-react";
import type { Evento } from "@/lib/types";

/**
 * Lista de eventos (vista admin)
 * ===========================================
 * Muestra todos los eventos en una lista responsive.
 * Cada item tiene: título, fecha, tipo (badge), estado (badge), ubicación
 * y botones de editar/eliminar.
 *
 * 📚 Concepto: Badges con colores semánticos
 * Usamos colores distintos según el tipo y estado del evento:
 * - Tipo: cada categoría tiene su color (slate, emerald, amber, etc.)
 * - Estado: proximo=verde, en-curso=amarillo, finalizado=gris, cancelado=rojo
 * Esto permite al usuario identificar visualmente el estado de un vistazo.
 */

interface EventListProps {
  eventos: Evento[];
  onEdit: (evento: Evento) => void;
  onDelete: (evento: Evento) => void;
  onAdd: () => void;
}

/** Opciones de tipo de evento disponibles (código → label legible) */
const EVENT_TIPOS: Record<string, string> = {
  reunion: "Reunión",
  seminario: "Seminario",
  taller: "Taller",
  charla: "Charla",
  congreso: "Congreso",
  otro: "Otro",
};

/** Clases Tailwind para el badge según el tipo de evento */
const TIPO_BADGE_CLASS: Record<string, string> = {
  reunion: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  seminario: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  taller: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  charla: "bg-sky-100 text-sky-700 hover:bg-sky-100",
  congreso: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  otro: "bg-slate-100 text-slate-700 hover:bg-slate-100",
};

/** Opciones de estado de evento (código → label legible) */
const EVENT_ESTADOS: Record<string, string> = {
  proximo: "Próximo",
  "en-curso": "En curso",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

/** Clases Tailwind para el badge según el estado del evento */
const ESTADO_BADGE_CLASS: Record<string, string> = {
  proximo: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  "en-curso": "bg-amber-100 text-amber-800 hover:bg-amber-100",
  finalizado: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  cancelado: "bg-red-100 text-red-700 hover:bg-red-100",
};

/**
 * Formatea una fecha ISO ("2025-09-02T10:00:00") como "2 sept 2025, 10:00".
 * Usa locale español (Ecuador).
 */
function formatEventDate(fecha: string): string {
  if (!fecha) return "Sin fecha";
  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return fecha;
    return (
      date.toLocaleDateString("es-EC", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  } catch {
    return fecha;
  }
}

export function EventList({ eventos, onEdit, onDelete, onAdd }: EventListProps) {
  if (eventos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No hay eventos
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Aún no se ha agregado ningún evento al calendario. ¡Crea el primero!
          </p>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar evento
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header con botón agregar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {eventos.length} {eventos.length === 1 ? "evento" : "eventos"}
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona los eventos del calendario académico de la asociación.
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de eventos */}
      <div className="grid grid-cols-1 gap-3">
        {eventos.map((evento) => {
          const tipoLabel = EVENT_TIPOS[evento.tipo || "otro"] || evento.tipo || "Otro";
          const estadoLabel =
            EVENT_ESTADOS[evento.estado || "proximo"] || evento.estado || "Próximo";
          const tipoBadgeClass =
            TIPO_BADGE_CLASS[evento.tipo || "otro"] || TIPO_BADGE_CLASS.otro;
          const estadoBadgeClass =
            ESTADO_BADGE_CLASS[evento.estado || "proximo"] || ESTADO_BADGE_CLASS.proximo;

          return (
            <Card
              key={evento.id || evento.titulo}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 flex items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Badges de tipo y estado */}
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <Badge className={tipoBadgeClass}>{tipoLabel}</Badge>
                    <Badge className={estadoBadgeClass}>{estadoLabel}</Badge>
                  </div>

                  {/* Título */}
                  <h3 className="font-semibold text-slate-900 truncate">
                    {evento.titulo}
                  </h3>

                  {/* Descripción (opcional, truncada a 1 línea) */}
                  {evento.descripcion && (
                    <p className="text-sm text-slate-500 truncate">
                      {evento.descripcion}
                    </p>
                  )}

                  {/* Meta: fecha y ubicación */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatEventDate(evento.fecha)}
                    </span>
                    {evento.ubicacion && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {evento.ubicacion}
                      </span>
                    )}
                    {evento.link && (
                      <a
                        href={evento.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Enlace
                      </a>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(evento)}
                    title="Editar"
                    className="text-slate-500 hover:text-slate-900"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(evento)}
                    title="Eliminar"
                    className="text-slate-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
