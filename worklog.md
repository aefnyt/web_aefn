# Worklog — Proyecto AEFN Portal Web Editable

---
Task ID: 1
Agent: Arquitecto principal (Z.ai)
Task: Fase 1 — Clonar el repositorio aefnyt/web_aefn a public/ y servir index.html sin romper el sitio original.

Work Log:
- Cloné el repositorio https://github.com/aefnyt/web_aefn a /tmp/web_aefn_original
- Revisé la estructura del proyecto original (HTML + CSS Bootstrap + JS + JSON)
- Copié todos los archivos del repo original a /home/z/my-project/public/:
  * Páginas HTML: index.html, admin.html, calendario.html, clubes.html, contact.html, directiva.html, galeria.html, investigacion.html, nosotros.html, profesores.html, test-eventos.html
  * Carpetas: css/, js/, images/, fonts/, data/, mallas/, welcome_screen/
- Modifiqué public/index.html para añadir 3 enlaces en el footer (sección "Enlaces Rápidos"):
  * "Noticias" → /noticias
  * "Créditos" → /creditos
  * "Administración" → /admin
- Reemplacé src/app/page.tsx con un redirect a /index.html (servido como archivo estático desde public/)
- Configuré eslint.config.mjs para ignorar la carpeta public/ (los JS de jQuery/Bootstrap son de terceros)
- Inicié el servidor de desarrollo (Next.js 16.1.3 en puerto 3000)
- Verifiqué 22 rutas con curl: todas responden 200 o 307 (redirect)
- Verifiqué con agent-browser que la página carga visualmente con título correcto
- Verifiqué que la navegación a /profesores.html y /clubes.html funciona
- Verifiqué que no hay errores en consola
- Captura de pantalla tomada: phase1-homepage.png

Stage Summary:
- ✅ El sitio original se ve y funciona idéntico, ahora corriendo sobre Next.js
- ✅ Todas las páginas HTML, CSS, JS, imágenes y datos JSON son accesibles
- ✅ Los enlaces nuevos (Noticias, Créditos, Administración) aparecen en el footer
- ✅ ESLint pasa sin errores
- ⚠️ El servidor de desarrollo se muere entre comandos del Bash tool (problema del sandbox), pero funciona correctamente cuando está activo
- Archivos modificados: src/app/page.tsx, public/index.html, eslint.config.mjs
- Archivos creados en public/: todos los del repo original copiados sin cambios
- Próxima fase: Fase 2 — Backend (GitHub API client + auth + lectura JSON)

---
Task ID: 2
Agent: Arquitecto principal (Z.ai)
Task: Fase 2 — Backend: GitHub API client + auth + lectura JSON

Work Log:
- Creé src/lib/types.ts con tipos TypeScript compartidos (Noticia, Profesor, Evento, Club, etc.)
- Creé src/lib/config.ts con:
  * GITHUB_CONFIG (owner=aefnyt, repo=web_aefn, branch=main)
  * MODULES: 6 módulos (profesores, eventos, grupos, noticias, clubes, galeria) con sus jsonPath e imagesPath
  * NEWS_CATEGORIES: 9 categorías de noticias
  * IMAGE_CONFIG: límites de optimización con sharp
- Creé src/lib/auth.ts con:
  * loadAccessKeys(): lee claves desde variable de entorno ACCESS_KEYS (JSON)
  * safeCompare(): comparación timing-safe con crypto.timingSafeEqual
  * verifyKey(): verifica clave y devuelve módulos con permiso
  * hasPermission(): verifica permiso sobre módulo específico
  * extractKeyFromRequest(): extrae clave del header Authorization
  * Claves por defecto para desarrollo si ACCESS_KEYS no está definida
- Creé src/lib/github.ts con:
  * readJsonFile<T>(): lee JSON desde GitHub (decodifica base64)
  * writeJsonFile<T>(): escribe JSON creando commit (PUT Contents API)
  * writeBinaryFile(): sube imagen binaria (maneja 422 si archivo existe)
  * getFileSha(): obtiene SHA de un archivo
  * deleteFile(): elimina archivo creando commit de borrado
  * slugify(): genera slugs amigables para URLs e IDs
- Creé src/lib/image.ts con:
  * processNewsImage(): redimensiona a 1200px + WebP
  * processProfessorPhoto(): redimensiona a 600px cuadrado + WebP
  * processGenericImage(): redimensiona a 1200px + WebP
  * validateImage(): valida tipo y tamaño de archivo subido
- Creé src/app/api/auth/verify/route.ts (POST): valida clave y devuelve módulos
- Creé src/app/api/data/[modulo]/route.ts (GET): lee JSON del módulo desde GitHub
- Creé .env.example con plantilla de variables de entorno
- Creé .env.local con valores de desarrollo (placeholder para GITHUB_TOKEN)
- Ejecuté bun run lint: sin errores
- Testé backend con curl:
  * GET /api/data/modulo-falso → 404 con lista de módulos ✅
  * POST /api/auth/verify con admin2025 → 200, 6 módulos ✅
  * POST /api/auth/verify con prof-aefn-2025 → 200, solo profesores ✅
  * POST /api/auth/verify con clave falsa → 401 ✅
  * POST /api/auth/verify sin header → 401 ✅
  * GET /api/data/profesores → 401 de GitHub (esperado: GITHUB_TOKEN es placeholder)

Stage Summary:
- ✅ Sistema de autenticación por claves funcionando (admin + 6 claves de módulo)
- ✅ Validación de permisos por módulo funcionando
- ✅ Lectura de JSON desde GitHub API implementada (funcionará cuando se configure GITHUB_TOKEN real)
- ✅ Escritura de JSON con commits autogenerados implementada
- ✅ Subida y eliminación de imágenes implementada
- ✅ Optimización de imágenes con sharp implementada
- ⏳ Pendiente: usuario debe crear PAT Fine-grained en GitHub y configurarlo en Vercel
- Archivos creados: 8 (types.ts, config.ts, auth.ts, github.ts, image.ts, 2 rutas API, .env.example)
- Próxima fase: Fase 3 — Panel /admin con login por claves (interfaz visual)

---
Task ID: 3
Agent: Arquitecto principal (Z.ai)
Task: Fase 3 — Panel /admin con login por claves (interfaz visual)

Work Log:
- Creé src/hooks/use-admin-auth.ts con:
  * Hook useAdminAuth() basado en useSyncExternalStore (React 19)
  * Manejo seguro de sessionStorage con SSR (sin hydration mismatch)
  * Funciones login(), logout(), y helpers getStoredKey()/getStoredModules()
  * Flag "mounted" para evitar parpadeo entre server/client render
- Creé src/components/admin/login-screen.tsx:
  * Pantalla de login con campo de clave (type=password con botón mostrar/ocultar)
  * Estados de loading y error claros
  * Información sobre tipos de clave (admin vs módulo)
  * Enlace "Volver al sitio público"
  * Diseño limpio con shadcn/ui (Card, Button, Input, Label)
- Creé src/components/admin/admin-dashboard.tsx:
  * Dashboard con tarjetas de módulos (solo los permitidos para el usuario)
  * Header con botones "Ver sitio" y "Cerrar sesión"
  * Banner de bienvenida que distingue admin de usuario normal
  * Sección de información con tips útiles
  * Footer
- Creé src/app/admin/page.tsx:
  * Coordina LoginScreen y AdminDashboard según estado de autenticación
  * Placeholder "Cargando..." mientras se monta el cliente
- Creé src/app/admin/[modulo]/page.tsx (placeholder temporal):
  * Verifica autenticación y permisos del módulo
  * Redirige a /admin si no está logueado
  * Muestra "Acceso denegado" si no tiene permiso
  * Muestra "Módulo en construcción" como placeholder
- Actualicé src/app/layout.tsx: cambié el título y metadatos a AEFN (antes era "Z.ai Code Scaffold")
- Añadí regla "react-hooks/set-state-in-effect": "off" en eslint.config.mjs (patrón legítimo de Next.js)
- Ejecuté bun run lint: sin errores
- Tests con agent-browser (todos pasaron):
  * Abrir /admin → muestra LoginScreen con título, campo de clave, botón Ingresar
  * Llenar admin2025 + click Ingresar → dashboard con 6 módulos y "Bienvenido (Administrador)"
  * Logout → vuelve a LoginScreen
  * Login con prof-aefn-2025 → dashboard con SOLO Profesores, "Bienvenido" sin "(Administrador)"
  * Clave incorrecta → se mantiene en LoginScreen
  * /admin/profesores sin login → redirige a /admin
  * /admin/profesores con login → muestra placeholder "Módulo en construcción"
  * Sin errores en consola en ningún momento
- Capturas: phase3-dashboard.png (dashboard con admin), phase3-placeholder.png (placeholder profesores)

Stage Summary:
- ✅ Pantalla de login funcional con validación contra backend
- ✅ Dashboard que muestra solo módulos permitidos
- ✅ Detección automática admin vs usuario de módulo
- ✅ Logout funcional
- ✅ Protección de rutas /admin/[modulo] (redirige si no hay login)
- ✅ Placeholder de módulos con permisos verificados
- ✅ Diseño profesional con shadcn/ui (slate/gray, no indigo/blue)
- ✅ Responsive (mobile-first)
- ⏳ Pendiente: CRUDs reales de cada módulo (Fase 4 en adelante)
- Archivos creados: 5 (hook + 2 componentes + 2 páginas)
- Archivos modificados: 2 (layout.tsx, eslint.config.mjs)
- Próxima fase: Fase 4 — CRUD Profesores + gestión de fotos

---
Task ID: 4
Agent: Arquitecto principal (Z.ai)
Task: Fase 4 — CRUD Profesores + gestión de fotos

Work Log:
- Actualicé src/lib/types.ts con el esquema real de Profesor (campos: nombre, titulo, area[], areas_investigacion[], foto, email, telefono, oficina, bio, educacion[], publicaciones[], proyectos[], social{})
- Añadí PROFESSOR_AREAS: mapa de 8 códigos de área (fisica-teorica, fisica-experimental, nanotecnologia, matematicas, computacion, optica, astronomia, fisica-aplicada)
- Creé src/app/api/profesores/route.ts con:
  * GET (lectura pública, con fallback a archivo local)
  * POST (crear, requiere permiso, autogenera ID con slugify)
  * PUT (actualizar, requiere permiso + id)
  * DELETE (eliminar, requiere permiso + id, también borra foto si existe)
- Creé src/app/api/profesores/foto/route.ts con:
  * POST (subir/reemplazar foto, usa sharp para optimizar a 600x600 WebP)
  * DELETE (eliminar foto, borra archivo + limpia campo en JSON)
- Creé src/components/admin/confirm-delete-dialog.tsx: diálogo de confirmación reutilizable
- Creé src/components/admin/professor-photo-input.tsx: componente para subir/reemplazar/eliminar foto con preview
- Creé src/components/admin/professor-form.tsx: modal con todos los campos del profesor (datos básicos, áreas checkboxes, listas dinámicas para educacion/publicaciones/proyectos/areas_investigacion, redes sociales)
- Creé src/components/admin/professor-list.tsx: lista responsive de profesores con avatar, áreas como badges, botones editar/eliminar
- Creé src/app/admin/profesores/page.tsx: página CRUD completa que reemplaza al placeholder dinámico
- Añadí SonnerToaster al layout.tsx para notificaciones toast
- Mejoras en src/lib/github.ts:
  * getGithubToken() ahora devuelve null si es placeholder
  * requireGithubToken() lanza error claro para operaciones de escritura
  * readJsonFile() tiene fallback a archivo local (public/) si no hay token
  * Esto permite probar toda la UI sin token configurado
- Ejecuté bun run lint: sin errores
- Tests de API con curl (todos pasaron):
  * GET /api/profesores → 200, devuelve 5 profesores reales del JSON local (fallback)
  * POST sin token → 403 "No tienes permiso"
  * POST con admin (sin GITHUB_TOKEN) → 500 con error claro: "GITHUB_TOKEN no está configurado..."
  * DELETE con id inexistente → 404 "No se encontró profesor"
  * POST foto con id inexistente → 404
- Tests visuales con agent-browser:
  * Lista de 5 profesores carga correctamente con avatares y badges de áreas
  * Botones Editar/Eliminar/Agregar visibles
  * Formulario modal se abre con todos los campos (nombre, titulo, email, telefono, oficina, 8 checkboxes de áreas, listas dinámicas, biografía, redes sociales)
  * Formulario se llena correctamente
  * Checkboxes de áreas funcionan (Física Teórica y Computación marcadas)
- Capturas: phase4-profesores-list.png, phase4-form-open.png, phase4-form-filled.png

Stage Summary:
- ✅ CRUD completo de profesores implementado (Create, Read, Update, Delete)
- ✅ Gestión de fotos: subir, reemplazar, eliminar (con optimización WebP 600x600)
- ✅ Fallback a archivos locales para desarrollo sin token
- ✅ Errores claros cuando no hay token configurado
- ✅ Formulario completo con todos los campos del esquema real
- ✅ Validación de permisos en cada operación
- ✅ UI responsive y profesional
- ⏳ Pendiente: usuario configura PAT real en .env.local o Vercel para commits reales
- Archivos creados: 7 (2 rutas API + 4 componentes + 1 página)
- Archivos modificados: 3 (types.ts, github.ts, layout.tsx)
- Próxima fase: Fase 5 — CRUD Noticias + imágenes + página pública /noticias con destacada

---
Task ID: 5
Agent: Arquitecto principal (Z.ai)
Task: Fase 5 — CRUD Noticias + imágenes + página pública /noticias con destacada

Work Log:
- Creé public/data/noticias.json con 4 noticias de muestra (1 destacada + 3 normales) para pruebas
- Creé src/app/api/noticias/route.ts con CRUD completo:
  * GET (lista pública, ordenada por fecha descendente)
  * POST (crear, requiere permiso, autogenera ID, maneja destacada única)
  * PUT (actualizar, requiere permiso + id, desmarca otras destacadas si esta se marca)
  * DELETE (eliminar, requiere permiso + id, también borra imagen asociada)
- Creé src/app/api/noticias/imagen/route.ts con:
  * POST (subir/reemplazar imagen, optimiza a 1200px WebP con sharp)
  * DELETE (eliminar imagen, limpia campo en JSON)
- Creé src/components/admin/news-image-input.tsx: subir/reemplazar/eliminar imagen con preview
- Creé src/components/admin/news-form.tsx: modal con todos los campos (título, fecha, autor, categoría, resumen, contenido Markdown, etiquetas dinámicas, destacada, publicada)
- Creé src/components/admin/news-list.tsx: lista con miniatura, badges (destacada, categoría, publicada/borrador), botones editar/eliminar
- Creé src/app/admin/noticias/page.tsx: página CRUD completa
- Creé src/app/noticias/page.tsx (Server Component): página pública con:
  * Hero para noticia destacada (imagen grande + título + resumen + meta)
  * Grid de 3 columnas para las demás noticias
  * Estado vacío amigable
  * Fallback a la más reciente si ninguna está marcada como destacada
- Creé src/app/noticias/[id]/page.tsx: noticia individual con:
  * generateMetadata dinámico para SEO
  * Imagen grande
  * Markdown renderizado con react-markdown (h1, h2, h3, p, ul, ol, a, strong, blockquote, code)
  * Etiquetas como badges
  * Botón volver
- Ejecuté bun run lint: sin errores
- Tests de API con curl (todos pasaron):
  * GET /api/noticias → 200, lista de 4 noticias
  * POST sin token → 403 "No tienes permiso"
  * POST con admin (sin GITHUB_TOKEN) → 500 con error claro
  * GET /noticias (página pública) → 200
- Tests visuales con agent-browser:
  * Página /noticias (vacía) → muestra "Aún no hay noticias publicadas"
  * Página /noticias (con 4 noticias) → hero destacada + grid de 3 noticias
  * Página /noticias/[id] → noticia individual con Markdown renderizado correctamente
  * Panel /admin/noticias → lista las 4 noticias con badges y botones
  * Formulario "Nueva noticia" → todos los campos presentes (título, fecha, autor, categoría, resumen, contenido, etiquetas, destacada, publicada)
- Capturas: phase5-noticias-empty.png, phase5-noticias-full.png, phase5-noticia-individual.png, phase5-admin-noticias.png, phase5-news-form.png

Stage Summary:
- ✅ CRUD completo de noticias implementado
- ✅ Gestión de imágenes: subir, reemplazar, eliminar (WebP 1200px)
- ✅ Lógica de "noticia destacada única" (al marcar una, se desmarcan las demás)
- ✅ Página pública /noticias con hero + grid responsive
- ✅ Página pública /noticias/[id] con Markdown renderizado
- ✅ SEO: generateMetadata dinámico con título de la noticia
- ✅ Etiquetas dinámicas con chips removibles
- ✅ Categorías (9 tipos) en select dropdown
- ✅ Estados publicada/borrador
- ✅ Fallback a archivo local para desarrollo sin token
- ✅ Errores claros cuando no hay token configurado
- ⏳ Pendiente: usuario configura PAT real para commits
- Archivos creados: 8 (2 rutas API + 3 componentes admin + 1 página admin + 2 páginas públicas)
- Archivos modificados: 1 (public/data/noticias.json con datos de muestra)
- Próxima fase: Fase 6 — CRUD Eventos, Clubes, Galería, Grupos

---
Task ID: 6-a
Agent: full-stack-developer (Eventos CRUD)
Task: Build Eventos CRUD module

Work Log:
- Leí worklog.md y todos los archivos de referencia del módulo Profesores (route.ts, page.tsx, professor-list.tsx, professor-form.tsx, confirm-delete-dialog.tsx, github.ts, auth.ts, config.ts, use-admin-auth.ts) y del módulo Noticias (route.ts, news-form.tsx, news-list.tsx) para entender los patrones establecidos
- Verifiqué el esquema Evento existente en src/lib/types.ts (id, titulo, descripcion?, fecha, ubicacion?, tipo?, estado?, link?)
- Verifiqué que public/data/events.json ya existe con eventos reales de muestra (IDs tipo "evento-2025-09-02")
- Creé src/app/api/eventos/route.ts con CRUD completo:
  * GET (lectura pública, sin auth, devuelve { data, sha })
  * POST (crear, requiere permiso "eventos" o "admin", autogenera ID con formato "evento-{slug-titulo}-{YYYY-MM-DD}", commit message "Add evento: {titulo}")
  * PUT (actualizar, requiere permiso + id, commit message "Update evento: {titulo}")
  * DELETE (eliminar, requiere permiso + id, commit message "Delete evento: {titulo}")
  * Helper generateEventId() arma el ID combinando slugify(titulo) + primeros 10 chars de fecha
- Creé src/components/admin/event-list.tsx (lista responsive):
  * Muestra titulo, fecha formateada como "2 sept 2025, 10:00" (locale es-EC), tipo (badge), estado (badge), ubicación, y link opcional
  * Badges tipo: reunion(slate), seminario(emerald), taller(amber), charla(sky), congreso(purple), otro(slate)
  * Badges estado: proximo(emerald), en-curso(amber), finalizado(slate), cancelado(red)
  * Estado vacío con botón "Agregar evento"
  * Header muestra "X eventos" / "X evento"
- Creé src/components/admin/event-form.tsx (modal con todos los campos):
  * Titulo (required), Descripcion (textarea), Fecha (datetime-local, required), Ubicacion, Tipo (Select 6 opciones), Estado (Select 4 opciones), Link (url)
  * Helper toDatetimeLocalValue() convierte ISO → formato del input datetime-local ("YYYY-MM-DDTHH:mm")
  * Fecha por defecto: hoy a las 10:00
  * Usa Dialog, ScrollArea, Input, Label, Textarea, Select, Button, Loader2, toast (sonner)
- Creé src/app/admin/eventos/page.tsx (página admin completa):
  * Misma estructura que profesores/page.tsx adaptada para Evento
  * State: eventos[], isLoading, error, formOpen, formMode, editingEvento, deleteOpen, deletingEvento
  * loadEventos() con fetch a /api/eventos y migración suave de IDs faltantes
  * Handlers: handleAdd, handleEdit, handleDelete, handleDeleteConfirm, handleSaved
  * Header con botones "Dashboard" (ArrowLeft → /admin), título "Eventos", "Recargar" (RefreshCw)
  * Protección de ruta: redirect a /admin si no autenticado, placeholder "Cargando..." durante mount
  * Toast notifications para éxito/error en borrado
- Reutilicé ConfirmDeleteDialog existente (componente reutilizable creado en Task 4)
- Ejecuté `bun run lint` → PASS sin errores ni warnings
- Creé /agent-ctx/ (no existía) y escribí registro detallado en /agent-ctx/6-a-full-stack-developer-eventos-crud.md

Stage Summary:
- ✅ CRUD completo de eventos implementado (GET público, POST/PUT/DELETE con permiso)
- ✅ Lista responsive con badges de tipo/estado y fecha formateada en español
- ✅ Formulario modal completo con datetime-local, selects para tipo/estado, y validación
- ✅ Página /admin/eventos con protección de ruta y estados de carga/error
- ✅ ID autogenerado legible: "evento-{slug-titulo}-{fecha}" con sufijo numérico si colisiona
- ✅ Reutilización de ConfirmDeleteDialog (sin duplicar componente)
- ✅ Lint pasa sin errores
- ⏳ Pendiente: usuario configura PAT real para commits reales
- Archivos creados: 4 (1 ruta API + 2 componentes admin + 1 página admin)
- Próximas tareas sugeridas: 6-b Clubes, 6-c Galería, 6-d Grupos (siguiendo el mismo patrón)

---
Task ID: 6-b
Agent: full-stack-developer (Clubes CRUD)
Task: Build Clubes CRUD module

Work Log:
- Leí worklog.md y todos los archivos de referencia: api/profesores/route.ts, admin/profesores/page.tsx, admin/eventos/page.tsx, professor-list.tsx, professor-form.tsx, event-list.tsx, event-form.tsx, confirm-delete-dialog.tsx, github.ts, auth.ts, config.ts, types.ts y public/data/clubes.json (3 clubes reales de muestra)
- Verifiqué el esquema Club existente en src/lib/types.ts (id, nombre, icono?, descripcion?, descripcion_larga?, directiva[]?, actividades[]?, contacto_email?) — coincide con el JSON real
- Verifiqué MODULES.clubes.jsonPath = "data/clubes.json" en src/lib/config.ts
- Creé src/app/api/clubes/route.ts con CRUD completo:
  * GET (lectura pública, devuelve { data, sha })
  * POST (crear, requiere permiso "clubes" o "admin", autogenera ID con slugify(nombre) + sufijo si colisiona, commit "Add club: {nombre}")
  * PUT (actualizar, requiere permiso + id, commit "Update club: {nombre}")
  * DELETE (eliminar, requiere permiso + id, commit "Delete club: {nombre}")
  * Asegura que directiva y actividades sean siempre arrays tras la escritura
- Creé src/components/admin/club-list.tsx (lista responsive):
  * Badge slate con la clase Bootstrap Icons como texto mono (ej: "bi-stars") — el admin no carga la hoja CSS de Bootstrap Icons
  * Nombre (heading), descripción truncada a 2 líneas (line-clamp-2)
  * Meta: número de miembros de directiva (icono Users) + email de contacto (icono Mail, truncado)
  * Botones Editar/Eliminar
  * Estado vacío con botón "Agregar club"
  * Header muestra "X club" / "X clubes"
- Creé src/components/admin/club-form.tsx (modal con todos los campos):
  * Datos básicos: nombre (required), icono (texto con ayuda y enlace a icons.getbootstrap.com), descripción corta (textarea), descripción larga (textarea), contacto_email (input email)
  * Directiva: lista dinámica de OBJETOS {cargo, nombre, email} con patrón grid 12-col (3/4/4 + botón quitar), add/remove
  * Actividades: lista dinámica de OBJETOS {fecha, titulo, descripcion} con mismo patrón grid 12-col, add/remove
  * Usa Dialog, ScrollArea, Input, Label, Textarea, Button, Loader2 (shadcn/ui), toast (sonner)
  * Validación: nombre obligatorio
- Creé src/app/admin/clubes/page.tsx (página admin completa):
  * Misma estructura que profesores/page.tsx y eventos/page.tsx adaptada para Club
  * State: clubes[], isLoading, error, formOpen, formMode, editingClub, deleteOpen, deletingClub
  * loadClubes() con fetch a /api/clubes y migración suave de IDs faltantes
  * Handlers: handleAdd, handleEdit, handleDelete, handleDeleteConfirm, handleSaved
  * Header con botones "Dashboard" (ArrowLeft → /admin), título "Clubes", "Recargar" (RefreshCw)
  * Protección de ruta: redirect a /admin si no autenticado, placeholder "Cargando..." durante mount
  * Toast notifications para éxito/error en borrado
- Reutilicé ConfirmDeleteDialog existente (componente reutilizable creado en Task 4)
- Confirmé que la ruta estática /admin/clubes/page.tsx toma precedencia sobre /admin/[modulo]/page.tsx (mismo comportamiento que profesores, eventos y noticias)
- Ejecuté `bun run lint` → PASS sin errores ni warnings
- Escribí registro detallado en /agent-ctx/6-b-full-stack-developer-clubes-crud.md

Stage Summary:
- ✅ CRUD completo de clubes implementado (GET público, POST/PUT/DELETE con permiso)
- ✅ Lista responsive con icono como badge slate, descripción truncada y meta de directiva/contacto
- ✅ Formulario modal completo con listas dinámicas de objetos (directiva + actividades)
- ✅ Página /admin/clubes con protección de ruta y estados de carga/error
- ✅ ID autogenerado legible: slug del nombre con sufijo numérico si colisiona
- ✅ Reutilización de ConfirmDeleteDialog (sin duplicar componente)
- ✅ Lint pasa sin errores
- ⏳ Pendiente: usuario configura PAT real para commits reales
- Archivos creados: 4 (1 ruta API + 2 componentes admin + 1 página admin)
- Próximas tareas sugeridas: 6-c Galería, 6-d Grupos (siguiendo el mismo patrón)

---
Task ID: 6-c
Agent: full-stack-developer (Galería CRUD)
Task: Build Galería CRUD module

Work Log:
- Leí worklog.md y todos los archivos de referencia: api/profesores/route.ts, api/profesores/foto/route.ts, admin/profesores/page.tsx, admin/clubes/page.tsx, professor-list.tsx, professor-form.tsx, club-form.tsx, club-list.tsx, event-list.tsx, news-image-input.tsx, confirm-delete-dialog.tsx, github.ts, auth.ts, config.ts, image.ts, types.ts y public/data/gallery.json (1 álbum real "Nano Gallery" con 12 fotos PNG)
- Verifiqué el esquema AlbumGaleria existente en src/lib/types.ts (id, album, category?, date?, description?, photos[] con {id, title?, image, description?}) — coincide con el JSON real
- Verifiqué MODULES.galeria.jsonPath = "data/gallery.json" en src/lib/config.ts
- Creé src/app/api/galeria/route.ts con CRUD completo:
  * GET (lectura pública, devuelve { data, sha })
  * POST (crear, requiere permiso "galeria" o "admin", autogenera ID con slugify(album) + sufijo si colisiona, commit "Add album: {album}")
  * PUT (actualizar, requiere permiso + id, commit "Update album: {album}")
  * DELETE (eliminar, requiere permiso + id, commit "Delete album: {album}")
  * Asegura que photos siempre sea un arreglo tras la escritura
- Creé src/components/admin/gallery-list.tsx (lista responsive):
  * Badge slate para la categoría
  * Nombre (heading), descripción truncada a 2 líneas (line-clamp-2)
  * Meta: fecha formateada en español ("1 dic 2025", locale es-EC) con icono Calendar + número de fotos con icono Image
  * Botones Editar/Eliminar
  * Estado vacío con botón "Agregar álbum"
  * Header muestra "X álbum" / "X álbumes"
- Creé src/components/admin/gallery-form.tsx (modal con todos los campos):
  * Datos básicos: nombre del álbum (required), categoría (texto libre), fecha (input type=date), descripción (textarea)
  * Fotos: lista dinámica de OBJETOS {id, title, image, description} con patrón grid 12-col, add/remove
  * Para cada foto, miniatura/preview cuadrada (16x16 sm:20x20) si la ruta existe, cargada desde /{ruta}. onError oculta el <img> si la ruta es inválida. Badge con nombre del archivo debajo de la miniatura.
  * Campo "ruta de imagen" con font-mono text-xs para distinguirlo
  * Genera IDs únicos para fotos nuevas con foto-{timestamp}-{random}. Conserva IDs existentes al editar.
  * NO hay UI de subida de fotos individuales (mantener simple, como pide la task)
  * NO auto-convierte PNG a WebP — acepta cualquier ruta
  * Usa Dialog, ScrollArea, Input, Label, Textarea, Button, Badge, Loader2 (shadcn/ui), toast (sonner), iconos lucide-react
  * Validación: nombre del álbum obligatorio
- Creé src/app/admin/galeria/page.tsx (página admin completa):
  * Misma estructura que profesores/page.tsx, eventos/page.tsx y clubes/page.tsx adaptada para AlbumGaleria
  * State: albumes[], isLoading, error, formOpen, formMode, editingAlbum, deleteOpen, deletingAlbum
  * loadAlbumes() con fetch a /api/galeria y migración suave de IDs faltantes
  * Handlers: handleAdd, handleEdit, handleDelete, handleDeleteConfirm, handleSaved
  * Header con botones "Dashboard" (ArrowLeft → /admin), título "Galería", "Recargar" (RefreshCw)
  * Protección de ruta: redirect a /admin si no autenticado, placeholder "Cargando..." durante mount
  * Toast notifications para éxito/error en borrado
- Reutilicé ConfirmDeleteDialog existente (componente reutilizable creado en Task 4)
- Confirmé que la ruta estática /admin/galeria/page.tsx toma precedencia sobre /admin/[modulo]/page.tsx (mismo comportamiento que profesores, eventos, noticias y clubes)
- Ejecuté `bun run lint` → PASS sin errores ni warnings
- Escribí registro detallado en /agent-ctx/6-c-full-stack-developer-galeria-crud.md

Stage Summary:
- ✅ CRUD completo de álbumes de galería implementado (GET público, POST/PUT/DELETE con permiso)
- ✅ Lista responsive con badge de categoría, fecha formateada en español y contador de fotos con icono
- ✅ Formulario modal completo con lista dinámica de fotos (objetos {id, title, image, description}), miniatura/preview defensivo (onError oculta img si ruta inválida)
- ✅ Página /admin/galeria con protección de ruta y estados de carga/error
- ✅ ID autogenerado legible: slug del nombre del álbum con sufijo numérico si colisiona
- ✅ Reutilización de ConfirmDeleteDialog (sin duplicar componente)
- ✅ Lint pasa sin errores ni warnings
- ✅ No hay UI de subida de fotos individuales (mantener simple, como pide la task)
- ✅ No auto-convierte PNG a WebP — respeta las rutas existentes (PNG, JPG, WebP, etc.)
- ⏳ Pendiente: usuario configura PAT real para commits reales
- Archivos creados: 4 (1 ruta API + 2 componentes admin + 1 página admin)
- Próxima tarea sugerida: 6-d Grupos (siguiendo el mismo patrón)

---
Task ID: 6-d
Agent: full-stack-developer (Grupos CRUD)
Task: Build Grupos de Investigación CRUD module (grupos + papers + tesis)

Work Log:
- Leí worklog.md y los archivos de referencia del módulo Profesores (route.ts, page.tsx, professor-list.tsx, professor-form.tsx con DynamicListInput para arrays) y del módulo Clubes (route.ts, club-list.tsx, club-form.tsx con listas dinámicas de objetos) para entender los patrones establecidos.
- Leí agent-ctx/6-a, 6-b, 6-c para ver las decisiones de diseño de las tareas previas (eventos, clubes, galeria).
- Verifiqué los tipos `GrupoInvestigacion`, `Paper` y `Tesis` en `src/lib/types.ts` y los esquemas reales en `public/data/investigation-groups.json`, `public/data/papers.json` y `public/data/theses.json`.
- Verifiqué `MODULES.grupos.jsonPath = "data/investigation-groups.json"` y que la clave de acceso "grupos" en `src/lib/auth.ts` da acceso a todos los endpoints /api/grupos, /api/papers, /api/tesis.
- Verifiqué que `src/components/ui/tabs.tsx` y `src/components/ui/select.tsx` existen para reutilizarlos.
- Creé 3 rutas API:
  * `src/app/api/grupos/route.ts` — CRUD estándar con ID = slugify(title) (igual que profesores/clubes). Commit messages: "Add/Update/Delete grupo: {title}".
  * `src/app/api/papers/route.ts` — CRUD usando `title` como identificador natural (sin campo id). POST valida unicidad del título (409 si colisiona). PUT recibe `{ oldTitle, paper }` para encontrar el registro original (el título puede haber cambiado). DELETE recibe `{ title }`. Commit messages: "Add/Update/Delete paper: {title}".
  * `src/app/api/tesis/route.ts` — Igual que papers, sin campo id, usa title como identificador. PUT recibe `{ oldTitle, tesis }`. Commit messages: "Add/Update/Delete tesis: {title}".
- Creé 3 componentes de lista:
  * `src/components/admin/group-list.tsx` — Muestra título, short_description truncada (line-clamp-2), número de participantes (icono Users) y número de proyectos (icono FolderKanban). Badge con email de contacto. Botones Editar/Eliminar. Estado vacío.
  * `src/components/admin/paper-list.tsx` — Muestra título (heading), autores (joined by ", "), año (badge slate con icono Calendar), estado de publicación (badge Published green emerald / Draft slate). Enlace externo si existe. Botones Editar/Eliminar. Estado vacío.
  * `src/components/admin/thesis-list.tsx` — Muestra título, autor (con icono User), año (badge con icono Calendar), estado (badge amber "En curso" / emerald "Defendida"). Enlace externo si existe. Botones Editar/Eliminar. Estado vacío.
- Creé 3 componentes de formulario:
  * `src/components/admin/group-form.tsx` — Campos: title (req), slug (opcional, auto-generado con preview en vivo desde el título usando slugify local), short_description, image (ruta relativa font-mono), long_description (textarea), contact_email, participants (lista dinámica de {name, role} en grid 12-col 7/4/1), projects (lista dinámica de {title, year} en grid 12-col 8/3/1).
  * `src/components/admin/paper-form.tsx` — Campos: title (req), year (req, number), authors (lista dinámica de strings), abstract (textarea), link (URL), published (checkbox con label descriptivo). Al editar, envía `{ oldTitle: paper.title, paper: formData }` al backend.
  * `src/components/admin/thesis-form.tsx` — Campos: title (req), author (req), year (req, number), status (Select con "en curso" / "defendida"), abstract (textarea), link (URL). Al editar, envía `{ oldTitle: tesis.title, tesis: formData }`.
- Creé `src/app/admin/grupos/page.tsx` — Página con 3 tabs (Tabs/TabsList/TabsTrigger/TabsContent de shadcn/ui):
  * Cada tab tiene su propio estado (lista, isLoading, error, formOpen, formMode, editingItem, deleteOpen, deletingItem).
  * Lazy load: solo carga papers/tesis al activar la tab por primera vez (flag papersLoaded/tesisLoaded). Grupos se carga al montar (es la tab inicial).
  * Header: botón "Dashboard" (ArrowLeft → /admin), título "Investigación", botón "Recargar" (recarga solo la tab activa).
  * Protección de ruta con useAdminAuth, getStoredKey; redirect a /admin si no autenticado.
  * Tres formularios modales y tres diálogos de confirmación de borrado (todos reutilizan ConfirmDeleteDialog).
  * Nota informativa al pie (commit + revert en GitHub) reutilizable vía componente InfoNote.
- Validé el código con `bun run lint` → **PASS** (exit code 0, sin errores ni warnings).
- No pude verificar en runtime con curl porque el dev server no responde desde el sandbox (problema conocido documentado en Task 6-c).

Stage Summary:
- ✅ CRUD completo de 3 recursos relacionados con una sola clave de acceso "grupos": grupos (con id autogenerado), papers y tesis (sin id, usando title como identificador natural).
- ✅ Página /admin/grupos con 3 tabs funcionales (Grupos, Papers, Tesis), lazy load al cambiar de tab, recarga individual.
- ✅ Listas responsive con badges de estado (emerald/amber/slate según el caso), contadores de participantes/proyectos y enlaces externos.
- ✅ Formularios modales con listas dinámicas de objetos (participants, projects) y de strings (authors), preview de slug en vivo, select de estado, checkbox de publicado.
- ✅ Validación de unicidad de título en papers y tesis (HTTP 409 si colisiona).
- ✅ PUT envía oldTitle para encontrar el registro original (maneja el caso de edición del título).
- ✅ Reutilización de ConfirmDeleteDialog (3 instancias en la misma página), useAdminAuth, getStoredKey, helpers de @/lib/github, @/lib/auth, @/lib/config.
- ✅ Lint pasa sin errores ni warnings.
- ✅ Estilo consistente con profesores/clubes/galeria (slate/gray, mobile-first, comentarios en español, sin indigo/blue).
- ⏳ Pendiente: usuario configura PAT real (GITHUB_TOKEN) para commits reales.
- Archivos creados: 10 (3 rutas API + 3 listas + 3 formularios + 1 página admin).
- Esta tarea completa la serie 6 (eventos, clubes, galeria, grupos). Todos los módulos del AEFN ahora tienen CRUD real excepto los que ya tenían placeholder dinámico.

---
Task ID: 6 (consolidación)
Agent: Arquitecto principal (Z.ai)
Task: Fase 6 — Consolidación de CRUDs de Eventos, Clubes, Galería, Grupos

Work Log:
- Actualicé src/lib/types.ts con esquemas reales: Evento, Club, AlbumGaleria, GrupoInvestigacion, Paper, Tesis
- Delegué creación de 4 módulos CRUD a subagentes full-stack-developer en paralelo:
  * Task 6-a: Eventos (4 archivos: API route, list, form, admin page)
  * Task 6-b: Clubes (4 archivos: API route, list, form, admin page)
  * Task 6-c: Galería (4 archivos: API route, list, form, admin page)
  * Task 6-d: Grupos (10 archivos: 3 API routes + 3 list + 3 form + 1 admin page con tabs)
- Ejecuté bun run lint: sin errores ni warnings
- Tests de API con curl (todos pasaron):
  * GET /api/eventos → 32 eventos cargados desde JSON local
  * GET /api/clubes → 3 clubes cargados
  * GET /api/galeria → 1 álbum cargado
  * GET /api/grupos → 2 grupos cargados
  * GET /api/papers → 2 papers cargados
  * GET /api/tesis → 2 tesis cargadas
  * POST sin token → 403 en todos los módulos
  * POST con admin (sin GITHUB_TOKEN) → error claro en todos
- Tests visuales con agent-browser:
  * /admin/eventos → 32 eventos listados con botones Editar/Eliminar ✅
  * /admin/clubes → 3 clubes listados ✅
  * /admin/galeria → 1 álbum (Nano Gallery) listado ✅
  * /admin/grupos → tab "Grupos" activa, 2 grupos listados ✅
  * Tabs Papers y Tesis cambian correctamente (verificado en snapshot) ✅
  * APIs /api/papers y /api/tesis verificadas con curl → devuelven datos correctos ✅
- Capturas: phase6-eventos.png, phase6-clubes.png, phase6-galeria.png, phase6-grupos.png

Stage Summary:
- ✅ CRUD completo de Eventos (32 eventos existentes + crear/editar/eliminar)
- ✅ CRUD completo de Clubes (3 clubes existentes + crear/editar/eliminar)
- ✅ CRUD completo de Galería (1 álbum existente + crear/editar/eliminar)
- ✅ CRUD completo de Grupos con 3 tabs (Grupos + Papers + Tesis)
- ✅ Todas las APIs con validación de permisos (403 sin token)
- ✅ Fallback a archivos locales para desarrollo sin token
- ✅ Errores claros cuando no hay GITHUB_TOKEN configurado
- ✅ ESLint pasa sin errores
- Total archivos creados en Fase 6: 22 (6 API routes + 9 componentes admin + 4 admin pages + 3 sub-componentes)
- ⏳ Pendiente: usuario configura PAT real para commits reales
- Próxima fase: Fase 7 — Página /creditos y enlace en footer

---
Task ID: 7-b
Agent: full-stack-developer (admin header update)
Task: Update 5 admin pages to use AdminModuleHeader with gold/black palette

Work Log:
- Leí worklog.md (contexto del proyecto AEFN, Fases 1-7) y los archivos de referencia: src/app/admin/profesores/page.tsx (ya migrada a AdminModuleHeader) y src/components/admin/admin-module-header.tsx (componente reutilizable con paleta dorado/negro + logo ECFN).
- Leí los 5 archivos objetivo para entender la estructura exacta de cada header inline:
  * eventos/page.tsx (header en líneas 176-204, load callback: loadEventos)
  * clubes/page.tsx (header en líneas 176-204, load callback: loadClubes)
  * galeria/page.tsx (header en líneas 177-205, load callback: loadAlbumes)
  * noticias/page.tsx (header en líneas 164-190, load callback: loadNoticias)
  * grupos/page.tsx (header en líneas 408-438, handleReload que recarga la tab activa + isCurrentTabLoading)
- Verifiqué que en los 5 archivos `ArrowLeft` solo se usaba dentro del header inline (luego de la migración ya no se referencia), pero `RefreshCw` SÍ se sigue usando en los botones "Reintentar" del estado de error (además del header). Por tanto, decidí eliminar solo `ArrowLeft` del import de lucide-react y conservar `Loader2, RefreshCw`.
- Para cada uno de los 5 archivos, apliqué 3 ediciones coordinadas con MultiEdit:
  1. Import de lucide-react: `import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";` → `import { Loader2, RefreshCw } from "lucide-react";`
  2. Añadido después del último `@/components/admin/` import: `import { AdminModuleHeader } from "@/components/admin/admin-module-header";`
  3. Cambio del wrapper `<div className="min-h-screen bg-slate-50">` → `<div className="min-h-screen bg-neutral-50">` y reemplazo del bloque `<header>...</header>` por `<AdminModuleHeader title=... onReload=... isLoading=... />`
- Para grupos (que tiene 3 tabs y 3 load functions), usé `onReload={handleReload}` (la función existente que recarga la tab activa) y `isLoading={isCurrentTabLoading}` (estado derivado que ya estaba calculado en el archivo).
- Títulos aplicados: "Eventos", "Clubes", "Galería", "Noticias", "Investigación".
- Ejecuté `bun run lint` → ERROR: 1 problema en src/app/admin/profesores/page.tsx línea 198: `'RefreshCw' is not defined  react/jsx-no-undef`. Era un bug preexistente de la Task 7-a (eliminaron RefreshCw del import en profesores pero el icono seguía usándose en el botón "Reintentar" del estado de error). Lo arreglé añadiendo `RefreshCw` de vuelta al import en profesores: `import { Loader2, RefreshCw } from "lucide-react";`.
- Re-ejecuté `bun run lint` → **PASS** (sin errores ni warnings).
- Verifiqué con grep que no queda ninguna referencia a `ArrowLeft` en los 5 archivos actualizados (solo queda en src/app/admin/[modulo]/page.tsx, que es el placeholder dinámico y NO estaba en el alcance de esta tarea).
- Revisé dev.log: servidor compila limpio, sin errores tras las ediciones.

Stage Summary:
- ✅ 5 páginas admin migradas al componente AdminModuleHeader reutilizable: /admin/eventos, /admin/clubes, /admin/galeria, /admin/noticias, /admin/grupos
- ✅ Paleta visual consistente en todos los módulos admin: header negro (bg-neutral-950) con borde dorado, botones con texto amber, logo ECFN en la esquina, fondo de página bg-neutral-50
- ✅ Imports limpios: eliminado `ArrowLeft` (ya no se usa fuera del header) en los 5 archivos; conservado `Loader2` (loading spinners) y `RefreshCw` (botones "Reintentar" del estado de error)
- ✅ Bug preexistente corregido en profesores/page.tsx (RefreshCw faltante en import — leftover de la Task 7-a)
- ✅ `bun run lint` pasa sin errores ni warnings
- ✅ Dev server compila limpio (Next.js 16.1.3 Turbopack)
- ✅ No se modificó ninguna otra lógica de los archivos (CRUD handlers, formularios modales, diálogos de borrado, tabs en grupos, lazy load, etc.)
- Archivos modificados: 6 (5 páginas objetivo + 1 fix en profesores)

---
Task ID: 7
Agent: Arquitecto principal (Z.ai)
Task: Fase 7 — Paleta dorado/negro + logos oficiales + página /creditos

Work Log:
- Analicé los 3 logos proporcionados por el usuario con VLM:
  * AEFN-PNG.png: átomo dorado + texto "ASOCIACIÓN DE ESTUDIANTES DE FÍSICA Y NANOTECNOLOGÍA-YT"
  * ECFN.png: hexágono dorado + texto "SCHOOL OF PHYSICAL SCIENCES AND NANOTECHNOLOGY"
  * LOGO-ECFN.png: solo el hexágono dorado sin texto
- Copié los logos a public/images/logos/:
  * aefn-logo.png (logo completo AEFN)
  * ecfn-logo.png (logo completo ECFN)
  * ecfn-symbol.png (solo el hexágono dorado, para íconos)
- Creé src/lib/theme.ts con:
  * AEFN_COLORS: paleta dorado (amber-500/600) + negro (neutral-950) + grises neutros
  * AEFN_LOGOS: rutas de los 3 logos
- Actualicé src/components/admin/login-screen.tsx:
  * Fondo gradient negro (neutral-950 → neutral-900)
  * Logo ECFN (hexágono dorado) en vez del ícono Atom
  * Botón "Ingresar" dorado (amber-500) con texto negro
  * Acentos dorados en texto y bordes
- Actualicé src/components/admin/admin-dashboard.tsx:
  * Header negro (neutral-950) con borde dorado
  * Logo ECFN en el header en vez de Atom
  * Tarjetas de módulos con hover dorado (amber-500)
  * Footer negro con texto dorado
- Creé src/components/admin/admin-module-header.tsx:
  * Header reutilizable para páginas de módulos admin
  * Paleta dorado/negro consistente
  * Logo ECFN en el lado derecho
  * Props: title, onReload, isLoading, children
- Delegué a subagente (Task 7-b) la actualización de 5 páginas admin:
  * eventos, clubes, galeria, noticias, grupos
  * Cada una ahora usa <AdminModuleHeader> en vez de header inline
  * Se cambiaron fondos slate → neutral
- Creé src/app/creditos/page.tsx (Server Component):
  * Página de agradecimientos con paleta dorado/negro
  * Sección "Colaboradores" con array editable
  * Sección "Desarrollo técnico" con array editable
  * Sección "Tecnología y herramientas" (Next.js, React, TypeScript, etc.)
  * Enlaces a email y GitHub
  * Header y footer con paleta dorado/negro
- Ejecuté bun run lint: sin errores
- Tests visuales con agent-browser:
  * Login page: paleta dorado/negro, logo ECFN, botón dorado ✅
  * Dashboard: header negro, módulos con hover dorado, footer negro ✅
  * /creditos: página completa con secciones de colaboradores ✅
  * /admin/profesores, /admin/grupos: headers con nueva paleta ✅
- Capturas: phase7-login-gold.png, phase7-dashboard-gold.png, phase7-profesores-gold.png, phase7-grupos-gold.png, phase7-creditos.png

Stage Summary:
- ✅ Paleta de colores oficial aplicada: dorado (amber-500/600) + negro (neutral-950)
- ✅ Logo ECFN (hexágono dorado) reemplaza al ícono Atom en todo el panel admin
- ✅ 3 logos oficiales copiados a public/images/logos/
- ✅ Componente AdminModuleHeader reutilizable para consistencia
- ✅ Página /creditos creada con arrays editables de colaboradores
- ✅ ESLint pasa sin errores
- ✅ Diseño responsive mantenido
- Archivos creados: 3 (theme.ts, admin-module-header.tsx, creditos/page.tsx)
- Archivos modificados: 7 (login-screen.tsx, admin-dashboard.tsx, 5 páginas admin via subagente)
- Próxima fase: Fase 8 — Documentación técnica + manual admin + guía Vercel

---
Task ID: 8
Agent: Arquitecto principal (Z.ai)
Task: Fase 8 — Documentación técnica + manual admin + guía Vercel

Work Log:
- Creé ARCHITECTURE.md (493 líneas) con documentación técnica completa:
  * Visión general y stack tecnológico
  * Diagrama de arquitectura del sistema
  * Estructura de carpetas detallada
  * Flujo de datos (lectura y edición)
  * Sistema de autenticación por claves
  * Integración con GitHub (Contents API, PAT, SHA)
  * Gestión de imágenes con sharp
  * Paleta de colores y tema (dorado + negro)
  * Decisiones de diseño (por qué Next.js, JSON, sessionStorage, etc.)
  * Seguridad
  * Limitaciones y futuras mejororas
- Creé ADMIN_MANUAL.md (511 líneas) manual para presidentes sin conocimientos técnicos:
  * Introducción y primeros pasos
  * Sistema de claves explicado
  * Guías detalladas para cada módulo (profesores, noticias, eventos, clubes, galería, investigación)
  * Cómo subir fotos de profesores
  * Cómo subir imágenes de noticias
  * Cómo marcar noticia destacada
  * Cómo editar créditos
  * Solución de problemas comunes
  * Preguntas frecuentes
- Creé DEPLOYMENT.md (471 líneas) guía paso a paso de Vercel:
  * Crear PAT Fine-grained de GitHub
  * Crear cuenta en Vercel
  * Conectar repositorio
  * Configurar variables de entorno (GITHUB_TOKEN y ACCESS_KEYS)
  * Primer despliegue
  * Verificación completa (checklist)
  * Cómo actualizar el sitio en el futuro
  * Cómo administrar las claves de acceso
  * Cómo volver a desplegar (redeploy)
  * Dominio personalizado (opcional)
  * Solución de problemas
- Actualicé README.md (267 líneas) con:
  * Descripción moderna del proyecto
  * Badges de tecnologías
  * Tabla de características
  * Enlaces a los 3 documentos de documentación
  * Inicio rápido para 3 audiencias (visitantes, admins, desarrolladores)
  * Estructura del proyecto
  * Comandos de desarrollo
  * Tecnologías usadas
  * Identidad visual (paleta + logos)
  * Seguridad
  * Contacto
- Ejecuté bun run lint: sin errores
- Verificación final completa:
  * 18/18 rutas HTTP responden 200 o 307 ✅
    - 6 páginas HTML originales
    - 2 páginas nuevas (/noticias, /creditos)
    - 1 panel admin (/admin)
    - 8 API routes (profesores, noticias, eventos, clubes, galería, grupos, papers, tesis, auth)
  * 4/4 documentos de documentación creados ✅
  * Servidor estable y sin errores

Stage Summary:
- ✅ Documentación técnica completa (ARCHITECTURE.md)
- ✅ Manual para presidentes sin conocimientos técnicos (ADMIN_MANUAL.md)
- ✅ Guía paso a paso de despliegue en Vercel (DEPLOYMENT.md)
- ✅ README.md moderno y profesional
- ✅ Todas las rutas funcionando (18/18)
- ✅ ESLint sin errores
- ✅ Proyecto completo y listo para desplegar
- Archivos creados: 4 (ARCHITECTURE.md, ADMIN_MANUAL.md, DEPLOYMENT.md, README.md)
- PROYECTO COMPLETO 🎉
