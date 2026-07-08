"use client";

import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import type { ModuleKey } from "@/lib/types";

/**
 * Hook de autenticación para el panel admin (lado cliente)
 * ===========================================
 * Maneja el estado de "¿quién está logueado?" en el navegador.
 *
 * 📚 Concepto: sessionStorage vs localStorage
 * - sessionStorage: la clave se BORRA al cerrar la pestaña. Más seguro.
 * - localStorage: la clave persiste aunque cierres el navegador.
 * Usamos sessionStorage porque queremos que el presidente tenga que ingresar su
 * clave cada vez que abra una sesión nueva.
 *
 * 📚 Concepto: useSyncExternalStore
 * React 19 introdujo este hook para leer de "stores externos" (como sessionStorage)
 * de forma segura con SSR. Evita el problema de hydration mismatch: en el servidor
 * no hay sessionStorage, así que devuelve null; en el cliente devuelve el valor real.
 *
 * 📚 Concepto: Patrones "mounted" en Next.js
 * Cuando un componente cliente lee del navegador (sessionStorage, localStorage),
 * el HTML que genera el servidor y el del primer render del cliente pueden diferir.
 * Esto causa un "hydration mismatch". El patrón estándar es usar un flag `mounted`
 * que arranca en false y pasa a true después del primer render del cliente. Mientras
 * sea false, mostramos un placeholder neutro. Es un patrón oficial de Next.js.
 */

const STORAGE_KEY = "aefn_admin_key";
const MODULES_KEY = "aefn_admin_modules";

interface AuthState {
  key: string | null;
  modules: ModuleKey[];
  isLoading: boolean;
  isAuthenticated: boolean;
  mounted: boolean;
}

// ====================================================================
// Funciones para useSyncExternalStore
// ====================================================================

/** Escucha cambios en sessionStorage desde otras pestañas */
function subscribe(callback: () => void): () => void {
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  }
  return () => {};
}

function getStoredKeySnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

function getServerKeySnapshot(): string | null {
  return null;
}

function getStoredModulesSnapshot(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(MODULES_KEY) ?? "";
}

function getServerModulesSnapshot(): string {
  return "";
}

// ====================================================================
// Hook principal
// ====================================================================
export function useAdminAuth(): AuthState & {
  login: (key: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
} {
  const storedKey = useSyncExternalStore(subscribe, getStoredKeySnapshot, getServerKeySnapshot);
  const storedModulesRaw = useSyncExternalStore(
    subscribe,
    getStoredModulesSnapshot,
    getServerModulesSnapshot
  );

  // Parsear módulos
  let storedModules: ModuleKey[] = [];
  if (storedModulesRaw) {
    try {
      storedModules = JSON.parse(storedModulesRaw) as ModuleKey[];
    } catch {
      storedModules = [];
    }
  }

  // Flag "mounted": patrón estándar de Next.js para evitar hydration mismatch.
  // El servidor renderiza con mounted=false (placeholder neutro); el cliente
  // cambia a true después del montaje y entonces lee sessionStorage.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (key: string): Promise<{ success: boolean; message: string }> => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
        });
        const data = await response.json();

        if (response.ok && data.valid) {
          sessionStorage.setItem(STORAGE_KEY, key);
          sessionStorage.setItem(MODULES_KEY, JSON.stringify(data.modules));
          // Disparar evento para que useSyncExternalStore se actualice
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("storage"));
          }
          setIsLoading(false);
          return { success: true, message: data.message || "Acceso concedido" };
        } else {
          setIsLoading(false);
          return { success: false, message: data.message || "Clave inválida" };
        }
      } catch (error) {
        setIsLoading(false);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Error de conexión",
        };
      }
    },
    []
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(MODULES_KEY);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
    setIsLoading(false);
  }, []);

  // Si no estamos montados todavía (SSR o primer render), devolvemos estado neutro
  const isAuthenticated = mounted && storedKey !== null && storedModules.length > 0;

  return {
    key: mounted ? storedKey : null,
    modules: mounted ? storedModules : [],
    isLoading,
    isAuthenticated,
    mounted,
    login,
    logout,
  };
}

// ====================================================================
// Helpers estáticos (para usar fuera de componentes, en llamadas fetch)
// ====================================================================

export function getStoredKey(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function getStoredModules(): ModuleKey[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(MODULES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ModuleKey[];
  } catch {
    return [];
  }
}
