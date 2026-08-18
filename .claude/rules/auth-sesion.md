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

**Nadie se auto-nombra admin.** El alta de «operador» crea cuenta normal + una
solicitud (`admin_whitelist` con `is_active=FALSE`). El rol es **derivado**, no hay
columna: admin = whitelist activo; caminante = autenticado que no es admin.

**Cada server action re-verifica `isCurrentUserAdmin()`.** El gate del layout NO
cubre actions invocadas directo.

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
