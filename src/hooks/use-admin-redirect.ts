"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/use-admin-auth";

/**
 * Hook para proteger páginas de admin con redirección al login
 * ===========================================
 * Si el usuario no está autenticado, lo redirige a /admin?redirect=...
 * Después de hacer login, vuelve a la página que quería ver.
 *
 * Flujo:
 * 1. Usuario hace clic en "Agregar Profesor" (sin login)
 * 2. Va a /admin/profesores
 * 3. Este hook detecta que NO está logueado
 * 4. Lo redirige a /admin?redirect=/admin/profesores
 * 5. Ve la pantalla de login
 * 6. Después de login, vuelve automáticamente a /admin/profesores
 */

export function useAdminRedirect(): { shouldRender: boolean } {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, mounted } = useAdminAuth();

  useEffect(() => {
    // Solo redirigir después de montar (evita hydration mismatch)
    // y solo si NO está autenticado
    if (mounted && !isAuthenticated) {
      const redirectUrl = `/admin?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [mounted, isAuthenticated, router, pathname]);

  // Solo renderizar el contenido si está montado Y autenticado
  return { shouldRender: mounted && isAuthenticated };
}
