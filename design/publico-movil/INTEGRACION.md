# Integración del sitio público móvil — qué dato sale de dónde

Auditoría de las **25 pantallas** de `design/publico-movil/` contra el código vivo de la rama
`movil-t1`. Para cada pantalla: qué campos del estado de ejemplo consume, qué función/tabla real
los daría, y si ya existe una ruta equivalente en producción.

**Regla de esta auditoría:** se reporta lo que hay. Donde el mockup inventa un dato, se dice —
no se propone inventarlo. Ver «Datos que el mockup inventa».

Conteo: **16 en A · 6 en B · 3 en C.**

> ⚠️ Nota de estado: `src/lib/publico/movil-css.ts` (`PUB_CSS`) **ya existe** en el árbol de
> trabajo (sin trackear, creado por otra sesión el 11 ago 11:58). Es la extracción verbatim de
> `pub-app.css` con cada selector prefijado con `.pub`. Verificado byte a byte contra el
> entregable actual. **Nadie lo importa todavía.** No re-extraer: se cablea ese o se borra
> antes de crear otro módulo.

---

## Cubo A · directo — el dato existe y hay función lista

| Pantalla | Datos que consume (del ejemplo) | De dónde salen de verdad | Ruta equivalente hoy |
|---|---|---|---|
| **PubExp** | `e.{nombre, titulo[], tag, cat, lugar, expTxt[], iti[], niveles[], precio/precioTxt, statement, incluye[], guia{n,r,q}, comunidad, ficha, packing[], faq[], op, estado}`, `sal[]{d,m,lbl,quedan,cupo}` | `fetchPublishedExperienceRow` · `src/lib/experiences/queries.ts` → `Experience.page.blocks` (`V2Hero`/`V2Split`/`V2Statement`/`V2Itinerary`/`V2Tariff`/`V2Checklist`/`V2Packing`/`V2Faq`) + `Experience.ficha` + `Experience.priceTiers` · `src/lib/experiences/types.ts`. Salidas: `fetchOpenSlotsForTemplate` · `src/lib/experiences/availability.ts`. Operador: `fetchOperatorChipForExperience` · `src/lib/operators/public.ts`. Estrellas: `fetchExperienceRatings` · `src/lib/experiences/ratings.ts` | `/caminante/experiencias/[slug]` (`ExperienceTemplateV2.tsx`) |
| **PubDestino** | `l.{n, acc[], coord, sub, terr[], pild[], caras[], galeria[], vivir[], cierre[], exps[]}` | `fetchDestino(slug)` · `src/lib/destinos/queries.ts` → `DestinoContent.{heroTitle, heroAccent, heroSub, heroBgUrl, heroMeta, terrIntro[], terrPills[], caras[], gallery[], expTitle, expCap, closeEyebrow, closeTitle, closeAccent}` · `src/lib/destinos/types.ts`. Grilla de experiencias del estado: `fetchPublicAvailability` + `toCard` filtrando por `estado` | `/caminante/destinos/[estado]` (`DestinoTemplate.tsx`, CSS `.dst`) |
| **PubCalendario** | salidas por mes: `{d, m, lbl, quedan, exp}`, `e.{nombre, lugar}`, `ops[e.op].n` | `fetchPublicAvailability` · `availability.ts` + `fetchPublishedExperienceRows`/`toCard` + `fetchOperatorChipForExperience` | `/caminante/calendario` |
| **PubOperador** | `op.{n, d, exps[]}` | `fetchOperatorProfile(slug)` · `src/lib/operators/public.ts` — devuelve **más** de lo que el diseño pinta: `bio, photoUrl, heroPhotoUrl, instagram, team[], metrics{salidas, viajeros, stars, encuestas, volveria}, experiencias[], testimonios[]` | `/caminante/operador/[slug]` (CSS `.opf`) |
| **PubNosotros** | nada — copy 100% estático (método, 4 caras, conservación, tres orillas) | Sin datos. Es copy | **No existe ruta.** `SiteChrome.navItems` ya apunta a `/caminante/nosotros` → 404 hoy |
| **PubReservar** | `e.niveles[]`, `e.precio`, `sal[]{quedan}`, `params.grupo`, `pax`, `total` | `src/app/caminante/reservar/[slug]/page.tsx` + `CheckoutForm.tsx` → `createCheckout` · `src/lib/payments/checkout.ts`; cupo real `fetchSlotAvailability`; token de grupo `cleanGrupoToken`; gate `deslindeListo` · `src/lib/experiences/flujo-venta.ts` | `/caminante/reservar/[slug]` |
| **PubExito** | `e.nombre`, `s.lbl`, `params.{pax, total}` | `src/app/caminante/reserva/exito/page.tsx` (resuelve la reserva desde `session_id` → Stripe → `payments.provider_ref`). El recibo por correo: `notifyCustomer` · `src/lib/notifications/notify-customer.ts` | `/caminante/reserva/exito?slug=&session_id=` |
| **PubDeslinde** | texto de cláusula, checkbox, alergias, contacto de emergencia, `acomp[]` | `fetchRegistrationContext(slug)` + `fetchPrefillForUser` + `fetchReservationLock` · `src/lib/registration/queries.ts`; guarda `submitRegistration` · `src/lib/registration/actions.ts` (`medical_profiles`, `dependents`, `registrations.participants`). Cláusulas y PDF: `Experience.registration.{waiverVersion, waiverDocUrl, waiverClauses}` | `/caminante/registro/[slug]?reserva=` · el documento legible es `/caminante/deslinde/[slug]` |
| **PubEspacio** | `S.usuario.nombre`, `S.viajes[]{exp, fecha, dias, pax, total, proximo, resena}`, `S.deslindeOk`, `S.usuario.acomp.length` | `fetchMiEspacio(user)` · `src/lib/perfil/queries.ts` → `{nombre, proximas[], vividas[], acompanantes[], firmas[], datos, medico}` | `/caminante/perfil` (CSS `.mesp`) |
| **PubExpediente** | nombre, correo, teléfono, alergias, contacto de emergencia, acompañantes, firmas | `fetchMiEspacio` (`datos`, `medico`, `acompanantes`, `firmas`) + `guardarDatosAction` / `guardarMedicoAction` / `agregarAcompananteAction` · `src/lib/perfil/actions.ts` | `/caminante/perfil` (acordeones del expediente) |
| **PubFeedback** | `st{guia, lugar, org}` ★, `nps` 0–10, texto libre, casilla de consentimiento | `fetchFeedbackByToken(token)` · `src/lib/feedback/queries.ts` → `FeedbackContext{sections[], npsEnabled, testimonialPrompt, voiceSub}`; envía `submitFeedback` · `src/lib/feedback/actions.ts` (`FeedbackInput`: `overallStars` en pasos de 0.5, `nps`, `sectionRatings`, `lovedText`, `improveText`, `expectedGapText`, `rebookInterest`, `testimonialText/Stars/Consent`, `photoConsent`) | `/caminante/feedback/[token]` · link abierto de grupo `/caminante/feedback/salida/[token]` |
| **PubEntrar** | correo, contraseña, Google, liga mágica | `src/app/caminante/login/page.tsx` + `signInWithGoogle` / `signInWithPassword` / `sendMagicLink` · `src/lib/auth/actions.ts`. El ruteo por rol vive en `/caminante/entrar` · `src/app/caminante/entrar/route.ts` | `/caminante/login` |
| **PubCrear** | `tipo` (viajero \| operador), nombre, correo | `src/app/caminante/signup/page.tsx?tipo=` + `signUpWithPassword` + `elegirOperador` (cookie `cam_op_intent`) · `src/lib/auth/op-intent.ts`; el alta de operador se registra en `admin_whitelist` con `is_active=false` desde `/caminante/bienvenida` | `/caminante/signup` |
| **PubBienvenida** | `S.usuario.nombre` | `src/app/caminante/bienvenida/page.tsx` | `/caminante/bienvenida` |
| **PubEmbajadores** | nombre, correo, Instagram/portafolio, «¿por qué tú?» | `submitAmbassadorApplication` · `src/lib/embajadores/actions.ts` → tabla `ambassador_applications` (0029) | `/caminante/embajadores` (CSS `.emb`) — ⚠️ el form real exige **más** campos, ver «contradicciones» |
| **PubPrivacidad** | copy legal | Página estática | `/caminante/privacidad` |

---

## Cubo B · falta capa — el dato está en la base pero ninguna función lo sirve con esa forma

| Pantalla | Qué le falta exactamente | Lo que sí existe hoy | Ruta equivalente hoy |
|---|---|---|---|
| **PubInicio** | (1) **Listado de lugares.** `PUB.lugares[]` pide todos los destinos con `acc[]`, `coord`, foto y conteo. `src/lib/destinos/queries.ts` solo expone `fetchDestino(slug)` — **no hay `fetchDestinos()`**. (2) **Listado de operadores.** `PUB.ops` pide nombre + bio + conteo de experiencias de todos; solo existen `fetchOperatorChip(operatorId)` y `fetchOperatorProfile(slug)`, ambos de uno en uno. (3) **Testimonios globales.** Solo se sirven **dentro** de `fetchOperatorProfile` (filtro `publish_status='approved'` + `testimonial_consent=true`, firmados con **iniciales**); no hay función pública que los traiga para el home. (4) El bloque «4,8 de 5 · 12 respuestas» está **hardcodeado** | Salidas próximas: `fetchPublicAvailability`. Tarjetas: `fetchPublishedExperienceRows` + `toCard`. Estrellas por experiencia: `fetchExperienceRatings`. Tabla `destinos` (0023) y tabla `operators` (0016/0020-0022) tienen todo el dato | `/caminante` → rewrite a `public/landing/index.html` (estático, la grilla se llena por `/caminante/api/experiences`) |
| **PubExps** | (1) el mismo **listado de lugares** de arriba. (2) `e.cat` (`"Hiking"`/`"Trekking"`/`"Ocean Safari"`) — **no existe campo de categoría** en `Experience`; lo más cercano es `brandSmall` (texto libre). (3) `e.nueva` — no existe bandera; habría que derivarla de `created_at`, que `fetchPublishedExperienceRows` ni siquiera selecciona | «Próxima fecha» (`fetchPublicAvailability`) y «Mejor calificada» (`fetchExperienceRatings`) sí salen tal cual | **No existe ruta.** `SiteChrome.navItems` apunta a `/caminante/experiencias` → 404 hoy |
| **PubSolicitar** | `CalPick` bloquea «las fechas ya ocupadas por el operador» a partir de la constante `RANGOS`. **No hay función que devuelva el calendario ocupado de un operador**: `fetchPublicAvailability` solo trae salidas `open` + `public` de experiencias publicadas, sin agrupar por operador y sin ver las privadas | `submitSlotRequest` · `src/lib/experiences/solicitudes.ts` → `slot_requests` (0018) + `Experience.minPeople` + `notifySolicitudFecha`. Los datos crudos están en `experience_slots` + `experiences.operator_id` | `/caminante/solicitar/[slug]` (CSS `.sol`) |
| **PubViaje** | (1) No hay función que devuelva **el detalle de UNA reserva**: `fetchMiEspacio` devuelve la lista (`ProximaSalida`) pero no trae la mochila ni el itinerario de la experiencia. (2) **«Punto de encuentro · Ángel de la Independencia · 7:00» + «ver mapa» no existen como dato** — ver «datos inventados» | Mochila: `V2Packing` del bloque de la experiencia. Deslinde/pago/personas: `ProximaSalida.{deslinde, pago, personasLinea}`. Invitación PDF: `/caminante/invitar/[slug]?o=v` (ya cableada en `perfil/page.tsx:146`) | Pantalla nueva: hoy toda la información vive plana dentro de `/caminante/perfil` |
| **PubFacturacion** | El mockup pide **«Folio del cobro (`ch_3QxB92…`)»**. El flujo real busca el pago por **correo + monto** o por link firmado `?p=<paymentId>&t=<HMAC>` (`firmarPago`/`tokenValido` · `src/lib/facturacion/token.ts`). **No hay búsqueda por folio/charge id** | `emitirCFDI(formData)` · `src/lib/facturacion/actions.ts`, tabla `cfdi_invoices` (0019), gate `facturacionActiva()` · `src/lib/facturacion/facturapi.ts` | `/caminante/facturacion` |
| **PubBaja** | El mockup da de baja con **un botón sin identidad**. La baja real exige la **firma HMAC** del contacto (`verifyContact` · `src/lib/email/unsubscribe.ts`); sin `?c=<contactId>&s=<sig>` no hay a quién dar de baja. Falta una pantalla que reciba el link firmado (y el POST one-click RFC 8058) con este diseño | `/caminante/api/unsubscribe` (GET humano + POST one-click) escribe `contacts.mailing_unsubscribed_at`; ya sirve su propia página HTML brandeada | `/caminante/api/unsubscribe` |

---

## Cubo C · falta el dato — no existe ni la fuente

| Pantalla | Qué consume | Estado real |
|---|---|---|
| **PubAprende** | `CAPS[]` = `{id, titulo[], lugar, expId, formato ("Artículo"/"Guía de campo"/"Ensayo fotográfico"/"Documental"), min, cara, tono, estado ("publicada"/"encamino"), destacada, esteMes, serie, entradilla, cuando}`, más filtros por lugar y por cara | **No existe tabla ni función.** El array vive en `pub-aprende.jsx`. Barrido de migraciones `0001`–`0034`: no hay `articles`, `posts`, `capsulas` ni `contenido`. `/caminante/magazine` es un stub de 8 líneas («Always-on content layer…»). En el landing, `id="aprende"` es una sección de promesa cuyo CTA apunta a **sí misma** (`href="#aprende"`), y `ExperienceTemplateV2`/`DestinoTemplate`/`RegistrationForm` enlazan a `/caminante#aprende` — un ancla que no aterriza en nada. Lo más cercano en la base es la **serie E** del Kit (`social_posts`), pero eso son láminas para Instagram, no artículos web |
| **PubCapsula** | `c.*` + el cuerpo del artículo (`CuerpoHongosto`, `CuerpoPisos`, `CuerpoAcuario`), `Dato{fuente}`, `Foto{pie}`, «Sigue leyendo», barra de compra | **No existe.** Los cuerpos son JSX literal y el propio diseño lo admite en pantalla: `.cap-muestra` dice «texto de muestra · redactado a partir del material documentado». Lo único servible es la barra de compra (`fetchOpenSlotsForTemplate`). Ojo: la ficha científica de la experiencia (`Experience.ficha`) sí tiene datos con fuente obligatoria, pero **no es un artículo** |
| **PubSerie** | «Las cuatro caras de Xalatlaco», 4 entregas, cuál está leída, «avísame» por entrega | **No existe.** No hay modelo de serie, ni de progreso de lectura, ni de «avísame» (ver riesgo 3.1) |

---

# Riesgos y colisiones

## 1 · CSS

**1.1 · El namespacing ya está resuelto — no lo rehagas.**
`pub-app.css` usa 70 clases genéricas (`.ph .veil .inner .row .g .d .h .p .a .x .ok .warn .sl .th .tt .tx .sk .bd .sy .chev .brand .hbtn .grab .gridc .ic .meta …`). 41 de esos nombres también existen en módulos del repo (`.adm`, `.dst`, `.mesp`, `.emb`, `.sol`, `.opf`, `.fin`, `template-v2-css.ts`, `deck-css.ts`, `kit-css.ts`, el landing). **Hoy ninguna colisión es real**: los dos lados scopean sus genéricas bajo un ancestro con namespace, y `src/lib/publico/movil-css.ts` ya prefija cada selector con `.pub`. Los prefijos `pub-` y `cap-` están libres (el único `cap-*` del repo es `.cap-l` en `destino-css.ts`, que no choca).

**Latente:** `template-v2-css.ts` y `deck-css.ts` **no tienen namespace** (declaran `.nav`, `.hero`, `.faq`, `.btn`, `.qa`, `.close`, `.bleed`, `.footer` a pelo). Si algún día una página monta el módulo `pub` junto con uno de esos, `.veil`, `.inner`, `.a`, `.h` y `.scrolled` se vuelven colisiones vivas.

**1.2 · Lo que sí fuga hoy: los selectores globales.** La extracción actual deja globales, a propósito:

```
* { box-sizing; margin:0; padding:0 }
html,body { height:100% }
body { font-family:"Geist"; color:var(--charcoal); background:var(--bg) }
button { font-family:inherit; cursor:pointer; color:inherit; background:none; border:none }
a { color:var(--olive) }   a:hover { color:var(--orange) }
img { display:block; width:100%; height:100%; object-fit:cover }
input,textarea,select { font-family:inherit }
@media(min-width:700px){ body{ display:flex; align-items:center; justify-content:center; padding:24px } … }
* { animation:none!important; transition:none!important }   /* reduced-motion */
```

Los destructivos son **`img{width:100%;height:100%;object-fit:cover}`** (deforma toda imagen de cualquier página en el mismo documento) y **`@media(min-width:700px){body{display:flex…}}`** (es la maqueta del «teléfono flotante» de la demo — la extracción de `admin-movil` sí la omitió; ésta no). `button{}` y `a{color}` además pisan los defaults de Tailwind. El comentario de cabecera del módulo dice que solo quedan globales `:root`, `html`, `body` y `*` — **subestima**: `button`, `a`, `img` e `input` también quedan globales.

**1.3 · Variables `:root` con valores distintos.** `pub-app.css` declara 17 variables en `:root`. Chocan con:

- **`src/app/globals.css`** (se carga en **toda** página de Next — la más grave): `--olive` `#776F67` vs `#637154` · `--sand` `#D4CEC6` vs `#b6ada5` · `--forest` `#5A7A4E` vs `#20392b`. Y en cascada arrastra `--text-secondary`, `--muted` y `--border`.
- **Los módulos de diseño**: `--line` `.13` vs `.12` (`destino-css`, `template-v2-css`, landing) · `--ink-soft` `.62` vs `.6` (**nueve** módulos) · `--shadow` con tres valores distintos según el módulo.
- `pub-app.css` **no** define `--dune`, así que hereda el que esté vivo — y ese ya es inconsistente en el repo (`#FF5D36` en `globals.css` vs `#c9b79c` en destino/template/landing/admin).

El patrón que ya resuelve esto en el repo es `opf-css.ts`: **declarar las variables sobre el wrapper (`.pub{}`) en vez de `:root`**. Es el único módulo que lo hace bien.

**1.4 · Doble carga de la fuente.** `pub-app.css` declara la familia `"Geist"` desde `.ttf` (`format("truetype-variations")`, ~343 KB entre las tres) mientras `globals.css` declara **la misma familia** desde `/shared/fonts/GeistVF.woff2` (~129 KB). Ambos `@font-face` quedan globales. Los tres `.ttf` sí existen en `public/landing/assets/fonts/`; las rutas relativas `assets/fonts/…` hay que reescribirlas a `/landing/assets/fonts/…` (la extracción ya lo hace). Geist Mono solo existe como `.ttf`, así que ese sí es obligado.

**1.5 · Colisión de nombre en el JSX, no en el CSS.** `PubAprende` está definida **dos veces**: en `pub-a.jsx:375` (índice de ficha científica, alimentado por `Experience.ficha` — cubo A/B) y en `pub-aprende.jsx:29` (índice de cápsulas — cubo C). El shell carga `pub-aprende.jsx` **al último**, así que gana la de cápsulas y la otra queda muerta. Hay que decidir cuál se transcribe; la de `pub-a.jsx` es la que se puede servir hoy con datos reales.

## 2 · Rutas duplicadas

**Duplican una ruta que ya existe** (17): `PubExp` ↔ `/caminante/experiencias/[slug]` · `PubDestino` ↔ `/caminante/destinos/[estado]` · `PubOperador` ↔ `/caminante/operador/[slug]` · `PubCalendario` ↔ `/caminante/calendario` · `PubReservar` ↔ `/caminante/reservar/[slug]` · `PubExito` ↔ `/caminante/reserva/exito` · `PubDeslinde` ↔ `/caminante/registro/[slug]` · `PubSolicitar` ↔ `/caminante/solicitar/[slug]` · `PubEspacio` + `PubExpediente` ↔ `/caminante/perfil` · `PubFeedback` ↔ `/caminante/feedback/[token]` · `PubEntrar` ↔ `/caminante/login` · `PubCrear` ↔ `/caminante/signup` · `PubBienvenida` ↔ `/caminante/bienvenida` · `PubEmbajadores` ↔ `/caminante/embajadores` · `PubFacturacion` ↔ `/caminante/facturacion` · `PubPrivacidad` ↔ `/caminante/privacidad` · `PubBaja` ↔ `/caminante/api/unsubscribe` · `PubInicio` ↔ `/caminante` (rewrite al landing estático).

**Donde el diseño MEJORA lo que hay:**
- `PubExps` y `PubNosotros` **tapan dos links muertos**: `SiteChrome.navItems` ya ofrece `/caminante/experiencias` y `/caminante/nosotros`, y ninguna de las dos rutas existe (404 hoy). También ofrece `/caminante/descubre`, que tampoco existe.
- `PubViaje` es pantalla nueva: hoy todo el detalle de una reserva vive aplanado en `/caminante/perfil`.
- `PubBaja` le pone marca a la página que hoy escupe el route handler.
- `PubOperador` en cambio **enseña menos** de lo que `fetchOperatorProfile` ya devuelve (se pierden métricas, equipo y testimonios).

**Donde el diseño CONTRADICE al sistema:**

1. **`PubDeslinde` no enlaza el PDF y hardcodea la cláusula.** Escribe un párrafo genérico («…libero a NUMAN HUB S.A. de C.V. …») y no ofrece leer el documento. La regla vigente (`deslindeListo`, `src/lib/experiences/flujo-venta.ts`) es que **`waiverDocUrl` nunca puede faltar: quien firma siempre debe poder leer el PDF**, y las cláusulas son por experiencia (`registration.waiverClauses`). Tal cual, la pantalla rompe la regla que bloquea publicar y cobrar.
2. **`PubFeedback` fija tres secciones** (`guía / lugar / organización`). Las secciones reales son **data-driven por experiencia** (`Experience.feedback.sections`) — «Ocean Safari ≠ un volcán». Además el mockup tira `overallStars`, `lovedText`, `improveText`, `expectedGapText`, `rebookInterest`, `testimonialStars` y `photoConsent`, que la encuesta real sí captura. Con esa forma, la mitad del panel de Encuesta se queda sin insumo.
3. **`PubSolicitar` no pide WhatsApp** — `submitSlotRequest` lo **exige** (`if (!nombre || !correo || !whatsapp) redirect(back("error=datos"))`). También le faltan `nota` y `tipo` (privado/abierta). El form no pasaría nunca.
4. **`PubEmbajadores` pide 4 campos**; el form real exige además WhatsApp, perfil cerrado (`creador|agencia|comunidad`) y al menos un link con tamaño de audiencia (`error=datos` / `error=perfil` / `error=links`).
5. **`PubExito` manda siempre al deslinde** (`nav.replace("deslinde")`). En producción el CTA solo aparece si `registration.active`; si no, iría a un 404 — exactamente el bug que se corrigió en `reserva/exito/page.tsx`.
6. **`PubReservar` cobra dentro de la app** (`setTimeout` → `nav.replace("exito")`). El cobro real es una **redirección a Stripe Checkout** y el regreso llega a `/caminante/reserva/exito?session_id=`. Esa transición no puede vivir dentro de la pila de pantallas.
7. **La app no tiene URLs.** El shell es una pila de React (`stack`/`push`/`pop`) sin router. Todos estos puntos de entrada llegan **por URL desde fuera** y hoy no tendrían dónde aterrizar: el regreso de Stripe (`?session_id=`), la liga mágica (`/caminante/auth/confirm?next=`), la encuesta (`/feedback/[token]`), el deslinde con reserva (`/registro/[slug]?reserva=`), el link de grupo privado (`?grupo=<token>`), el link de baja firmado (`?c=&s=`) y el link de facturación (`?p=&t=`). Es el riesgo estructural más grande del entregable.

## 3 · Datos que el mockup inventa (no existen en la base)

1. **«Avísame».** La hoja `ShAvisame` y cinco pantallas capturan un correo para avisar cuando abra una fecha. **No hay waitlist**: cero coincidencias de `waitlist`/`avisame`/`notificarme` en `src/` y `supabase/`. Lo más cercano es `slot_requests` (que es *pedir* una fecha, no *que me avisen*) y la tabla `leads` (0015), que hoy solo la escribe el webhook de WhatsApp aunque su columna `source` ya admite `'web'`.
2. **`e.guia = {n, r, q}`** — un guía estructurado con nombre, credencial y cita, por experiencia. **No existe ese modelo.** Lo único parecido es `guias()` en `src/lib/kit/kit.ts:949`, una heurística sobre los bloques `split` que es interna del Kit y **ya falló**: en hongos devolvía las *variedades de hongo* (Pambazo, Chilero) como si fueran personas, con su propio nombre repetido como cita. Por eso E5 filtra con `retratables()`. Sacarlo a una página pública repetiría ese error con nombre y cara.
3. **Punto de encuentro y mapa** (`PubViaje`: «Ángel de la Independencia · 7:00 · ver mapa»). **No hay campo** de punto de encuentro ni URL de mapa en `Experience`; el texto solo aparece dentro de la prosa del itinerario y del documento legal.
4. **`ops.kentro.marca = {fondo:"#212121", acento:"#9a3b2d"}`** — colores de marca del operador. La tabla `operators` (0020-0022) tiene `slug, name, bio, photo_url, photo_adjust, hero_photo_url, hero_adjust, instagram, team, is_public`. **Sin campos de tema.** El theming por operador es el plan white-label, que no está construido.
5. **`e.cat`** (`Hiking`/`Trekking`/`Ocean Safari`) — no hay campo de categoría; lo más cercano es `brandSmall`, texto libre. Toda la agrupación de `PubExps` y los rótulos «X salidas al bosque / al mar» dependen de esto.
6. **`e.nueva`** y **`e.fotos: 80`** — no hay bandera de «nueva» ni contador de fotos expuesto (el conteo sí se puede derivar de `photoBank` + `gallery`).
7. **`l.temporadas`** (`PubDestino`, «Cuándo suele haber salida») — `DestinoContent` no tiene ese campo. `Experience.ficha.temporada` existe pero es **por experiencia**, no por destino.
8. **`hola@numanhub.com`** — aparece en `ShMenu` («Contacto») y en `PubPrivacidad` («pedir acceso, corrección o eliminación»). **Esa dirección no existe en ningún lugar del repo.** Las reales son `uno@numanhub.com` y `caminante@numanhub.com`. Es el mismo tipo de dato inventado que el domicilio del boletín.
9. **`caminante.mx/aprende/<id>`** — el toast de compartir de `PubCapsula`. El dominio es `caminante.numanhub.com`.
10. **Los agregados hardcodeados.** «4,8 de 5 · Ensenada de Muertos · **12 respuestas**» en el home, «Hoy hay 4 salidas en 3 experiencias» en el calendario, «El calendario tiene 4 salidas abiertas» en Mi espacio. Ojo especial con el primero: ese 4,8/12 es justo el número que el panel **dejó de mostrar** el 10 ago porque escondía dos salidas distintas (Jun 12-15 · 7 · 4.6★ y Jun 18-21 · 5 · 5.0★). Publicarlo así en el home reintroduce el error que se acaba de corregir.
11. **Formas que no calzan** (el dato existe, la estructura no): `incluye[]` y `packing[]` del mockup llevan una segunda línea (`["Guía micóloga certificada","Nanae Watabe · NANAE"]`), pero `V2Checklist.yesItems` y `V2Packing.items` son `string[]`. Y `ficha.especies[i]` del mockup es *un* texto + *una* fuente, mientras el real es `datos: {texto, fuente}[]`.
12. **Testimonios sin firma.** El mockup los remata con «*Recolección de hongos · ★5* · testimonio publicado con consentimiento». Los reales exigen `publish_status='approved'` **y** `testimonial_consent=true`, y se firman con **iniciales** (`initialsOf`, `src/lib/operators/public.ts:70`) — nunca con el nombre completo.
13. **Los `tono` del banco de fotos.** `Ph` usa `paisaje, flora, gente, comunidad, comida, detalle, cielo, mar, barranca, claro`. Los slots reales de `Experience.photoBank` son `flora, paisaje, comunidad, comida, gente, problemas, cielo, detalle`. **`mar`, `barranca` y `claro` no son slots** (y `problemas` no se usa en el diseño). Son colores de placeholder, pero el `data-banco` sugiere un mapeo 1:1 que no existe.
