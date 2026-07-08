"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth, getStoredKey } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Profesor } from "@/lib/types";
import { ProfessorList } from "@/components/admin/professor-list";
import { ProfessorForm } from "@/components/admin/professor-form";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { AdminModuleHeader } from "@/components/admin/admin-module-header";

/**
 * Página /admin/profesores — CRUD completo de profesores
 * ===========================================
 * Esta página reemplaza al placeholder dinámico /admin/[modulo] específicamente
 * para el módulo "profesores". Aquí es donde el presidente puede:
 * 1. Ver la lista de profesores
 * 2. Agregar un profesor nuevo
 * 3. Editar un profesor existente (incluyendo su foto)
 * 4. Eliminar un profesor
 *
 * 📚 Concepto: Ruta estática vs dinámica en Next.js
 * Next.js permite tener /admin/profesores (estática) Y /admin/[modulo] (dinámica)
 * al mismo tiempo. La estática tiene prioridad: cuando alguien visita
 * /admin/profesores, Next.js usa page.tsx de la carpeta "profesores".
 * Cuando visita /admin/eventos, no hay carpeta "eventos" todavía, así que
 * usa el placeholder dinámico [modulo]. Esto nos permite migrar módulo por
 * módulo sin romper nada.
 */

export default function ProfesoresAdminPage() {
  const router = useRouter();
  const { isAuthenticated, mounted } = useAdminAuth();

  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal de crear/editar
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingProfesor, setEditingProfesor] = useState<Profesor | null>(null);

  // Estado del diálogo de confirmación de borrado
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProfesor, setDeletingProfesor] = useState<Profesor | null>(null);

  // === Cargar profesores desde la API ===
  const loadProfesores = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profesores");
      const data = await response.json();

      if (response.ok) {
        // Asignar IDs automáticos a profesores que no tengan (migración suave)
        const profesoresConId = (data.data || []).map((p: Profesor, i: number) => ({
          ...p,
          id: p.id || `temp-${i}-${p.nombre.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`,
        }));
        setProfesores(profesoresConId);
      } else {
        setError(data.error || data.detail || "Error al cargar profesores.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadProfesores();
    }
  }, [mounted, isAuthenticated, loadProfesores]);

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
    setEditingProfesor(null);
    setFormOpen(true);
  }

  function handleEdit(profesor: Profesor) {
    setFormMode("edit");
    setEditingProfesor(profesor);
    setFormOpen(true);
  }

  function handleDelete(profesor: Profesor) {
    setDeletingProfesor(profesor);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingProfesor) {
      return { success: false, message: "No hay profesor seleccionado." };
    }

    const accessKey = getStoredKey();
    if (!accessKey) {
      return { success: false, message: "Sesión expirada. Vuelve a iniciar sesión." };
    }

    try {
      const response = await fetch("/api/profesores", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body: JSON.stringify({ id: deletingProfesor.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Actualizar la lista local (sin necesidad de recargar todo)
        setProfesores((prev) => prev.filter((p) => p.id !== deletingProfesor.id));
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

  function handleSaved(savedProfesor: Profesor) {
    // Actualizar la lista local
    setProfesores((prev) => {
      const index = prev.findIndex((p) => p.id === savedProfesor.id);
      if (index === -1) {
        // Es nuevo, agregarlo
        return [...prev, savedProfesor];
      } else {
        // Es edición, reemplazarlo
        const newList = [...prev];
        newList[index] = savedProfesor;
        return newList;
      }
    });
    setFormOpen(false);
    setEditingProfesor(null);
  }

  const accessKey = getStoredKey();

  // === Render ===

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminModuleHeader title="Profesores" onReload={loadProfesores} isLoading={isLoading} />

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado de carga */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin mr-2" />
              <span className="text-slate-500">Cargando profesores...</span>
            </CardContent>
          </Card>
        )}

        {/* Estado de error */}
        {error && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadProfesores} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de profesores */}
        {!isLoading && !error && (
          <ProfessorList
            profesores={profesores}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        )}

        {/* Nota informativa */}
        {!isLoading && !error && profesores.length > 0 && (
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
        <ProfessorForm
          open={formOpen}
          mode={formMode}
          profesor={editingProfesor}
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
        title="Eliminar profesor"
        description="¿Estás seguro de que quieres eliminar a este profesor? Esta acción no se puede deshacer desde el panel, pero el commit queda en el historial de GitHub."
        itemLabel={deletingProfesor?.nombre}
        confirmText="Sí, eliminar"
        onSuccess={(msg) => toast.success(msg)}
        onError={(msg) => toast.error(msg)}
      />
    </div>
  );
}
