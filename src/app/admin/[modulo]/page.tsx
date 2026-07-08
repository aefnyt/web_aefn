"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminAuth, getStoredModules } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Construction } from "lucide-react";
import { MODULES } from "@/lib/config";
import type { ModuleKey } from "@/lib/types";

/**
 * Página /admin/[modulo] — Placeholder temporal
 * ===========================================
 * Esta es una página TEMPORAL. En las próximas fases se reemplazará por el
 * CRUD real de cada módulo (profesores, noticias, etc.).
 *
 * Por ahora:
 * - Verifica que el usuario esté logueado y tenga permiso para el módulo
 * - Muestra un mensaje de "próximamente"
 * - Permite volver al dashboard
 */

export default function ModulePlaceholderPage() {
  const params = useParams<{ modulo: string }>();
  const router = useRouter();
  const { isAuthenticated, mounted } = useAdminAuth();

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Cargando...</div>
      </div>
    );
  }

  // Si no está logueado, redirigir al login
  if (!isAuthenticated) {
    router.push("/admin");
    return null;
  }

  const modulo = params.modulo as ModuleKey;
  const moduleConfig = MODULES[modulo as keyof typeof MODULES];
  const userModules = getStoredModules();

  // Si el módulo no existe o no tiene permiso
  if (!moduleConfig || !userModules.includes(modulo)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Acceso denegado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              {!moduleConfig
                ? `El módulo "${modulo}" no existe.`
                : `No tienes permiso para acceder al módulo "${moduleConfig.label}".`}
            </p>
            <Button onClick={() => router.push("/admin")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin")}
              className="text-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            <span className="text-slate-300">/</span>
            <h1 className="text-base font-semibold text-slate-900">{moduleConfig.label}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-100 text-amber-700">
                <Construction className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Módulo en construcción</CardTitle>
                <p className="text-sm text-slate-500 mt-1">{moduleConfig.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              El panel de administración para <strong>{moduleConfig.label}</strong> estará
              disponible próximamente. Este módulo administrará los datos almacenados en:
            </p>
            <div className="p-3 rounded-md bg-slate-100 font-mono text-sm text-slate-700">
              {moduleConfig.jsonPath}
              {moduleConfig.imagesPath && (
                <>
                  <br />
                  {moduleConfig.imagesPath}/ (imágenes)
                </>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Fase actual: implementando paneles de administración. Próximamente podrás agregar,
              editar y eliminar {moduleConfig.label.toLowerCase()} desde aquí.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
