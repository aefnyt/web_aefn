# Task 6-b — Clubes CRUD module

**Agent:** full-stack-developer (Clubes CRUD)
**Task ID:** 6-b
**Date:** Continuation of AEFN Portal Web Editable project

## Context

This task continues from prior tasks (1-6a) documented in `/home/z/my-project/worklog.md`.
It builds the Clubes (student clubs) CRUD module following the established pattern
from the Profesores module (Task 4) and Eventos module (Task 6-a).

## Files created

1. **`src/app/api/clubes/route.ts`** — CRUD API (GET/POST/PUT/DELETE)
   - Module key: `"clubes"` → JSON path: `"data/clubes.json"`
   - GET: public (no auth), returns `{ data, sha }`
   - POST: requires `clubes` or `admin` permission, autogenerates ID via
     `slugify(nombre)` with numeric suffix on collision, commits
     `"Add club: {nombre}"`
   - PUT: requires permission + `id`, commits `"Update club: {nombre}"`
   - DELETE: requires permission + `id`, commits `"Delete club: {nombre}"`
   - Ensures `directiva` and `actividades` are always arrays after write

2. **`src/components/admin/club-list.tsx`** — Responsive list component
   - Each item shows:
     - Icon badge (the Bootstrap Icons class name as mono-spaced text in a
       slate badge, since the admin doesn't load Bootstrap Icons CSS)
     - Nombre (heading)
     - Descripcion (truncated to 2 lines via `line-clamp-2`)
     - Meta: directiva member count (Users icon) + contacto_email (Mail icon)
     - Editar / Eliminar buttons
   - Empty state with "Agregar club" button
   - Header shows "X club" / "X clubes"

3. **`src/components/admin/club-form.tsx`** — Modal form
   - Fields: nombre (required), icono (Bootstrap Icons class, with helper text
     + link to icons.getbootstrap.com), descripcion (textarea short),
     descripcion_larga (textarea long), contacto_email (email input)
   - **Directiva** dynamic list — each item is an object with `cargo`,
     `nombre`, `email` rendered in a 12-col grid (3/4/4 + remove button).
     Includes add/remove buttons.
   - **Actividades** dynamic list — each item is an object with `fecha`,
     `titulo`, `descripcion` in the same 12-col grid pattern.
   - Uses Dialog, ScrollArea, Input, Label, Textarea, Button, Loader2 from
     shadcn/ui. Toast from sonner.
   - Validation: requires `nombre`.
   - Saves via `POST /api/clubes` (create) or `PUT /api/clubes` (edit) with
     Authorization header.

4. **`src/app/admin/clubes/page.tsx`** — Admin page
   - Identical structure to `/admin/profesores/page.tsx`
   - State: `clubes[]`, `isLoading`, `error`, `formOpen`, `formMode`,
     `editingClub`, `deleteOpen`, `deletingClub`
   - `loadClubes()` fetches `/api/clubes` and applies soft ID migration
   - Route protection: redirects to `/admin` if not authenticated; shows
     "Cargando..." during mount
   - Header: Dashboard back button (ArrowLeft), "Clubes" title, Recargar
     button (RefreshCw)
   - Toast notifications for delete success/error via ConfirmDeleteDialog
     callbacks

## Reused components

- `ConfirmDeleteDialog` (from `@/components/admin/confirm-delete-dialog`) —
  same reusable component created in Task 4. No duplication.
- `useAdminAuth`, `getStoredKey` from `@/hooks/use-admin-auth`
- Helpers: `readJsonFile`, `writeJsonFile`, `slugify` from `@/lib/github`;
  `hasPermission`, `extractKeyFromRequest` from `@/lib/auth`;
  `MODULES` from `@/lib/config`

## Pattern notes

- Same code style as profesores/eventos modules: TypeScript strict, `"use client"`
  for components with hooks, Spanish comments, no indigo/blue primary colors
  (only slate/gray scale + slate-100 badges for the icon).
- The dynamic `/admin/[modulo]/page.tsx` placeholder still exists for the
  remaining modules (grupos, galeria). Next.js prioritizes the static
  `/admin/clubes/page.tsx` route over the dynamic one — same behavior as
  profesores, eventos and noticias.
- ID generation uses `slugify(nombre)`, identical to profesores pattern.
- Soft ID migration in `loadClubes()` mirrors the profesores/eventos pattern
  for legacy items missing an `id`.

## Verification

- `bun run lint` → PASS (no errors, no warnings)
- Files created: 4 (1 API route + 2 admin components + 1 admin page)
- Static route `/admin/clubes` overrides the dynamic `/admin/[modulo]`
  placeholder (confirmed by file structure).
- API route path is `MODULES.clubes.jsonPath` = `"data/clubes.json"` (verified
  against `/home/z/my-project/src/lib/config.ts`).
- Club type from `@/lib/types` matches the real schema in
  `/home/z/my-project/public/data/clubes.json` (3 sample clubs:
  astronomia, programacion-cientifica, investigacion).

## Issues / TODOs

- None blocking. Real GitHub commits require `GITHUB_TOKEN` configured in
  `.env.local` or Vercel (same as all other modules — fallback to local JSON
  is used when token is missing, so the UI is fully functional in dev).
- Next suggested tasks: 6-c Galería, 6-d Grupos (following same pattern).
