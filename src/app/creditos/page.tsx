import Link from "next/link";
import { ArrowLeft, Heart, Users, Code, Github } from "lucide-react";
import { AEFN_LOGOS } from "@/lib/theme";

/**
 * Página /creditos — Agradecimientos y colaboradores
 * ===========================================
 * Muestra un agradecimiento a todas las personas que han colaborado
 * con el desarrollo y mantenimiento del sitio web de la AEFN.
 *
 * 📚 Cómo editar esta página:
 * Para añadir, quitar o modificar nombres, edita los arrays COLABORADORES
 * y DESARROLLO más abajo. No necesitas tocar el resto del código.
 *
 * La página es un Server Component (no tiene estado ni interactividad),
 * por lo que se renderiza en el servidor y es muy rápida.
 */

export const metadata = {
  title: "Créditos - AEFN",
  description: "Agradecimientos a los colaboradores del sitio web de la AEFN",
};

// ====================================================================
// COLABORADORES — Editar esta lista para añadir/quitar nombres
// ====================================================================
// Formato: { nombre: string, rol: string, periodo?: string }
const COLABORADORES: Array<{
  nombre: string;
  rol: string;
  periodo?: string;
}> = [
  {
    nombre: "Juan Daniel Vasconez Vela",
    rol: "Desarrollador principal",
    periodo: "2025",
  },
  // Añade más colaboradores aquí siguiendo el mismo formato:
  // {
  //   nombre: "Nombre Apellido",
  //   rol: "Presidente AEFN 2025",
  //   periodo: "2025",
  // },
];

// ====================================================================
// DESARROLLO TÉCNICO — Personas que contribuyeron al código
// ====================================================================
const DESARROLLO: Array<{
  nombre: string;
  contribucion: string;
}> = [
  {
    nombre: "Juan Daniel Vasconez Vela",
    contribucion: "Migración a Next.js, panel de administración y backend",
  },
  // Añade más desarrolladores aquí:
  // {
  //   nombre: "Nombre",
  //   contribucion: "Descripción de la contribución",
  // },
];
// ====================================================================

export default function CreditosPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-neutral-950 border-b border-amber-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/index.html"
            className="inline-flex items-center gap-3 text-white hover:text-amber-400 transition-colors"
          >
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-amber-500/30 overflow-hidden">
              <img
                src={AEFN_LOGOS.ecfnSymbol}
                alt="ECFN"
                className="w-7 h-7 object-contain"
              />
            </div>
            <span className="font-semibold text-sm">AEFN</span>
          </Link>
          <Link
            href="/index.html"
            className="text-sm text-amber-400/70 hover:text-amber-400 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Título */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 border border-amber-500/20 mb-4">
            <Heart className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
            Créditos y Agradecimientos
          </h1>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Este sitio web es posible gracias al esfuerzo colaborativo de
            estudiantes y miembros de la Asociación de Estudiantes de Física y
            Nanotecnología de Yachay Tech.
          </p>
        </div>

        {/* Sección: Colaboradores */}
        {COLABORADORES.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold text-neutral-900">
                Colaboradores
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COLABORADORES.map((colab, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl bg-white border border-neutral-200 shadow-sm"
                >
                  <h3 className="font-semibold text-neutral-900">
                    {colab.nombre}
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">{colab.rol}</p>
                  {colab.periodo && (
                    <p className="text-xs text-neutral-400 mt-2">
                      Período: {colab.periodo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sección: Desarrollo técnico */}
        {DESARROLLO.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Code className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold text-neutral-900">
                Desarrollo técnico
              </h2>
            </div>
            <div className="space-y-3">
              {DESARROLLO.map((dev, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl bg-white border border-neutral-200 shadow-sm"
                >
                  <h3 className="font-semibold text-neutral-900">
                    {dev.nombre}
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    {dev.contribucion}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sección: Tecnología */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Github className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-neutral-900">
              Tecnología y herramientas
            </h2>
          </div>
          <div className="p-6 rounded-xl bg-neutral-950 border border-amber-500/20">
            <p className="text-neutral-300 text-sm leading-relaxed mb-4">
              Este sitio está construido con tecnologías modernas de código
              abierto:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                "Next.js 16",
                "React 19",
                "TypeScript",
                "Tailwind CSS 4",
                "shadcn/ui",
                "GitHub API",
                "Vercel",
                "Prisma",
                "sharp (imágenes)",
              ].map((tech) => (
                <div
                  key={tech}
                  className="px-3 py-2 rounded-md bg-white/5 border border-amber-500/10 text-amber-400/90 text-center"
                >
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mensaje final */}
        <section className="text-center py-8 border-t border-neutral-200">
          <p className="text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            ¿Quieres colaborar con el sitio? Escríbenos a{" "}
            <a
              href="mailto:decanatoecfn@yachaytech.edu.ec"
              className="text-amber-600 hover:text-amber-700 underline"
            >
              decanatoecfn@yachaytech.edu.ec
            </a>{" "}
            o visita nuestro repositorio en{" "}
            <a
              href="https://github.com/aefnyt/web_aefn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 underline"
            >
              GitHub
            </a>
            .
          </p>
          <p className="text-sm text-neutral-400 mt-6">
            AEFN · Asociación de Estudiantes de Física y Nanotecnología ·
            Yachay Tech
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-amber-500/20 bg-neutral-950">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-amber-400/60">
          AEFN · Yachay Tech
        </div>
      </footer>
    </div>
  );
}
