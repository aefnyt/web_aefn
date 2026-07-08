/**
 * Tipos compartidos para el backend del AEFN
 * ===========================================
 * Este archivo define la "forma" de los datos que usamos en todo el proyecto.
 * TypeScript usa estos tipos para detectar errores antes de que el código se ejecute.
 *
 * 📚 Concepto: Tipo (Type)
 * Un tipo es como un molde. Le dice a TypeScript "esta variable siempre va a ser
 * un objeto con estos campos". Si intentas asignar algo diferente, TypeScript te
 * avisa antes de que el código se ejecute. Es como tener un corrector ortográfico
 * pero para la estructura de tus datos.
 */

/** Resultado de una operación que modifica un archivo en GitHub */
export interface GitHubCommitResult {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  message: string;
}

/** Módulos del sistema que se pueden editar desde el panel admin */
export type ModuleKey =
  | "profesores"
  | "eventos"
  | "grupos"
  | "noticias"
  | "clubes"
  | "galeria";

/** Información sobre un módulo (definida en config.ts) */
export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  /** Ruta del archivo JSON dentro del repo, ej: "data/profesores.json" */
  jsonPath: string;
  /** Ruta de la carpeta de imágenes dentro del repo, ej: "images/profesores" */
  imagesPath?: string;
  /** Descripción corta para mostrar en el panel */
  description: string;
  /** Icono de lucide-react para el panel */
  icon: string;
}

/** Respuesta del endpoint de verificación de clave */
export interface AuthVerifyResponse {
  valid: boolean;
  modules: ModuleKey[];
  message?: string;
}

/** Categorías de noticias (extensibles sin tocar código) */
export type NewsCategory =
  | "publicacion-cientifica"
  | "reconocimiento"
  | "logro-estudiantes"
  | "convocatoria-investigacion"
  | "convocatoria-vinculacion"
  | "convocatoria-becas"
  | "evento-asociacion"
  | "comunicado-universidad"
  | "otra";

/** Estructura de una noticia */
export interface Noticia {
  id: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagen?: string;
  fecha: string;
  autor: string;
  categoria: NewsCategory;
  etiquetas: string[];
  destacada: boolean;
  publicada: boolean;
  creadaEn: string;
  actualizadaEn: string;
}

/** Estructura de un profesor (esquema completo que ya existe en data/profesores.json) */
export interface Profesor {
  /** ID único autogenerado (slug del nombre). Añadido por el panel admin. */
  id?: string;
  /** Nombre completo, ej: "Gema Gonzáles, Ph.D" */
  nombre: string;
  /** Título o cargo, ej: "Decana de la Escuela..." */
  titulo: string;
  /** Códigos de área, ej: ["nanotecnologia", "computacion"] */
  area: string[];
  /** Áreas de investigación (frases legibles) */
  areas_investigacion: string[];
  /** Ruta relativa de la foto, ej: "images/profesores/gema.webp" (vacío si no tiene) */
  foto: string;
  /** Email institucional */
  email: string;
  /** Teléfono (opcional) */
  telefono?: string;
  /** Oficina (opcional) */
  oficina?: string;
  /** Biografía */
  bio?: string;
  /** Lista de títulos académicos */
  educacion?: string[];
  /** Lista de publicaciones destacadas */
  publicaciones?: string[];
  /** Lista de proyectos de investigación */
  proyectos?: string[];
  /** Enlaces a redes académicas */
  social?: {
    linkedin?: string;
    google_scholar?: string;
    github?: string;
    researchgate?: string;
    orcid?: string;
  };
}

/** Códigos de área válidos para profesores (definidos en profesores.js) */
export const PROFESSOR_AREAS: Record<string, string> = {
  "fisica-teorica": "Física Teórica",
  "fisica-experimental": "Física Experimental",
  "nanotecnologia": "Nanotecnología",
  "matematicas": "Matemáticas",
  "computacion": "Computación",
  "optica": "Óptica",
  "astronomia": "Astronomía",
  "fisica-aplicada": "Física Aplicada",
};

/** Estructura de un evento */
export interface Evento {
  id: string;
  titulo: string;
  descripcion?: string;
  /** Fecha ISO, ej: "2025-09-02T10:00:00" */
  fecha: string;
  ubicacion?: string;
  /** Tipo: reunion, seminario, taller, charla, congreso, otro */
  tipo?: string;
  /** Estado: proximo, en-curso, finalizado, cancelado */
  estado?: string;
  link?: string;
}

/** Estructura de un club */
export interface Club {
  id: string;
  nombre: string;
  icono?: string;
  descripcion?: string;
  descripcion_larga?: string;
  directiva?: Array<{
    cargo: string;
    nombre: string;
    email?: string;
  }>;
  actividades?: Array<{
    fecha?: string;
    titulo?: string;
    descripcion?: string;
  }>;
  contacto_email?: string;
}

/** Estructura de un álbum de galería */
export interface AlbumGaleria {
  id: string;
  album: string;
  category?: string;
  date?: string;
  description?: string;
  photos: Array<{
    id: string;
    title?: string;
    image: string;
    description?: string;
  }>;
}

/** Estructura de un grupo de investigación */
export interface GrupoInvestigacion {
  id: string;
  title: string;
  slug?: string;
  short_description?: string;
  image?: string;
  participants?: Array<{
    name: string;
    role?: string;
  }>;
  long_description?: string;
  projects?: Array<{
    title: string;
    year?: number;
  }>;
  contact_email?: string;
}

/** Estructura de un paper (publicación científica) */
export interface Paper {
  title: string;
  authors: string[];
  year: number;
  abstract?: string;
  link?: string;
  published?: boolean;
}

/** Estructura de una tesis */
export interface Tesis {
  title: string;
  author: string;
  year: number;
  abstract?: string;
  link?: string;
  status?: string; // "en curso", "defendida"
}
