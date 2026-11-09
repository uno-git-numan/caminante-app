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

**La liga mágica por correo NO es PKCE (7 nov 2026).** `@supabase/ssr` fuerza
PKCE aunque se le pida `flowType: "implicit"`; con PKCE el token sólo se canjea
desde el navegador que pidió la liga (el verificador vive en su cookie), y en
el teléfono el correo se abre en Mail, Gmail o Safari, no en el Chrome que la
pidió: «No pudimos completar el inicio de sesión» hasta para Luis desde su
iPhone. `sendMagicLink` usa `createSupabaseOtpClient()` (`lib/supabase/otp.ts`,
supabase-js plano con flujo implícito, sin cookies) y `auth/confirm` canjea el
token plano desde cualquier dispositivo. Google y Apple siguen por PKCE (ahí el
callback vuelve al mismo navegador).

**Crear cuenta con contraseña no manda correo de confirmación.**
`signUpWithPassword` y `entrarAlGrupo` crean la cuenta con
`auth.admin.createUser({ email_confirm: true })` y abren sesión con
`signInWithPassword` en el mismo request. `auth.signUp` mandaba un link PKCE
de confirmación con el mismo problema de arriba. `mailer_autoconfirm` sigue en
false en Supabase: no hace falta tocarlo.

**Todo camino de login IGNORA la sesión entrante (7 nov 2026).** Con una
sesión muerta en la cookie, el cliente SSR normal intenta refrescarla, falla y
auth-js ≥2.1 llama `_removeSession`, que borra TAMBIÉN el `code-verifier` y
manda `SIGNED_OUT`; si en ese mismo request corre `signInWithOAuth`, la
limpieza se lleva el verificador recién puesto y Google regresa a «PKCE code
verifier not found». Así quedó Luis fuera desde su iPhone. Por eso
`signInWithPassword`, `signInWithGoogle/Apple`, el alta por contraseña y
`entrarAlGrupo` usan `createSupabaseAuthClient()` (ignora la sesión, lee el
verificador), igual que `auth/confirm` y `auth/callback`.

**La sesión muerta se cura en el middleware por el error DEVUELTO.** Desde
auth-js 2.1xx `getUser()` ya no lanza con «Invalid Refresh Token»: lo devuelve
en `error`. El middleware atiende los dos caminos y borra la cookie en sus
variantes de path/domain (`matarCookie`), porque un borrado sólo surte efecto
con el mismo path y domain con que se puso.

**El caso Ana Malvido (9 nov 2026): tres trampas que se encadenaban.**
1. Su cuenta nació del código viejo del grupo **sin contraseña**: «Ya tengo
   cuenta» con contraseña no podía funcionar, y «Crear cuenta» respondía «ya
   existe» — un callejón. **Ahora «ya existe» nunca es callejón**: si la
   contraseña que escribió es la suya, entra; si no, le llega un código y cae en
   la pantalla para escribirlo (`signUpWithPassword`, `entrarAlGrupo`).
2. **Hotmail/Outlook (Safe Links) y antivirus abren cada liga del correo antes que
   la persona.** Si `auth/confirm` canjeaba el token en el GET, la liga llegaba
   gastada (la de Ana se canjeó 22 s después de mandarse). **El GET de
   `auth/confirm` sólo enseña un botón; el canje vive en el POST.** Los
   escáneres no envían formularios.
3. Liga que se abre en otro navegador/teléfono o en el navegador interno de la app
   de correo. **El correo de acceso trae también un CÓDIGO** (`{{ .Token }}`, 8
   dígitos, `mailer_otp_length`) que se escribe en `/caminante/login/codigo`
   (`entrarConCodigo` → `verifyOtp({email, token, type:"email"})` con el cliente
   que ignora la sesión). «Mándame un código de acceso» en /login usa
   `shouldCreateUser:false`: un correo con typo no se vuelve cuenta fantasma.
   ⚠️ La plantilla hospedada en Supabase (Auth → Email templates → Magic Link) es
   la que manda; el archivo `supabase/templates/magic-link.html` es su copia. Si
   no trae `{{ .Token }}`, la pantalla del código pide algo que el correo no trae.

**Contraseña por CÓDIGO** (9 nov 2026; antes era una liga de recuperación por
Resend que el escáner de Outlook le gastó a Ana): `pedirLigaDeContrasena` manda
el mismo código de acceso con destino `/caminante/cuenta/contrasena` →
`definirContrasena`. La casa nunca teclea ni conoce contraseñas. Entradas:
«Créala o cámbiala aquí» en /login y en Mi espacio.

**El destino sobrevive a la liga** (`cam_destino`, lib/auth/destino-cookie.ts):
Supabase tira `emailRedirectTo` si no está en su lista permitida (una ruta como
/caminante/g/<token>/entrar caía a la portada); `pedirCodigo` lo guarda en cookie
y `auth/confirm` lo usa.

**Plantilla Magic Link hospedada con `{{ .Token }}` y remitente «Luis · Caminante»
(SMTP Settings) desde el 9 nov 2026**, aplicados desde el dashboard.

**Apple**: `signInWithApple` existe y el botón (`AppleButton`) se dibuja sólo con
`NEXT_PUBLIC_AUTH_APPLE=1`. Darlo de alta es de Luis: en Supabase → Auth →
Providers → Apple, con Services ID, Team ID, Key ID y la llave `.p8` de su Apple
Developer, y el redirect `https://hnyoahirxmzkshivgvnm.supabase.co/auth/v1/callback`
registrado en el Services ID. Luego la env var en Vercel y rebuild.

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

## El equipo: el tercer rol (0070, 25 sep 2026)

Cuatro perfiles: **admin** (la casa) · **equipo** (`staff`) · **operador**
(`operators.panel_activo`) · **caminante**. Se derivan por correo, **en ese
orden**: la casa manda; un correo en `staff` activo es equipo aunque también
tenga fila de operador.

**Qué es el equipo.** Empleados con sueldo, de numan (`staff.numan`) y/o de una
o varias operadoras (`staff_operadoras`; Caminante y Kéntro son un solo equipo:
Druidas). `facultades` las prende y apaga la casa: `onboarding` (numan) ·
`clientes` · `armar` · `campo` (operadora). **Lo que nunca:** reembolsos,
`commission_pct`, Connect/CSD/facturas, dispensas, suspender/baja, dar accesos
— todo eso sigue exigiendo `isCurrentUserAdmin()`, y esta tabla no lo abre.

**Cómo entra al panel (`lib/auth/alcance.ts`).** Dos formas, y la forma es lo
que evita tocar el resto del panel:
- Equipo de una **operadora** → alcance `operador` de esa operadora con
  `equipo` colgado. Todo lo que filtra por `esOperador()` le aplica. Si trabaja
  para dos, la cookie del sombrero elige **sólo entre las suyas** — aquí el
  sombrero sí decide a nombre de quién actúa, a propósito: es la operadora,
  acotada. El invariante #22 protege a la casa, que actúa por cualquiera.
- Equipo de **numan** → alcance `equipo`. `tipo === "casa"` sigue falso. Lo
  que puede lo abren a mano `puedeOnboarding()` (agendar llamada, pedir
  expediente, aprobar/rechazar solicitud, resolver documentos y actividades) y
  `operadoraObjetivo()` (subir por una operadora). Con las dos a la vez: en
  `/plataforma` es numan, en el resto su operadora.

**Dueña y equipo a la vez** (27 sep 2026, `lib/equipo/sombreros.ts`): el mismo
correo puede ser dueño de una operadora (`operators.email` + `panel_activo`) y
equipo de otras. `equipoDe` trae `duena`; los sombreros son la suya (primero,
por omisión) + las de equipo, y viajan en `alcance.sombreros`. Con el sombrero
de la suya el alcance es `operador` SIN `equipo` (dueña plena: lista blanca
completa, administra su equipo, cobra); con el de otra, `operador` con
`equipo` (facultades). El rol real sigue siendo `equipo`; AdminShell y el
layout lo tratan como operadora cuando el alcance no trae `equipo`.
`puedeEntrarAlPanel` incluye `equipo` (antes no: nadie del equipo podía
mover una tarjeta).

**Listas blancas** (`panel-operador.ts`): `rutaDeEquipoNuman` (Comunidad de la
plataforma + Mi alta/expediente/marca por `?operadora=`) y
`rutaDeEquipoOperadora` (lo del operador menos `/mi-alta/equipo`: el equipo no
se administra solo). El layout las aplica; falla cerrado.

**Alta y facultades** (`lib/equipo/actions.ts`, Luis 27 sep 2026): **cada
quien administra a su gente**. La casa en `/plataforma/equipo` da de alta a la
de numan y a la de las operadoras PROPIAS (Caminante, Kéntro) —a una externa
como Nomádika le da de alta su dueña, y numan ni la ve como opción ni lista a
su equipo—. Cada operadora, propias incluidas, tiene la pestaña **«Equipo»**
(`EQUIPO_NAV`, `/mi-alta/equipo`): la dueña la ve, su equipo no
(`sinAdministrarEquipo`), y la casa con el sombrero de una propia la ve
apuntando a ésa (`?operadora=` o el sombrero puesto). Sólo facultades de
operadora desde ahí. Un correo de `admin_whitelist` no se puede meter al
equipo. La baja apaga `activo`, conserva la fila.

**La atribución (0071, `lib/equipo/atribucion*.ts`).** Un LIBRO
(`staff_atribuciones`): una fila por (persona, objeto, tramo); la abierta tiene
`hasta` null y un índice parcial impide dos titulares. Objetos: `solicitud`
(operator_applications) y `operadora` (operators) del lado numan; `tarjeta`
(crm_cards) y `grupo` (experience_slots) del lado operadora.
- **Tomar es actuar**: agendar la llamada o mover la tarjeta la hace de quien
  actúa si nadie la tenía (`tomarSiLibre`); si era de otro no se arrebata; la
  casa no toma, asigna. Aprobar la solicitud HEREDA la operadora al mismo
  titular y cierra la solicitud como `resuelta`; rechazar y «caído» también.
- **Una sola puerta** para tener algo (`puedeTener`): activo + facultad del
  objeto + lado (numan para lo de numan; trabajar para ESA operadora para lo
  suyo). Tomar, asignar y recibir una transferencia pasan por ahí.
- **El pago sabe quién lo vendió**: `payments.vendedor_id` se congela al entrar
  (titular de la tarjeta de esa persona×experiencia, o del grupo) en los dos
  webhooks; null = nadie del equipo. Una transferencia posterior no lo mueve.
- **«Quién lo lleva» en Comunidad** (lámina del 27 sep, `ui/asignar/Asignar.tsx`,
  `lib/equipo/titulares.ts`): la tarjeta de operadora del pipeline y la del CRM
  dicen quién la lleva; el cajón trae el control. El verbo lo decide
  `verboDeAsignacion` (puro): la casa asigna/pasa, el equipo con la puerta
  toma/pasa lo suyo, sin puerta no hay botón. La lista de «a quién» es
  `puedeTener` sobre el equipo activo. El tablero del CRM ganó su cajón
  (`ui/Cajon.tsx`): ficha, escribirle, y quién la lleva. En «Por contestar»
  también: la solicitud de fecha se lleva por SU TARJETA del CRM (nace con
  ella, `crm_cards.slot_request_id`) y el embajador es un objeto propio
  (0072, `embajador` → ambassador_applications; de la operadora del sombrero;
  aprobar o rechazar lo resuelve).
- **La baja exige transferir la cartera** (`darDeBaja(id, transferirA)`): lo
  abierto pasa con `cierre='baja'`; «a quién pasó» se DERIVA del libro
  (`aQuienPaso`), no se guarda aparte.
- **Comisiones y Rendimiento (F3, `lib/equipo/comisiones.ts` puro +
  `rendimiento.ts`)**: numan = 10% de `platform_fee_mxn` (neto de devolución
  en proporción) para quien tenía la operadora el día del pago (`titularEn`);
  Caminante = 3% del cobrado sin IVA de `payments.vendedor_id` cuando la
  salida ya ocurrió, en el mes de la salida; lo futuro «por devengar»; una
  reserva sin fecha no devenga y se dice. **Lo que no tiene dato sale null y
  la pantalla dice «sin dato / sin registro», nunca $0**: lo pagado a cada
  quien (no hay tabla), respondidas <1h, embajadores, el 1% de embajadoras.
  Una devolución resta del pago que devolvió (refunded_mxn no tiene fecha).
  La pestaña Rendimiento sólo se dibuja para uno@numanhub.com; la operadora
  ve lo de su equipo sin comisiones. Memoria: `caminante-equipo-vendedores`.

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
