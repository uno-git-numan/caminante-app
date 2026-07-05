# PLAN — Pre-llenado con IA del formulario de experiencia

> **Para quien ejecute esto** (cualquier sesión/modelo): lee primero `CLAUDE.md` del repo.
> Reglas duras que aplican aquí: nunca tocar `main`; `git fetch` antes de push; deploy =
> push a `deploy/caminante-site` → preview de Vercel → Promote con OK de Luis; los
> secretos los pega LUIS (jamás escribir la API key en código/commits); regla de
> producto: **el formulario CREA, el dashboard opera** — la IA solo PRE-LLENA el
> formulario, el humano revisa y guarda. Al terminar: documentar (CLAUDE.md + memoria)
> y BORRAR este archivo (regla de sistema limpio).

## Objetivo

En `/caminante/admin/experiencias/nueva`, una sección **"Pre-llenar con IA"**: el admin
sube el itinerario del operador (PDF), brochures, imágenes o texto suelto + indicaciones
opcionales → Claude devuelve la experiencia con la forma EXACTA del formulario
(`Experience` de `src/lib/experiences/types.ts`, solo campos de texto) + salidas
sugeridas → el formulario se llena → Luis revisa, ajusta fotos y guarda como siempre.

## Prerrequisito (Luis — PENDIENTE al escribir esto)

- Cuenta de API creada (org NUMAN HUB en console.anthropic.com) ✅, key `caminante-prellenar` creada ✅.
- **Luis pega la key** (Claude no maneja secretos):
  1. `~/dev/caminante-app/.env.local` → línea `ANTHROPIC_API_KEY=sk-ant-…`
  2. Vercel → proyecto caminante-app → Settings → Environment Variables →
     `ANTHROPIC_API_KEY` en **Production y Preview** (preview hace falta para probar antes de promover).
  3. Cargar saldo en Billing (~$5 USD alcanza para ~20-40 pre-llenados).
- Nota de higiene: la key se pegó una vez en un chat; si Luis quiere máxima limpieza,
  puede regenerarla en la console cuando el flujo ya esté probado (es un click, se
  actualiza en los dos lugares del paso anterior).

## Estado al escribir este plan

- Worktree de trabajo: `~/dev/caminante-app-notif` (rama `wip/notify-reservas`, basada
  en `deploy/caminante-site`; los features anteriores de esa rama ya están promovidos).
- **Ya existe (revisar, no re-crear):** `src/lib/ai/prellenar.ts` — esquema JSON de
  salida + llamada a la API. Decisiones ya tomadas ahí:
  - Modelo `claude-opus-4-8`, `thinking: adaptive`, `output_config: { effort: "medium",
    format: json_schema }` → salida estructurada garantizada, sin parseo frágil.
  - HTTP directo con `fetch` (SIN `@anthropic-ai/sdk`): es una sola llamada POST y el
    shell sandboxeado de esta máquina no puede correr npm/node (ver Gotchas). Si el uso
    crece, migrar al SDK.
  - El prompt del sistema lleva la voz de marca ("científico-poeta"), la regla de "sin
    fechas/conteos en el copy" y la instrucción de NO inventar datos logísticos
    (faltantes → vacío + explicación en `notas`).
  - Salida: `{ data: Partial<Experience> solo-texto, slots: [{label, startDate,
    endDate, capacity}], notas: string }`. Sin URLs de imagen (fotos = manuales).

## Pasos de ejecución

### 1. Endpoint admin — `src/app/caminante/api/admin/prellenar/route.ts`
- `POST` multipart/form-data: campo `files` (múltiple) + campo `notas` (texto opcional).
- `export const runtime = "nodejs"; export const maxDuration = 60;`
- Gate: `isCurrentUserAdmin()` (de `@/lib/auth/authorization`) → 401 si no. Igual que
  el resto del admin: el gate del layout NO cubre routes, se re-verifica adentro.
- Tipos aceptados: `application/pdf`, `image/png|jpeg|webp|gif`, `text/plain`, `.md`.
  DOCX NO (la API no lo acepta nativo) → error claro: "Exporta el Word a PDF".
- **Límite 4 MB total** (Vercel corta el body en ~4.5 MB — ver Gotchas). Validar y
  devolver error amable si se pasa.
- Convierte archivos a base64 → `prellenarExperiencia(archivos, notas)` → devuelve el
  JSON `{ok, result|error}` tal cual.

### 2. Panel en el formulario — `src/app/caminante/admin/experiencias/PrellenarIA.tsx`
- Client component chico: input de archivos (multiple) + textarea "Indicaciones para la
  IA (opcional)" + botón "Pre-llenar con IA" + estado (spinner "Leyendo documentos…",
  error, éxito). Al éxito muestra las `notas` de la IA (qué faltó/asumió) en un aviso.
- Estilo: mismo lenguaje visual del form (Tailwind con tokens de marca: cream/lagoon/
  olive/sand/orange, bordes `border-sand`, radios 2xl). Botón principal glassy/orange
  como los del form.
- Props: `onResult(data, slots, notas)` — el estado vive en ExperienceForm.

### 3. Integración en `src/app/caminante/admin/experiencias/ExperienceForm.tsx`
- Render de `<PrellenarIA/>` arriba del todo, SOLO en modo crear (`!initial`) — en
  edición no tiene sentido pisar contenido curado (si algún día se quiere, decisión de Luis).
- Merge NO destructivo `aplicarPrellenado(prev, data)`:
  - Solo asigna campos cuyo valor de la IA venga no-vacío (string con contenido /
    array con elementos). Nunca pisa con vacío lo que el admin ya tecleó.
  - Mapeos especiales: `waiverClauses` → `registration.waiverClauses` (sin activar
    `registration.active` — eso lo decide Luis); `feedbackLocationLabel` +
    `feedbackSections` → `feedback.*`; `price` → objeto `price` del form;
    `datesBadge` → `datesBadge`.
  - `slots`: mapear a `SlotRow` del form → `{label, start: startDate+"T08:00",
    end: endDate+"T18:00", cupo: capacity}`. Si el form no tiene salidas capturadas,
    reemplaza; si ya hay, agrega al final (sin duplicar labels).
- Tras aplicar: status del form = "Pre-llenado con IA — revisa antes de guardar".

### 4. Verificación (SIN node local — ver Gotchas)
- El gate real es el **build del preview de Vercel** (corre tsc + eslint completos):
  commit → `git fetch` → push a `deploy/caminante-site` → esperar preview READY.
- Prueba E2E en el preview (necesita la key en env de Preview): entrar como admin a
  `/caminante/admin/experiencias/nueva`, subir un PDF real del itinerario de la
  siguiente experiencia de Luis, verificar que el form se llena coherente, guardar
  como BORRADOR (no publicar), revisar en `/caminante/admin/eventos` que el draft
  existe con sus salidas. Borrar el draft de prueba si fue con datos dummy
  (`setExperienceStatus`/SQL NO — usar el propio panel; los drafts sí se pueden dejar).
- JAMÁS probar publicando: hay clientes reales comprando en el sitio.

### 5. Deploy + cierre
- Promote a producción **con OK explícito de Luis** (el clasificador lo exige y es la regla).
- Documentar: sección nueva en `CLAUDE.md` ("Pre-llenado con IA del form de
  experiencia") + actualizar memoria (`caminante-dashboard-admin` o nota nueva:
  modelo usado, costo aprox por uso, dónde vive la key, límite 4MB, DOCX no).
- Borrar `PLAN-prellenar-ia.md` (este archivo) en el commit de cierre.
- Marcar tarea #29 como completed.

## Gotchas para el ejecutor

1. **node/npm/tsc CUELGAN en el shell sandboxeado de Claude en esta máquina** (hasta
   `node -e` se congela; visto 4 jul 2026). No pierdas tiempo: usa el build del preview
   de Vercel como verificador de tipos/lint.
2. **Límite de body en Vercel: ~4.5 MB.** Por eso el límite de 4 MB en el endpoint. Los
   itinerarios en PDF suelen pesar <1 MB; los brochures con fotos pueden pasarse —
   el error debe decirlo claro ("quita fotos del PDF o súbelo comprimido").
3. **Structured outputs:** todos los objetos del esquema llevan `additionalProperties:
   false` y `required` completo (ya está así en `prellenar.ts`). No usar `minLength`/
   `maximum` (no soportados).
4. **`stop_reason: "refusal"`** puede venir con HTTP 200 — ya manejado en
   `prellenar.ts`; no leer `content[0]` sin revisar `stop_reason`.
5. **La primera llamada con el esquema tarda más** (compilación del schema, se cachea
   24h). Si el preview da timeout en la primera prueba, reintentar antes de debuggear.
6. **Rama compartida**: otras sesiones (bot de WhatsApp, CFDI) empujan a
   `deploy/caminante-site`. `git fetch` + merge --ff-only antes de push; al promover se
   promueve el tip integrado (puede llevar trabajo de otras sesiones — verificar que
   sus previews estén verdes antes del Promote).

## Fuera de alcance (no hacer sin pedirlo Luis)

- Generación/selección de fotos con IA.
- Pre-llenado en modo edición de experiencias existentes.
- Bot de WhatsApp con IA (usa la misma cuenta de API, pero es otro proyecto y otra key).
