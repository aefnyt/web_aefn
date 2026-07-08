"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Users, FolderKanban } from "lucide-react";
import type { GrupoInvestigacion } from "@/lib/types";

/**
 * Lista de grupos de investigación (vista admin)
 * ===========================================
 * Muestra todos los grupos en una lista responsive.
 * Cada item tiene: título, descripción corta (truncada), número de
 * participantes (icono Users) y número de proyectos (icono FolderKanban).
 * Botones de editar/eliminar a la derecha.
 *
 * Sigue el mismo patrón visual que club-list.tsx y gallery-list.tsx.
 */

interface GroupListProps {
  grupos: GrupoInvestigacion[];
  onEdit: (grupo: GrupoInvestigacion) => void;
  onDelete: (grupo: GrupoInvestigacion) => void;
  onAdd: () => void;
}

export function GroupList({ grupos, onEdit, onDelete, onAdd }: GroupListProps) {
  if (grupos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No hay grupos de investigación
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Aún no se ha agregado ningún grupo. ¡Crea el primero!
          </p>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar grupo
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
            {grupos.length} {grupos.length === 1 ? "grupo" : "grupos"}
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona los grupos de investigación, sus participantes y proyectos.
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de grupos */}
      <div className="grid grid-cols-1 gap-3">
        {grupos.map((grupo) => {
          const participantes = grupo.participants || [];
          const proyectos = grupo.projects || [];
          return (
            <Card
              key={grupo.id || grupo.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 flex items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Título */}
                  <h3 className="font-semibold text-slate-900 truncate">
                    {grupo.title}
                  </h3>

                  {/* Descripción corta (truncada a 2 líneas) */}
                  {grupo.short_description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mt-0.5">
                      {grupo.short_description}
                    </p>
                  )}

                  {/* Meta: participantes + proyectos */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {participantes.length}{" "}
                      {participantes.length === 1
                        ? "participante"
                        : "participantes"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FolderKanban className="w-3.5 h-3.5" />
                      {proyectos.length}{" "}
                      {proyectos.length === 1 ? "proyecto" : "proyectos"}
                    </span>
                    {grupo.contact_email && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-slate-100 text-slate-600"
                      >
                        {grupo.contact_email}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(grupo)}
                    title="Editar"
                    className="text-slate-500 hover:text-slate-900"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(grupo)}
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
