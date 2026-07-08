# 🎓 AEFN — Sitio Web Oficial

> Asociación de Estudiantes de Física y Nanotecnología — Yachay Tech

Sitio web moderno y administrable para la AEFN. Permite gestionar profesores, noticias, eventos, clubes, galería e investigación desde un panel web, sin necesidad de editar archivos manualmente.

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Documentación](#-documentación)
- [Inicio rápido](#-inicio-rápido)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Desarrollo local](#-desarrollo-local)
- [Despliegue](#-despliegue)
- [Tecnologías](#-tecnologías)
- [Contacto](#-contacto)

---

## ✨ Características

### Sitio público
- 🏠 **Página principal** con carrusel, áreas y FAQ
- 👨‍🏫 **Directorio de profesores** con perfiles completos y fotos
- 📰 **Sección de noticias** con artículo destacado + grid
- 📅 **Calendario de eventos** académicos
- 🎯 **Clubes estudiantiles** con directivas y actividades
- 🔬 **Grupos de investigación** con papers y tesis
- 📸 **Galería de fotos** organizada en álbumes
- 🤝 **Página de créditos** con colaboradores

### Panel de administración (`/admin`)
- 🔐 **Autenticación por claves** (una clave por módulo)
- ✏️ **CRUD completo** para todos los módulos
- 🖼️ **Subida de imágenes** con optimización automática (WebP)
- 📝 **Editor Markdown** para el contenido de noticias
- ⭐ **Noticias destacadas** (una a la vez, automático)
- 💾 **Commits automáticos** a GitHub con cada cambio
- 📱 **Diseño responsive** (funciona en móvil y desktop)
- 🎨 **Paleta oficial** dorado + negro de la ECFN

### Backend
- 🌐 **API REST** completa (Next.js API Routes)
- 🔑 **Validación de permisos** por módulo
- 🐙 **Integración con GitHub** (Contents API)
- 🖼️ **Optimización de imágenes** con sharp
- 🔒 **Variables de entorno** (tokens y claves nunca en código)

---

## 📚 Documentación

| Documento | Para quién | Qué contiene |
|-----------|-----------|--------------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Desarrolladores | Arquitectura técnica, decisiones de diseño, estructura |
| **[ADMIN_MANUAL.md](./ADMIN_MANUAL.md)** | Presidentes y administradores | Cómo usar el panel admin (sin conocimientos técnicos) |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Quien despliega el sitio | Guía paso a paso de Vercel + GitHub |

---

## 🚀 Inicio rápido

### Para visitantes

Solo ve a la URL del sitio y navega. No necesitas cuenta ni clave.

### Para administradores

1. Ve a `https://tu-sitio.vercel.app/admin`
2. Ingresa tu clave de acceso
3. Administra el contenido desde el panel

> 📖 Ver **[ADMIN_MANUAL.md](./ADMIN_MANUAL.md)** para instrucciones detalladas.

### Para desarrolladores

```bash
# Clonar el repositorio
git clone https://github.com/aefnyt/web_aefn.git
cd web_aefn

# Instalar dependencias
bun install

# Copiar variables de entorno
cp .env.example .env.local
# Edita .env.local con tu GITHUB_TOKEN y ACCESS_KEYS

# Iniciar servidor de desarrollo
bun run dev
```

Abre `http://localhost:3000` en tu navegador.

---

## 📁 Estructura del proyecto

```
web_aefn/
├── public/                  # Sitio estático original (HTML/CSS/JS) + datos JSON
│   ├── index.html           # Página principal
│   ├── data/                # Archivos JSON (editables vía admin)
│   └── images/              # Imágenes (incluye logos oficiales)
├── src/
│   ├── app/                 # App Router de Next.js
│   │   ├── admin/           # Panel de administración
│   │   ├── noticias/        # Páginas públicas de noticias
│   │   ├── creditos/        # Página de créditos
│   │   └── api/             # API Routes (backend)
│   ├── components/          # Componentes React (shadcn/ui + admin)
│   ├── hooks/               # Hooks personalizados
│   └── lib/                 # Lógica compartida (auth, github, image, etc.)
├── ARCHITECTURE.md          # Documentación técnica
├── ADMIN_MANUAL.md          # Manual de administración
├── DEPLOYMENT.md            # Guía de despliegue
└── package.json
```

> 📖 Ver **[ARCHITECTURE.md](./ARCHITECTURE.md)** para detalles completos.

---

## 🛠️ Desarrollo local

### Requisitos

- **Node.js** 18+ o **Bun** (recomendado)
- Un editor de código (VS Code recomendado)
- Un PAT de GitHub para probar los commits (opcional para UI)

### Comandos disponibles

```bash
bun run dev      # Inicia servidor de desarrollo (puerto 3000)
bun run build    # Construye para producción
bun run start    # Inicia servidor de producción (después de build)
bun run lint     # Verifica calidad del código con ESLint
```

### Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```env
# Token de GitHub (Fine-grained PAT)
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxxxx

# Claves de acceso al panel admin (formato JSON)
ACCESS_KEYS={"admin":"clave-admin","profesores":"clave-prof",...}
```

> 📖 Ver **[DEPLOYMENT.md](./DEPLOYMENT.md)** para crear el PAT de GitHub.

### Fallback sin token

Si no configuras `GITHUB_TOKEN`, el sitio funciona en modo lectura usando los archivos JSON locales de `public/data/`. Las operaciones de escritura fallarán con un error claro. Esto es útil para probar la UI sin necesidad del token.

---

## 🚢 Despliegue

El proyecto está optimizado para **Vercel** (gratis).

### Despliegue automático

1. Conecta el repositorio a Vercel (ver **[DEPLOYMENT.md](./DEPLOYMENT.md)**)
2. Cada `git push` a `main` despliega automáticamente
3. Los commits generados desde el panel admin NO disparan redespliegue (solo cambian datos)

### Variables de entorno en producción

Configura en Vercel → Settings → Environment Variables:

| Variable | Descripción |
|----------|-------------|
| `GITHUB_TOKEN` | PAT de GitHub (permiso Contents: Read and write) |
| `ACCESS_KEYS` | JSON con las 7 claves de acceso |

---

## 🧪 Tecnologías

### Frontend
- **Next.js 16** — Framework React full-stack
- **React 19** — Librería de UI
- **TypeScript 5** — Tipado estático
- **Tailwind CSS 4** — Styling utility-first
- **shadcn/ui** — Componentes accesibles (New York style)
- **lucide-react** — Iconos
- **react-markdown** — Renderizado de Markdown

### Backend
- **Next.js API Routes** — Endpoints de servidor
- **GitHub Contents API** — Almacenamiento de datos
- **sharp** — Optimización de imágenes
- **crypto** (Node.js) — Comparación timing-safe de claves

### Infraestructura
- **Vercel** — Hosting + CDN + HTTPS
- **GitHub** — Repositorio + almacenamiento de datos + auditoría

---

## 🎨 Identidad visual

### Paleta de colores

| Color | Uso |
|-------|-----|
| 🟡 **Dorado** (`amber-500`) | Acentos, botones, hover |
| ⚫ **Negro** (`neutral-950`) | Headers, footers, fondos oscuros |
| ⚪ **Gris neutro** (`neutral-50`) | Fondos de páginas |

### Logos oficiales

Ubicación: `public/images/logos/`

| Archivo | Descripción |
|---------|-------------|
| `aefn-logo.png` | Logo completo AEFN |
| `ecfn-logo.png` | Logo completo ECFN |
| `ecfn-symbol.png` | Símbolo ECFN (hexágono dorado) |

---

## 🔒 Seguridad

- ✅ Tokens y claves NUNCA en el código (variables de entorno)
- ✅ Comparación de claves con `timingSafeEqual` (anti timing-attack)
- ✅ PAT Fine-grained con permisos mínimos (solo 1 repo)
- ✅ HTTPS automático en Vercel
- ✅ Validación de permisos en cada operación de escritura
- ✅ Validación de tipo y tamaño de imágenes subidas

> 📖 Ver **[ARCHITECTURE.md](./ARCHITECTURE.md#11-seguridad)** para detalles.

---

## 📞 Contacto

- 📧 **Email:** decanatoecfn@yachaytech.edu.ec
- 📸 **Instagram:** [@aefn_yt](https://www.instagram.com/aefn_yt/)
- 🐙 **GitHub:** [aefnyt/web_aefn](https://github.com/aefnyt/web_aefn)

---

## 📄 Licencia

Proyecto de código abierto para uso de la Asociación de Estudiantes de Física y Nanotecnología de Yachay Tech.

---

## 🙏 Créditos

Ver **[/creditos](./ADMIN_MANUAL.md#10-página-de-créditos)** o la página `/creditos` del sitio.

---

*Última actualización: Diciembre 2025*
