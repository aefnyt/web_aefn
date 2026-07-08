import { redirect } from "next/navigation";

/**
 * FASE 1 — Servir el sitio estático original
 * ===========================================
 * La ruta "/" redirige a "/index.html", que es servido directamente desde
 * la carpeta public/ como un archivo estático. Esto permite que el sitio
 * original (HTML + CSS Bootstrap + JS) funcione sin cambios, sin que el
 * layout de Next.js (Tailwind, globals.css) interfiera con sus estilos.
 *
 * Las páginas /admin, /noticias y /creditos (que sí usarán React + Tailwind)
 * se añadirán en fases posteriores y tendrán su propio layout.
 */
export default function Home() {
  redirect("/index.html");
}
