"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth, getStoredKey } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { AlbumGaleria } from "@/lib/types";
import { GalleryList } from "@/components/admin/gallery-list";
import { GalleryForm } from "@/components/admin/gallery-form";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { AdminModuleHeader } from "@/components/admin/admin-module-header";

/**
 * Página /admin/galeria — CRUD completo de álbumes de galería
 * ===========================================
 * Aquí el presidente puede gestionar los álbumes de la galería:
 * 1. Ver la lista de álbumes
 * 2. Agregar un álbum nuevo
 * 3. Editar un álbum existente (incluyendo sus fotos)
 * 4. Eliminar un álbum
 *
 * Sigue exactamente el mismo patrón que /admin/profesores, /admin/eventos
 * y /admin/clubes.
 */

export default function GaleriaAdminPage() {
  const router = useRouter();
  const { isAuthenticated, mounted } = useAdminAuth();

  const [albumes, setAlbumes] = useState<AlbumGaleria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal de crear/editar
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingAlbum, setEditingAlbum] = useState<AlbumGaleria | null>(null);

  // Estado del diálogo de confirmación de borrado
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAlbum, setDeletingAlbum] = useState<AlbumGaleria | null>(null);

  // === Cargar álbumes desde la API ===
  const loadAlbumes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/galeria");
      const data = await response.json();

      if (response.ok) {
        // Asignar IDs automáticos a álbumes que no tengan (migración suave)
        const albumesConId = (data.data || []).map((a: AlbumGaleria, i: number) => ({
          ...a,
          id:
            a.id ||
            `temp-${i}-${(a.album || "album")
              .toLowerCase()
              .replace(/\s+/g, "-")
              .slice(0, 40)}`,
        }));
        setAlbumes(albumesConId);
      } else {
        setError(data.error || data.detail || "Error al cargar álbumes.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadAlbumes();
    }
  }, [mounted, isAuthenticated, loadAlbumes]);

  // === Protección de ruta ===
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/admin");
    return null;
  }

  // === Handlers ===

  function handleAdd() {
    setFormMode("create");
    setEditingAlbum(null);
    setFormOpen(true);
  }

  function handleEdit(album: AlbumGaleria) {
    setFormMode("edit");
    setEditingAlbum(album);
    setFormOpen(true);
  }

  function handleDelete(album: AlbumGaleria) {
    setDeletingAlbum(album);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingAlbum) {
      return { success: false, message: "No hay álbum seleccionado." };
    }

    const accessKey = getStoredKey();
    if (!accessKey) {
      return { success: false, message: "Sesión expirada. Vuelve a iniciar sesión." };
    }

    try {
      const response = await fetch("/api/galeria", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body: JSON.stringify({ id: deletingAlbum.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Actualizar la lista local (sin necesidad de recargar todo)
        setAlbumes((prev) => prev.filter((a) => a.id !== deletingAlbum.id));
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || data.message };
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Error de conexión",
      };
    }
  }

  function handleSaved(savedAlbum: AlbumGaleria) {
    // Actualizar la lista local
    setAlbumes((prev) => {
      const index = prev.findIndex((a) => a.id === savedAlbum.id);
      if (index === -1) {
        // Es nuevo, agregarlo
        return [...prev, savedAlbum];
      } else {
        // Es edición, reemplazarlo
        const newList = [...prev];
        newList[index] = savedAlbum;
        return newList;
      }
    });
    setFormOpen(false);
    setEditingAlbum(null);
  }

  const accessKey = getStoredKey();

  // === Render ===

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <AdminModuleHeader title="Galería" onReload={loadAlbumes} isLoading={isLoading} />

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado de carga */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin mr-2" />
              <span className="text-slate-500">Cargando álbumes...</span>
            </CardContent>
          </Card>
        )}

        {/* Estado de error */}
        {error && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadAlbumes} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de álbumes */}
        {!isLoading && !error && (
          <GalleryList
            albumes={albumes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        )}

        {/* Nota informativa */}
        {!isLoading && !error && albumes.length > 0 && (
          <div className="mt-8 p-4 rounded-md bg-blue-50 border border-blue-100 text-sm text-blue-700">
            <strong>Nota:</strong> Los cambios se guardan automáticamente en GitHub
            como commits. El sitio público se actualiza en ~30 segundos. Si
            cometes un error, puedes revertir cualquier cambio desde el historial
            de commits en GitHub.
          </div>
        )}
      </main>

      {/* Modal de formulario (crear/editar) */}
      {accessKey && (
        <GalleryForm
          open={formOpen}
          mode={formMode}
          album={editingAlbum}
          accessKey={accessKey}
          onSaved={handleSaved}
          onOpenChange={setFormOpen}
        />
      )}

      {/* Diálogo de confirmación de borrado */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteOpen}
        title="Eliminar álbum"
        description="¿Estás seguro de que quieres eliminar este álbum? Se borrarán también todas las fotos asociadas. Esta acción no se puede deshacer desde el panel, pero el commit queda en el historial de GitHub."
        itemLabel={deletingAlbum?.album}
        confirmText="Sí, eliminar"
        onSuccess={(msg) => toast.success(msg)}
        onError={(msg) => toast.error(msg)}
      />
    </div>
  );
}
