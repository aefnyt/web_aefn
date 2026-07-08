# 📖 Manual del Administrador — AEFN

> Guía para que cualquier presidente o miembro de la AEFN pueda administrar el sitio web **sin conocimientos técnicos**.

---

## 📋 Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Primeros Pasos](#2-primeros-pasos)
3. [Sistema de Claves](#3-sistema-de-claves)
4. [Administrar Profesores](#4-administrar-profesores)
5. [Administrar Noticias](#5-administrar-noticias)
6. [Administrar Eventos](#6-administrar-eventos)
7. [Administrar Clubes](#7-administrar-clubes)
8. [Administrar Galería](#8-administrar-galería)
9. [Administrar Investigación](#9-administrar-investigación)
10. [Página de Créditos](#10-página-de-créditos)
11. [Qué hacer si algo falla](#11-qué-hacer-si-algo-falla)
12. [Preguntas Frecuentes](#12-preguntas-frecuentes)

---

## 1. Introducción

### ¿Qué es este manual?

Este manual te enseña a administrar el sitio web de la AEFN. **No necesitas saber programar.** Si sabes usar Facebook o Google Docs, puedes administrar este sitio.

### ¿Qué puedes hacer?

- ✅ Agregar, editar y eliminar **profesores** (con fotos)
- ✅ Publicar **noticias** y anuncios (con imágenes)
- ✅ Gestionar **eventos** del calendario
- ✅ Administrar **clubes** estudiantiles
- ✅ Subir fotos a la **galería**
- ✅ Gestionar **grupos de investigación**, papers y tesis

### ¿Qué NO necesitas hacer?

- ❌ NO necesitas editar archivos JSON manualmente
- ❌ NO necesitas entrar a GitHub
- ❌ NO necesitas saber HTML, CSS ni programación
- ❌ NO necesitas instalar nada en tu computadora

Todo se hace desde el navegador, como cualquier página web.

---

## 2. Primeros Pasos

### Paso 1: Entra al panel de administración

1. Abre tu navegador (Chrome, Firefox, Safari, etc.)
2. Ve a la dirección del sitio web de la AEFN
3. Haz clic en el enlace **"Administración"** que está al final de la página (en el footer), debajo de "Enlaces Rápidos"

   También puedes escribir directamente: `tu-sitio.vercel.app/admin`

### Paso 2: Ingresa tu clave

Verás una pantalla con un campo que dice "Clave de acceso":

1. Escribe tu clave en el campo
2. Haz clic en el botón **"Ingresar"**

> 💡 **Tip:** Si quieres ver lo que escribes, haz clic en el ícono del ojo 👁️ al lado del campo.

### Paso 3: ¡Listo!

Si la clave es correcta, verás el **Panel de Administración** con tarjetas de los módulos que puedes administrar.

Si la clave es incorrecta, verás un mensaje de error en rojo. Vuelve a intentarlo.

---

## 3. Sistema de Claves

### ¿Cómo funcionan las claves?

Hay **7 claves diferentes**, cada una da acceso a partes distintas del sitio:

| Clave | Qué puedes hacer |
|-------|------------------|
| 🔑 **Clave de Administrador** | TODO: profesores, noticias, eventos, clubes, galería, investigación |
| 👨‍🏫 Clave de Profesores | Solo administrar profesores |
| 📰 Clave de Noticias | Solo publicar/editar noticias |
| 📅 Clave de Eventos | Solo administrar eventos |
| 🎯 Clave de Clubes | Solo administrar clubes |
| 📸 Clave de Galería | Solo administrar la galería |
| 🔬 Clave de Investigación | Solo administrar grupos, papers y tesis |

### ¿Quién tiene cada clave?

El **administrador general** (usualmente el presidente o el encargado de tecnología) tiene todas las claves y las reparte según los roles:

- El encargado de prensa tiene la clave de **Noticias**
- El encargado de eventos tiene la clave de **Eventos**
- etc.

### ¿Cómo cambio una clave?

Si necesitas cambiar una clave (por ejemplo, porque alguien dejó el cargo), pídelo al administrador general. Él puede cambiar las claves desde Vercel sin tocar código.

> ⚠️ **Importante:** Las claves son **personales**. No las compartas con nadie. Si sospechas que alguien más las sabe, pide cambiarlas.

### ¿Dónde se guardan las claves?

Las claves se guardan en tu navegador (**sessionStorage**), lo que significa:

- ✅ Se borran automáticamente al cerrar la pestaña
- ✅ Nadie que use tu computadora después encontrará la clave
- ⚠️ Si abres una pestaña nueva, tendrás que ingresar la clave otra vez

---

## 4. Administrar Profesores

### Ver la lista de profesores

1. En el panel, haz clic en la tarjeta **"Profesores"**
2. Verás una lista con todos los profesores actuales

### Agregar un profesor nuevo

1. Haz clic en el botón **"Agregar"** (arriba a la derecha)
2. Se abre un formulario. Llena los campos:

   | Campo | ¿Obligatorio? | Qué poner |
   |-------|---------------|-----------|
   | Nombre completo | ✅ Sí | "Dr. Juan Pérez" |
   | Título / Cargo | ✅ Sí | "Profesor Principal" |
   | Email | Opcional | "jperez@yachaytech.edu.ec" |
   | Teléfono | Opcional | "0991234567" |
   | Oficina | Opcional | "Lab 204" |
   | Áreas | Opcional | Marca las casillas que apliquen |
   | Áreas de investigación | Opcional | Clic en "Agregar" y escribe cada una |
   | Biografía | Opcional | Texto libre sobre el profesor |
   | Educación | Opcional | Lista de títulos académicos |
   | Publicaciones | Opcional | Lista de papers destacados |
   | Proyectos | Opcional | Lista de proyectos de investigación |
   | LinkedIn, Google Scholar, GitHub | Opcional | URLs de los perfiles |

3. Haz clic en **"Guardar"**

> 💡 **Sobre la foto:** Primero guarda el profesor (sin foto). Luego edítalo y verás la opción de subir la foto.

### Editar un profesor

1. En la lista, busca el profesor
2. Haz clic en el botón **"Editar"** (ícono de lápiz ✏️)
3. Modifica lo que necesites
4. Haz clic en **"Guardar"**

### Subir o cambiar la foto de un profesor

1. Edita el profesor (botón "Editar")
2. Arriba del formulario verás la sección **"Fotografía"**
3. Haz clic en **"Subir foto"** (o "Reemplazar" si ya tiene una)
4. Selecciona la imagen desde tu computadora
5. Espera a que se suba (verás un ícono girando)
6. Cuando termine, verás un mensaje de éxito ✅

**Recomendaciones para la foto:**
- Usa una foto cuadrada (se recorta automáticamente a 600×600)
- Formato: JPG, PNG o WebP
- Tamaño máximo: 10 MB (se optimiza automáticamente)
- Una foto profesional o de buena calidad

### Eliminar la foto de un profesor

1. Edita el profesor
2. En la sección "Fotografía", haz clic en **"Eliminar"** (botón rojo)
3. Confirma

### Eliminar un profesor

1. En la lista, busca el profesor
2. Haz clic en el botón **"Eliminar"** (ícono de papelera 🗑️)
3. Aparece un diálogo de confirmación
4. Haz clic en **"Sí, eliminar"**

> ⚠️ **Ojo:** Esto borra al profesor y su foto. Si te equivocas, puedes recuperar los datos desde el historial de GitHub (pídelo al administrador).

---

## 5. Administrar Noticias

### Ver la lista de noticias

1. En el panel, haz clic en **"Noticias"**
2. Verás todas las noticias ordenadas por fecha (más recientes primero)

### Publicar una noticia nueva

1. Haz clic en **"Nueva noticia"**
2. Llena el formulario:

   | Campo | ¿Obligatorio? | Qué poner |
   |-------|---------------|-----------|
   | Título | ✅ Sí | "Estudiante gana premio nacional" |
   | Fecha | ✅ Sí | Fecha de publicación (por defecto: hoy) |
   | Autor | Opcional | "AEFN" (por defecto) o el nombre del autor |
   | Categoría | Opcional | Elige del menú desplegable |
   | Resumen corto | Opcional | 1-2 frases que aparecen en la lista |
   | Contenido completo | ✅ Sí | El texto completo de la noticia |
   | Etiquetas | Opcional | Palabras clave (ej: "premio", "estudiantes") |
   | Mostrar como destacada ⭐ | Opcional | La muestra grande en la página principal |
   | Publicada | Opcional | Si no la marcas, queda como borrador |

3. Haz clic en **"Guardar noticia"**

> 💡 **Sobre la imagen:** Primero guarda la noticia. Luego edítala para subir la imagen.

### Escribir el contenido en Markdown

El contenido de la noticia se escribe en **Markdown**, un formato simple:

| Si escribes... | Se ve como... |
|----------------|---------------|
| `**texto en negrita**` | **texto en negrita** |
| `*texto en cursiva*` | *texto en cursiva* |
| `## Subtítulo` | Subtítulo grande |
| `### Sub-subtítulo` | Subtítulo más pequeño |
| `- elemento 1`<br>`- elemento 2` | • elemento 1<br>• elemento 2 |
| `1. primer elemento`<br>`2. segundo elemento` | 1. primer elemento<br>2. segundo elemento |
| `[texto del enlace](https://ejemplo.com)` | [texto del enlace](https://ejemplo.com) |
| `> Cita textual` | > Cita textual |

### Marcar una noticia como "Destacada"

La noticia destacada aparece **grande** en la página principal de noticias (`/noticias`).

1. Al crear o editar la noticia, marca la casilla **"Mostrar como destacada ⭐"**
2. Guarda

> 💡 Solo puede haber **una** noticia destacada a la vez. Si marcas una nueva, la anterior se desmarca automáticamente.

### Subir la imagen de una noticia

1. Edita la noticia (botón "Editar")
2. Arriba verás la sección **"Imagen principal"**
3. Haz clic en **"Subir imagen"**
4. Selecciona la imagen
5. Espera a que se optimice y suba

**Recomendaciones:**
- Usa imágenes con proporción 16:9 (paisaje) para que se vean bien
- Resolución mínima recomendada: 1200×675 píxeles
- Formato: JPG, PNG o WebP
- La imagen se optimiza automáticamente a 1200px de ancho

### Guardar como borrador

Si quieres redactar una noticia pero no publicarla todavía:

1. Crea la noticia normalmente
2. **Desmarca** la casilla "Publicada"
3. Guarda

La noticia existirá en el panel admin pero **no se mostrará** en el sitio público hasta que la marques como "Publicada".

---

## 6. Administrar Eventos

### Agregar un evento

1. En el panel, haz clic en **"Eventos"** → **"Agregar"**
2. Llena el formulario:

   | Campo | Qué poner |
   |-------|-----------|
   | Título | "Asamblea General AEFN" |
   | Descripción | Detalles del evento |
   | Fecha | Fecha y hora (ej: "2025-09-02, 10:00") |
   | Ubicación | "ECFN - Yachay Tech" |
   | Tipo | Reunión, Seminario, Taller, Charla, Congreso, Otro |
   | Estado | Próximo, En curso, Finalizado, Cancelado |
   | Link | URL de Zoom/Meet si es virtual (opcional) |

3. Guarda

### Estados de un evento

- **Próximo** (verde): el evento aún no ha pasado
- **En curso** (amarillo): el evento está happening ahora
- **Finalizado** (gris): el evento ya terminó
- **Cancelado** (rojo): el evento se canceló

---

## 7. Administrar Clubes

### Agregar un club

1. Ve a **"Clubes"** → **"Agregar"**
2. Campos principales:
   - **Nombre:** "Club de Astronomía"
   - **Icono:** clase de Bootstrap Icons (ej: "bi-stars"). Puedes buscar iconos en https://icons.getbootstrap.com
   - **Descripción:** texto corto que aparece en la tarjeta
   - **Descripción larga:** texto completo
   - **Contacto email:** email del club

3. **Directiva:** lista de miembros con cargo, nombre y email
   - Clic en "Agregar" para añadir cada miembro
   - Puedes quitar con el botón ✕

4. **Actividades:** lista de actividades del club
   - Cada actividad tiene fecha, título y descripción

---

## 8. Administrar Galería

### Crear un álbum

1. Ve a **"Galería"** → **"Agregar"**
2. Campos:
   - **Album:** nombre del álbum ("Nano Gallery 2025")
   - **Category:** categoría libre ("Arte", "Evento", etc.)
   - **Date:** fecha del álbum
   - **Description:** descripción
   - **Photos:** lista de fotos

### Añadir fotos a un álbum

En el formulario del álbum, en la sección "Photos":

1. Clic en **"Agregar"**
2. Para cada foto:
   - **ID:** identificador único (ej: "foto-1")
   - **Title:** título de la foto
   - **Image:** ruta de la imagen (ej: "images/gallery/nanogal/1.png")
   - **Description:** descripción de la foto

> ⚠️ **Nota sobre imágenes:** Actualmente, las imágenes de la galería se suben manualmente al repositorio de GitHub (en la carpeta `images/gallery/`). El admin escribe la ruta en el formulario. Esta es una limitación que se mejorará en el futuro.

---

## 9. Administrar Investigación

El módulo de Investigación tiene **3 pestañas**: Grupos, Papers y Tesis.

### Grupos de investigación

Cada grupo tiene:
- Título, slug (identificador URL), descripción corta y larga
- Imagen (ruta)
- Participantes (lista con nombre y rol)
- Proyectos (lista con título y año)
- Email de contacto

### Papers (publicaciones científicas)

Cada paper tiene:
- Título
- Autores (lista)
- Año
- Resumen (abstract)
- Link al paper (URL)
- Publicado (sí/no)

### Tesis

Cada tesis tiene:
- Título
- Autor (estudiante)
- Año
- Resumen
- Link (si está disponible)
- Estado: "en curso" o "defendida"

---

## 10. Página de Créditos

La página `/creditos` muestra un agradecimiento a todas las personas que han colaborado.

### ¿Cómo añadir tu nombre?

Esta página **se edita directamente en el código** (no hay formulario). Para añadir un colaborador:

1. Ve al repositorio en GitHub: `github.com/aefnyt/web_aefn`
2. Abre el archivo `src/app/creditos/page.tsx`
3. Busca el array `COLABORADORES` (al inicio del archivo)
4. Añade un objeto siguiendo el formato:
   ```typescript
   {
     nombre: "Tu Nombre",
     rol: "Presidente AEFN 2025",
     periodo: "2025",
   },
   ```
5. Guarda los cambios (GitHub hará un commit)

> 💡 Si no sabes editar código en GitHub, pídelo al administrador. Es un cambio de 2 minutos.

---

## 11. Qué hacer si algo falla

### "No se pudieron cargar los datos"

**Causa:** Problema de conexión con GitHub o el servidor está reiniciándose.

**Solución:**
1. Espera 1-2 minutos
2. Recarga la página (F5)
3. Si persiste, avisa al administrador

### "GITHUB_TOKEN no está configurado"

**Causa:** El token de GitHub expiró o no se configuró bien.

**Solución:** Avísa al administrador. Él debe:
1. Generar un nuevo PAT en GitHub
2. Actualizarlo en Vercel → Settings → Environment Variables
3. Hacer redeploy

### "No tienes permiso para editar"

**Causa:** Tu clave no tiene permiso para ese módulo.

**Solución:** Verifica que estás usando la clave correcta. Si necesitas acceso a otro módulo, pídelo al administrador.

### La página se quedó cargando

**Solución:**
1. Cierra la pestaña
2. Ábrela de nuevo
3. Vuelve a ingresar tu clave

### Hice un cambio y no se ve en el sitio público

**Causa:** Vercel tarda ~30 segundos en actualizar después de un commit.

**Solución:**
1. Espera 1 minuto
2. Recarga la página pública con `Ctrl + Shift + R` (o `Cmd + Shift + R` en Mac) para forzar la recarga

### Cometí un error y quiero deshacerlo

**Buenas noticias:** Todos los cambios se guardan en el historial de GitHub.

1. Avisa al administrador
2. Él puede revertir cualquier cambio desde GitHub:
   - Ve al repositorio en GitHub
   - Clic en "Commits"
   - Encuentra el commit que quieres revertir
   - Clic en "..." → "Revert"

---

## 12. Preguntas Frecuentes

### ¿Puedo editar desde el celular?

Sí, el panel admin es responsive (se adapta a móviles). Pero para una experiencia más cómoda, recomendamos usar una computadora, especialmente para subir imágenes.

### ¿Las claves caducan?

Las claves no caducan, pero el PAT de GitHub sí (cada 90 días). Cuando el PAT caduca, el administrador debe renovarlo. Las claves de acceso siguen funcionando igual.

### ¿Pueden varias personas editar al mismo tiempo?

Sí, pero con cuidado. Si dos personas editan el mismo profesor al mismo tiempo, la segunda en guardar recibirá un error (el SHA no coincide). Simplemente recarga y vuelve a intentarlo.

### ¿Dónde se guardan las imágenes que subo?

Las imágenes se guardan en el repositorio de GitHub, en las carpetas:
- `images/profesores/` — fotos de profesores (WebP)
- `images/noticias/` — imágenes de noticias (WebP)

Se optimizan automáticamente antes de subirse (redimensionadas + convertidas a WebP).

### ¿Puedo ver quién hizo cada cambio?

Sí. Todos los cambios generan un commit en GitHub con:
- Autor (la cuenta de GitHub configurada)
- Fecha y hora
- Mensaje descriptivo (ej: "Add profesor: Dr. Juan Pérez")
- Diff (qué cambió exactamente)

Ve a `github.com/aefnyt/web_aefn/commits/main` para ver el historial.

### ¿Qué pasa si se borra algo por accidente?

No hay problema. GitHub guarda el historial completo. El administrador puede restaurar cualquier versión anterior desde el historial de commits.

### ¿Necesito internet para administrar el sitio?

Sí. Tanto el panel admin como la API requieren conexión a internet.

### ¿El sitio funciona sin GitHub?

No. GitHub es donde se guardan los datos. Si GitHub cae, el sitio sigue mostrándose (por caché de Vercel), pero no se pueden hacer ediciones.

---

## 📞 Contacto

Si tienes problemas o preguntas que no están en este manual:

- **Email:** decanatoecfn@yachaytech.edu.ec
- **Instagram:** @aefn_yt
- **Repositorio:** github.com/aefnyt/web_aefn

---

*Manual actualizado: Diciembre 2025*
