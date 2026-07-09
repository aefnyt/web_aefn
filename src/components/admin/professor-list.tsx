"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Mail, Plus } from "lucide-react";
import { PROFESSOR_AREAS, type Profesor } from "@/lib/types";

/**
 * Lista de profesores (tabla tipo cards)
 * ===========================================
 * Muestra todos los profesores en una lista responsive.
 * Cada item tiene: foto, nombre, título, áreas (badges), email, y botones
 * de editar/eliminar.
 *
 * 📚 Concepto: Renderizado de listas en React
 * Para mostrar una lista de elementos, usamos .map() para transformar
 * cada item del array en un elemento JSX. React necesita una "key" única
 * por cada elemento para optimizar el renderizado.
 */

interface ProfessorListProps {
  profesores: Profesor[];
  onEdit: (profesor: Profesor) => void;
  onDelete: (profesor: Profesor) => void;
  onAdd: () => void;
}

/** Genera iniciales: "Gema Gonzáles, Ph.D" → "GG" */
function getInitials(name: string): string {
  const cleanName = name.replace(/,.*$/, "").trim();
  const parts = cleanName.split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Traduce código de área a label legible */
function getAreaLabel(code: string): string {
  return PROFESSOR_AREAS[code] || code;
}

export function ProfessorList({ profesores, onEdit, onDelete, onAdd }: ProfessorListProps) {
  if (profesores.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No hay profesores
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Aún no se ha agregado ningún profesor. ¡Sé el primero!
          </p>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar profesor
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
            {profesores.length} {profesores.length === 1 ? "profesor" : "profesores"}
          </h2>
          <p className="text-sm text-slate-500">
            Edita o elimina profesores existentes, o agrega nuevos.
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de profesores */}
      <div className="grid grid-cols-1 gap-3">
        {profesores.map((profesor) => (
          <Card
            key={profesor.id || profesor.nombre}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4 flex items-center gap-4">
              {/* Avatar */}
              <Avatar className="w-14 h-14 flex-shrink-0 border border-slate-200">
                <AvatarImage
                  src={profesor.foto ? `/${profesor.foto}` : undefined}
                  alt={profesor.nombre}
                />
                <AvatarFallback className="bg-slate-100 text-slate-500 text-sm font-semibold">
                  {getInitials(profesor.nombre)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {profesor.nombre}
                </h3>
                <p className="text-sm text-slate-600 truncate">{profesor.titulo}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(profesor.area || []).map((areaCode) => (
                    <Badge
                      key={areaCode}
                      variant="secondary"
                      className="text-xs bg-slate-100 text-slate-700"
                    >
                      {getAreaLabel(areaCode)}
                    </Badge>
                  ))}
                  {profesor.email && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 ml-1">
                      <Mail className="w-3 h-3" />
                      {profesor.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(profesor)}
                  title="Editar"
                  className="text-slate-500 hover:text-slate-900"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(profesor)}
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
