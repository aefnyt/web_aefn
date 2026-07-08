"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth, getStoredKey } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Club } from "@/lib/types";
import { ClubList } from "@/components/admin/club-list";
import { ClubForm } from "@/components/admin/club-form";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { AdminModuleHeader } from "@/components/admin/admin-module-header";

/**
 * Página /admin/clubes — CRUD completo de clubes
 * ===========================================
 * Aquí el presidente puede gestionar los clubes estudiantiles de la asociación:
 * 1. Ver la lista de clubes
 * 2. Agregar un club nuevo
 * 3. Editar un club existente (incluyendo su directiva y actividades)
 * 4. Eliminar un club
 *
 * Sigue exactamente el mismo patrón que /admin/profesores y /admin/eventos.
 */

export default function ClubesAdminPage() {
  const router = useRouter();
  const { isAuthenticated, mounted } = useAdminAuth();

  const [clubes, setClubes] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal de crear/editar
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingClub, setEditingClub] = useState<Club | null>(null);

  // Estado del diálogo de confirmación de borrado
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingClub, setDeletingClub] = useState<Club | null>(null);

  // === Cargar clubes desde la API ===
  const loadClubes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/clubes");
      const data = await response.json();

      if (response.ok) {
        // Asignar IDs automáticos a clubes que no tengan (migración suave)
        const clubesConId = (data.data || []).map((c: Club, i: number) => ({
          ...c,
          id:
            c.id ||
            `temp-${i}-${(c.nombre || "club")
              .toLowerCase()
              .replace(/\s+/g, "-")
              .slice(0, 40)}`,
        }));
        setClubes(clubesConId);
      } else {
        setError(data.error || data.detail || "Error al cargar clubes.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadClubes();
    }
  }, [mounted, isAuthenticated, loadClubes]);

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
    setEditingClub(null);
    setFormOpen(true);
  }

  function handleEdit(club: Club) {
    setFormMode("edit");
    setEditingClub(club);
    setFormOpen(true);
  }

  function handleDelete(club: Club) {
    setDeletingClub(club);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingClub) {
      return { success: false, message: "No hay club seleccionado." };
    }

    const accessKey = getStoredKey();
    if (!accessKey) {
      return { success: false, message: "Sesión expirada. Vuelve a iniciar sesión." };
    }

    try {
      const response = await fetch("/api/clubes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body: JSON.stringify({ id: deletingClub.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Actualizar la lista local (sin necesidad de recargar todo)
        setClubes((prev) => prev.filter((c) => c.id !== deletingClub.id));
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

  function handleSaved(savedClub: Club) {
    // Actualizar la lista local
    setClubes((prev) => {
      const index = prev.findIndex((c) => c.id === savedClub.id);
      if (index === -1) {
        // Es nuevo, agregarlo
        return [...prev, savedClub];
      } else {
        // Es edición, reemplazarlo
        const newList = [...prev];
        newList[index] = savedClub;
        return newList;
      }
    });
    setFormOpen(false);
    setEditingClub(null);
  }

  const accessKey = getStoredKey();

  // === Render ===

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <AdminModuleHeader title="Clubes" onReload={loadClubes} isLoading={isLoading} />

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado de carga */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin mr-2" />
              <span className="text-slate-500">Cargando clubes...</span>
            </CardContent>
          </Card>
        )}

        {/* Estado de error */}
        {error && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadClubes} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de clubes */}
        {!isLoading && !error && (
          <ClubList
            clubes={clubes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        )}

        {/* Nota informativa */}
        {!isLoading && !error && clubes.length > 0 && (
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
        <ClubForm
          open={formOpen}
          mode={formMode}
          club={editingClub}
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
        title="Eliminar club"
        description="¿Estás seguro de que quieres eliminar este club? Esta acción no se puede deshacer desde el panel, pero el commit queda en el historial de GitHub."
        itemLabel={deletingClub?.nombre}
        confirmText="Sí, eliminar"
        onSuccess={(msg) => toast.success(msg)}
        onError={(msg) => toast.error(msg)}
      />
    </div>
  );
}
