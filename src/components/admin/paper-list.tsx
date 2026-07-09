"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Calendar } from "lucide-react";
import type { Paper } from "@/lib/types";

/**
 * Lista de papers / publicaciones científicas (vista admin)
 * ===========================================
 * Muestra todos los papers en una lista responsive.
 * Cada item tiene: título (heading), autores (joined by ", "), año (badge),
 * estado de publicación (badge Published green / Draft slate) y botones
 * de editar/eliminar.
 *
 * Sigue el mismo patrón visual que paper-list.tsx y thesis-list.tsx.
 */

interface PaperListProps {
  papers: Paper[];
  onEdit: (paper: Paper) => void;
  onDelete: (paper: Paper) => void;
  onAdd: () => void;
}

export function PaperList({ papers, onEdit, onDelete, onAdd }: PaperListProps) {
  if (papers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No hay papers
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Aún no se ha agregado ninguna publicación científica. ¡Crea la primera!
          </p>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar paper
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
            {papers.length} {papers.length === 1 ? "paper" : "papers"}
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona las publicaciones científicas de los grupos de investigación.
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de papers */}
      <div className="grid grid-cols-1 gap-3">
        {papers.map((paper, i) => {
          const authors = paper.authors || [];
          return (
            <Card
              key={`${paper.title}-${i}`}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 flex items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Título */}
                  <h3 className="font-semibold text-slate-900 line-clamp-2">
                    {paper.title}
                  </h3>

                  {/* Autores */}
                  {authors.length > 0 && (
                    <p className="text-sm text-slate-600 truncate mt-0.5">
                      {authors.join(", ")}
                    </p>
                  )}

                  {/* Meta: año + estado de publicación */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {typeof paper.year === "number" && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-slate-100 text-slate-700 inline-flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        {paper.year}
                      </Badge>
                    )}
                    {paper.published ? (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Publicado
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-slate-200 text-slate-600"
                      >
                        Borrador
                      </Badge>
                    )}
                    {paper.link && (
                      <a
                        href={paper.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-500 hover:text-slate-900 underline truncate max-w-[200px]"
                        title={paper.link}
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
                    onClick={() => onEdit(paper)}
                    title="Editar"
                    className="text-slate-500 hover:text-slate-900"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(paper)}
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
