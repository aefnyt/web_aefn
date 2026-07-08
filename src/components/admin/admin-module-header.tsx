"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { AEFN_LOGOS } from "@/lib/theme";

/**
 * Header reutilizable para páginas de módulos admin
 * ===========================================
 * Mantiene consistencia visual: paleta dorado/negro + logo ECFN.
 * Usado por /admin/profesores, /admin/eventos, /admin/clubes, etc.
 *
 * Props:
 * - title: nombre del módulo ("Profesores", "Eventos", etc.)
 * - onReload: función para recargar la lista (opcional)
 * - isLoading: estado de carga (muestra spinner)
 * - children: contenido extra a la derecha (opcional)
 */

interface AdminModuleHeaderProps {
  title: string;
  onReload?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function AdminModuleHeader({
  title,
  onReload,
  isLoading,
  children,
}: AdminModuleHeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-neutral-950 border-b border-amber-500/20 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin")}
            className="text-amber-400/80 hover:text-amber-400 hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
          <span className="text-amber-500/30">/</span>
          <h1 className="text-base font-semibold text-white">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {children}
          {onReload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReload}
              disabled={isLoading}
              className="text-amber-400/60 hover:text-amber-400 hover:bg-white/5"
              title="Recargar lista"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Recargar</span>
            </Button>
          )}
          {/* Símbolo ECFN en el header derecho */}
          <div className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 border border-amber-500/20 overflow-hidden">
            <img
              src={AEFN_LOGOS.ecfnSymbol}
              alt="ECFN"
              className="w-6 h-6 object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
