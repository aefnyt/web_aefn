"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredKey } from "@/hooks/use-admin-auth";
import { useAdminRedirect } from "@/hooks/use-admin-redirect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Evento } from "@/lib/types";
import { EventList } from "@/components/admin/event-list";
import { EventForm } from "@/components/admin/event-form";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { AdminModuleHeader } from "@/components/admin/admin-module-header";

/**
 * Página /admin/eventos — CRUD completo de eventos
 * ===========================================
 * Aquí el presidente puede gestionar el calendario de eventos de la asociación:
 * 1. Ver la lista de eventos
 * 2. Agregar un evento nuevo
 * 3. Editar un evento existente
 * 4. Eliminar un evento
 *
 * Sigue exactamente el mismo patrón que /admin/profesores.
 */

export default function EventosAdminPage() {
    const { shouldRender } = useAdminRedirect();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal de crear/editar
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);

  // Estado del diálogo de confirmación de borrado
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingEvento, setDeletingEvento] = useState<Evento | null>(null);

  // === Cargar eventos desde la API ===
  const loadEventos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/eventos");
      const data = await response.json();

      if (response.ok) {
        // Asignar IDs automáticos a eventos que no tengan (migración suave)
        const eventosConId = (data.data || []).map((e: Evento, i: number) => ({
          ...e,
          id:
            e.id ||
            `temp-${i}-${(e.titulo || "evento")
              .toLowerCase()
              .replace(/\s+/g, "-")
              .slice(0, 40)}`,
        }));
        setEventos(eventosConId);
      } else {
        setError(data.error || data.detail || "Error al cargar eventos.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shouldRender) {
      loadEventos();
    }
  }, [shouldRender, loadEventos]);

  // === Handlers ===

  function handleAdd() {
    setFormMode("create");
    setEditingEvento(null);
    setFormOpen(true);
  }

  function handleEdit(evento: Evento) {
    setFormMode("edit");
    setEditingEvento(evento);
    setFormOpen(true);
  }

  function handleDelete(evento: Evento) {
    setDeletingEvento(evento);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingEvento) {
      return { success: false, message: "No hay evento seleccionado." };
    }

    const accessKey = getStoredKey();
    if (!accessKey) {
      return { success: false, message: "Sesión expirada. Vuelve a iniciar sesión." };
    }

    try {
      const response = await fetch("/api/eventos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body: JSON.stringify({ id: deletingEvento.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Actualizar la lista local (sin necesidad de recargar todo)
        setEventos((prev) => prev.filter((e) => e.id !== deletingEvento.id));
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

  function handleSaved(savedEvento: Evento) {
    // Actualizar la lista local
    setEventos((prev) => {
      const index = prev.findIndex((e) => e.id === savedEvento.id);
      if (index === -1) {
        // Es nuevo, agregarlo
        return [...prev, savedEvento];
      } else {
        // Es edición, reemplazarlo
        const newList = [...prev];
        newList[index] = savedEvento;
        return newList;
      }
    });
    setFormOpen(false);
    setEditingEvento(null);
  }

  const accessKey = getStoredKey();

  // === Render ===
  if (!shouldRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-amber-400/60 text-sm">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <AdminModuleHeader title="Eventos" onReload={loadEventos} isLoading={isLoading} />

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado de carga */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin mr-2" />
              <span className="text-slate-500">Cargando eventos...</span>
            </CardContent>
          </Card>
        )}

        {/* Estado de error */}
        {error && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadEventos} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de eventos */}
        {!isLoading && !error && (
          <EventList
            eventos={eventos}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        )}

        {/* Nota informativa */}
        {!isLoading && !error && eventos.length > 0 && (
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
        <EventForm
          open={formOpen}
          mode={formMode}
          evento={editingEvento}
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
        title="Eliminar evento"
        description="¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer desde el panel, pero el commit queda en el historial de GitHub."
        itemLabel={deletingEvento?.titulo}
        confirmText="Sí, eliminar"
        onSuccess={(msg) => toast.success(msg)}
        onError={(msg) => toast.error(msg)}
      />
    </div>
  );
}
