"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Calendar, User } from "lucide-react";
import type { Tesis } from "@/lib/types";

/**
 * Lista de tesis (vista admin)
 * ===========================================
 * Muestra todas las tesis en una lista responsive.
 * Cada item tiene: título (heading), autor, año (badge), estado
 * ("en curso" amber / "defendida" emerald) y botones de editar/eliminar.
 *
 * Sigue el mismo patrón visual que paper-list.tsx.
 */

interface ThesisListProps {
  tesis: Tesis[];
  onEdit: (tesis: Tesis) => void;
  onDelete: (tesis: Tesis) => void;
  onAdd: () => void;
}

/** Clases Tailwind según el estado de la tesis */
function getStatusBadgeClass(status?: string): string {
  if (status === "defendida") {
    return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
  }
  // "en curso" u otros
  return "bg-amber-100 text-amber-700 hover:bg-amber-100";
}

/** Texto legible del estado */
function getStatusLabel(status?: string): string {
  if (status === "defendida") return "Defendida";
  if (status === "en curso") return "En curso";
  return status || "En curso";
}

export function ThesisList({ tesis, onEdit, onDelete, onAdd }: ThesisListProps) {
  if (tesis.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No hay tesis
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Aún no se ha agregado ninguna tesis. ¡Crea la primera!
          </p>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar tesis
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
            {tesis.length} {tesis.length === 1 ? "tesis" : "tesis"}
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona las tesis de los grupos de investigación.
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de tesis */}
      <div className="grid grid-cols-1 gap-3">
        {tesis.map((t, i) => (
          <Card
            key={`${t.title}-${i}`}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4 flex items-start gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Título */}
                <h3 className="font-semibold text-slate-900 line-clamp-2">
                  {t.title}
                </h3>

                {/* Autor */}
                {t.author && (
                  <p className="text-sm text-slate-600 truncate mt-0.5 inline-flex items-center gap-1">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{t.author}</span>
                  </p>
                )}

                {/* Meta: año + estado */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {typeof t.year === "number" && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-slate-100 text-slate-700 inline-flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      {t.year}
                    </Badge>
                  )}
                  <Badge className={`text-xs ${getStatusBadgeClass(t.status)}`}>
                    {getStatusLabel(t.status)}
                  </Badge>
                  {t.link && (
                    <a
                      href={t.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-slate-900 underline truncate max-w-[200px]"
                      title={t.link}
                    >
                      Ver enlace
                    </a>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(t)}
                  title="Editar"
                  className="text-slate-500 hover:text-slate-900"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(t)}
                  title="Eliminar"
                  className="text-slate-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
