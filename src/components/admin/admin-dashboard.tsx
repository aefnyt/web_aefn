"use client";

import Link from "next/link";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  FlaskConical,
  GraduationCap,
  Image as ImageIcon,
  LogOut,
  Newspaper,
  Users,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { ALL_MODULES } from "@/lib/config";
import type { ModuleKey } from "@/lib/types";
import { AEFN_LOGOS } from "@/lib/theme";

/**
 * Dashboard del Panel Admin
 * ===========================================
 * Se muestra después de que el usuario se loguea correctamente.
 * Muestra tarjetas con los módulos a los que el usuario tiene permiso.
 * Cada tarjeta lleva a /admin/[modulo] donde estará el CRUD.
 */

// Mapa de iconos (lucide-react se importa individualmente)
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Calendar,
  FlaskConical,
  Newspaper,
  Users,
  Image: ImageIcon,
};

export function AdminDashboard() {
  const { modules, logout, key, mounted } = useAdminAuth();

  // Filtrar módulos: solo mostrar los que el usuario tiene permiso
  const allowedModules = ALL_MODULES.filter((m) => modules.includes(m.key));

  // Determinar si es admin (tiene todos los módulos)
  const isAdmin = allowedModules.length === ALL_MODULES.length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-neutral-950 border-b border-amber-500/20 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Símbolo ECFN (hexágono dorado) */}
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-amber-500/30 overflow-hidden">
                <img
                  src={AEFN_LOGOS.ecfnSymbol}
                  alt="ECFN"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white">Panel de Administración</h1>
                <p className="text-xs text-amber-400/80">AEFN · Yachay Tech</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/index.html" target="_blank">
                <Button variant="ghost" size="sm" className="text-amber-400/80 hover:text-amber-400 hover:bg-white/5">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Ver sitio
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-amber-400/80 border-amber-500/30 hover:text-amber-400 hover:bg-white/5 hover:border-amber-500/50"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de bienvenida */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-1">
            Bienvenido{isAdmin ? " (Administrador)" : ""}
          </h2>
          <p className="text-neutral-600">
            {isAdmin
              ? "Tienes acceso completo a todos los módulos del sitio."
              : `Tienes acceso a ${allowedModules.length} ${
                  allowedModules.length === 1 ? "módulo" : "módulos"
                }. Selecciona uno para comenzar.`}
          </p>
        </div>

        {/* Grid de módulos */}
        {allowedModules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-slate-500">
                No tienes acceso a ningún módulo. Contacta al administrador.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allowedModules.map((module) => {
              const Icon = ICONS[module.icon] ?? GraduationCap;
              return (
                <Link key={module.key} href={`/admin/${module.key}`}>
                  <Card className="group h-full hover:shadow-lg hover:border-amber-500/40 transition-all cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      <CardTitle className="text-lg">{module.label}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-400 font-mono">
                        /{module.jsonPath}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Sección de información */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Información</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2 text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
              <p>
                Todos los cambios se guardan automáticamente en GitHub con un commit. Puedes ver el
                historial en cualquier momento.
              </p>
            </div>
            <div className="flex items-start gap-2 text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <p>
                Los cambios se reflejan en el sitio público en aproximadamente 30 segundos después
                de guardar.
              </p>
            </div>
            <div className="flex items-start gap-2 text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
              <p>
                Tu clave se mantiene solo en esta pestaña del navegador. Al cerrarla, tendrás que
                ingresarla nuevamente.
              </p>
            </div>
            <div className="flex items-start gap-2 text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
              <p>
                Si cometes un error, puedes revertir cualquier cambio desde GitHub usando el
                historial de commits.
              </p>
            </div>
          </div>
        </div>

        {/* Debug: mostrar clave (solo en desarrollo, comentar en producción) */}
        {process.env.NODE_ENV === "development" && mounted && key && (
          <div className="mt-8 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700 font-mono break-all">
            [DEV] Clave activa: {key}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-amber-500/20 bg-neutral-950">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-amber-400/60">
          AEFN · Asociación de Estudiantes de Física y Nanotecnología · Yachay Tech
        </div>
      </footer>
    </div>
  );
}
