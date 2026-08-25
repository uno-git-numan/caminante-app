---
paths:
  - "src/middleware.ts"
  - "src/lib/auth/**"
  - "src/lib/supabase/server.ts"
  - "src/app/caminante/auth/**"
  - "src/app/caminante/login/**"
  - "src/app/caminante/signup/**"
  - "scripts/invariantes.mjs"
---

# Sesión, auth y el guardián de invariantes

## Antes de tocar nada aquí: `npm run verificar`

`scripts/invariantes.mjs` corre en **cada build** (`prebuild`) y **tumba el deploy**
si se rompe alguna de sus 8 reglas. **Cada regla nació de un incidente real** y el
mensaje de error explica cuál, para que quien lo vea en un build fallido entienda
por qué existe sin venir aquí.

`node scripts/invariantes.mjs --autoprueba` verifica que las reglas de verdad
detectan lo que dicen. Un guardián callado no sirve de nada.

## Los incidentes que las produjeron

**El middleware vivía en la RAÍZ con el código en `src/`.** Next lo ignora **sin un
solo warning**, así que nunca corrió — y su único trabajo es `updateSession`, o sea
refrescar la cookie de Supabase en cada request. Sin eso el token caduca sin
reemplazo hasta pudrirse. Resultado en el iPhone de Luis: «Application error» en la
home y login imposible **aunque el enlace mágico fuera recién pedido**, porque
`getUser()` **lanza** en vez de devolver `{error}` y nadie lo atrapaba.

Prueba de que ya corre: el alias `caminante-app.vercel.app` por fin responde **308**
al dominio canónico — ese redirect llevaba meses escrito sin ejecutarse jamás.

⚠️ **Diagnóstico equivocado que costó horas:** primero se culpó al caché, luego a un
commit, por un bisect que «arregló» la home. Era **correlación**: el crash depende
de si el access token ya venció en ese instante, no del build. **Con un síntoma que
solo aparece en el dispositivo del usuario, ir a los logs del servidor ANTES de
bisectar.**

**`createSupabaseServerClient` DEBE envolver `setAll` en try/catch.** Al refrescar
el token, `@supabase/ssr` intenta escribir la cookie en un Server Component
(solo-lectura) → excepción → **500 para usuarios logueados en TODA página de
`/caminante`**. Anónimos veían 200, por eso curl no lo detectaba. **No quites el
try/catch.**

**El middleware no se mete con `/caminante/auth/`**: se llevaba el verificador de
PKCE. Y `cookiesDeSesion` nunca borra la cookie `-code-verifier`.

**El panel móvil tiene que seguir alcanzable** (regla 8): nav → `/entrar`, el
**índice** del panel redirige al panel-app en teléfono, y el panel-app conserva su
salida `?escritorio=1`. Se rompió dos veces en un día.

## Reglas del dominio

**Nadie se auto-nombra admin.** El rol es **derivado**, y desde el 24 ago son TRES:

| rol | de dónde sale |
|---|---|
| `admin` (la casa) | `admin_whitelist.is_active` |
| `operador` | `operators.panel_activo` (0042) |
| `caminante` | sesión que no es ninguno de los dos |

**La casa manda**: la whitelist gana sobre `operators`. La fila «Numan ·
Caminante» trae el correo de Luis y sin esa precedencia entraría a su propio
panel filtrado a sí mismo.

⚠️ **`operators` tiene RLS que solo expone las filas `is_public = true`.** Por eso
la consulta que resuelve el rol va con el cliente de SERVICIO, no con el de la
sesión: un operador en pausa como perfil (Kéntro) no aparecía y el rol caía a
«caminante» — quedaba fuera de su propio panel sin un solo error, solo un
`?error=not_admin` en la home.

**El panel del operador tiene DOS cerrojos** (ver `design/panel-operador/`):
la lista blanca de rutas (`lib/auth/panel-operador.ts`, evaluada en el layout
contra la cabecera `x-ruta` del middleware) y el alcance de cada consulta
(`lib/auth/alcance.ts`). El alcance de un operador son **sus experiencias**, y de
ahí cuelga todo. La poda se aplica justo después de traer las filas y antes de la
primera agregación.

**Cada server action re-verifica.** El gate del layout NO cubre actions invocadas
directo. `isCurrentUserAdmin()` significa **«la casa»** y eso no se toca: lo
llaman dos docenas de actions, y hacerle significar «puede entrar al panel» las
abriría todas de golpe. Para lo que un operador SÍ puede tocar están
`puedeEditarSlug` / `puedeEditarExperiencia` / `puedeEditarSlot`, que resuelven
contra la BASE con el id que llega — nunca contra un campo del formulario, porque
esos ids viajan en `<input hidden>` y cambiarlos es abrir el inspector.

⚠️ **Podar la consulta principal de una pantalla NO basta**: hay que recorrer
todas las que dispara, y también lo que puede disparar. La Encuesta hace tres
consultas; con dos podadas seguía enseñando el correo de un cliente de la casa.

**El admin no compra**: `/reservar` y `/registro` lo rebotan. (Ojo al verificar:
por eso esas vistas no se pueden ver con sesión de admin.)

## Olfatear el user-agent

**PROHIBIDO en páginas públicas** — el sitio móvil se resuelve con CSS, y olfatear
rompería el caché de Vercel. Solo es admisible donde la ruta es `force-dynamic`
**y** lo único que se decide es a dónde redirigir, no qué HTML emitir
(`lib/ui/dispositivo.ts`). Las tablets van a escritorio a propósito.

## Gotchas de configuración

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` mal puesta = rebote del admin **sin
  `?error=`**. GoTrue tolera un apikey inválido, PostgREST no → la consulta a
  `admin_whitelist` falla → `isCurrentUserAdmin()` da false.
- **Google OAuth se inicia en una server action**, no en el cliente: si no,
  `exchangeCodeForSession` falla con «PKCE code verifier not found in storage».
- Para probar login sin correo (Gmail pre-consume los magic links):
  `supabase.auth.admin.generateLink({type:'magiclink', email})` y abrir el
  `/auth/confirm?token_hash=…` directo.
- **Vercel captura las env vars al crear el deployment**: tras guardar una key
  nueva hay que **rebuild** antes de promover, o el runtime no la ve.
