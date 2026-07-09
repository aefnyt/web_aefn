"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { LoginScreen } from "@/components/admin/login-screen";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

/**
 * Página /admin — Punto de entrada al panel de administración
 * ===========================================
 * Decide qué mostrar:
 * - Si NO está logueado → muestra la pantalla de Login
 * - Si SÍ está logueado → muestra el Dashboard
 *   - Si hay un parámetro ?redirect=... → va a esa página (ej: /admin/profesores)
 */

function AdminContent() {
  const { isAuthenticated, mounted } = useAdminAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirectTo = searchParams.get("redirect");

  // Si está logueado y hay un redirect pendiente, ir ahí
  useEffect(() => {
    if (mounted && isAuthenticated && redirectTo) {
      router.replace(redirectTo);
    }
  }, [mounted, isAuthenticated, redirectTo, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-amber-400/60 text-sm">Cargando...</div>
      </div>
    );
  }

  // Si está autenticado y NO hay redirect, mostrar dashboard
  // Si está autenticado y SÍ hay redirect, el useEffect lo redirigirá
  if (isAuthenticated) {
    if (redirectTo) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950">
          <div className="text-amber-400/60 text-sm">Redirigiendo...</div>
        </div>
      );
    }
    return <AdminDashboard />;
  }

  return <LoginScreen />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-950">
          <div className="text-amber-400/60 text-sm">Cargando...</div>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
