# 🚀 Guía de Despliegue — AEFN en Vercel

> Paso a paso para desplegar el sitio web de la AEFN en Vercel (gratis) y configurar todo correctamente.

---

## 📋 Tabla de Contenidos

1. [Resumen](#1-resumen)
2. [Requisitos previos](#2-requisitos-previos)
3. [Paso 1: Crear el PAT de GitHub](#paso-1-crear-el-pat-de-github)
4. [Paso 2: Crear cuenta en Vercel](#paso-2-crear-cuenta-en-vercel)
5. [Paso 3: Conectar el repositorio](#paso-3-conectar-el-repositorio)
6. [Paso 4: Configurar variables de entorno](#paso-4-configurar-variables-de-entorno)
7. [Paso 5: Primer despliegue](#paso-5-primer-despliegue)
8. [Paso 6: Verificar que todo funciona](#paso-6-verificar-que-todo-funciona)
9. [Cómo actualizar el sitio en el futuro](#cómo-actualizar-el-sitio-en-el-futuro)
10. [Cómo administrar las claves de acceso](#cómo-administrar-las-claves-de-acceso)
11. [Cómo volver a desplegar](#cómo-volver-a-desplegar)
12. [Dominio personalizado (opcional)](#dominio-personalizado-opcional)
13. [Solución de problemas](#solución-de-problemas)

---

## 1. Resumen

Esta guía te lleva desde cero hasta tener el sitio web de la AEFN funcionando en internet, gratis, con:

- ✅ Sitio público accesible 24/7
- ✅ Panel de administración funcional
- ✅ HTTPS automático (candado verde en el navegador)
- ✅ CDN global (carga rápida desde cualquier país)
- ✅ Commits automáticos a GitHub cuando editas contenido

**Tiempo estimado:** 30-45 minutos

---

## 2. Requisitos previos

Antes de empezar necesitas:

1. **Una cuenta de GitHub** con acceso al repositorio `aefnyt/web_aefn`
   - Si no tienes acceso, pídelo al administrador actual
2. **El código del proyecto** ya subido a ese repositorio
   - (Si estás leyendo esto, probablemente ya está hecho)
3. **10 minutos** para crear el PAT de GitHub
4. **20 minutos** para configurar Vercel

> 💡 No necesitas instalar nada en tu computadora. Todo se hace desde el navegador.

---

## Paso 1: Crear el PAT de GitHub

El **Personal Access Token (PAT)** es como una contraseña que permite que Vercel (nuestro servidor) hable con GitHub para guardar los cambios que hagas desde el panel admin.

### 1.1 Ve a la configuración de GitHub

1. Inicia sesión en GitHub con la cuenta de la asociación (`aefnyt`)
2. Ve a: **https://github.com/settings/personal-access-tokens/new**
   - (O: clic en tu foto de perfil → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token)

### 1.2 Llena el formulario

| Campo | Valor |
|-------|-------|
| **Token name** | `AEFN Web Editor` |
| **Expiration** | `90 days` (recomendado) |
| **Resource owner** | `aefnyt` (la cuenta de la asociación) |
| **Repository access** | Selecciona **"Only select repositories"** → marca `aefnyt/web_aefn` |
| **Repository permissions** → **Contents** | `Read and write` ⚠️ (esto es lo que permite leer y modificar los JSON) |
| **Repository permissions** → todo lo demás | Déjalo en `No access` (por seguridad) |

### 1.3 Genera y copia el token

1. Haz clic en **"Generate token"**
2. **¡Copia el token AHORA!** Se ve así: `github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxx...`
3. Guárdalo en un lugar seguro (gestor de contraseñas, nota encriptada)

> ⚠️ **CRÍTICO:** GitHub NO te volverá a mostrar el token. Si lo pierdes, tendrás que crear uno nuevo.
> 
> 🚫 **NUNCA** pegues el token en un chat, email, o archivo de código. Trátalo como una contraseña bancaria.

### 1.4 ¿Qué hacer cuando el token expire (en 90 días)?

GitHub te enviará un email antes de que expire. Cuando eso pase:

1. Repite los pasos 1.1 a 1.3 para crear un token nuevo
2. Ve a Vercel → Settings → Environment Variables → edita `GITHUB_TOKEN`
3. Pega el nuevo token
4. Haz redeploy (ver sección 11)

---

## Paso 2: Crear cuenta en Vercel

### 2.1 Ve a Vercel

1. Abre **https://vercel.com**
2. Haz clic en **"Sign Up"** (arriba a la derecha)

### 2.2 Regístrate con GitHub

1. Haz clic en **"Continue with GitHub"**
2. Autoriza a Vercel a acceder a tu cuenta de GitHub
3. Completa tu perfil si te lo pide

> 💡 Usar la cuenta de GitHub de la asociación (`aefnyt`) es lo recomendable, así el proyecto pertenece a la organización, no a una persona.

### 2.3 Verifica tu email

Vercel te enviará un email de confirmación. Haz clic en el enlace para verificar tu cuenta.

---

## Paso 3: Conectar el repositorio

### 3.1 Importa el proyecto

1. En el dashboard de Vercel, haz clic en **"Add New..."** → **"Project"**

2. Verás una lista de tus repositorios de GitHub. Busca `aefnyt/web_aefn`

3. Si no lo ves:
   - Haz clic en **"Adjust GitHub App Permissions"**
   - Autoriza a Vercel a acceder al repositorio `aefnyt/web_aefn`
   - Vuelve a la lista y búscalo

4. Haz clic en **"Import"** al lado del repositorio

### 3.2 Configura el proyecto

Vercel detectará automáticamente que es un proyecto Next.js. Verás una pantalla de configuración:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Next.js (debe detectarse automáticamente) |
| **Root Directory** | `./` (dejarlo así) |
| **Build Command** | `next build` (dejarlo así) |
| **Output Directory** | (dejarlo en blanco, Vercel lo maneja) |
| **Install Command** | (dejarlo en blanco, Vercel detecta `bun` o `npm` automáticamente) |

> ⚠️ **NO hagas clic en "Deploy" todavía.** Primero necesitamos configurar las variables de entorno (siguiente paso).

---

## Paso 4: Configurar variables de entorno

Esta es la parte más importante. Aquí configuramos las claves secretas que el backend necesita.

### 4.1 Abre la sección de Environment Variables

En la misma pantalla de configuración (antes de desplegar), busca la sección **"Environment Variables"**.

### 4.2 Añade `GITHUB_TOKEN`

1. Clic en **"Add"**
2. Llena:

   | Campo | Valor |
   |-------|-------|
   | **Key** | `GITHUB_TOKEN` |
   | **Value** | Pega aquí el token que copiaste en el Paso 1 (empieza con `github_pat_`) |
   | **Environment** | Marca **Production**, **Preview**, y **Development** |

3. Haz clic en **"Add"**

### 4.3 Añade `ACCESS_KEYS`

Esta variable contiene las 7 claves de acceso al panel admin.

1. Clic en **"Add"** otra vez
2. Llena:

   | Campo | Valor |
   |-------|-------|
   | **Key** | `ACCESS_KEYS` |
   | **Value** | Pega el JSON de abajo (cambiando las claves por unas seguras) |
   | **Environment** | Marca las 3 casillas |

3. El **Value** debe ser exactamente este formato (una sola línea):

```json
{"admin":"CAMBIA-ESTA-CLAVE-ADMIN","profesores":"CAMBIA-ESTA-CLAVE-PROF","eventos":"CAMBIA-ESTA-CLAVE-EVENTOS","grupos":"CAMBIA-ESTA-CLAVE-GRUPOS","noticias":"CAMBIA-ESTA-CLAVE-NOTICIAS","clubes":"CAMBIA-ESTA-CLAVE-CLUBES","galeria":"CAMBIA-ESTA-CLAVE-GALERIA"}
```

> ⚠️ **IMPORTANTE:** Cambia cada `CAMBIA-ESTA-CLAVE-XXX` por una clave real. Recomendaciones:
> - Mínimo 12 caracteres
> - Mezcla letras, números y símbolos
> - Ejemplo: `aefn-admin-2025-Xk7$mP9!`
> - **NO uses las claves de ejemplo del código** (`admin2025`, etc.) — son inseguras

4. Haz clic en **"Add"**

### 4.4 Verifica que las 2 variables están añadidas

Deberías ver en la lista:
- `GITHUB_TOKEN` ✓
- `ACCESS_KEYS` ✓

---

## Paso 5: Primer despliegue

### 5.1 Despliega

1. Haz clic en el botón **"Deploy"** (abajo de todo)

2. Verás una pantalla con un animation mientras Vercel:
   - Clona el repositorio
   - Instala dependencias
   - Compila el proyecto
   - Lo despliega a servidores globales

3. Esto tarda **2-5 minutos**. Sé paciente.

### 5.2 ¡Felicitaciones! 🎉

Cuando termine, verás:
- Un mensaje de "Congratulations!"
- Una URL como `https://web-aefn.vercel.app` (o similar)
- Un confeti animado

### 5.3 Visita tu sitio

1. Haz clic en la URL para abrir tu sitio
2. Verifica que la página principal carga correctamente
3. Ve al footer y haz clic en **"Administración"**
4. Ingresa una de las claves que configuraste
5. ¡Deberías ver el panel de administración!

---

## Paso 6: Verificar que todo funciona

### 6.1 Test del sitio público

- [ ] La página principal carga (`/index.html`)
- [ ] Las páginas de profesores, clubes, etc. cargan
- [ ] La página `/noticias` muestra las noticias
- [ ] La página `/creditos` muestra los créditos

### 6.2 Test del panel admin

- [ ] Puedes entrar a `/admin` con tu clave
- [ ] Ves el dashboard con los módulos
- [ ] Puedes navegar a un módulo (ej: Profesores)
- [ ] Ves la lista de registros existentes

### 6.3 Test de edición (¡importante!)

1. Ve a **Profesores** → **Agregar**
2. Crea un profesor de prueba (nombre: "Test", título: "Test")
3. Haz clic en **Guardar**
4. Si todo está bien configurado, verás un mensaje de éxito ✅
5. Ve a GitHub → `github.com/aefnyt/web_aefn/commits/main`
6. Deberías ver un commit que dice "Add profesor: Test"

> ✅ Si ves el commit en GitHub, ¡todo funciona perfectamente!
> 
> ❌ Si ves un error "GITHUB_TOKEN no está configurado", revisa el Paso 4.
> 
> ❌ Si ves "Bad credentials", tu PAT puede estar mal copiado o expirado.

### 6.4 Limpia el profesor de prueba

1. Vuelve a Profesores en el panel admin
2. Elimina el profesor "Test" que creaste
3. Verifica que el commit de eliminación aparece en GitHub

---

## Cómo actualizar el sitio en el futuro

Hay dos tipos de actualizaciones:

### A. Actualizar contenido (noticias, profesores, etc.)

**No necesitas hacer nada especial.** Solo entra al panel admin y edita. Los cambios se guardan automáticamente en GitHub.

### B. Actualizar código (nuevas funciones, correcciones de bugs)

Si alguien modifica el código del proyecto (no el contenido), Vercel detecta el cambio y **redespliega automáticamente**. No necesitas hacer nada.

1. Los cambios se suben a GitHub (vía `git push` o editando directamente en GitHub)
2. Vercel detecta el push
3. Vercel construye y despliega la nueva versión automáticamente
4. En 2-3 minutos, el sitio está actualizado

> 💡 Puedes ver el estado de los despliegues en Vercel → tu proyecto → pestaña "Deployments"

---

## Cómo administrar las claves de acceso

### Cambiar una clave existente

1. Ve a Vercel → tu proyecto → **Settings** → **Environment Variables**
2. Busca `ACCESS_KEYS`
3. Haz clic en el lápiz (edit)
4. Modifica el JSON con las nuevas claves
5. Guarda
6. **Importante:** Haz clic en **"Redeploy"** para que el cambio tome efecto
   - Ve a la pestaña "Deployments"
   - Clic en los 3 puntos del último deployment
   - Clic en "Redeploy"

### Añadir una clave nueva

Si en el futuro quieres añadir una nueva clave para un módulo nuevo:

1. Edita `ACCESS_KEYS` en Vercel
2. Añade el par `"modulo-nuevo": "clave-nueva"` al JSON
3. Redeploy

> ⚠️ Siempre haz **Redeploy** después de cambiar variables de entorno. Si no, el cambio no toma efecto.

---

## Cómo volver a desplegar

A veces necesitas forzar un redeploy sin cambiar código (por ejemplo, después de actualizar variables de entorno).

### Opción A: Desde Vercel

1. Ve a Vercel → tu proyecto → pestaña **"Deployments"**
2. Busca el último deployment (arriba del todo)
3. Haz clic en los **3 puntos** a la derecha
4. Selecciona **"Redeploy"**
5. Confirma

### Opción B: Desde GitHub (vacío commit)

Si prefieres usar Git:

```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

Esto hace un commit vacío que dispara el redespliegue automático.

---

## Dominio personalizado (opcional)

Por defecto, tu sitio estará en `algo.vercel.app`. Si quieres un dominio propio (ej: `aefn.yachaytech.edu.ec`):

### 1. Comprar/obtener el dominio

- Si es un subdominio de yachaytech.edu.ec, habla con el administrador de la universidad
- Si es un dominio propio (~$12/año), puedes comprarlo en Namecheap, GoDaddy, etc.

### 2. Añadirlo en Vercel

1. Ve a Vercel → tu proyecto → **Settings** → **Domains**
2. Escribe tu dominio (ej: `aefn.yachaytech.edu.ec`)
3. Haz clic en **"Add"**
4. Vercel te dará instrucciones sobre qué registros DNS configurar

### 3. Configurar DNS

Ve al panel de tu dominio y añade los registros que Vercel te indica. Generalmente:
- Un registro `CNAME` que apunte a `cname.vercel-dns.com`
- O un registro `A` que apunte a `76.76.21.21`

### 4. Esperar

Los cambios de DNS tardan de unos minutos a 24 horas en propagagarse. Vercel te avisará cuando el dominio esté activo.

---

## Solución de problemas

### "Build Failed" en Vercel

**Causa:** Hay un error en el código.

**Solución:**
1. Ve a Vercel → Deployments → clic en el deployment fallido
2. Lee los logs de error
3. Si no entiendes el error, pídelo a un desarrollador

### El sitio carga pero las APIs dan error 500

**Causa:** Las variables de entorno no están bien configuradas.

**Solución:**
1. Verifica que `GITHUB_TOKEN` y `ACCESS_KEYS` están en Vercel → Settings → Environment Variables
2. Verifica que el `GITHUB_TOKEN` no haya expirado (GitHub → Settings → Personal access tokens)
3. Si el token expiró, crea uno nuevo, actualízalo en Vercel, y haz redeploy

### "Bad credentials" al intentar guardar

**Causa:** El PAT de GitHub es inválido o expiró.

**Solución:**
1. Ve a GitHub → Settings → Personal access tokens
2. Verifica que el token sigue activo
3. Si expiró, crea uno nuevo (Paso 1 de esta guía)
4. Actualízalo en Vercel → Settings → Environment Variables → `GITHUB_TOKEN`
5. Redeploy

### El panel admin me dice "Clave inválida"

**Causa:** La clave que ingresaste no coincide con la configurada en `ACCESS_KEYS`.

**Solución:**
1. Ve a Vercel → Settings → Environment Variables → `ACCESS_KEYS`
2. Verifica que la clave que estás usando coincide exactamente
3. Si necesitas cambiarla, edítala y haz redeploy

### Los cambios no se reflejan en el sitio público

**Causa:** Vercel tarda ~30 segundos en redesplegar después de un commit.

**Solución:**
1. Espera 1 minuto
2. Recarga la página con `Ctrl + Shift + R` (o `Cmd + Shift + R` en Mac)
3. Si aún no se ve, revisa Vercel → Deployments para ver si hay un deploy en curso

### Las imágenes no cargan

**Causa:** Puede ser problema de caché o de la optimización.

**Solución:**
1. Recarga la página con `Ctrl + Shift + R`
2. Si persiste, abre la consola del navegador (F12) y mira los errores
3. Si ves errores 404, la imagen no se subió correctamente a GitHub

### Vercel dice "Function Timeout"

**Causa:** La API de GitHub tardó demasiado en responder.

**Solución:**
1. Reintenta la operación (suele ser temporal)
2. Si persiste, puede que GitHub esté lento. Espera unos minutos

---

## 📞 Ayuda

Si tienes problemas que no están en esta guía:

1. **Revisa los logs de Vercel:** Deployments → clic en el deployment → "Build Logs" o "Runtime Logs"
2. **Revisa los logs de GitHub:** Settings → Personal access tokens → verifica que el token no expiró
3. **Pide ayuda:** decanatoecfn@yachaytech.edu.ec

---

## ✅ Checklist final

Antes de considerar el despliegue completo, verifica:

- [ ] El sitio público carga en `https://tu-sitio.vercel.app`
- [ ] El panel admin carga en `/admin`
- [ ] Puedes hacer login con tu clave
- [ ] Puedes crear/editar/eliminar un profesor
- [ ] Puedes crear/editar/eliminar una noticia
- [ ] Puedes subir una foto de profesor
- [ ] Puedes subir una imagen de noticia
- [ ] Los commits aparecen en GitHub
- [ ] Las claves son seguras (mínimo 12 caracteres)
- [ ] El PAT de GitHub tiene fecha de expiración registrada en tu calendario (90 días)

¡Todo listo! 🎉

---

*Guía actualizada: Diciembre 2025*
