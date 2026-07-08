# Task 6-d — Grupos de Investigación CRUD module

**Agent:** full-stack-developer (Grupos CRUD)
**Task ID:** 6-d
**Date:** Continuation of AEFN Portal Web Editable project

## Context

This task continues from prior tasks (1-6c) documented in `/home/z/my-project/worklog.md`.
It builds the **Grupos de Investigación** CRUD module, which is special: it manages
THREE related JSON files with ONE access key (`"grupos"`):

1. **Grupos** — `data/investigation-groups.json` (`GrupoInvestigacion[]`)
2. **Papers** — `data/papers.json` (`Paper[]`)
3. **Tesis** — `data/theses.json` (`Tesis[]`)

The admin page `/admin/grupos` shows three tabs (Grupos, Papers, Tesis), each with
its own list and CRUD.

## Files created (10 total)

### 1. API routes (3 files)

#### `src/app/api/grupos/route.ts`
CRUD for investigation groups. Standard pattern (same as profesores/clubes):
- Module key `"grupos"` → JSON path `MODULES.grupos.jsonPath = "data/investigation-groups.json"`
- GET: public, returns `{ data, sha }`
- POST: requires `grupos` or `admin` permission; autogenerates ID via
  `slugify(title)` with numeric suffix on collision; auto-fills `slug` from ID
  if not provided; commits `"Add grupo: {title}"`
- PUT: requires permission + `id`; commits `"Update grupo: {title}"`
- DELETE: requires permission + `id`; commits `"Delete grupo: {title}"`
- Ensures `participants` and `projects` are always arrays after write

#### `src/app/api/papers/route.ts`
CRUD for papers. **No `id` field** in the JSON — uses `title` as the natural
identifier (same module key `"grupos"`, JSON path hardcoded to
`"data/papers.json"`):
- GET: public, returns `{ data, sha }`
- POST: requires permission; validates uniqueness of `title` (HTTP 409 on
  collision); ensures `authors` is always an array and `published` defaults to
  `true`; commits `"Add paper: {title}"`
- PUT: receives `{ oldTitle, paper }` (so the title can be edited); commits
  `"Update paper: {paper.title}"`
- DELETE: receives `{ title }`; commits `"Delete paper: {title}"`

#### `src/app/api/tesis/route.ts`
CRUD for theses. **No `id` field** — same pattern as papers (uses `title` as
the identifier). JSON path hardcoded to `"data/theses.json"`. Validates
uniqueness of `title` (HTTP 409 on collision). PUT receives
`{ oldTitle, tesis }`. Commit messages: `"Add/Update/Delete tesis: {title}"`.

### 2. List components (3 files)

#### `src/components/admin/group-list.tsx`
Each item shows:
- Title (heading)
- `short_description` (truncated to 2 lines via `line-clamp-2`)
- Meta row: participants count (icon `Users`), projects count (icon
  `FolderKanban`), and contact email as a slate badge
- Edit / Delete icon buttons
- Empty state with "Agregar grupo" button
- Header shows `"X grupo"` / `"X grupos"`

#### `src/components/admin/paper-list.tsx`
Each item shows:
- Title (heading, up to 2 lines)
- Authors (joined by `", "`, truncated)
- Year badge (slate, with `Calendar` icon)
- Published status badge: `"Publicado"` (emerald) when `published === true`,
  `"Borrador"` (slate-200) otherwise
- External link (truncated, opens in new tab) if `link` exists
- Edit / Delete icon buttons
- Empty state with "Agregar paper" button

#### `src/components/admin/thesis-list.tsx`
Each item shows:
- Title (heading, up to 2 lines)
- Author (with `User` icon)
- Year badge (slate, with `Calendar` icon)
- Status badge: `"En curso"` (amber) when `status === "en curso"`,
  `"Defendida"` (emerald) when `status === "defendida"`
- External link (truncated, opens in new tab) if `link` exists
- Edit / Delete icon buttons
- Empty state with "Agregar tesis" button

### 3. Form components (3 files)

#### `src/components/admin/group-form.tsx`
Modal form (`max-w-3xl`) with:
- `title` (required)
- `slug` (optional, with **live preview** of the auto-generated slug from
  the title using a local `localSlugify` function — shows what the API will
  use if the field is left empty)
- `short_description` (textarea, 2 rows)
- `image` (text path, `font-mono`, with helper text)
- `long_description` (textarea, 5 rows)
- `contact_email`
- **Participants** dynamic list — each item is `{ name, role }` rendered in
  a 12-col grid (7/4/1 + remove button)
- **Projects** dynamic list — each item is `{ title, year }` rendered in a
  12-col grid (8/3/1 + remove button). Year is parsed to a number (or
  `undefined` if empty)

Saves via `POST /api/grupos` (create) or `PUT /api/grupos` (edit, with `id`).
Uses Dialog, ScrollArea, Input, Label, Textarea, Button, Loader2 from shadcn/ui
and toast from sonner.

#### `src/components/admin/paper-form.tsx`
Modal form (`max-w-2xl`) with:
- `title` (required)
- `year` (required, number input)
- `authors` (dynamic list of strings, like `educacion` in professor-form)
- `abstract` (textarea, 5 rows)
- `link` (URL input)
- `published` (Checkbox in a slate-styled box with descriptive label)

When editing, sends `{ oldTitle: paper.title, paper: formData }` so the API
can find the original record even if the title was changed in the form.
Validation: title required, year must be a valid number.

#### `src/components/admin/thesis-form.tsx`
Modal form (`max-w-2xl`) with:
- `title` (required)
- `author` (required)
- `year` (required, number input) + `status` (Select with `"en curso"` /
  `"defendida"` options, on the same row on `sm+` screens)
- `abstract` (textarea, 5 rows)
- `link` (URL input)

When editing, sends `{ oldTitle: tesis.title, tesis: formData }`. Validation:
title and author required, year must be a valid number. Uses the shadcn/ui
`Select` component (already present in `src/components/ui/select.tsx`).

### 4. Admin page with tabs

#### `src/app/admin/grupos/page.tsx`
- Uses `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` from
  `@/components/ui/tabs`
- Three tabs: `"grupos"`, `"papers"`, `"tesis"`
- Each tab has its own complete state (list, isLoading, error, formOpen,
  formMode, editingItem, deleteOpen, deletingItem) — 9 useState hooks total
  per tab × 3 tabs
- **Lazy loading**: grupos are loaded on mount (initial tab); papers and
  tesis are loaded the first time their tab is activated (tracked via
  `papersLoaded` / `tesisLoaded` flags)
- Header: "Dashboard" back button (ArrowLeft → `/admin`), "Investigación"
  title, "Recargar" button (reloads ONLY the current tab — `handleReload`
  calls the right `load*` function based on `activeTab`)
- `useAdminAuth` + `getStoredKey` for route protection (redirect to `/admin`
  if not authenticated; "Cargando..." placeholder during mount)
- Three form modals (GroupForm, PaperForm, ThesisForm) — the onSaved
  callbacks for papers/tesis pass `editingItem?.title` as `oldTitle` so the
  local list update uses the original title to find the entry to replace
- Three `ConfirmDeleteDialog` instances (one per resource) — all reuse the
  same component, with resource-specific titles and descriptions
- Reusable `InfoNote` component at the bottom of each tab (commit + revert
  note in GitHub)

## Key design decisions

### Papers and Tesis use `title` as the natural identifier
The original JSON files don't have an `id` field for papers or theses. We use
the `title` as the unique identifier (it's unique within each JSON file).
The PUT endpoint receives `{ oldTitle, paper }` (or `{ oldTitle, tesis }`)
so the API can find the original record to replace — even if the user
changed the title in the form. The frontend's `onSaved` callback also
receives the `oldTitle` to update the local list correctly.

### Validation of uniqueness
POST and PUT for papers/tesis validate that the title doesn't collide with
an existing entry. If it does, the API returns HTTP 409 with a descriptive
error. The frontend shows the error via toast.

### Lazy loading of tabs
Only the active tab's data is loaded on demand. Grupos (the initial tab) is
loaded on mount; papers and tesis are loaded the first time their tab is
activated. Subsequent tab switches don't re-fetch unless the user clicks
"Recargar". This keeps the initial page load fast.

### Slug preview in group form
The `slug` field is optional in the group form. A local `localSlugify`
function (mirroring the server-side `slugify` in `@/lib/github`) shows a
live preview of what slug will be used if the field is left empty. This
gives the user transparency without duplicating logic across the wire.

### Reusing ConfirmDeleteDialog
Three instances of `ConfirmDeleteDialog` coexist in the same page, each with
its own `open` state and `onConfirm` handler. The component handles its own
loading state internally, so there's no conflict.

## Verification

- `bun run lint` → **PASS** (exit code 0, no errors, no warnings)
- Files created: **10** (3 API routes + 3 list components + 3 form
  components + 1 admin page)
- Static route `/admin/grupos` overrides the dynamic `/admin/[modulo]`
  placeholder (confirmed by file structure — same as profesores/eventos/
  noticias/clubes/galeria)
- API route paths verified:
  - grupos: `MODULES.grupos.jsonPath` = `"data/investigation-groups.json"`
  - papers: hardcoded `"data/papers.json"`
  - tesis: hardcoded `"data/theses.json"`
- Types from `@/lib/types` match the real JSON schemas:
  - `investigation-groups.json`: 2 groups with id, title, slug,
    short_description, image, participants[{name, role}], long_description,
    projects[{title, year}], contact_email
  - `papers.json`: 2 papers with title, authors[], year, abstract, link,
    published
  - `theses.json`: 2 theses with title, author, year, abstract, link,
    status
- Runtime curl test failed (dev server unreachable from sandbox — known
  issue documented in Task 6-c). Lint passes and code follows the exact
  same pattern as the previously-verified clubes module.

## Issues / TODOs

- None blocking. Real GitHub commits require `GITHUB_TOKEN` configured in
  `.env.local` or Vercel (same as all other modules — fallback to local
  JSON is used when token is missing, so the UI is fully functional in dev).
- **This task completes the series 6** (eventos, clubes, galeria, grupos).
  All AEFN modules now have CRUD real implementations. The dynamic
  `/admin/[modulo]` placeholder remains only as a fallback for unknown
  module slugs (it's now overridden by static routes for all 6 modules:
  profesores, eventos, noticias, clubes, galeria, grupos).

## Stage Summary

- ✅ 3 API routes created following the established CRUD pattern
- ✅ 3 list components with badges, counts, and responsive layout
- ✅ 3 form components with dynamic lists (objects for participants/projects,
  strings for authors) and live slug preview
- ✅ 1 admin page with 3 tabs, lazy loading, and per-tab state isolation
- ✅ Papers and theses use `title` as natural identifier (no `id` field)
  with `oldTitle` passed on PUT to handle title edits
- ✅ Validation of title uniqueness (HTTP 409 on collision)
- ✅ All 10 files lint-pass cleanly
- ✅ Reuses ConfirmDeleteDialog (3×), useAdminAuth, getStoredKey, helpers
- ✅ Style consistent with profesores/clubes/galeria (slate, mobile-first,
  Spanish comments, no indigo/blue)
