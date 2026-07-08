/**
 * Paleta de colores oficial AEFN / ECFN
 * ===========================================
 * La identidad visual de la Escuela de Ciencias Físicas y Nanotecnología
 * usa DORADO y NEGRO como colores principales.
 *
 * 📚 Concepto: Paleta de colores
 * Una paleta es un conjunto fijo de colores que se usan consistentemente
 * en todo un proyecto. Definirlos en un solo lugar facilita mantener
 * coherencia visual y cambiarlos en el futuro.
 *
 * Clases Tailwind correspondientes a nuestra paleta:
 * - Negro:     bg-neutral-950, text-neutral-50 (texto sobre negro)
 * - Dorado:    bg-amber-500, text-amber-600, bg-amber-100 (fondos claros)
 * - Gris claro: bg-neutral-50, bg-neutral-100 (fondos de páginas)
 *
 * Usamos "neutral" (no "slate" ni "zinc") porque es el gris más puro,
 * sin tintes azulados o amarillentos, que combina mejor con el dorado.
 */

export const AEFN_COLORS = {
  /** Negro principal — fondos oscuros, headers */
  black: {
    bg: "bg-neutral-950",
    bgHover: "bg-neutral-900",
    text: "text-neutral-50",
    textOnBlack: "text-white",
  },
  /** Dorado principal — acentos, botones, highlights */
  gold: {
    bg: "bg-amber-500",
    bgHover: "bg-amber-600",
    bgLight: "bg-amber-50",
    bgLightHover: "bg-amber-100",
    text: "text-amber-600",
    textDark: "text-amber-700",
    border: "border-amber-500",
    borderLight: "border-amber-200",
  },
  /** Grises neutros — fondos, texto secundario */
  neutral: {
    bg: "bg-neutral-50",
    bgCard: "bg-white",
    bgSubtle: "bg-neutral-100",
    text: "text-neutral-900",
    textSecondary: "text-neutral-600",
    textMuted: "text-neutral-400",
    border: "border-neutral-200",
    borderSubtle: "border-neutral-100",
  },
} as const;

/**
 * Rutas de los logos oficiales.
 */
export const AEFN_LOGOS = {
  /** Logo completo de la AEFN (átomo + texto) — para footer y splash */
  aefn: "/images/logos/aefn-logo.png",
  /** Logo completo de la ECFN (hexágono + texto en inglés) */
  ecfn: "/images/logos/ecfn-logo.png",
  /** Solo el símbolo del hexágono dorado — para íconos y avatares */
  ecfnSymbol: "/images/logos/ecfn-symbol.png",
} as const;
