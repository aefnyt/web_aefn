import type { ModuleConfig, ModuleKey, NewsCategory } from "./types";

/**
 * Configuración central del AEFN
 * ===========================================
 * Este archivo es el "mapa" del proyecto. Define:
 * - Qué módulos existen y qué JSON/editan
 * - Qué categorías de noticias hay
 * - Quién es el dueño del repo y cómo se llama
 *
 * 📚 Concepto: Configuración centralizada
 * En vez de esparcir constantes por todo el código (el nombre del repo, las rutas
 * de los JSON, etc.), las ponemos todas en un solo archivo. Si mañana cambias el
 * nombre del repo o añades un módulo, solo modificas ESTE archivo y todo el
 * resto del proyecto se adapta automáticamente.
 */

// ====================================================================
// DATOS DEL REPOSITORIO
// ====================================================================
export const GITHUB_CONFIG = {
  /** Dueño del repositorio (la cuenta de GitHub) */
  owner: "aefnyt",
  /** Nombre del repositorio */
  repo: "web_aefn",
  /** Rama donde se guardan los cambios */
  branch: "main",
} as const;

// ====================================================================
// MÓDULOS EDITABLES
// ====================================================================
/**
 * Cada módulo define:
 * - key: identificador interno (también es el nombre de la clave de acceso)
 * - label: nombre visible en el panel admin
 * - jsonPath: ruta del JSON dentro del repo (relativa a la raíz)
 * - imagesPath: carpeta donde se suben las imágenes (opcional)
 * - description: texto de ayuda
 * - icon: nombre del icono de lucide-react
 */
export const MODULES: Record<ModuleKey, ModuleConfig> = {
  profesores: {
    key: "profesores",
    label: "Profesores",
    jsonPath: "public/data/profesores.json",
    imagesPath: "public/images/profesores",
    description: "Gestionar el directorio de profesores de la escuela",
    icon: "GraduationCap",
  },
  eventos: {
    key: "eventos",
    label: "Eventos",
    jsonPath: "public/data/events.json",
    description: "Gestionar eventos del calendario académico",
    icon: "Calendar",
  },
  grupos: {
    key: "grupos",
    label: "Investigación",
    jsonPath: "public/data/investigation-groups.json",
    description: "Grupos de investigación, papers y tesis",
    icon: "FlaskConical",
  },
  noticias: {
    key: "noticias",
    label: "Noticias",
    jsonPath: "public/data/noticias.json",
    imagesPath: "public/images/noticias",
    description: "Publicar noticias y anuncios para la comunidad",
    icon: "Newspaper",
  },
  clubes: {
    key: "clubes",
    label: "Clubes",
    jsonPath: "public/data/clubes.json",
    description: "Gestionar clubes estudiantiles",
    icon: "Users",
  },
  galeria: {
    key: "galeria",
    label: "Galería",
    jsonPath: "public/data/gallery.json",
    description: "Administrar álbumes y fotos de la galería",
    icon: "Image",
  },
};

/** Lista de todos los módulos (para iterar en el panel) */
export const ALL_MODULES: ModuleConfig[] = Object.values(MODULES);

// ====================================================================
// CATEGORÍAS DE NOTICIAS
// ====================================================================
/**
 * Categorías disponibles para clasificar noticias.
 * Si en el futuro necesitas una nueva categoría, solo añádela aquí.
 * El "slug" es lo que se guarda en el JSON; el "label" es lo que ve el usuario.
 */
export const NEWS_CATEGORIES: Record<NewsCategory, string> = {
  "publicacion-cientifica": "Publicación científica",
  "reconocimiento": "Reconocimiento académico",
  "logro-estudiantes": "Logro de estudiantes",
  "convocatoria-investigacion": "Convocatoria de investigación",
  "convocatoria-vinculacion": "Convocatoria de vinculación",
  "convocatoria-becas": "Becas o intercambios",
  "evento-asociacion": "Evento de la Asociación",
  "comunicado-universidad": "Comunicado oficial",
  "otra": "Otra",
};

// ====================================================================
// CONFIGURACIÓN DE IMÁGENES
// ====================================================================
/**
 * Límites para optimización de imágenes con sharp.
 * Estos valores se usan en lib/image.ts.
 */
export const IMAGE_CONFIG = {
  /** Ancho máximo para imágenes de noticias (px) */
  newsMaxWidth: 1200,
  /** Ancho máximo para fotos de profesores (px) */
  professorMaxWidth: 600,
  /** Calidad WebP (1-100). 80 es buen balance entre calidad y tamaño */
  webpQuality: 80,
  /** Tamaño máximo de archivo subido antes de optimizar (10 MB) */
  maxUploadBytes: 10 * 1024 * 1024,
} as const;
