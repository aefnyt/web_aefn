"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Star, Calendar, Eye, EyeOff } from "lucide-react";
import { NEWS_CATEGORIES } from "@/lib/config";
import type { Noticia } from "@/lib/types";

/**
 * Lista de noticias (vista admin)
 * ===========================================
 * Muestra las noticias en una tabla con columnas:
 * - Imagen miniatura
 * - Título + categoría
 * - Fecha
 * - Estado (publicada/borrador)
 * - Destacada (estrella)
 * - Acciones (editar, eliminar)
 */

interface NewsListProps {
  noticias: Noticia[];
  onEdit: (noticia: Noticia) => void;
  onDelete: (noticia: Noticia) => void;
  onAdd: () => void;
}

function formatDate(fecha: string): string {
  try {
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return fecha;
  }
}

export function NewsList({ noticias, onEdit, onDelete, onAdd }: NewsListProps) {
  if (noticias.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No hay noticias
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Aún no se ha publicado ninguna noticia. ¡Crea la primera!
          </p>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva noticia
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
            {noticias.length} {noticias.length === 1 ? "noticia" : "noticias"}
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona las noticias que se muestran en el sitio público.
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva noticia
        </Button>
      </div>

      {/* Lista de noticias */}
      <div className="grid grid-cols-1 gap-3">
        {noticias.map((noticia) => {
          const categoriaLabel = NEWS_CATEGORIES[noticia.categoria] || noticia.categoria;
          return (
            <Card
              key={noticia.id}
              className="hover:shadow-md transition-shadow overflow-hidden"
            >
              <CardContent className="p-4 flex items-center gap-4">
                {/* Miniatura */}
                <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                  {noticia.imagen ? (
                    <img
                      src={`/${noticia.imagen}`}
                      alt={noticia.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Plus className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {noticia.destacada && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Destacada
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {categoriaLabel}
                    </Badge>
                    {noticia.publicada ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1">
                        <Eye className="w-3 h-3" />
                        Publicada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-slate-500">
                        <EyeOff className="w-3 h-3" />
                        Borrador
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 truncate">
                    {noticia.titulo}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">
                    {noticia.resumen || "(sin resumen)"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(noticia.fecha)}
                    </span>
                    <span>por {noticia.autor || "AEFN"}</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(noticia)}
                    title="Editar"
                    className="text-slate-500 hover:text-slate-900"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(noticia)}
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
