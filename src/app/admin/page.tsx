"use client";

import { useAdminAuth } from "@/hooks/use-admin-auth";
import { LoginScreen } from "@/components/admin/login-screen";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

/**
 * Página /admin — Punto de entrada al panel de administración
 * ===========================================
 * Esta página decide qué mostrar:
 * - Si el usuario NO está logueado → muestra la pantalla de Login
 * - Si el usuario SÍ está logueado → muestra el Dashboard
 *
 * 📚 Concepto: Renderizado condicional en React
 * En React, puedes decidir qué mostrar usando un condicional:
 *   {condicion ? <ComponenteA /> : <ComponenteB />}
 * Aquí lo usamos para alternar entre login y dashboard según el estado de auth.
 *
 * 📚 Concepto: "use client"
 * Esta directiva al inicio del archivo le dice a Next.js: "este código se ejecuta
 * en el navegador, no en el servidor". Es necesaria porque usamos useState,
 * useEffect y sessionStorage, que solo existen en el navegador.
 */

export default function AdminPage() {
  // El hook maneja todo: lectura inicial de sessionStorage, login, logout.
  // `mounted` nos permite evitar el parpadeo de login antes de que el hook
  // lea sessionStorage en el primer render del cliente.
  const { isAuthenticated, mounted } = useAdminAuth();

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Cargando...</div>
      </div>
    );
  }

  return isAuthenticated ? <AdminDashboard /> : <LoginScreen />;
}
