"use client";

import { useEffect, useState, useCallback } from "react";
import { getStoredKey } from "@/hooks/use-admin-auth";
import { useAdminRedirect } from "@/hooks/use-admin-redirect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { GrupoInvestigacion, Paper, Tesis } from "@/lib/types";
import { GroupList } from "@/components/admin/group-list";
import { GroupForm } from "@/components/admin/group-form";
import { PaperList } from "@/components/admin/paper-list";
import { PaperForm } from "@/components/admin/paper-form";
import { ThesisList } from "@/components/admin/thesis-list";
import { ThesisForm } from "@/components/admin/thesis-form";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { AdminModuleHeader } from "@/components/admin/admin-module-header";

/**
 * Página /admin/grupos — CRUD de Grupos de Investigación, Papers y Tesis
 * ===========================================
 * Este módulo es especial: gestiona TRES archivos JSON relacionados con
 * una sola clave de acceso ("grupos"). La página tiene TRES TABS:
 *
 * 1. "Grupos"  → data/investigation-groups.json (GrupoInvestigacion[])
 * 2. "Papers"  → data/papers.json (Paper[])
 * 3. "Tesis"   → data/theses.json (Tesis[])
 *
 * Cada tab tiene su propio estado (lista, isLoading, error, formOpen,
 * editingItem, deleteOpen) y carga sus datos al activarse.
 *
 * 📚 Concepto: Módulo compuesto
 * A diferencia de profesores/clubes/galeria (un módulo = un archivo JSON),
 * el módulo "grupos" agrupa tres recursos relacionados semánticamente
 * (pertenecen a la sección "Investigación" del sitio público). Reutilizar
 * una misma clave de acceso simplifica la administración: el coordinador
 * de investigación puede editar todo desde una sola pantalla.
 *
 * 📚 Concepto: Tabs vs páginas separadas
 * Elegimos Tabs en vez de tres páginas (/admin/grupos,
 * /admin/grupos/papers, /admin/grupos/tesis) porque:
 * - El usuario conceptualmente está gestionando "Investigación".
 * - Cambiar entre sub-recursos es rápido (sin recargar página).
 * - El estado de cada tab se mantiene al cambiar (no se pierde al volver).
 */

type TabKey = "grupos" | "papers" | "tesis";

export default function GruposAdminPage() {
    const { shouldRender } = useAdminRedirect();

  // === Tab activa ===
  const [activeTab, setActiveTab] = useState<TabKey>("grupos");

  // ===== Estado para GRUPOS =====
  const [grupos, setGrupos] = useState<GrupoInvestigacion[]>([]);
  const [gruposLoading, setGruposLoading] = useState(true);
  const [gruposError, setGruposError] = useState<string | null>(null);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [groupFormMode, setGroupFormMode] = useState<"create" | "edit">("create");
  const [editingGroup, setEditingGroup] = useState<GrupoInvestigacion | null>(null);
  const [groupDeleteOpen, setGroupDeleteOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<GrupoInvestigacion | null>(null);
  // Para saber si ya cargamos grupos al menos una vez (lazy load por tab)
  const [gruposLoaded, setGruposLoaded] = useState(false);

  // ===== Estado para PAPERS =====
  const [papers, setPapers] = useState<Paper[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [papersError, setPapersError] = useState<string | null>(null);
  const [paperFormOpen, setPaperFormOpen] = useState(false);
  const [paperFormMode, setPaperFormMode] = useState<"create" | "edit">("create");
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [paperDeleteOpen, setPaperDeleteOpen] = useState(false);
  const [deletingPaper, setDeletingPaper] = useState<Paper | null>(null);
  const [papersLoaded, setPapersLoaded] = useState(false);

  // ===== Estado para TESIS =====
  const [tesis, setTesis] = useState<Tesis[]>([]);
  const [tesisLoading, setTesisLoading] = useState(false);
  const [tesisError, setTesisError] = useState<string | null>(null);
  const [thesisFormOpen, setThesisFormOpen] = useState(false);
  const [thesisFormMode, setThesisFormMode] = useState<"create" | "edit">("create");
  const [editingTesis, setEditingTesis] = useState<Tesis | null>(null);
  const [thesisDeleteOpen, setThesisDeleteOpen] = useState(false);
  const [deletingTesis, setDeletingTesis] = useState<Tesis | null>(null);
  const [tesisLoaded, setTesisLoaded] = useState(false);

  // ====================================================================
  // Cargar GRUPOS (al montar si está autenticado)
  // ====================================================================
  const loadGrupos = useCallback(async () => {
    setGruposLoading(true);
    setGruposError(null);

    try {
      const response = await fetch("/api/grupos");
      const data = await response.json();

      if (response.ok) {
        // Migración suave de IDs faltantes (igual que en profesores/clubes)
        const gruposConId = (data.data || []).map(
          (g: GrupoInvestigacion, i: number) => ({
            ...g,
            id:
              g.id ||
              `temp-${i}-${(g.title || "grupo")
                .toLowerCase()
                .replace(/\s+/g, "-")
                .slice(0, 40)}`,
          })
        );
        setGrupos(gruposConId);
        setGruposLoaded(true);
      } else {
        setGruposError(data.error || data.detail || "Error al cargar grupos.");
      }
    } catch (err) {
      setGruposError(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setGruposLoading(false);
    }
  }, []);

  // ====================================================================
  // Cargar PAPERS (lazy al activar tab)
  // ====================================================================
  const loadPapers = useCallback(async () => {
    setPapersLoading(true);
    setPapersError(null);

    try {
      const response = await fetch("/api/papers");
      const data = await response.json();

      if (response.ok) {
        setPapers(data.data || []);
        setPapersLoaded(true);
      } else {
        setPapersError(data.error || data.detail || "Error al cargar papers.");
      }
    } catch (err) {
      setPapersError(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setPapersLoading(false);
    }
  }, []);

  // ====================================================================
  // Cargar TESIS (lazy al activar tab)
  // ====================================================================
  const loadTesis = useCallback(async () => {
    setTesisLoading(true);
    setTesisError(null);

    try {
      const response = await fetch("/api/tesis");
      const data = await response.json();

      if (response.ok) {
        setTesis(data.data || []);
        setTesisLoaded(true);
      } else {
        setTesisError(data.error || data.detail || "Error al cargar tesis.");
      }
    } catch (err) {
      setTesisError(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setTesisLoading(false);
    }
  }, []);

  // Cargar grupos al montar si está autenticado
  useEffect(() => {
    if (shouldRender) {
      loadGrupos();
    }
  }, [shouldRender, loadGrupos]);

  // Cargar pestañas al activarlas por primera vez (lazy load)
  useEffect(() => {
    if (shouldRender && activeTab === "papers" && !papersLoaded) {
      loadPapers();
    }
    if (shouldRender && activeTab === "tesis" && !tesisLoaded) {
      loadTesis();
    }
  }, [shouldRender, activeTab, papersLoaded, tesisLoaded, loadPapers, loadTesis]);

  // === Protección de ruta ===
  // ====================================================================
  // Handlers GRUPOS
  // ====================================================================
  function handleAddGroup() {
    setGroupFormMode("create");
    setEditingGroup(null);
    setGroupFormOpen(true);
  }
  function handleEditGroup(grupo: GrupoInvestigacion) {
    setGroupFormMode("edit");
    setEditingGroup(grupo);
    setGroupFormOpen(true);
  }
  function handleDeleteGroup(grupo: GrupoInvestigacion) {
    setDeletingGroup(grupo);
    setGroupDeleteOpen(true);
  }
  async function handleDeleteGroupConfirm() {
    if (!deletingGroup?.id) {
      return { success: false, message: "No hay grupo seleccionado." };
    }
    const accessKey = getStoredKey();
    if (!accessKey) {
      return { success: false, message: "Sesión expirada. Vuelve a iniciar sesión." };
    }
    try {
      const response = await fetch("/api/grupos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body: JSON.stringify({ id: deletingGroup.id }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setGrupos((prev) => prev.filter((g) => g.id !== deletingGroup.id));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || data.message };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Error de conexión",
      };
    }
  }
  function handleGroupSaved(saved: GrupoInvestigacion) {
    setGrupos((prev) => {
      const index = prev.findIndex((g) => g.id === saved.id);
      if (index === -1) return [...prev, saved];
      const newList = [...prev];
      newList[index] = saved;
      return newList;
    });
    setGroupFormOpen(false);
    setEditingGroup(null);
  }

  // ====================================================================
  // Handlers PAPERS
  // ====================================================================
  function handleAddPaper() {
    setPaperFormMode("create");
    setEditingPaper(null);
    setPaperFormOpen(true);
  }
  function handleEditPaper(paper: Paper) {
    setPaperFormMode("edit");
    setEditingPaper(paper);
    setPaperFormOpen(true);
  }
  function handleDeletePaper(paper: Paper) {
    setDeletingPaper(paper);
    setPaperDeleteOpen(true);
  }
  async function handleDeletePaperConfirm() {
    if (!deletingPaper?.title) {
      return { success: false, message: "No hay paper seleccionado." };
    }
    const accessKey = getStoredKey();
    if (!accessKey) {
      return { success: false, message: "Sesión expirada. Vuelve a iniciar sesión." };
    }
    try {
      const response = await fetch("/api/papers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body: JSON.stringify({ title: deletingPaper.title }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPapers((prev) =>
          prev.filter((p) => p.title !== deletingPaper.title)
        );
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || data.message };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Error de conexión",
      };
    }
  }
  function handlePaperSaved(saved: Paper, oldTitle?: string) {
    setPapers((prev) => {
      const lookupTitle = oldTitle ?? saved.title;
      const index = prev.findIndex((p) => p.title === lookupTitle);
      if (index === -1) return [...prev, saved];
      const newList = [...prev];
      newList[index] = saved;
      return newList;
    });
    setPaperFormOpen(false);
    setEditingPaper(null);
  }

  // ====================================================================
  // Handlers TESIS
  // ====================================================================
  function handleAddTesis() {
    setThesisFormMode("create");
    setEditingTesis(null);
    setThesisFormOpen(true);
  }
  function handleEditTesis(t: Tesis) {
    setThesisFormMode("edit");
    setEditingTesis(t);
    setThesisFormOpen(true);
  }
  function handleDeleteTesis(t: Tesis) {
    setDeletingTesis(t);
    setThesisDeleteOpen(true);
  }
  async function handleDeleteTesisConfirm() {
    if (!deletingTesis?.title) {
      return { success: false, message: "No hay tesis seleccionada." };
    }
    const accessKey = getStoredKey();
    if (!accessKey) {
      return { success: false, message: "Sesión expirada. Vuelve a iniciar sesión." };
    }
    try {
      const response = await fetch("/api/tesis", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessKey}`,
        },
        body: JSON.stringify({ title: deletingTesis.title }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTesis((prev) =>
          prev.filter((t) => t.title !== deletingTesis.title)
        );
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || data.message };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Error de conexión",
      };
    }
  }
  function handleTesisSaved(saved: Tesis, oldTitle?: string) {
    setTesis((prev) => {
      const lookupTitle = oldTitle ?? saved.title;
      const index = prev.findIndex((t) => t.title === lookupTitle);
      if (index === -1) return [...prev, saved];
      const newList = [...prev];
      newList[index] = saved;
      return newList;
    });
    setThesisFormOpen(false);
    setEditingTesis(null);
  }

  // === Recargar la tab activa ===
  function handleReload() {
    if (activeTab === "grupos") loadGrupos();
    else if (activeTab === "papers") loadPapers();
    else if (activeTab === "tesis") loadTesis();
  }

  // Indicador de carga para el botón Recargar (según tab activa)
  const isCurrentTabLoading =
    (activeTab === "grupos" && gruposLoading) ||
    (activeTab === "papers" && papersLoading) ||
    (activeTab === "tesis" && tesisLoading);

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
      <AdminModuleHeader
        title="Investigación"
        onReload={handleReload}
        isLoading={isCurrentTabLoading}
      />

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabKey)}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="grupos">Grupos</TabsTrigger>
            <TabsTrigger value="papers">Papers</TabsTrigger>
            <TabsTrigger value="tesis">Tesis</TabsTrigger>
          </TabsList>

          {/* ============== TAB: GRUPOS ============== */}
          <TabsContent value="grupos">
            {gruposLoading && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin mr-2" />
                  <span className="text-slate-500">Cargando grupos...</span>
                </CardContent>
              </Card>
            )}

            {gruposError && !gruposLoading && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-red-600 mb-4">{gruposError}</p>
                  <Button onClick={loadGrupos} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            )}

            {!gruposLoading && !gruposError && (
              <GroupList
                grupos={grupos}
                onEdit={handleEditGroup}
                onDelete={handleDeleteGroup}
                onAdd={handleAddGroup}
              />
            )}

            {!gruposLoading && !gruposError && grupos.length > 0 && (
              <InfoNote />
            )}
          </TabsContent>

          {/* ============== TAB: PAPERS ============== */}
          <TabsContent value="papers">
            {papersLoading && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin mr-2" />
                  <span className="text-slate-500">Cargando papers...</span>
                </CardContent>
              </Card>
            )}

            {papersError && !papersLoading && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-red-600 mb-4">{papersError}</p>
                  <Button onClick={loadPapers} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            )}

            {!papersLoading && !papersError && (
              <PaperList
                papers={papers}
                onEdit={handleEditPaper}
                onDelete={handleDeletePaper}
                onAdd={handleAddPaper}
              />
            )}

            {!papersLoading && !papersError && papers.length > 0 && (
              <InfoNote />
            )}
          </TabsContent>

          {/* ============== TAB: TESIS ============== */}
          <TabsContent value="tesis">
            {tesisLoading && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin mr-2" />
                  <span className="text-slate-500">Cargando tesis...</span>
                </CardContent>
              </Card>
            )}

            {tesisError && !tesisLoading && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-red-600 mb-4">{tesisError}</p>
                  <Button onClick={loadTesis} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            )}

            {!tesisLoading && !tesisError && (
              <ThesisList
                tesis={tesis}
                onEdit={handleEditTesis}
                onDelete={handleDeleteTesis}
                onAdd={handleAddTesis}
              />
            )}

            {!tesisLoading && !tesisError && tesis.length > 0 && (
              <InfoNote />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ============== Formularios modales ============== */}
      {accessKey && (
        <>
          <GroupForm
            open={groupFormOpen}
            mode={groupFormMode}
            grupo={editingGroup}
            accessKey={accessKey}
            onSaved={handleGroupSaved}
            onOpenChange={setGroupFormOpen}
          />
          <PaperForm
            open={paperFormOpen}
            mode={paperFormMode}
            paper={editingPaper}
            accessKey={accessKey}
            onSaved={(saved) => handlePaperSaved(saved, editingPaper?.title)}
            onOpenChange={setPaperFormOpen}
          />
          <ThesisForm
            open={thesisFormOpen}
            mode={thesisFormMode}
            tesis={editingTesis}
            accessKey={accessKey}
            onSaved={(saved) => handleTesisSaved(saved, editingTesis?.title)}
            onOpenChange={setThesisFormOpen}
          />
        </>
      )}

      {/* ============== Diálogos de confirmación de borrado ============== */}
      <ConfirmDeleteDialog
        open={groupDeleteOpen}
        onConfirm={handleDeleteGroupConfirm}
        onOpenChange={setGroupDeleteOpen}
        title="Eliminar grupo"
        description="¿Estás seguro de que quieres eliminar este grupo de investigación? Esta acción no se puede deshacer desde el panel, pero el commit queda en el historial de GitHub."
        itemLabel={deletingGroup?.title}
        confirmText="Sí, eliminar"
        onSuccess={(msg) => toast.success(msg)}
        onError={(msg) => toast.error(msg)}
      />
      <ConfirmDeleteDialog
        open={paperDeleteOpen}
        onConfirm={handleDeletePaperConfirm}
        onOpenChange={setPaperDeleteOpen}
        title="Eliminar paper"
        description="¿Estás seguro de que quieres eliminar este paper? Esta acción no se puede deshacer desde el panel, pero el commit queda en el historial de GitHub."
        itemLabel={deletingPaper?.title}
        confirmText="Sí, eliminar"
        onSuccess={(msg) => toast.success(msg)}
        onError={(msg) => toast.error(msg)}
      />
      <ConfirmDeleteDialog
        open={thesisDeleteOpen}
        onConfirm={handleDeleteTesisConfirm}
        onOpenChange={setThesisDeleteOpen}
        title="Eliminar tesis"
        description="¿Estás seguro de que quieres eliminar esta tesis? Esta acción no se puede deshacer desde el panel, pero el commit queda en el historial de GitHub."
        itemLabel={deletingTesis?.title}
        confirmText="Sí, eliminar"
        onSuccess={(msg) => toast.success(msg)}
        onError={(msg) => toast.error(msg)}
      />
    </div>
  );
}

/** Nota informativa reutilizable (commit + revert en GitHub). */
function InfoNote() {
  return (
    <div className="mt-8 p-4 rounded-md bg-blue-50 border border-blue-100 text-sm text-blue-700">
      <strong>Nota:</strong> Los cambios se guardan automáticamente en GitHub
      como commits. El sitio público se actualiza en ~30 segundos. Si
      cometes un error, puedes revertir cualquier cambio desde el historial
      de commits en GitHub.
    </div>
  );
}
