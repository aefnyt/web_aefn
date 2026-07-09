"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Image as ImageIcon, Calendar } from "lucide-react";
import type { AlbumGaleria } from "@/lib/types";

/**
 * Lista de álbumes de galería (vista admin)
 * ===========================================
 * Muestra todos los álbumes en una lista responsive.
 * Cada item tiene: nombre, categoría (badge), fecha, descripción truncada,
 * número de fotos y botones de editar/eliminar.
 *
 * 📚 Concepto: Gestión a nivel de álbum
 * A diferencia de otros módulos, aquí el recurso editable es el ÁLBUM (no las
 * fotos individuales). Cada álbum agrupa varias fotos con sus metadatos.
 */

interface GalleryListProps {
  albumes: AlbumGaleria[];
  onEdit: (album: AlbumGaleria) => void;
  onDelete: (album: AlbumGaleria) => void;
  onAdd: () => void;
}

/**
 * Formatea una fecha ISO ("2025-12-01") como "1 dic 2025".
 * Usa locale español (Ecuador).
 */
function formatAlbumDate(fecha?: string): string | null {
  if (!fecha) return null;
  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return fecha;
    return date.toLocaleDateString("es-EC", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return fecha;
  }
}

export function GalleryList({ albumes, onEdit, onDelete, onAdd }: GalleryListProps) {
  if (albumes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No hay álbumes
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Aún no se ha agregado ningún álbum a la galería. ¡Crea el primero!
          </p>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar álbum
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
            {albumes.length} {albumes.length === 1 ? "álbum" : "álbumes"}
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona los álbumes y sus fotos.
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de álbumes */}
      <div className="grid grid-cols-1 gap-3">
        {albumes.map((album) => {
          const fechaFormateada = formatAlbumDate(album.date);
          const numFotos = Array.isArray(album.photos) ? album.photos.length : 0;

          return (
            <Card
              key={album.id || album.album}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 flex items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Categoría (badge) */}
                  {album.category && (
                    <div className="mb-1.5">
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                        {album.category}
                      </Badge>
                    </div>
                  )}

                  {/* Nombre del álbum */}
                  <h3 className="font-semibold text-slate-900 truncate">
                    {album.album}
                  </h3>

                  {/* Descripción (truncada a 2 líneas) */}
                  {album.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">
                      {album.description}
                    </p>
                  )}

                  {/* Meta: fecha y número de fotos */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                    {fechaFormateada && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {fechaFormateada}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      {numFotos} {numFotos === 1 ? "foto" : "fotos"}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(album)}
                    title="Editar"
                    className="text-slate-500 hover:text-slate-900"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(album)}
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
