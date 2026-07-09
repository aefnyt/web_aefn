"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Mail, Plus, Users } from "lucide-react";
import type { Club } from "@/lib/types";

/**
 * Lista de clubes (vista admin)
 * ===========================================
 * Muestra todos los clubes estudiantiles en una lista responsive.
 * Cada item tiene: icono (como texto), nombre, descripción truncada,
 * email de contacto (si existe) y botones de editar/eliminar.
 *
 * 📚 Concepto: Iconos Bootstrap en JSON
 * El JSON original usa clases de Bootstrap Icons (ej: "bi-stars"). En el
 * panel admin no cargamos Bootstrap Icons, así que mostramos el nombre de
 * la clase como texto dentro de un badge slate. El sitio público sí sabe
 * renderizar estas clases porque incluye la hoja de estilos de Bootstrap.
 */

interface ClubListProps {
  clubes: Club[];
  onEdit: (club: Club) => void;
  onDelete: (club: Club) => void;
  onAdd: () => void;
}

export function ClubList({ clubes, onEdit, onDelete, onAdd }: ClubListProps) {
  if (clubes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No hay clubes
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Aún no se ha agregado ningún club estudiantil. ¡Crea el primero!
          </p>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar club
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
            {clubes.length} {clubes.length === 1 ? "club" : "clubes"}
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona los clubes estudiantiles de la asociación.
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de clubes */}
      <div className="grid grid-cols-1 gap-3">
        {clubes.map((club) => (
          <Card
            key={club.id || club.nombre}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4 flex items-start gap-4">
              {/* Icono (mostramos la clase Bootstrap Icons como texto) */}
              <div className="flex-shrink-0 mt-0.5">
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-600 font-mono text-xs px-2 py-1"
                  title="Clase Bootstrap Icons"
                >
                  {club.icono || "bi-people"}
                </Badge>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Nombre */}
                <h3 className="font-semibold text-slate-900 truncate">
                  {club.nombre}
                </h3>

                {/* Descripción corta (truncada a 2 líneas) */}
                {club.descripcion && (
                  <p className="text-sm text-slate-600 line-clamp-2 mt-0.5">
                    {club.descripcion}
                  </p>
                )}

                {/* Meta: miembros de directiva + email de contacto */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                  {club.directiva && club.directiva.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {club.directiva.length}{" "}
                      {club.directiva.length === 1
                        ? "miembro de directiva"
                        : "miembros de directiva"}
                    </span>
                  )}
                  {club.contacto_email && (
                    <span className="inline-flex items-center gap-1 truncate max-w-full">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{club.contacto_email}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(club)}
                  title="Editar"
                  className="text-slate-500 hover:text-slate-900"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(club)}
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
