import Link from "next/link";
import { notFound } from "next/navigation";
import { readJsonFile } from "@/lib/github";
import { MODULES, NEWS_CATEGORIES } from "@/lib/config";
import type { Noticia, NewsCategory } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { Calendar, User, ArrowLeft, Atom, Tag, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Página pública /noticias/[id] — Noticia individual
 * ===========================================
 * Muestra una noticia completa:
 * - Imagen grande
 * - Título, fecha, autor, categoría
 * - Contenido en Markdown renderizado
 * - Etiquetas
 * - Botón volver
 *
 * 📚 Concepto: generateStaticParams + dynamic
 * En Next.js, las páginas con [id] pueden ser:
 * - Estáticas: se generan HTMLs para cada id en build time
 * - Dinámicas: se generan en cada request
 * Usamos dynamic = "force-dynamic" porque las noticias cambian constantemente
 * (se agregan nuevas vía panel admin), así que no podemos pre-generarlas.
 */

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Genera metadatos dinámicos para SEO (título de la noticia) */
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const { data } = await readJsonFile<Noticia[]>(MODULES.noticias.jsonPath);
    const noticia = (data ?? []).find((n) => n.id === id);
    if (noticia) {
      return {
        title: `${noticia.titulo} - AEFN`,
        description: noticia.resumen || noticia.titulo,
      };
    }
  } catch {
    // ignore
  }
  return { title: "Noticia - AEFN" };
}

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

export default async function NoticiaIndividualPage({ params }: PageProps) {
  const { id } = await params;

  let noticia: Noticia | null = null;

  try {
    const { data } = await readJsonFile<Noticia[]>(MODULES.noticias.jsonPath);
    noticia = (data ?? []).find((n) => n.id === id) || null;
  } catch {
    notFound();
  }

  if (!noticia) {
    notFound();
  }

  // Si no está publicada, mostrar 404 (excepto si es preview admin, pero eso lo manejamos distinto)
  if (!noticia.publicada) {
    notFound();
  }

  const categoriaLabel =
    NEWS_CATEGORIES[noticia.categoria as NewsCategory] || noticia.categoria;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/index.html"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white">
              <Atom className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">AEFN</span>
          </Link>
          <Link
            href="/noticias"
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Todas las noticias
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Categoría */}
        <div className="mb-4">
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
            {categoriaLabel}
          </Badge>
        </div>

        {/* Título */}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
          {noticia.titulo}
        </h1>

        {/* Meta (fecha, autor) */}
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(noticia.fecha)}
          </span>
          {noticia.autor && (
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {noticia.autor}
            </span>
          )}
        </div>

        {/* Imagen principal */}
        {noticia.imagen && (
          <div className="mb-8 -mx-4 sm:mx-0">
            <img
              src={`/${noticia.imagen}`}
              alt={noticia.titulo}
              className="w-full max-w-3xl rounded-lg shadow-md object-cover aspect-video sm:rounded-xl"
            />
          </div>
        )}

        {/* Resumen (si existe, como subtítulo) */}
        {noticia.resumen && (
          <p className="text-lg text-slate-600 mb-6 font-medium leading-relaxed">
            {noticia.resumen}
          </p>
        )}

        {/* Contenido Markdown */}
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown
            components={{
              // Personalización de elementos Markdown
              h1: ({ children }) => (
                <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold text-slate-900 mt-6 mb-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold text-slate-800 mt-5 mb-2">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-slate-700 leading-relaxed mb-4">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 text-slate-700 space-y-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 text-slate-700 space-y-1">
                  {children}
                </ol>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-900 underline hover:text-slate-600"
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-slate-900">{children}</strong>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-slate-200 pl-4 italic text-slate-600 my-4">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ),
            }}
          >
            {noticia.contenido}
          </ReactMarkdown>
        </div>

        {/* Etiquetas */}
        {noticia.etiquetas && noticia.etiquetas.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-slate-400" />
              {noticia.etiquetas.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-slate-600 border-slate-200"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Botón volver */}
        <div className="mt-12 pt-6 border-t border-slate-100">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a todas las noticias
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 text-center text-xs text-slate-400">
          AEFN · Asociación de Estudiantes de Física y Nanotecnología · Yachay Tech
        </div>
      </footer>
    </div>
  );
}
