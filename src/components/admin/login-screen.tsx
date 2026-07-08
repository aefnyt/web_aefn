"use client";

import { useState } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { AEFN_LOGOS } from "@/lib/theme";

/**
 * Pantalla de Login del Panel Admin
 * ===========================================
 * Muestra un formulario simple donde el presidente ingresa su clave.
 * Al enviar, llama al hook useAdminAuth que verifica contra el backend.
 *
 * Identidad visual: dorado + negro (colores oficiales AEFN/ECFN).
 */

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { login, isLoading } = useAdminAuth();
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) {
      setError("Por favor ingresa tu clave de acceso.");
      return;
    }

    setError(null);
    const result = await login(key.trim());

    if (result.success) {
      onLoginSuccess?.();
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          {/* Símbolo ECFN (hexágono dorado) */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-amber-500/30 mb-4 overflow-hidden">
            <img
              src={AEFN_LOGOS.ecfnSymbol}
              alt="ECFN"
              className="w-14 h-14 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">AEFN · Panel de Administración</h1>
          <p className="text-sm text-amber-400/80 mt-1">
            Asociación de Estudiantes de Física y Nanotecnología
          </p>
        </div>

        <Card className="shadow-2xl border-amber-500/20 bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2 text-neutral-900">
              <KeyRound className="w-5 h-5 text-amber-600" />
              Iniciar sesión
            </CardTitle>
            <CardDescription>
              Ingresa la clave correspondiente al módulo que quieres administrar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key" className="text-neutral-900">Clave de acceso</Label>
                <div className="relative">
                  <Input
                    id="key"
                    type={showKey ? "text" : "password"}
                    placeholder="Tu clave de acceso"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    disabled={isLoading}
                    autoComplete="off"
                    className="pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-amber-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showKey ? "Ocultar clave" : "Mostrar clave"}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !key.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Ingresar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-100">
              <p className="text-xs text-neutral-500 leading-relaxed">
                <strong>Tipos de clave:</strong>
                <br />
                • Clave de <strong>administrador</strong>: acceso a todos los módulos
                <br />
                • Clave de <strong>módulo</strong> (profesores, eventos, etc.): acceso solo a ese módulo
                <br />
                <br />
                Si no tienes una clave, contacta al administrador de la asociación.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a
            href="/index.html"
            className="text-sm text-amber-400/70 hover:text-amber-400 transition-colors"
          >
            ← Volver al sitio público
          </a>
        </div>
      </div>
    </div>
  );
}
