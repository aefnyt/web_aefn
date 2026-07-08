import Link from "next/link";
import { readJsonFile } from "@/lib/github";
import { MODULES, NEWS_CATEGORIES } from "@/lib/config";
import type { Noticia, NewsCategory } from "@/lib/types";
import { Calendar, User, ArrowRight, Star, Newspaper, Atom } from "lucide-react";

/**
 * Página pública /noticias
 * ===========================================
 * Muestra:
 * 1. La noticia destacada como "hero" (imagen grande)
 * 2. Las demás noticias en un grid de tarjetas (3 columnas desktop)
 *
 * 📚 Concepto: Server Component
 * Esta página es un "Server Component": se renderiza en el servidor (no en
 * el navegador). Ventajas:
 * - Más rápido: el navegador recibe HTML listo, no tiene que esperar JS
 * - Mejor SEO: Google indexa el contenido
 * - Puede acceder a la API de GitHub directamente (con el token)
 *
 * 📚 Concepto: generateMetadata
 * Next.js llama a esta función para generar los <meta> tags de la página.
 * Útil para SEO (título, descripción que ven Google y redes sociales).
 */

export const dynamic = "force-dynamic"; // Siempre datos frescos

export const metadata = {
  title: "Noticias - AEFN",
  description: "Noticias y anuncios de la Asociación de Estudiantes de Física y Nanotecnología",
};

function formatDate(fecha: string): string {
  try {
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return fecha;
  }
}

export default async function NoticiasPage() {
  // Leer noticias desde GitHub
  let noticias: Noticia[] = [];
  let loadError = false;

  try {
    const { data } = await readJsonFile<Noticia[]>(MODULES.noticias.jsonPath);
    noticias = data ?? [];
  } catch {
    loadError = true;
  }

  // Filtrar solo publicadas y ordenar por fecha descendente
  const publicadas = noticias
    .filter((n) => n.publicada)
    .sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return dateB - dateA;
    });

  // La destacada es la primera con destacada=true (o fallback a la más reciente)
  const destacada =
    publicadas.find((n) => n.destacada) || publicadas[0] || null;

  // Las demás (sin la destacada)
  const demas = destacada
    ? publicadas.filter((n) => n.id !== destacada.id)
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/index.html"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 text-white">
                  <Atom className="w-5 h-5" />
                </div>
                <span className="font-semibold">AEFN</span>
              </Link>
              <span className="text-slate-300">/</span>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Newspaper className="w-6 h-6" />
                Noticias
              </h1>
            </div>
            <Link
              href="/index.html"
              className="text-sm text-slate-500 hover:text-slate-700 hidden sm:block"
            >
              ← Volver al inicio
            </Link>
          </div>
          <p className="text-slate-600 mt-2 text-sm">
            Noticias, anuncios e información relevante para la comunidad de Física y Nanotecnología.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadError && (
          <div className="p-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            <p className="font-semibold">No se pudieron cargar las noticias.</p>
            <p className="text-sm mt-1">
              Intenta recargar la página en unos momentos.
            </p>
          </div>
        )}

        {!loadError && publicadas.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
              <Newspaper className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Aún no hay noticias publicadas
            </h2>
            <p className="text-slate-500">
              Vuelve pronto para conocer las últimas novedades de la asociación.
            </p>
          </div>
        )}

        {/* === NOTICIA DESTACADA (HERO) === */}
        {destacada && (
          <section className="mb-12">
            <Link
              href={`/noticias/${destacada.id}`}
              className="group block overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Imagen */}
                <div className="aspect-video lg:aspect-auto lg:h-full bg-slate-100 overflow-hidden">
                  {destacada.imagen ? (
                    <img
                      src={`/${destacada.imagen}`}
                      alt={destacada.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Newspaper className="w-16 h-16" />
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Destacada
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                      {NEWS_CATEGORIES[destacada.categoria as NewsCategory] || destacada.categoria}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 group-hover:text-slate-700 transition-colors">
                    {destacada.titulo}
                  </h2>

                  {destacada.resumen && (
                    <p className="text-slate-600 mb-4 line-clamp-3">
                      {destacada.resumen}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(destacada.fecha)}
                    </span>
                    {destacada.autor && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {destacada.autor}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-slate-900 group-hover:gap-2 transition-all">
                    Leer noticia completa
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* === GRID DE NOTICIAS === */}
        {demas.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {destacada ? "Más noticias" : "Todas las noticias"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {demas.map((noticia) => (
                <Link
                  key={noticia.id}
                  href={`/noticias/${noticia.id}`}
                  className="group block overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md transition-all border border-slate-100"
                >
                  {/* Imagen */}
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    {noticia.imagen ? (
                      <img
                        src={`/${noticia.imagen}`}
                        alt={noticia.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Newspaper className="w-10 h-10" />
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                        {NEWS_CATEGORIES[noticia.categoria as NewsCategory] || noticia.categoria}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-slate-700 transition-colors">
                      {noticia.titulo}
                    </h4>

                    {noticia.resumen && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {noticia.resumen}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(noticia.fecha)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400">
          AEFN · Asociación de Estudiantes de Física y Nanotecnología · Yachay Tech
        </div>
      </footer>
    </div>
  );
}
