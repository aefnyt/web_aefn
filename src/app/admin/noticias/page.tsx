"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth, getStoredKey } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Noticia } from "@/lib/types";
import { NewsList } from "@/components/admin/news-list";
import { NewsForm } from "@/components/admin/news-form";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { AdminModuleHeader } from "@/components/admin/admin-module-header";

/**
 * Página /admin/noticias — CRUD completo de noticias
 * ===========================================
 * Aquí el presidente puede gestionar todas las noticias del sitio.
 */

export default function NoticiasAdminPage() {
  const router = useRouter();
  const { isAuthenticated, mounted } = useAdminAuth();

  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingNoticia, setDeletingNoticia] = useState<Noticia | null>(null);

  const loadNoticias = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/noticias");
      const data = await response.json();

      if (response.ok) {
        setNoticias(data.data || []);
      } else {
        setError(data.error || data.detail || "Error al cargar noticias.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadNoticias();
    }
  }, [mounted, isAuthenticated, loadNoticias]);

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

  function handleAdd() {
    setFormMode("create");
    setEditingNoticia(null);
    setFormOpen(true);
  }

  function handleEdit(noticia: Noticia) {
    setFormMode("edit");
    setEditingNoticia(noticia);
    setFormOpen(true);
  }

  function handleDelete(noticia: Noticia) {
    setDeletingNoticia(noticia);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingNoticia) {
      return { success: false, message: "No hay noticia seleccionada." };
    }

    const accessKey = getStoredKey();
    if (!accessKey) {
      return { success: false, message: "Sesión expirada. Vuelve a iniciar sesión." };
    }

    try {
      const response = await fetch("/api/noticias", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body: JSON.stringify({ id: deletingNoticia.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setNoticias((prev) => prev.filter((n) => n.id !== deletingNoticia.id));
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

  function handleSaved(savedNoticia: Noticia) {
    setNoticias((prev) => {
      const index = prev.findIndex((n) => n.id === savedNoticia.id);
      let newList: Noticia[];

      if (index === -1) {
        newList = [...prev, savedNoticia];
      } else {
        newList = [...prev];
        newList[index] = savedNoticia;
      }

      // Si la noticia guardada es destacada, desmarcar las demás en la UI local
      if (savedNoticia.destacada) {
        newList = newList.map((n) =>
          n.id === savedNoticia.id ? n : { ...n, destacada: false }
        );
      }

      // Re-ordenar por fecha descendente
      newList.sort((a, b) => {
        const dateA = new Date(a.fecha).getTime();
        const dateB = new Date(b.fecha).getTime();
        return dateB - dateA;
      });

      return newList;
    });
    setFormOpen(false);
    setEditingNoticia(null);
  }

  const accessKey = getStoredKey();

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminModuleHeader title="Noticias" onReload={loadNoticias} isLoading={isLoading} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin mr-2" />
              <span className="text-slate-500">Cargando noticias...</span>
            </CardContent>
          </Card>
        )}

        {error && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadNoticias} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && (
          <NewsList
            noticias={noticias}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        )}
      </main>

      {accessKey && (
        <NewsForm
          open={formOpen}
          mode={formMode}
          noticia={editingNoticia}
          accessKey={accessKey}
          onSaved={handleSaved}
          onOpenChange={setFormOpen}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteOpen}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteOpen}
        title="Eliminar noticia"
        description="¿Estás seguro de que quieres eliminar esta noticia? Se eliminará también su imagen. Esta acción no se puede deshacer desde el panel, pero el commit queda en el historial de GitHub."
        itemLabel={deletingNoticia?.titulo}
        confirmText="Sí, eliminar"
        onSuccess={(msg) => toast.success(msg)}
        onError={(msg) => toast.error(msg)}
      />
    </div>
  );
}
