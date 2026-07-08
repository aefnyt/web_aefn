# 📐 Arquitectura del Proyecto AEFN

> Documentación técnica completa del sitio web de la Asociación de Estudiantes de Física y Nanotecnología (Yachay Tech).

---

## 📋 Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura de Carpetas](#4-estructura-de-carpetas)
5. [Flujo de Datos](#5-flujo-de-datos)
6. [Sistema de Autenticación](#6-sistema-de-autenticación)
7. [Integración con GitHub](#7-integración-con-github)
8. [Gestión de Imágenes](#8-gestión-de-imágenes)
9. [Paleta de Colores y Tema](#9-paleta-de-colores-y-tema)
10. [Decisiones de Diseño](#10-decisiones-de-diseño)
11. [Seguridad](#11-seguridad)
12. [Limitaciones y Futuras Mejoras](#12-limitaciones-y-futuras-mejoras)

---

## 1. Visión General

El proyecto es un **sitio web full-stack** que permite a la AEFN gestionar su presencia online sin necesidad de conocimientos técnicos. Combina:

- **Sitio público estático** (HTML/CSS/JS original) servido desde `public/`
- **Panel de administración** (React + shadcn/ui) para editar contenido
- **Backend de API** (Next.js API Routes) que habla con GitHub
- **Almacenamiento en GitHub** (archivos JSON + imágenes) con commits automáticos

### Principio rector

> "El presidente de la asociación debe poder agregar, editar y eliminar contenido desde el navegador, sin tocar código ni archivos JSON manualmente."

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Framework | **Next.js** | 16.1.3 | Full-stack (frontend + backend) |
| Lenguaje | **TypeScript** | 5 | Tipado estático |
| UI Components | **shadcn/ui** (New York) | - | Componentes accesibles |
| Iconos | **lucide-react** | 0.525 | Iconos SVG |
| Styling | **Tailwind CSS** | 4 | Utility-first CSS |
| Markdown | **react-markdown** | 10.1 | Renderizar contenido de noticias |
| Optimización imágenes | **sharp** | 0.34 | Redimensionar + WebP |
| Despliegue | **Vercel** | - | Hosting + CDN + HTTPS |
| Almacenamiento | **GitHub** | - | JSON + imágenes como commits |
| Notificaciones | **sonner** | 2.0 | Toasts en el panel admin |
| Validación | **zod** | 4 | (disponible, sin usar extensivamente) |

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│  NAVEGADOR DEL USUARIO                                          │
│                                                                 │
│  ┌─────────────────────┐    ┌────────────────────────────────┐ │
│  │ SITIO PÚBLICO       │    │ PANEL ADMIN (/admin)           │ │
│  │ (HTML estático)     │    │ (React + Tailwind + shadcn/ui) │ │
│  │ /index.html         │    │ Login → Dashboard → CRUD       │ │
│  │ /profesores.html    │    │                                │ │
│  │ /noticias (Next.js) │    │ sessionStorage guarda la clave │ │
│  │ /creditos (Next.js) │    │                                │ │
│  └─────────┬───────────┘    └──────────────┬─────────────────┘ │
│            │                               │                   │
│            │ fetch JSON                    │ fetch + Auth header│
│            ▼                               ▼                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  VERCEL — Next.js (Serverless)                                  │
│                                                                 │
│  API Routes (backend):                                          │
│  ├── /api/auth/verify        POST  Validar clave               │
│  ├── /api/data/[modulo]      GET   Leer JSON                   │
│  ├── /api/profesores         GET/POST/PUT/DELETE               │
│  ├── /api/profesores/foto    POST/DELETE (subir/eliminar foto) │
│  ├── /api/noticias           GET/POST/PUT/DELETE               │
│  ├── /api/noticias/imagen    POST/DELETE                       │
│  ├── /api/eventos            GET/POST/PUT/DELETE               │
│  ├── /api/clubes             GET/POST/PUT/DELETE               │
│  ├── /api/galeria            GET/POST/PUT/DELETE               │
│  ├── /api/grupos             GET/POST/PUT/DELETE               │
│  ├── /api/papers             GET/POST/PUT/DELETE               │
│  └── /api/tesis              GET/POST/PUT/DELETE               │
│                                                                 │
│  Variables de entorno (NUNCA en código):                        │
│  ├── GITHUB_TOKEN   (Fine-grained PAT, permiso Contents: RW)   │
│  └── ACCESS_KEYS    (JSON con las 7 claves de acceso)          │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼ GitHub Contents API
┌─────────────────────────────────────────────────────────────────┐
│  REPOSITORIO GITHUB (aefnyt/web_aefn)                          │
│                                                                 │
│  /data/*.json        ← cada edición genera 1 commit            │
│  /images/profesores/ ← fotos optimizadas (WebP 600px)           │
│  /images/noticias/   ← imágenes optimizadas (WebP 1200px)       │
│                                                                 │
│  ✅ Historial completo = auditoría automática                  │
│  ✅ Rollback trivial = git revert                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Estructura de Carpetas

```
web_aefn/
├── public/                          # Archivos estáticos servidos directamente
│   ├── index.html                   # Página principal (HTML original)
│   ├── profesores.html, clubes.html, ...  # Páginas HTML originales
│   ├── css/                         # Bootstrap + tema AEFN
│   ├── js/                          # jQuery, Bootstrap JS, scripts propios
│   ├── data/                        # JSON de datos (editables vía admin)
│   │   ├── profesores.json
│   │   ├── events.json
│   │   ├── clubes.json
│   │   ├── gallery.json
│   │   ├── investigation-groups.json
│   │   ├── papers.json
│   │   ├── theses.json
│   │   └── noticias.json            # (nuevo, añadido por este proyecto)
│   ├── images/
│   │   ├── logos/                   # 3 logos oficiales (AEFN, ECFN, símbolo)
│   │   ├── profesores/              # Fotos de profesores (WebP)
│   │   ├── noticias/                # Imágenes de noticias (WebP)
│   │   └── gallery/                 # Fotos de la galería
│   ├── fonts/, mallas/, welcome_screen/
│   └── robots.txt
│
├── src/
│   ├── app/                         # App Router de Next.js
│   │   ├── page.tsx                 # Redirect a /index.html
│   │   ├── layout.tsx               # Layout raíz (metadata + Toaster)
│   │   ├── globals.css              # Estilos globales Tailwind
│   │   │
│   │   ├── admin/                   # Panel de administración (cliente)
│   │   │   ├── page.tsx             # Login + Dashboard
│   │   │   ├── profesores/page.tsx  # CRUD profesores
│   │   │   ├── noticias/page.tsx    # CRUD noticias
│   │   │   ├── eventos/page.tsx     # CRUD eventos
│   │   │   ├── clubes/page.tsx      # CRUD clubes
│   │   │   ├── galeria/page.tsx     # CRUD galería
│   │   │   ├── grupos/page.tsx      # CRUD grupos + papers + tesis (con tabs)
│   │   │   └── [modulo]/page.tsx    # Placeholder dinámico (fallback)
│   │   │
│   │   ├── noticias/                # Páginas públicas (server components)
│   │   │   ├── page.tsx             # Lista con hero + grid
│   │   │   └── [id]/page.tsx        # Noticia individual (Markdown)
│   │   │
│   │   ├── creditos/page.tsx        # Página de créditos (server component)
│   │   │
│   │   └── api/                     # API Routes (backend)
│   │       ├── auth/verify/route.ts
│   │       ├── data/[modulo]/route.ts
│   │       ├── profesores/route.ts
│   │       ├── profesores/foto/route.ts
│   │       ├── noticias/route.ts
│   │       ├── noticias/imagen/route.ts
│   │       ├── eventos/route.ts
│   │       ├── clubes/route.ts
│   │       ├── galeria/route.ts
│   │       ├── grupos/route.ts
│   │       ├── papers/route.ts
│   │       └── tesis/route.ts
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui (40+ componentes)
│   │   └── admin/                   # Componentes del panel admin
│   │       ├── login-screen.tsx
│   │       ├── admin-dashboard.tsx
│   │       ├── admin-module-header.tsx  # Header reutilizable
│   │       ├── confirm-delete-dialog.tsx
│   │       ├── professor-list.tsx, professor-form.tsx, professor-photo-input.tsx
│   │       ├── news-list.tsx, news-form.tsx, news-image-input.tsx
│   │       ├── event-list.tsx, event-form.tsx
│   │       ├── club-list.tsx, club-form.tsx
│   │       ├── gallery-list.tsx, gallery-form.tsx
│   │       ├── group-list.tsx, group-form.tsx
│   │       ├── paper-list.tsx, paper-form.tsx
│   │       └── thesis-list.tsx, thesis-form.tsx
│   │
│   ├── hooks/
│   │   ├── use-admin-auth.ts        # Hook de autenticación (cliente)
│   │   ├── use-toast.ts             # Toast hook (shadcn)
│   │   └── use-mobile.ts            # Detección de móvil
│   │
│   └── lib/
│       ├── types.ts                 # Tipos TypeScript (Profesor, Noticia, etc.)
│       ├── config.ts                # Módulos, categorías, límites
│       ├── auth.ts                  # Validación de claves (timing-safe)
│       ├── github.ts                # Cliente GitHub Contents API
│       ├── image.ts                 # Optimización con sharp
│       ├── theme.ts                 # Paleta dorado/negro + rutas de logos
│       ├── db.ts                    # Prisma client (no usado en este proyecto)
│       └── utils.ts                 # cn() helper de Tailwind
│
├── prisma/                          # Schema de Prisma (no usado)
├── .env.example                     # Plantilla de variables de entorno
├── .env.local                       # Variables locales (NO subir a git)
├── ARCHITECTURE.md                  # Este archivo
├── ADMIN_MANUAL.md                  # Manual para presidentes
├── DEPLOYMENT.md                    # Guía de despliegue en Vercel
└── package.json
```

---

## 5. Flujo de Datos

### Flujo de lectura (visitante ve el sitio)

```
1. Usuario visita /index.html
2. Next.js sirve el archivo estático desde public/
3. El HTML carga CSS de Bootstrap + JS de jQuery
4. JS hace fetch('data/profesores.json') → sirve desde public/
5. Se renderizan las tarjetas de profesores
```

### Flujo de edición (admin actualiza contenido)

```
1. Admin entra a /admin, ingresa su clave
2. Navegador: POST /api/auth/verify con la clave en header Authorization
3. Backend: compara clave con ACCESS_KEYS (timing-safe)
4. Backend: devuelve { valid: true, modules: ["profesores", ...] }
5. Navegador: guarda clave en sessionStorage, muestra dashboard

6. Admin hace clic en "Profesores" → /admin/profesores
7. Navegador: GET /api/profesores (sin auth, lectura pública)
8. Backend: readJsonFile("data/profesores.json")
   - Si hay GITHUB_TOKEN: lee de GitHub API (datos frescos)
   - Si no: fallback a archivo local public/data/profesores.json
9. Navegador: renderiza la lista

10. Admin hace clic en "Agregar", llena el formulario, guarda
11. Navegador: POST /api/profesores con clave en header + datos
12. Backend: hasPermission(clave, "profesores") → verifica
13. Backend: readJsonFile (lee estado actual + SHA)
14. Backend: agrega nuevo profesor al array
15. Backend: writeJsonFile → PUT a GitHub Contents API
    - Genera commit "Add profesor: Dr. Juan Pérez"
16. GitHub: responde con commit SHA
17. Backend: responde { success: true, commitSha: "abc123" }
18. Navegador: actualiza lista local + toast de éxito
```

---

## 6. Sistema de Autenticación

### Modelo: claves por módulo (sin usuarios)

No hay sistema tradicional de usuarios con login/contraseña. En su lugar, hay **7 claves de acceso**:

| Clave | Permiso |
|-------|---------|
| `admin` | Acceso a TODOS los módulos |
| `profesores` | Solo módulo Profesores |
| `eventos` | Solo módulo Eventos |
| `grupos` | Solo módulo Grupos (incluye papers + tesis) |
| `noticias` | Solo módulo Noticias |
| `clubes` | Solo módulo Clubes |
| `galeria` | Solo módulo Galería |

### Implementación

**Lado servidor** (`src/lib/auth.ts`):
- Las claves viven en la variable de entorno `ACCESS_KEYS` (formato JSON)
- Comparación con `crypto.timingSafeEqual` (evita timing attacks)
- `extractKeyFromRequest()` extrae la clave del header `Authorization: Bearer <clave>`

**Lado cliente** (`src/hooks/use-admin-auth.ts`):
- Hook `useAdminAuth()` con `useSyncExternalStore` (React 19)
- La clave se guarda en `sessionStorage` (se borra al cerrar la pestaña)
- Flag `mounted` para evitar hydration mismatch (patrón estándar Next.js)

### Cambiar una clave

1. **En Vercel (producción):** Settings → Environment Variables → editar `ACCESS_KEYS` → Redeploy
2. **En desarrollo:** editar `.env.local` y reiniciar el servidor

**No se toca código.** Las claves nunca están en el repositorio.

---

## 7. Integración con GitHub

### Mecanismo

Usamos la [GitHub Contents API](https://docs.github.com/rest/repos/contents):

| Operación | Método HTTP | Endpoint |
|-----------|-------------|----------|
| Leer archivo | GET | `/repos/{owner}/{repo}/contents/{path}?ref=main` |
| Crear/Actualizar | PUT | `/repos/{owner}/{repo}/contents/{path}` |
| Eliminar | DELETE | `/repos/{owner}/{repo}/contents/{path}` |

Cada PUT/DELETE genera automáticamente un commit en GitHub.

### Token (PAT Fine-grained)

- **Tipo:** Fine-grained (más seguro que Classic)
- **Permisos:** Solo `Contents: Read and write` sobre el repo `aefnyt/web_aefn`
- **Expiración:** 90 días (recomendado)
- **Almacenamiento:** Variable de entorno `GITHUB_TOKEN` (nunca en código)

### Optimistic Concurrency Control

Cada PUT requiere el SHA del archivo actual. Si alguien más editó el archivo entre que lo leíste y lo guardaste, el SHA no coincidirá y la API rechazará la petición. Esto previene sobrescribir cambios de otros.

### Fallback para desarrollo

Si `GITHUB_TOKEN` no está configurado (o es el placeholder), las operaciones de **lectura** caen al archivo local en `public/`. Las operaciones de **escritura** fallan con un error claro. Esto permite probar toda la UI sin necesidad de un token real.

---

## 8. Gestión de Imágenes

### Flujo de subida

```
1. Admin selecciona imagen en el formulario (input type="file")
2. Navegador: POST /api/profesores/foto (o /api/noticias/imagen)
   con FormData: { id, file }
3. Backend:
   a. validateImage() — verifica tipo (JPG/PNG/WebP/GIF) y tamaño (<10MB)
   b. processNewsImage() o processProfessorPhoto() con sharp:
      - Noticias: redimensiona a 1200px ancho, WebP calidad 80
      - Profesores: redimensiona a 600x600 cuadrado, WebP calidad 80
   c. writeBinaryFile() → PUT a GitHub (base64)
   d. Actualiza el campo "foto"/"imagen" en el JSON
   e. Si había imagen anterior, la elimina (deleteFile)
4. Resultado: 1 commit de imagen + 1 commit de JSON
```

### Por qué sharp + WebP

- Una foto de 5MB se reduce a ~50KB (99% de reducción)
- WebP es soportado por todos los navegadores modernos
- Mantiene el repositorio pequeño y el sitio rápido

---

## 9. Paleta de Colores y Tema

### Colores oficiales AEFN/ECFN

| Color | Tailwind | Uso |
|-------|----------|-----|
| **Negro** | `neutral-950`, `neutral-900` | Headers, footers, fondos oscuros |
| **Dorado** | `amber-500`, `amber-600` | Acentos, botones, hover |
| **Dorado claro** | `amber-50`, `amber-100` | Fondos suaves, badges |
| **Gris neutro** | `neutral-50`, `neutral-100` | Fondos de páginas, cards |
| **Texto** | `neutral-900`, `neutral-600` | Texto principal y secundario |

### Por qué `neutral` y no `slate`

`neutral` es el gris más puro (sin tintes azulados o amarillentos). Combina mejor con el dorado que `slate` (que tiene un tinte azulado).

### Logos oficiales

Ubicación: `public/images/logos/`

| Archivo | Uso |
|---------|-----|
| `aefn-logo.png` | Logo completo AEFN (átomo + texto) |
| `ecfn-logo.png` | Logo completo ECFN (hexágono + texto en inglés) |
| `ecfn-symbol.png` | Símbolo del hexágono dorado — usado en headers del panel admin |

### Definición central

Toda la configuración de tema está en `src/lib/theme.ts`:

```typescript
export const AEFN_COLORS = { black: {...}, gold: {...}, neutral: {...} };
export const AEFN_LOGOS = { aefn: "...", ecfn: "...", ecfnSymbol: "..." };
```

---

## 10. Decisiones de Diseño

### ¿Por qué Next.js y no Astro/SvelteKit/etc.?

1. **Full-stack en un solo proyecto** — frontend y backend juntos, sin dividir entre plataformas
2. **Vercel es del mismo equipo** — integración perfecta, cero configuración
3. **API Routes** — endpoints de backend sin configurar un servidor separado
4. **Server Components** — las páginas públicas `/noticias` se renderizan en servidor (SEO + velocidad)
5. **Ecosistema maduro** — shadcn/ui, React 19, documentación extensa

### ¿Por qué archivos JSON y no una base de datos?

1. **Cantidad de datos pequeña** — ~5-50 registros por módulo
2. **Auditoría automática** — cada cambio es un commit con autor, fecha y diff
3. **Rollback trivial** — `git revert` o "Restore commit" en GitHub
4. **Transparencia** — cualquier persona puede ver los datos en GitHub
5. **Cero costo** — no hay que pagar/mantener una BD
6. **Migración futura fácil** — si se necesita BD, los JSON se importan fácil

### ¿Por qué sessionStorage y no localStorage?

- `sessionStorage` se borra al cerrar la pestaña → más seguro
- Si alguien se sienta en la computadora del presidente después, no encuentra la clave
- El presidente debe ingresar su clave cada vez que abre una sesión nueva (aceptable para uso admin)

### ¿Por qué Server Components para páginas públicas?

- `/noticias` y `/noticias/[id]` son Server Components
- Se renderizan en el servidor → HTML listo para el navegador
- **Mejor SEO**: Google ve el contenido real, no un loading spinner
- **Más rápido**: el navegador no tiene que esperar JS para mostrar contenido
- Pueden acceder a la API de GitHub directamente (con el token del servidor)

### ¿Por qué no JWT?

Para una asociación estudiantil con ~5-10 administradores, el sistema de claves es suficiente y más simple. Un sistema JWT requeriría:
- Generación de tokens con expiración
- Refresh tokens
- Almacenamiento más complejo
- Middleware de validación

Si en el futuro se necesita más seguridad, se puede añadir JWT sin cambiar la arquitectura.

---

## 11. Seguridad

### ✅ Buenas prácticas implementadas

| Práctica | Implementación |
|----------|----------------|
| **Tokens nunca en el navegador** | `GITHUB_TOKEN` solo en servidor (Vercel) |
| **Claves nunca en código** | `ACCESS_KEYS` en variable de entorno |
| **Comparación timing-safe** | `crypto.timingSafeEqual` en `auth.ts` |
| **HTTPS obligatorio** | Vercel lo configura automáticamente |
| **Validación de permisos** | Cada operación de escritura verifica `hasPermission()` |
| **Validación de imágenes** | `validateImage()` verifica tipo y tamaño |
| **Sanitización de inputs** | React escapa HTML automáticamente |
| **Tokens PAT Fine-grained** | Solo acceso al repo específico, permisos mínimos |

### ⚠️ Consideraciones

- Las claves viajan en cada petición (header Authorization), pero **solo sobre HTTPS** (cifrado)
- Si una clave se compromete, se cambia en Vercel y se hace redeploy
- El PAT de GitHub tiene expiración de 90 días (GitHub avisa antes de expirar)
- No hay rate limiting adicional (GitHub ya limita a 5000 req/hora)

---

## 12. Limitaciones y Futuras Mejoras

### Limitaciones actuales

1. **Latencia de ~1-2s por edición** — la API de GitHub no es instantánea
2. **Vercel redespliega tras cada commit** (~30s) — durante ese tiempo, los datos servidos por Vercel pueden estar "viejos"
   - **Mitigación:** las páginas públicas leen de GitHub API (datos frescos), no de Vercel
3. **5.000 req/hora a GitHub** — suficiente para una asociación, pero limitante si crece mucho
4. **Sin búsqueda global** — podría añadirse en el futuro
5. **Sin imágenes en galería vía upload** — el admin escribe rutas manualmente (mejorable)

### Futuras mejoras posibles

- 🔹 Búsqueda global en el sitio
- 🔹 Integración con Google Calendar para eventos
- 🔹 Formulario de contacto funcional (con email)
- 🔹 Sistema de borradores para noticias (ya hay campo `publicada`, pero sin preview)
- 🔹 Notificaciones por email cuando se publica algo nuevo
- 🔹 Exportación/importación de datos (backup completo)
- 🔹 Migración a base de datos si el volumen crece (Supabase, PlanetScale)
- 🔹 Multi-idioma (inglés/español)

---

## 📖 Documentación relacionada

- **[ADMIN_MANUAL.md](./ADMIN_MANUAL.md)** — Manual para presidentes (sin conocimientos técnicos)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Guía paso a paso de despliegue en Vercel
- **[README.md](./README.md)** — Resumen del proyecto

---

*Última actualización: Diciembre 2025*
