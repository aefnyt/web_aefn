# Task 6-c — Galería CRUD

**Agent:** full-stack-developer (Galería CRUD)
**Task:** Build Galería CRUD module (álbumes + fotos internas)

## Work Log

- Leí `worklog.md` y todos los archivos de referencia del módulo Profesores (route.ts, foto/route.ts, page.tsx, professor-list.tsx, professor-form.tsx, news-image-input.tsx, confirm-delete-dialog.tsx) y del módulo Clubes (route.ts, club-form.tsx, club-list.tsx, page.tsx) para entender los patrones establecidos.
- Verifiqué el esquema `AlbumGaleria` existente en `src/lib/types.ts` (id, album, category?, date?, description?, photos[] con {id, title?, image, description?}) — coincide con el JSON real en `public/data/gallery.json`.
- Verifiqué `MODULES.galeria.jsonPath = "data/gallery.json"` en `src/lib/config.ts`.
- Verifiqué que `public/data/gallery.json` ya existe con 1 álbum real ("Nano Gallery") con 12 fotos — IDs tipo "foto-1", "foto-2", imágenes PNG en `images/gallery/nanogal/`.

### Archivos creados

1. **`src/app/api/galeria/route.ts`** — CRUD completo:
   - GET (lectura pública, devuelve `{ data, sha }`)
   - POST (crear, requiere permiso "galeria" o "admin", autogenera ID con `slugify(album)` + sufijo si colisiona, commit `"Add album: {album}"`)
   - PUT (actualizar, requiere permiso + id, commit `"Update album: {album}"`)
   - DELETE (eliminar, requiere permiso + id, commit `"Delete album: {album}"`)
   - Asegura que `photos` siempre sea un arreglo tras la escritura.
   - Helper: usa `slugify` del `@/lib/github` para generar IDs legibles (ej: "Nano Gallery" → "nano-gallery").

2. **`src/components/admin/gallery-list.tsx`** — Lista responsive de álbumes:
   - Badge slate para la categoría.
   - Nombre del álbum (heading), descripción truncada a 2 líneas (`line-clamp-2`).
   - Meta: fecha formateada en español (`"1 dic 2025"`, locale es-EC) con icono `Calendar`, y número de fotos con icono `Image`.
   - Header muestra `"X álbum"` / `"X álbumes"`.
   - Estado vacío con botón `"Agregar álbum"`.
   - Botones Editar/Eliminar (iconos `Pencil`, `Trash2`).

3. **`src/components/admin/gallery-form.tsx`** — Formulario modal:
   - Datos básicos: nombre del álbum (required), categoría (texto libre), fecha (input `type=date`), descripción (textarea).
   - Fotos: lista dinámica de OBJETOS `{id, title, image, description}` con patrón grid 12-col (5/6/1 + descripción a full width), botones add/remove.
   - Para cada foto, se muestra una **miniatura/preview** cuadrada (16x16 / 20x20) si el campo `image` no está vacío, cargada desde `/{ruta}`. Si la imagen no carga (ruta inválida), se oculta el `<img>` con un handler `onError`. Si no hay ruta, muestra un icono `ImageIcon` placeholder.
   - Debajo de la miniatura, un Badge con el nombre del archivo (último segmento de la ruta) para verificación visual rápida.
   - El campo "ruta de imagen" usa `font-mono text-xs` para distinguirlo de los campos de texto libre.
   - Genera IDs únicos para fotos nuevas con `foto-{timestamp}-{random}`. Conserva IDs existentes al editar.
   - Usa Dialog, ScrollArea, Input, Label, Textarea, Button, Badge, Loader2 (shadcn/ui), toast (sonner), iconos lucide-react.
   - Validación: nombre del álbum obligatorio.

4. **`src/app/admin/galeria/page.tsx`** — Página admin completa:
   - Misma estructura que `profesores/page.tsx`, `eventos/page.tsx` y `clubes/page.tsx` adaptada para `AlbumGaleria`.
   - State: `albumes[]`, `isLoading`, `error`, `formOpen`, `formMode`, `editingAlbum`, `deleteOpen`, `deletingAlbum`.
   - `loadAlbumes()` con fetch a `/api/galeria` y migración suave de IDs faltantes.
   - Handlers: `handleAdd`, `handleEdit`, `handleDelete`, `handleDeleteConfirm`, `handleSaved`.
   - Header con botones "Dashboard" (ArrowLeft → `/admin`), título "Galería", "Recargar" (RefreshCw).
   - Protección de ruta: redirect a `/admin` si no autenticado, placeholder "Cargando..." durante mount.
   - Toast notifications para éxito/error en borrado.
   - Nota informativa al pie sobre commits en GitHub.

### Decisiones de diseño

- **No hay UI de subida de fotos individuales** (mantener simple, como pide la task). El admin escribe manualmente la ruta de cada foto (ej: `images/gallery/nanogal/1.png`).
- **No se auto-convierten PNG a WebP**: el formulario acepta cualquier ruta (PNG, JPG, WebP, etc.) y la guarda tal cual. El JSON existente usa PNG y seguirá usándolos.
- **No hay endpoint `/api/galeria/foto`** (no se suben fotos en esta fase). Las fotos se gestiona como array dentro del álbum.
- **Preview funcional pero defensivo**: usa `<img>` nativo con `onError` para ocultar imágenes que no carguen (no rompe el UI si el admin escribe una ruta inexistente).
- **Reutilicé `ConfirmDeleteDialog`** existente (componente reutilizable creado en Task 4).

### Verificación

- Ejecuté `bun run lint` → **PASS** sin errores ni warnings.
- El código sigue exactamente el mismo patrón que el módulo Clubes (ya verificado por Task 6-b), por lo que la estructura es correcta.
- No pude verificar en runtime con curl porque el dev server se detuvo (problema conocido del sandbox documentado en worklog Task 1). El lint pasa y la estructura sigue el patrón verificado.

## Stage Summary

- ✅ CRUD completo de álbumes de galería implementado (GET público, POST/PUT/DELETE con permiso).
- ✅ Lista responsive con badge de categoría, fecha formateada en español y contador de fotos.
- ✅ Formulario modal completo con lista dinámica de fotos (objetos), preview de miniatura defensivo.
- ✅ Página `/admin/galeria` con protección de ruta y estados de carga/error.
- ✅ ID autogenerado legible: slug del nombre del álbum con sufijo numérico si colisiona.
- ✅ Reutilización de `ConfirmDeleteDialog` (sin duplicar componente).
- ✅ Lint pasa sin errores ni warnings.
- ⏳ Pendiente: usuario configura PAT real para commits reales.
- Archivos creados: 4 (1 ruta API + 2 componentes admin + 1 página admin).
- Próxima tarea sugerida: 6-d Grupos (siguiendo el mismo patrón).
