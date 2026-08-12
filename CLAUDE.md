# CLAUDE.md — Caminante (contexto para Claude)

> **Lee esto primero, y luego el master plan en Notion** (la estrategia/visión):
> https://app.notion.com/p/378b0498350f813e806bcb8bf4404a7f
> Regla de oro: si algo importante cambia, actualízalo en el master plan **y** aquí.

## Qué es
Caminante = la expansión de NUMAN al mundo natural: plataforma de experiencias en
naturaleza + contenido educativo + conservación. Voz "científico-poeta". Las **4 caras**
de cada lugar: 🌿 Naturaleza · 🌊 Conservación · 🤝 Comunidades · ⚠️ Problemas.

## Estado actual (8 jun 2026) — FASE 1 COMPLETA Y EN VIVO
- **En vivo:** `https://caminante.numanhub.com` (subdominio, SSL) → también `caminante-app.vercel.app`.
- **Constructor "Crear experiencia"** funcional: formulario (Template + 4 caras + fotos + Stripe link) → Supabase → genera página + tarjeta del landing + entrada del calendario.
- **Experiencias data-driven**: una plantilla dinámica renderiza desde Supabase. Landing y calendario leen de la base.
- Publicadas y EN VIVO (30 jun): **Ensenada de Muertos** (Ocean Safari, BCS — 1 salida Jul 16-19, cupo 16) y **Recolección de Hongos · Xalatlaco** (Edo. Méx., 1 día — salidas Dom 26 jul y Dom 23 ago, cupo 17 c/u). Ambas: página estática bespoke (rewrite) con fechas/cupo EN VIVO desde `/api/availability`, descubribles desde Home (grid #proximos) y desde Destinos (botón "Vivir esta experiencia" → `/caminante/experiencias/<slug>`). `hike-mariposas-monarca` existe en BD (sin página estática). Faltan dar de alta: Acatenango, Iztaccíhuatl, Pico de Orizaba, Combo Volcanes.
- ⚠️ **El copy de las páginas de experiencia NO debe llevar fechas/conteos/temporada** (regla de Luis): las fechas reales viven SOLO en las date-cards (`data-salida` → `.fecha`/`.cupo`, llenadas desde la BD). El resto del copy es atemporal, sobre la experiencia.

## Diseño v2 data-driven (ensenada/hongos → plantilla universal) — EN PRODUCCIÓN (6 jul 2026)
- **Qué cambió:** el diseño bespoke de ensenada/hongos dejó de ser HTML estático (rewrite) y ahora es una **plantilla data-driven** que lee de la BD. Cualquier experiencia con `data.design==="v2"` se ve igual. Los `.html` en `public/landing/experiencias/` quedan como **respaldo/fuente del diseño** (ya NO se sirven).
- **Modelo por bloques** (`src/lib/experiences/types.ts`): `Experience.design/page`; `PageV2.blocks` = arreglo ordenado de bloques tipados (`hero`, `split`, `statement`, `itinerary`, `tariff`, `checklist`, `faq`, `packing`, `dates`, `closing`). `split` = sección de 2 columnas (frame `xp`=mosaico / `allies`=una foto) que cubre experiencia/guías/comunidad/variedades/aliados.
- **Plantilla** `experiencias/[slug]/ExperienceTemplateV2.tsx`: renderiza los bloques 1:1 contra el CSS+script **extraídos VERBATIM** del HTML (`src/lib/experiences/template-v2-css.ts` y `template-v2-script.ts`, byte-idénticos — si el diseño cambia, RE-EXTRAER del HTML, no editar a mano). secnum auto-numerado; fechas server-side vía `fetchOpenSlotsForTemplate(experienceId)` (sirve página pública y preview de borradores). Ruteo: `page.tsx` y `admin/preview/[slug]` → v2 si `design==="v2"`, si no legacy. Rewrites estáticos de ensenada/hongos **quitados** de `next.config.ts`.
- **Autoría v2** (`ExperienceForm.tsx` reescrito): edita un `V2Draft` de **secciones fijas opcionales** (`src/lib/experiences/page-v2.ts`: `buildBlocks`/`draftFromBlocks`/`emptyV2Draft`/`emptyGuide`) → al guardar produce `page.blocks` + `design:"v2"`. El título del hero nombra la experiencia (tarjetas/admin/notifs) y su foto alimenta las tarjetas del home/Mi espacio. Subidor **multi-foto con compresión** en navegador (2560px, JPEG q0.82). La operación (precio cobrable, fechas/cupo, registro, encuesta) sigue igual.
- **IA a v2:** `src/lib/ai/prellenar.ts` (esquema+system) y `aplicar-prellenado.ts` (`aplicarPrellenadoV2`: metadatos→exp, secciones→draft, preserva fotos) devuelven/consumen el contenido v2 en voz de marca. Fuera lenses/contexto/impacto.
- **Migración de datos:** ensenada + hongos poblados con merge NO destructivo (script one-off con service-role; preserva todas las claves). Round-trip `buildBlocks(draftFromBlocks(page))` = idéntico a las páginas reales.
- ⚠️ **Gotcha de verificación (6 jul):** `tsc`/`npm build`/`npm dev` **concurrentes entre sesiones deadlockean** el FS sandboxeado → procesos en estado `U`/`E` que ni `kill -9` mata (solo reboot). Correr `tsc` SOLO (una sesión a la vez) o confiar en el **build de Vercel** (aislado) como verificador de tipos. Node local corre solo con `dangerouslyDisableSandbox`. Pendiente menor: prueba de humo del form nuevo (crear un borrador real y ver "Vista previa").

## Cómo correr (gotchas importantes)
- El proyecto vive en `~/dev/caminante-app` (se movió de ~/Documents porque iCloud hacía el dev server lentísimo — NO regresarlo a Documents/iCloud).
- **npm/node NO están en el PATH.** Usa fnm:
  `export PATH="/Users/luisdelarosa/Desktop/acting/caminante/.tools/fnm-data/node-versions/v22.22.0/installation/bin:$PATH"`
- **Next 16.1.6 usa webpack, NO Turbopack** (Turbopack truena al compilar páginas). Los scripts `dev` y `build` ya tienen `--webpack`. No lo quites.
- Arranca con `npm run dev` (si el dev server no enlaza el puerto, córrelo con el sandbox deshabilitado).
- `start-dev.command` (doble clic en Finder) levanta dev + el listener de Stripe. Está en .gitignore (rutas de máquina + lee la llave de .env.local).
- `.env.local` tiene las llaves (gitignored). Local y prod usan **la misma base de Supabase**.

## PDF descargable = DECK tipo flyer (9 slides fijos) — EN PRODUCCIÓN (7 jul, v2)
- **Qué:** el botón "Descargar PDF" (vertical/horizontal) de una experiencia v2 abre `/caminante/admin/print/[slug]?o=h|v` (solo-admin) → un **deck a tamaño fijo** (16:9 = 1280×720 / 9:16 = 720×1280), **un slide = una página exacta** vía `@page {size} + .slide {page-break-after:always}`.
- **Orden FIJO de 9 slides** (selección por tipo en `ExperienceDeck.tsx`, independiente del orden del array): 1 portada · 2 experiencia (split `anchor==="experiencia"`) · 3 itinerario (day-cards ARRIBA a la derecha, letra grande) · 4 precio · 5 qué incluye · 6 comunidad (split cuyo eyebrow/título matchea /comunidad/i) · 7 qué llevar · 8 faq · 9 cierre. Statement/guías/variedades/aliados/fechas NO van al flyer.
- **Portada** = TÍTULO de la experiencia en grande (hero.title + accent itálica naranja, como el hero web) + eyebrow + tagline; fechas en vivo arriba-der. **Marca en TODOS los slides**: ARRIBA el wordmark CAMINANTE (`.s-word`, sello SIEMPRE en colores verdaderos olive/sand/orange — jamás teñirlo pálido; solo las letras cambian carbón↔blanco) + pager; ABAJO `BrandFoot` (sello + logos de `page.collaborators`: color natural en crema, silueta blanca en foto).
- **Logos de colaborador se AUTO-RECORTAN al subir** (`recortarLogo` en ExperienceForm: bbox del alfa + margen ~5%, salida SIEMPRE PNG — el compresor JPEG mataría la transparencia; `Uploader logo`). Sin esto un wordmark en lienzo gigante se veía diminuto junto al sello.
- **Orden de la página WEB (canon `buildBlocks`, page-v2.ts):** hero → experiencia → statement → itinerario → tariff → checklist → guides[] → packing → faq → dates → closing (cambiado 7 jul: guides tras checklist, packing antes de faq; la data v2 existente se reordenó con script one-off vía PostgREST — mismos bloques, otro orden).
- ⚠️ **Fuentes Geist en el PDF = EMBEBIDAS en base64** (`deck-fonts.ts`, ~673KB). Chrome print-to-PDF descarta web fonts por URL; embebidas = el PDF SIEMPRE sale en Geist. Si Geist cambia, re-generar el base64 de `public/landing/assets/fonts/*.ttf`.
- ✅ **Glass con BLUR REAL en el PDF** (`DECK_GLASS_SCRIPT` en deck-css.ts): `backdrop-filter` no se rasteriza al imprimir, pero **CSS `filter: blur()` sí**. El script (corre en load, ANTES del AUTOPRINT) clona el `img.bg` del slide DENTRO de cada `.glassify` (`.day`, `.tf-card`, `.faq-card`) con offset negativo = alineado pixel-perfect + blur(18px) + tinte (el background rgba original de la card). Pantalla y PDF se ven IGUALES. Validado con test headless aislado y en el PDF real de producción.
- **Nombre del archivo PDF = título de la experiencia** (`generateMetadata` en la ruta de print: el <title> es el filename que Chrome propone). El slide de cierre trae el botón "¿Interesado? Reserva aquí →" con link ABSOLUTO a `/caminante/reservar/<slug>` — los PDFs de Chrome conservan hyperlinks (clickeable en el archivo).
- ⚠️ **NO centrar cards con `transform: translateY(-50%)`** en el deck: Chrome fragmenta el desborde SIN el transform al imprimir (texto fuera de la card). Usar flex (`display:flex;align-items:center` en el slide), como quedó el FAQ.
- **Flyer para REDES (posts 4:5 de Instagram) — EN PRODUCCIÓN (8 jul):** botón "Flyer redes" en Eventos→detalle → `/caminante/admin/social/[slug]` (solo-admin). Reusa el MISMO deck en variante `social`: `deckCss("v",{social:true})` + `<ExperienceDeck social>` renderizan los slides a **720×900 (4:5)** con `SOCIAL_CSS` que comprime el aire del vertical (son posts del FEED, IG los muestra completos → sin zonas seguras). `SocialExport.tsx` exporta cada slide a **PNG 1080×1350 SIN librería**: serializa el slide a `<svg><foreignObject>` con su CSS (fuentes ya en base64) e imágenes convertidas a data-URI (`fetch`→`FileReader`; el bucket público de Supabase manda `access-control-allow-origin:*`) → canvas sin mancha → `toDataURL('image/png')`. Botón "Descargar" por-slide (confiable) + "Descargar todas" (Chrome pide permitir descargas múltiples). Glass rasteriza bien (los clones son `<img>` que se inlinean). Verificado E2E en prod (portada + itinerario, 1080×1350).
- **Invitación PÚBLICA (PDF):** `/caminante/invitar/[slug]` = el deck imprimible pero SIN gate, solo experiencias PUBLICADAS y solo fechas públicas (nunca privadas). Vertical por defecto, `<title>`=título → archivo `<Título>.pdf`. El botón "Descargar invitación (PDF)" de Mi espacio apunta aquí.
- **Verificación del deck:** ruta pública temporal `caminante/deckcheck/[slug]` (sin gate, + entrada TEMP en `SiteChrome.isImmersive` para que no la envuelva el nav del sitio — si no, la portada se parte en 2 páginas). Promover con la ruta → headless `--print-to-pdf` del dominio de PRODUCCIÓN (el alias de preview da 302) + PyMuPDF (páginas/fuentes/render) → borrar la ruta y su entrada en SiteChrome → promover limpieza.

## Arquitectura
- `src/lib/experiences/` — `types.ts` (contrato Experience), `queries.ts` (lee de Supabase), `data.ts` (fallback en código), `card.ts` (tarjeta), `actions.ts` (saveExperience, generateStripeLink), `template-assets.ts` (CSS inyectado).
- `src/app/caminante/experiencias/[slug]/` — página dinámica + `ExperienceTemplate.tsx` (lee con `fetchExperienceBySlug`).
- `src/app/caminante/admin/experiencias/nueva` + `ExperienceForm.tsx` — formulario (gated por admin).
- `src/app/caminante/calendario/page.tsx` — calendario dinámico.
- `src/app/caminante/SiteChrome.tsx` — oculta el nav viejo en rutas inmersivas.
- API: `/caminante/api/experiences` (tarjetas), `/caminante/api/admin/upload` (Supabase Storage, bucket `experiences`), `/caminante/api/admin/seed-experiences` (siembra dev).
- Landing: **estático** en `public/landing/index.html`, servido por un rewrite (`beforeFiles`) en `next.config.ts` para `/caminante`. El grid se llena en cliente desde la API.
- **Páginas de destino data-driven (14 jul):** `/caminante/destinos/[estado]` = ruta dinámica React (`src/app/caminante/destinos/[estado]/`, CSS `.dst` verbatim) que lee la tabla **`destinos`** (0023: estado/slug/is_published/`content` jsonb; RLS lectura pública). Reemplazó los HTML estáticos + rewrites por estado (los `.html` en `public/landing/destinos/` quedan como respaldo). **Fallback clave:** un estado sin fila renderiza página VÁLIDA (hero + grilla de experiencias en vivo + cierre) → **nunca 404** al dar de alta un estado nuevo. La grilla ya era dinámica (`exp-grid.js` filtra por `data-exp-grid="<Estado>"`). `estadoFromSlug` valida contra `ESTADOS` (slug no-estado → 404). Editor+IA del contenido = Fase 2 (pendiente); hoy se puebla con seed vía service-role.
- Supabase: tabla `experiences` (slug, status, data jsonb). Migraciones en `supabase/migrations/` se aplican **a mano en el SQL Editor** (no hay CLI).
- ⚠️ **Los archivos de migración ≠ el estado real de la base.** Antes del `0007`, la base solo tenía **4 tablas**: `admin_whitelist` (0002), `experiences` (0006), y `listings` + `providers` vacías (parte del 0001). El resto del marketplace del `0001` (profiles, trips, bookings, **payments**, etc.) **nunca se aplicó** a esta base — existe solo en el código. Si vas a alterar una tabla "vieja", verifica primero que exista (Database → Tables).
- ✅ **`0007_crm_experience_direct` APLICADA (8 jun).** Agregó `contacts`, `experience_slots`, `reservations`, `payments` (creada desde cero, atada a reservations — NO la del marketplace), `notion_sync_log`, y `experiences.notion_trip_url`. Total: 9 tablas. Es la base de la capa CRM/reservas (ver "Caminante · Arquitectura de Plataforma" en Notion).
- ✅ **`0008_registrations_medical` APLICADA (11 jun).** `medical_profiles` (perfil de seguridad reutilizable 1:1 contact, incl. bloque aseguradora: CURP, beneficiario…) + `registrations` (snapshot legal congelado por firma, **APPEND-ONLY: trigger bloquea UPDATE/DELETE incluso al service-role** — corregir un dato = editar `medical_profiles` y, si importa legalmente, re-firmar con nueva `waiverVersion`) + `contacts.birth_date` y `contacts.mailing_unsubscribed_at` (**las bajas de mailing son sagradas**: nada las reactiva salvo el propio usuario en su perfil). Slots de Ensenada sembrados (Jun 12-15 / Jun 18-21).
- ✅ **`0009_slots_optional_capacity` APLICADA (17 jun).** `experience_slots.capacity_total` deja de ser NOT NULL: **`NULL` = salida SIN TOPE** (no se "agota"). El check `seats_taken <= capacity_total` pasa con NULL; la columna generada `seats_available` queda NULL y el código la trata como ilimitada (sin conteo ni "Agotado", sin rechazo por cupo en `actions.ts` / `page.tsx` / `RegistrationForm.tsx` / `queries.ts` — `seatsAvailable: number | null`). `seats_taken` sigue como **contador informativo** (cuántos se registraron a esa fecha). Las salidas de Ensenada quedaron sin tope. **Reversible**: poner `capacity_total = N` re-topa una salida.

## Registro nativo (11 jun) — reemplaza al Google Form
- **`/caminante/registro/[slug]`**: formulario de registro + firma de deslinde con branding del sitio (diseño de Claude Design integrado en `RegistrationForm.tsx`). Se activa por experiencia desde el admin (sección "Registro y deslinde": versión, URL del doc del sistema legal, cláusulas-resumen).
- **Flujo del server action** (`src/lib/registration/actions.ts`): dedupe de contact en cascada (user_id → email → teléfono últimos-10-dígitos, helpers en `src/lib/crm/contacts.ts`) → upsert `medical_profiles` → reserva `confirmed` (reusa la existente, nunca retrocede status; incrementa `seats_taken` solo al crear — y solo bloquea por cupo si la salida tiene tope, ver 0009) → insert `registrations` (idempotente por unique reserva×contact×versión) → `notion_sync_log` con payload SOLO comercial (datos médicos JAMÁS van a Notion — LFPDPPP).
- **`/caminante/perfil`**: gated por login; el usuario ve/edita sus datos + perfil médico (lecturas vía RLS select_own) e historial de firmas (solo lectura). La liga user↔contact ocurre en `auth/confirm/route.ts` (`ensureContactLink`, por email, solo si `user_id is null`) + refuerzo lazy en el perfil.
- Sync al CRM: skill local `/sincronizar-registros` (lee `notion_sync_log` pendientes vía PostgREST con la service-role de `.env.local`, matching contra All Clients, write-back de `notion_page_url`/`notion_pipeline_url`).
- ✅ **EN PRODUCCIÓN (11 jun)**: registro nativo promovido a caminante.numanhub.com; service-role key de Vercel actualizada; flujo Google Forms eliminado (form/Sheet/Apps Script/guías a papelera — regla de sistema limpio); datos de prueba limpiados (procedimiento: `disable trigger registrations_immutable` SOLO en transacción y SOLO para datos de prueba, jamás reales).

## Cobro por persona vía WhatsApp (Stripe Payment Link por reserva) — FASE 1 pipeline
- **Migración `0014_reservation_payment_links` (PENDIENTE de aplicar a mano).** Agrega a `reservations`: `payment_link_url`, `payment_link_id`, `amount_due_mxn`. Antes vivía un solo Stripe link a nivel experiencia (`experiences.data.stripeLink` vía `generateStripeLink`); ahora hay link POR RESERVA (precio_por_persona × num_people).
- **`src/lib/payments/reservation-links.ts` (`createReservationPaymentLink`)**: precio por persona = `experience_slots.price_mxn` (si el slot lo define) → si no, `experience.data.price.amount` parseado. Crea product+price+PaymentLink con `metadata {reservation_id, contact_id, slot_id}` (Stripe la copia al Checkout Session → vuelve en el webhook). Guarda el link en la reserva y encola `notion_sync_log` action `payment_link_sent`. Reusa el link si ya existe (`reuseExisting`, default true). **Reusable por el bot de WhatsApp a futuro.**
- **`src/lib/payments/finalize-reservation.ts` (`finalizeReservationCheckout`)**: el camino BUENO sobre `reservations`/`payments` (NO confundir con `finalize.ts`, que es el marketplace dormido trips/bookings). Idempotente por `payments.provider_ref` (= PaymentIntent id). Recalcula status (`paid`/`partially_paid`) **solo avanzando, nunca retrocede** (RANK; no toca completed/cancelled). Encola `notion_sync_log` action `paid` (solo comercial).
- **Webhook (`/caminante/api/payments/webhook`)**: ahora maneja `checkout.session.completed` → `finalizeReservationCheckout`. El branch viejo `payment_intent.succeeded` quedó **guardado por `intent.metadata.trip_id`** (los PI de los Payment Links no lo traen → se ignoran ahí; su pago se procesa en el checkout.session). ⚠️ En el dashboard de Stripe hay que habilitar el evento `checkout.session.completed`.
- **Admin `/caminante/admin/cobro`** (`CobroForm.tsx` + action `src/lib/payments/cobro.ts` `generarCobro`): admin escribe slug + correo del cliente (+ nombre/WhatsApp/personas/slot opcionales) → dedupe de contact en cascada → reserva `requested` canal `whatsapp` (NO consume `seats_taken`; el cupo se consume al registrarse) → link de pago + mensaje listo para WhatsApp con botón copiar. **Es el "primer win" copy-paste, sin esperar a la automatización de WhatsApp.**
- Gotcha de pruebas: requiere Stripe en **modo live** (hoy TEST) + llaves de Vercel frescas (ver Pendientes #2/#4). En TEST funciona el flujo completo con tarjeta de prueba `4242…`.

## Pago DIRECTO en web (Stripe Checkout) — EN PRODUCCIÓN **LIVE** (1 jul)
- **DOS canales de venta distintos:** **web** = pagar en el sitio (self-serve), **redes sociales** = WhatsApp (`/admin/cobro`, cobro asistido). Son flujos separados a propósito.
- **Flujo web:** botón **"Reservar y pagar"** en las páginas estáticas → `/caminante/reservar/[slug]` (`page.tsx` + `CheckoutForm.tsx`) → **`createCheckout`** (`src/lib/payments/checkout.ts`) crea una **Stripe Checkout Session** (precio del slot × personas; metadata `{self_serve, experience_id, slot_id, operator_id, commission_pct, num_people}`) → webhook `checkout.session.completed` → **`finalize-selfserve.ts`** (`finalizeSelfServeCheckout`): dedupe contacto por correo + reserva **PAGADA** (`channel=web`) + `payments` + **operador atribuido**. → `/caminante/reserva/exito` → deslinde (solo si `registration.active`, si no lo omite para no dar 404). **NO depende de 0014/0015.**
- **Webhook** (`/caminante/api/payments/webhook`) llama primero `finalizeReservationCheckout` (WhatsApp, needs 0014); si `handled=false` → `finalizeSelfServeCheckout` (web). Idempotente por `payments.provider_ref` (= PaymentIntent).
- ⚠️ **STRIPE EN LIVE (1 jul):** cuenta de **NUMAN HUB** activada (onboarding + CLABE + payout **semanal lunes**; fondos nuevos con hold ~7 días). Llaves **live** en Vercel (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`). Webhook **live** "elegant-harmony" → `https://caminante.numanhub.com/caminante/api/payments/webhook`, evento `checkout.session.completed`. **E2E verificado con cobro REAL** ($2,550, `pi_live_…`, reserva pagada + atribuida) y **reembolsado** (Stripe MX no devuelve la comisión ~$110). El sandbox/test tiene su propio webhook "whimsical-celebration".
- **Links Stripe VIEJOS removidos** (`generateStripeLink` + botón "Generar link de pago" del admin + botón de pago en el éxito del registro): no pasaban por webhook → no registraban ni atribuían. Ahora hay **un solo camino web rastreado**.
- 🔗 **Para la sesión CFDI/Facturapi:** el webhook es el gancho; `payments.provider_ref` = `pi_…` = su `ref_cobro`. Agreguen el timbrado como **módulo aparte que el webhook llame** (no editar `finalize-selfserve` en conflicto). Cobros reales sin CFDI = `status_cfdi=por-emitir`.

## FLUJO COMPLETO OBLIGATORIO: deslinde para vender + correo al cliente (9 jul)
- **REGLA DE LUIS (caso Enyd, 9 jul): "no debe existir nunca un evento sin deslinde, sin flujo completo. Nunca."** (Enyd pagó 2 lugares de Hacienda San Andrés publicada SIN deslinde activo, y la pantalla de éxito prometía un correo que no existía.)
- **`deslindeListo(exp)`** (`src/lib/experiences/flujo-venta.ts`) = fuente única: ok ⇔ `registration.active` && ≥1 cláusula && **`waiverDocUrl` presente** (regla de Luis: quien firma SIEMPRE debe poder leer el PDF — el doc nunca vacío). La consultan **TRES gates**: (1) publicar desde el form (`ExperienceForm.onSubmit`), (2) publicar desde el dashboard (`setExperienceStatus` — antes no validaba NADA), (3) cobrar (`createCheckout` rebota `?error=deslinde`; `/reservar` muestra aviso en vez del form). Defensa en profundidad: aunque algo se cuele publicado, NO SE COBRA sin deslinde.
- **Los PDFs de deslinde viven en `public/legal/deslinde-<slug>.pdf`** (fuente: gdocs del sistema legal en Drive/CAMINANTE/legal; formato brandeado header sello+wordmark). El de Hacienda San Andrés se generó el 9 jul desde su gdoc con los placeholders resueltos (NUMAN HUB S.A. de C.V. / NHU250826CS8 / Prado Norte 525 / RNT en trámite — mismos datos que el de hongos). ⚠️ El gdoc de Drive aún tiene los placeholders sin resolver (actualizar a mano cuando se pueda).
- **Correo de confirmación AL CLIENTE** (`src/lib/notifications/notify-customer.ts`, patrón del correo de encuesta de feedback/send.ts): comprobante brandeado (experiencia/salida/personas/nivel/monto) + CTA "Firmar mi deslinde" (con `?reserva=`) si el deslinde está activo. Cableado en `finalize-selfserve` junto a `notifyNuevaReserva` (Promise.allSettled, best-effort, jamás tira el webhook). El copy de la pantalla de éxito ("te enviamos la confirmación...") ahora ES verdad.
- Estado deslindes (9 jul): ensenada ✓ · hongos ✓ (activo con doc — nota vieja de "hongos sin deslinde" QUEDÓ OBSOLETA) · bosque-volcanes ✓ COMPLETO (activado + PDF conectado 9 jul) · **mariposas SIN doc → el gate le impide vender** (su única salida ya pasó; al relanzarla, generar su deslinde con el sistema legal).

## REGLA: "prendido TODO antes de publicar" — deslinde + encuesta (3 ago)
- **REGLA DE LUIS (3 ago 2026): "siempre tiene que estar prendido todo antes de publicar la
  experiencia."** Nació del caso hongos: la salida del 26 jul salió con **18 personas y nadie
  recibió encuesta**. La casilla «Encuesta activa» del formulario **nace apagada**, ningún gate la
  exigía y el checklist no la mencionaba → se vendió, se viajó y se terminó sin medir; el único
  síntoma fue el silencio. Volcanes y barrancas estaban igual (configuradas pero apagadas).
- **`listaParaPublicar(exp)`** (`src/lib/experiences/flujo-venta.ts`) = `deslindeListo` +
  **`encuestaLista`** (activa && ≥1 categoría && `locationLabel`, que es la que arma el asunto
  «¿Cómo te fuiste de …?»). Es el candado ÚNICO de publicar y lo consultan **los dos caminos**:
  `ExperienceForm.onSubmit` y `setExperienceStatus` (este último era el bypass del gate del form).
- ⚠️ **La encuesta NO bloquea cobrar**, a diferencia del deslinde: una venta con la encuesta
  apagada no le hace daño al cliente. El candado va en publicar, que es donde Luis lo pidió.
- **Checklist** (`lib/kit/checklist.ts`): «Encuesta» es ítem **DURO** (ancla `#s16`) y
  `listoParaComunicar` lo exige junto a deslinde y salidas → se ve ANTES de intentar publicar.
- Estado (3 ago): las 4 publicadas + mariposas quedaron con **deslinde y encuesta activos**.

## Encuesta POR SALIDA en el panel (10 ago)
- El panel agrupaba las respuestas por **experiencia**. Con dos salidas de lo mismo eso esconde lo
  único que importa: **Ensenada mostraba «12 respuestas · 4.8★»** cuando en realidad son
  **Jun 12-15 · 7 · 4.6★** y **Jun 18-21 · 5 · 5.0★**. Ahora `RespuestasExp` agrupa por
  `salidaLabel` con conteo y promedio propios.
- **La salida de una respuesta sale de `experience_feedback.slot_id` (0031)** y solo si falta, de la
  reserva. Antes se resolvía SIEMPRE por la reserva → las respuestas del **link abierto de grupo**
  (un acompañante que no compró, sin reserva) salían sin salida. Caso real: Alexandra, hongos
  26 jul. Si el slot no tiene `label`, el label cae a la fecha en vez de quedar vacío.
- **`via: "correo" | "grupo"`** en `EncuestaRespuesta`/`EncuestaPersona` (se deriva de
  `reservation_id`, no de `source` — ver el bug de abajo). Chip «grupo» en la respuesta.
- ⚠️ **Bug corregido en `feedback/actions.ts`:** al enviar, el update escribía `source:"web"` fijo y
  **pisaba `source:'abierta'`** — la única marca de que la persona llegó por el link del grupo se
  borraba justo al responder. Por eso Alexandra quedó con `source='web'` en la base: respondió antes
  del fix. `via` se deriva de `reservation_id` precisamente para no depender del dato dañado.
- **Eventos → detalle:** columna **Encuesta** por salida (`respondidas/invitadas · promedio★`,
  best-effort vía `fetchSlotFeedbackStats`) que liga a `/admin/encuesta#res-<slug16>`.
- **`AdminShell`:** llegar con `#id` abre ese expandible y lo centra (`abrirHash`, + `hashchange`).
  Sin eso el link de Eventos aterrizaba en una tarjeta cerrada. Aplica a TODOS los `[data-x]`.

## Fechas de salida: el fin nunca antes del inicio (3 ago)
- La salida «Ago 29-30» de volcanes tenía `ends_at` en **JULIO** (mes tecleado mal) → el sistema la
  daba por terminada 4 semanas antes de salir. Como **`ends_at` dispara la encuesta (+24h)**, con la
  encuesta activa les habría llegado «¿cómo te fue?» a 6 clientes que aún no viajan. (La encuesta
  apagada fue lo único que lo evitó — accidente, no diseño.) Fecha corregida a mano en la base.
- Guard en los **tres** caminos que escriben `ends_at`: `slots-admin.ts` (form),
  `eventos-actions.ts` (dashboard, compara contra el inicio nuevo si viene en el mismo patch) y
  `solicitudes-actions.ts` (aprobar solicitud).
- ⚠️ **`send-surveys` corre 17:00 UTC (11am CDMX) y exige `ends_at` ≤ ahora−24h** → una salida que
  termina 5pm CDMX recibe encuesta ~42h después, no 24. El despacho es **idempotente** (salta las
  reservas que ya tienen fila en `experience_feedback`) y su ventana es de **60 días**, así que
  encender una encuesta tarde SÍ recupera salidas recientes. Se puede disparar a mano con el botón
  **Run** del cron en Vercel → Settings → Cron Jobs (el `CRON_SECRET` no está en `.env.local`).

## Participantes por reserva (multi-boleto + perfiles opcionales) — **EN PRODUCCIÓN (1 jul)**
- **Multi-boleto → cobro** ya existía: el selector "PERSONAS" de `/caminante/reservar/[slug]` cobra `precio_slot × num_people` y el cupo descuenta `Σ num_people` de reservas en HOLDING. Sin cambios.
- **Perfiles por participante (nuevo, OPCIONAL)**: en el deslinde `/caminante/registro/[slug]`, sección **"Participantes (opcional)"**, el titular agrega acompañantes (p. ej. hijos). **Decisiones de Luis**: el titular firma UN solo deslinde por todo el grupo; capturarlos es **opcional** (nunca bloquea pago ni firma).
- **Migración `0017_dependents_participants` APLICADA (1 jul)**: tabla `dependents` (perfil VIVO reutilizable bajo `guardian_contact_id`, mismos campos médicos que `medical_profiles`, RLS `dependents_select_own`; escrituras = service-role) + columna `registrations.participants jsonb` (roster CONGELADO al firmar: `[{dependent_id, full_name, birth_date, relationship, medical_snapshot}]`). Los menores **NO** son `contacts` (no ensucian CRM/Notion). Datos médicos = sensibles, jamás a Notion.
- **`submitRegistration`** (`src/lib/registration/actions.ts`): si viene `reservationId` (reserva pagada self-serve) ata el deslinde a ESA reserva (no crea otra, no toca `num_people`/status); por cada participante hace dedupe por `(guardián, nombre)` → insert/update en `dependents` → snapshot al array congelado. Con `participants` vacío = comportamiento de antes.
- **Éxito → deslinde**: `reserva/exito/page.tsx` resuelve la reserva desde `session_id` (Stripe → `payment_intent` → `payments.provider_ref`) y liga el CTA con `?reserva=<id>`. `/caminante/perfil` lista "Mis participantes guardados" (lectura RLS).
- ⚠️ **Solo aparece donde `experience.registration.active`** (el deslinde). Hoy **Ensenada** sí; **Hongos NO** (pendiente: configurar su doc legal en el admin, sección "Registro y deslinde", para que el flujo de participantes aplique ahí; hoy hongos cobra multi-boleto pero sin paso de deslinde/perfiles).
- Verificado E2E en preview (Ensenada, 2 hijos): dependients guardados + roster congelado + reserva pagada NO duplicada. **Limpieza de datos de prueba**: `registrations` es append-only (trigger `registrations_immutable`); borrar filas de prueba exige `disable trigger ... enable` en transacción en el SQL Editor — acción sensible que **Luis autoriza/ejecuta** (el clasificador de auto-mode la bloquea a Claude, por diseño).

## Entrada por rol + Mi espacio — EN PRODUCCIÓN (4 jul)
- **`/caminante/entrar`** = punto de entrada ÚNICO por rol: sin sesión → login (con `next` de regreso); admin → `/caminante/admin`; caminante → `/caminante/perfil`. Todos los botones "Entrar" apuntan ahí — la lógica de ruteo vive en UN lugar.
- **Landing estático**: botón "Entrar" (`.btn-entrar`, glass sobre hero / oscuro al scrollear) en `.nav-cta` + link en el drawer. Un script consulta **`/caminante/api/session`** (endpoint que SOLO devuelve `{role}`, cero PII, no-store) y re-etiqueta a "Mi espacio"/"Panel" si hay sesión.
- **Login** rebota sesiones activas por rol (ya no muestra el form). **SiteChrome** recibe `role` (no bool): sin sesión "Entrar", caminante "Mi espacio", admin "Panel". **AdminShell** tiene botón "Salir" (signOut).
- **Mi espacio** (`/caminante/perfil`, diseño Claude Design jul 2026, inmersivo): tarjetas fotográficas por reserva (foto = `experience.data.heroImageUrl`, fecha = slot label, chips pago/deslinde con RANK real, CTA "Firma tu deslinde" → `/registro/[slug]?reserva=`), salidas vividas (link a `/feedback/[token]` si la encuesta está pendiente), expediente en acordeones con edición inline. Arquitectura: `src/lib/perfil/queries.ts` (fetchMiEspacio) + `src/lib/perfil/actions.ts` (wrappers FormData) + CSS scopeado `.mesp` en `perfil/ui/espacio-css.ts`. `ProfileForm.tsx` eliminado.
- ⚠️ **`guardarMedicoAction` FUSIONA sobre el perfil actual**: el upsert de `updateMedicalProfile` escribe TODAS las columnas y el form de Mi espacio solo edita seguridad-en-campo — sin el merge se borrarían CURP/género/beneficiario capturados en el deslinde. No quitar el merge.
- **Notificación de reservas al admin** (`src/lib/notifications/notify-admin.ts`, cableada en `finalize-selfserve` y `submitRegistration`): cascada WhatsApp texto libre (bot, ventana 24h) → template `nueva_reserva` (UTILITY es_MX, 3 variables; creado vía API en el WABA 1419419650026975, esperar APPROVED) → correo Resend a uno@numanhub.com SIEMPRE. Best-effort: jamás tira el webhook.
- **Guarda anti-sobrescritura (5 jul):** `saveExperience(exp, {expectedSlug, allowOverwrite})` bloquea guardar sobre un slug existente (cualquier estado; usa el cliente admin — `fetchExperienceBySlug` NO sirve, filtra published) salvo que sea el que se edita (`expectedSlug`) o el admin confirme (`allowOverwrite`, aviso inline en el form). Motivo: el upsert por slug pisaba experiencias completas — casi pasa con `recoleccion-de-hongos` (Amecameca vs Xalatlaco con ventas reales).
- **Normalización de categorías cerradas (5 jul):** `ESTADOS` vive en `src/lib/experiences/estados.ts` (fuente única: form + esquema IA). El esquema de la IA fuerza enums (estado, moneda, lens key); los campos de patrón (`caraNo`, `context.no`, `vivir.num`, `itinerario.dno`) NO se piden a la IA — se estampan por índice en `aplicar-prellenado.ts`, que además trae `normalizarEstado` (alias edomex/cdmx/df/bcs…→canónico; sin match → vacío, nunca adivina), `normalizarLensKey` y `normalizarMoneda`.
- **Niveles de precio / priceTiers (5 jul, EN PRODUCCIÓN):** `Experience.priceTiers?: {label, amount}[]` (ej. Habitación compartida $11,500 / sencilla $15,000). `price` = base/"desde". Form: repetidor en la sección Precio. Página pública: "Inversión desde" + lista. **Cobro real:** `CheckoutForm` muestra selector "Tipo" si hay tiers; `createCheckout` resuelve el monto **server-side por índice** contra `priceTiers` guardado (JAMÁS un monto del cliente), `tier_label` va en metadata + nombre del producto Stripe, y `finalize-selfserve` guarda `Nivel: X` en `reservations.notes` (sin migración). Prioridad de precio: tier elegido → `slot.price_mxn` → `price.amount`. Sin tiers todo sigue igual (las 3 experiencias actuales no tienen).
- Gotcha de esta máquina (4 jul): **node se cuelga en el shell sandboxeado de Claude** (hasta `node -e` se congela) → tsc/eslint locales no corren; el build de Vercel (preview) es el verificador antes de promover.

## Pre-llenado con IA del formulario de experiencia — EN PRODUCCIÓN (5 jul)
- **Qué:** en "+ Experiencia" (`/admin/experiencias/nueva`, SOLO modo crear) hay un panel **"Pre-llenar con IA"**: subes itinerario PDF / brochure / imágenes / texto → Claude **Opus 4.8** devuelve la experiencia con la forma del `Experience` (solo texto) + salidas sugeridas → el form se llena → Luis revisa, sube fotos y guarda. Va con la regla "el formulario CREA": la IA solo PRE-LLENA, el humano revisa/guarda.
- **Arquitectura:** `src/lib/ai/prellenar.ts` (esquema JSON espejo de Experience + llamada HTTP directa a la API con `output_config.format` json_schema → salida estructurada garantizada; voz de marca; NO inventa datos logísticos, faltantes→vacío+`notas`) · `src/lib/ai/aplicar-prellenado.ts` (merge NO destructivo: jamás pisa con vacío; preserva fotos por índice en lenses/vivir/aliados; mapea slots IA→filas del form) · `api/admin/prellenar/route.ts` (POST multipart, gate `isCurrentUserAdmin`, PDF/imagen/texto, **límite 4 MB** = body de Vercel, DOCX→PDF, `maxDuration 60`) · `admin/experiencias/PrellenarIA.tsx` (panel, design system `.adminexp`).
- **API key:** `ANTHROPIC_API_KEY` (key `caminante-prellenar`, org NUMAN HUB en console.anthropic.com). En `.env.local` (local) y Vercel Production+Preview (la pegó Luis). Prepago por uso: ~$0.05 USD por pre-llenado (verificado E2E con itinerario de ballena gris: extrajo precio/cupo/fecha/incluye/cancelación textual, redactó las 4 caras en voz de marca, y en `notas` reportó honestamente qué omitió sin inventar).
- **Gotcha env var:** Vercel captura las env vars al crear el deployment → tras guardar una key nueva hay que **rebuild** (commit vacío) antes de promover, o el runtime no la ve.
- Costo del modelo (5 jul): Opus 4.8 = $5/$25 por millón de tokens in/out. Un itinerario ≈ 1.8k tokens salida.

## Solicitar nueva fecha + grupos privados por link — EN PRODUCCIÓN (8 jul)
- **Flujo completo:** el viajero pide una fecha en `/caminante/solicitar/[slug]` (botón "Solicitar nueva fecha" en toda experiencia v2; CTA principal si no hay fechas abiertas) → cae en `slot_requests` + notificación al admin (`notifySolicitudFecha`: WhatsApp→template `nueva_reserva` reutilizado→correo Resend SIEMPRE) → el admin la **aprueba en `/caminante/admin/solicitudes`** (nace la salida real) o la rechaza. NADIE paga al solicitar.
- **Migración 0018 APLICADA:** `experience_slots.visibility` ('public' default | 'private') + `access_token unique` (+ check private⇒token) y tabla `slot_requests` (contact, experiencia, desired_date/nota — check "al menos uno", num_people, group_type, status new/approved/rejected, created_slot_id). RLS sin policies (solo service-role).
- **Salidas PRIVADAS (grupo con link):** solo existen con su link `…/caminante/experiencias/<slug>?grupo=<token>` (token: `crypto.randomBytes(16).toString("base64url")`; SIEMPRE sanitizar con `cleanGrupoToken` de availability.ts antes de filtros PostgREST). Puntos que filtran `visibility='public'`: `fetchOpenSlotsForTemplate` (acepta `{grupoToken, includePrivate}`; preview/print admin = includePrivate), `fetchPublicAvailability`, `/reservar` (con token muestra SOLO esa salida), picker del deslinde (los de grupo llegan con `?reserva=`). `createCheckout` exige token exacto server-side para slots privados + **check de cupo real antes de cobrar** (aplica también a públicas). El form de experiencia NO ve/toca privadas (carga solo open+public; el cierre masivo tampoco las toca).
- **`Experience.minPeople`** (jsonb, campo "Mínimo para salir" en Fechas & cupo): informa y valida el form de solicitud (releído server-side en `submitSlotRequest`).
- **Panel `/caminante/admin/solicitudes`** (`solicitudes-actions.ts`, cada action re-verifica admin): aprobar = insert DIRECTO en `experience_slots` (open, visibility elegida, token si privada, endsAt recordado para la encuesta +24h) + update request; muestra **link + mensaje WhatsApp copiables** (patrón CobroForm). Idempotente: re-aprobar re-muestra el link. ⚠️ `approveSlotRequest` NO hace revalidatePath (refrescaría y el panel con el link desaparecería antes de copiarse). Badge de pendientes en AdminShell (best-effort). En Eventos→detalle: chip "Privada" + "Copiar link".
- **E2E verificado en producción** (8 jul): fuga de visibilidad (6 checks), solicitud desde la web (contact dedupe + notificación), aprobación → slot privado + link funcionando. Datos de prueba zz-/dash-test limpiados.

## Solicitar nueva fecha + grupos privados por link — EN PRODUCCIÓN (8 jul)
- **Flujo completo:** el viajero pide una fecha en `/caminante/solicitar/[slug]` (botón "Solicitar nueva fecha" en toda experiencia v2; CTA principal si no hay fechas abiertas) → cae en `slot_requests` + notificación al admin (`notifySolicitudFecha`: WhatsApp→template `nueva_reserva` reutilizado→correo Resend SIEMPRE) → el admin la **aprueba en `/caminante/admin/solicitudes`** (nace la salida real) o la rechaza. NADIE paga al solicitar.
- **Migración 0018 APLICADA:** `experience_slots.visibility` ('public' default | 'private') + `access_token unique` (+ check private⇒token) y tabla `slot_requests` (contact, experiencia, desired_date/nota — check "al menos uno", num_people, group_type, status new/approved/rejected, created_slot_id). RLS sin policies (solo service-role).
- **Salidas PRIVADAS (grupo con link):** solo existen con su link `…/caminante/experiencias/<slug>?grupo=<token>` (token: `crypto.randomBytes(16).toString("base64url")`; SIEMPRE sanitizar con `cleanGrupoToken` de availability.ts antes de filtros PostgREST). Puntos que filtran `visibility='public'`: `fetchOpenSlotsForTemplate` (acepta `{grupoToken, includePrivate}`; preview/print admin = includePrivate), `fetchPublicAvailability`, `/reservar` (con token muestra SOLO esa salida), picker del deslinde (los de grupo llegan con `?reserva=`). `createCheckout` exige token exacto server-side para slots privados + **check de cupo real antes de cobrar** (aplica también a públicas). El form de experiencia NO ve/toca privadas (carga solo open+public; el cierre masivo tampoco las toca).
- **`Experience.minPeople`** (jsonb, campo "Mínimo para salir" en Fechas & cupo): informa y valida el form de solicitud (releído server-side en `submitSlotRequest`).
- **Panel `/caminante/admin/solicitudes`** (`solicitudes-actions.ts`, cada action re-verifica admin): aprobar = insert DIRECTO en `experience_slots` (open, visibility elegida, token si privada, endsAt recordado para la encuesta +24h) + update request; muestra **link + mensaje WhatsApp copiables** (patrón CobroForm). Idempotente: re-aprobar re-muestra el link. ⚠️ `approveSlotRequest` NO hace revalidatePath (refrescaría y el panel con el link desaparecería antes de copiarse). Badge de pendientes en AdminShell (best-effort). En Eventos→detalle: chip "Privada" + "Copiar link".
- **E2E verificado en producción** (8 jul): fuga de visibilidad (6 checks), solicitud desde la web (contact dedupe + notificación), aprobación → slot privado + link funcionando. Datos de prueba zz-/dash-test limpiados.

## Banco de fotos tipificado + Ficha científica + Serie E del Kit (19 jul)
- **Modelo (SIN migración, jsonb en `experiences.data`):** `Experience.photoBank` (8 slots tipados de fotos: `flora/paisaje/comunidad/comida/gente` núcleo + `problemas/cielo/detalle` extra, todos `string[]`) y `Experience.ficha` (`especies[]` {comun, cientifico?, datos:{texto,fuente}[]} · `datos[]` {n?, texto, fuente, cara?} con cara ∈ biologia/conservacion/comunidades/problemas · `glosario[]` {termino, def} · `temporada[]` {epoca, fenomeno, fuente?}). **La fuente es OBLIGATORIA** en especies.datos y datos del lugar — sin fuente el dato no entra.
- **Form** (`ExperienceForm.tsx`): secciones «Banco de fotos» (s1b: 5 grids núcleo reusando MultiAdd/.gal-slot + acordeón «Más tipos» con los 3 extra) y «Ficha científica» (s1c: repetidores + botón **«Extraer con IA de mis PDFs»** → `api/admin/ficha-ia` calcada de prellenar (multipart ≤4MB, gate admin, Opus) + `src/lib/ai/ficha-ia.ts` — esquema en el system (NO `output_config.format`: gotcha "compiled grammar is too large"), JAMÁS inventa (faltantes → arreglos vacíos), **merge NO destructivo** en cliente (dedupe por comun/texto/termino/época y solo entra lo que trae texto+fuente).
- **Kit:** `fetchKitContext` expone `photoBank`/`ficha`; `poolFor(ctx, salt, {exclude?, categorias?})` prioriza fotos del banco de las categorías pedidas → resto del banco → pool clásico (galería+fondos), dedupe por fileKey — **compat total: sin banco todo cae al pool de siempre**. Piezas **serie E (E1–E8, momento "E · Informativo")** en `PIEZAS_E` (kit.ts): E1 Ficha de especie · E2 El dato · E3 Glosario · E4 Temporada · E5 Comunidades · E6 Conservación · E7 Problemas · E8 Postal (E8 siempre lista con fallback a galería; el resto = "pendiente de insumo" con razón clara apuntando a la sección faltante). **Kinds de lámina EXISTENTES provisionales** con el mapeo aislado en `laminasE1..E8` para swap fácil cuando Claude Design entregue los definitivos. La página del kit las muestra bajo «Catálogo informativo» con las MISMAS cards y controles (heredan Publicar/Programar de KitPieceControls sin tocarlo); `kit-actions` genera captions también para las E listas y `kit-captions` trae reglas serie E (educativas atemporales, jamás vender, fuente abreviada permitida, E5/E7 sin CTA).

## Captions del Kit: anatomía §1 + LOS 3 PORQUÉS §6 (19 jul)
- **Fuente de verdad:** `Drive/CAMINANTE/playbook/04-FORMULAS.md` (fórmulas extraídas del benchmark real de @enmarcha.mx). ⚠️ Ese doc **afirmaba** que la plataforma ya las traía integradas y **no era cierto**: el generador solo pedía hook/caption/hashtags/cta. Ahora sí lo están §1 y §6 (ver «pendiente» abajo).
- **§1 Anatomía:** gancho ≤90 car. → contexto → tensión/dato → profundización (opc.) → **CIERRE CON PREGUNTA directa al lector, en TODOS los captions sin excepción** (ahí viven los comentarios). El CTA va DESPUÉS de la pregunta y jamás la sustituye — aunque la pieza no lleve CTA (E5/E7), la pregunta va.
- **§6 Los 3 porqués (OBLIGADO antes del cierre):** safe (el dato) → real (lo que implica) → **raw** (la verdad humana). **La pregunta del cierre SIEMPRE sale del tercer porqué, nunca del primero** (caso verificado: 7.8K likes con pregunta existencial vs ~1.2K con dato solo). El ejemplo del manual (meteoros → cielos oscuros desapareciendo → la luz de las ciudades → «¿cuántos estaremos mirando cuando suceda?») va literal en el system prompt.
- **Implementación** (`src/lib/ai/kit-captions.ts`): `KitCaption` suma `cierre?` (la pregunta) y `porques?` ({safe, real, raw}) — **ambos opcionales** para no romper los captions ya guardados en `experiences.data.kitCaptions`. La IA debe ESCRIBIR los tres porqués (forzar el trabajo, y así es auditable), pero son **nota interna: `captionToText` NUNCA los publica**. Orden del texto copiable: gancho → cuerpo → pregunta → CTA → hashtags. Si la IA no devuelve `cierre`, se deja vacío — no se fabrica.
- **UI:** cada tarjeta del kit muestra un `<details>` «Los 3 porqués · de dónde salió la pregunta» (clase `.porq`) para auditar la profundidad de un vistazo.
- **§2/§3 Palabra-trigger:** `KitCaption.trigger?` = la línea «Comenta PALABRA y te mando las fechas» (palabra CORTA, UNA, en MAYÚSCULAS, ligada al tema; la promesa se cumple **en el DM**, nunca con un link). **SOLO en P4–P6 y E4** — el set `CON_TRIGGER` en kit-captions.ts marca esas piezas con `[LLEVA TRIGGER]` en el prompt **y además filtra la respuesta**: aunque la IA se despiste, el trigger no puede aparecer en lanzamiento (P1–P3) ni en las informativas puras. Va después del CTA en el texto copiable. `palabraTrigger()` extrae la PALABRA de la frase → chip **«👁 vigilar: PALABRA»** en la tarjeta de la pieza: es la señal de qué revisar en comentarios (cada uno = un lead que se contesta por DM).

## Motor v2 de redes: métricas, reporte semanal, scheduler global y checklist (20 jul)
- **Métricas de IG** (`0027_social_insights` APLICADA + `src/lib/social/insights.ts` + cron `fetch-insights` diario): `refreshInsights()` pide `like_count`/`comments_count` como campos del media y `saved`/`reach` como *insights* (la Graph API los sirve en endpoints distintos). ⚠️ **Métrica ausente = `null`, que NO es 0** (permiso faltante o tipo de media ≠ midió cero). **Decisión de diseño (mejor que columnas en social_posts):** tabla APARTE — la cola de publicación es el camino crítico y algo secundario como las métricas jamás debe poder romperla; `insights.ts` solo LEE `social_posts`.
- **«Qué está funcionando»** en `/admin/social-cola`: promedio por **TIPO de pieza** (P2 vs E3…), no por post suelto — la pregunta útil del playbook §8 es qué formato repetir. `puntaje() = likes + 3×comentarios + 3×saves` (comentarios y saves son las señales que mueve el algoritmo; coincide con lo que midió el benchmark). Best-effort: si la tabla no existiera, la página no se cae.
- **Reporte semanal** (`notifications/reporte-semanal.ts` + cron lunes 15:00 UTC): qué se publicó, ranking a 90 días, qué sale esta semana y cuál formato repetir. Mismo patrón Resend que notify-admin (ojo con el User-Agent: sin él, Cloudflare responde 403).
- **Scheduler GLOBAL:** `computeCampaignSchedule(..., { busyDates })` empuja cada pieza al siguiente día libre y reserva el suyo; `social/agenda.ts` (`fetchBusyDates`) lee los días vivos de TODA la cola. Sin esto cada campaña se calculaba sola y dos caían el mismo día — pasó de verdad con Hongos (tres campañas colisionaron el 20 y el 23 jul; esas se re-acomodan a mano en la UI de la cola). El único toque a `publish-actions.ts` son 2 líneas dentro de `programarCampana`; **`publish.ts` y el cron de publicar siguen en CERO cambios** (esa es la frontera real: el camino crítico de publicación).
- **Checklist «Comunicación lista»** (`lib/kit/checklist.ts` + `ChecklistComunicacion.tsx`, sección `#s0` del formulario): semáforo calculado sobre el estado VIVO del form (sin guardar) — fotos n/5 slots núcleo · ficha ✓/✗ bloque por bloque con la pieza que desbloquea · saber de guías para E5 (**nombre sin biografía NO cuenta**: el retrato cita saber real) · deslinde (activo+cláusulas+PDF) · salidas. Cada ítem linkea a su sección. «Generar captions» corre inline (`generarCaptionsDesdeForm`, reusa el generador del Kit y regresa al form); **«Programar campaña» abre el Kit a propósito** — esa acción rasteriza las láminas del DOM para subir las imágenes y en el formulario no existen.
- **Facebook: CERO código.** Se activa como crosspost nativo desde la config de Instagram. Cuando exista un segundo canal real se diseña bien (nada de un campo `provider` "por si acaso").
- **Newsletter: pendiente a propósito.** Las 4 plantillas las diseña Claude Design («La carta», «Un dato», «Guía de campo», «Así se vivió») con reglas de email (tablas, CSS inline, 600px, fallback de fuentes) + migración 0028 y flujo de baja. Construirlo antes de tenerlas = rehacerlo.

## SEGUNDO sistema visual: EDITORIAL (serie E del Kit) — 19 jul
- **Dos sistemas visuales conviven en el Kit.** El **promocional** (P1–P10) vende una salida con un cartel: chrome de marca en toda lámina (sello + momento + pie de colaboradores), CTA. El **editorial** (E1–E8, de Claude Design, `Caminante Web - Sistema Editorial.html`) **cuenta una historia en secuencia** (portada → cuerpos → cierre) y **jamás vende**: marca mínima (sello en la portada, firma en el cierre), foto e idea, naranja con cuentagotas.
- ⚠️ **NAMESPACE `edu-` (regla dura).** Claude Design entregó clases genéricas (`.slide`, `.photo`, `.mark`, `.caption`, `.ficha`…) que **colisionaban de frente** con el promocional. Todo el sistema nuevo va prefijado (`.edu-slide`, `.edu-photo`, `.edu-hook`…). **Las láminas E conservan ADEMÁS la clase `.slide`**: el exportador rasteriza `[data-piece="X"] .slide` (KitClient) y **KitPieceControls no se toca** — así las E heredan Publicar/Programar gratis. `.edu-slide` solo sobreescribe lo visual (fondo oscuro), el tamaño lo sigue dando `.slide`.
- ⚠️ **Nada de @import de Google Fonts** en el CSS del kit: el export serializa a SVG y las fuentes por URL se pierden (mismo gotcha que `deck-fonts.ts`). Se usa la **Geist embebida en base64** (`DECK_FONTS`).
- **8 kinds nuevos** en `Lamina` (kit.ts), markup 1:1 de las funciones del HTML, render en `KitDeck` (`EduSlide`): `edu-portada` (gancho+teaser+→) · `edu-cuerpo` (caballo de batalla: claim itálico + caption, texto al tercio inferior izq.) · `edu-ficha` (nombre + científico + filas k/v con hairlines) · `edu-cierre` (síntesis + vuelta de tuerca + firma) · `edu-postal` · `edu-dcover` (portada macro con índice) · `edu-dentry` (**lámina de espécimen: foto 58% / banda de papel 42%, corte nítido**) · `edu-retrato`.
- **E1–E8 son SECUENCIAS** alimentadas por `ficha` + `photoBank` reales (los textos del mockup eran placeholder): E1 portada+fichas+cierre · E2/E4/E6/E7 portada+cuerpos+cierre · E3 dcover+dentries+cierre · E5 portada+retratos+cierre · E8 postal suelta. **El cierre solo se emite si hay material real** (statement/hero) — no se inventa remate. Las filas de la ficha salen de partir el dato en `"Clave: valor"`.
- ⚠️ **E5 solo retrata PERSONAS con saber escrito** (`retratables()`): `guias()` también devuelve los items sueltos de los splits, que en hongos son **variedades de hongo** (Pambazo, Chilero) — salían retratadas como personas y con su propio nombre repetido como cita. Se exige bio o credencial real; **jamás una cita inventada**.
- **Ajustes por texto real** (el mockup traía rótulos cortos en inglés/2 palabras): `.edu-pb-t` 100→76px y `.edu-plate-term` 78→68px con `break-word`; la postal toma **la primera oración del candidato más corto** (el subtítulo del hero llenaba media lámina truncado).
- **Story 9:16:** el diseño anclaba a bottom 68–132px, que en 1280 de alto cae bajo la barra de respuesta de IG. Overrides que suben los bloques ~200px y respetan **~250px de zona segura** arriba y abajo (sellos a top 250, créditos de fuente a bottom 250). La lámina de espécimen usa % y adapta sola.
- **Prueba de no-regresión obligatoria al tocar este CSS:** la huella de estilos computados de `[data-piece="P1"]` debe ser IDÉNTICA a producción (147 elementos, mismo hash) → el PNG exportado del promocional no cambió.

## REDISEÑO del sistema editorial (serie E) — 5 principios (21 jul)
- **Alcance:** SOLO serie E (E1–E8); el promocional P1–P10 y el publicador intactos. Se arregló el RENDER y la LÓGICA DE ARMADO, no los datos (ficha + banco ya poblados).
- **P1 · la foto NUNCA contradice el texto:** el reparto de fotos es un **registro global (ledger)** en `kit.ts` (`makeLedger`/`buildSerieE`) que da fotos ÚNICAS por slot. **FONDO NEUTRO = `paisaje`+`cielo`** es el único fondo válido detrás de CIENCIA (E2 dato, E3 glosario, E4 temporada, E6 conexión). **FOTO-SUJETO = `gente`/`comunidad`/`detalle`** solo en E5 (retratos) y postales E8. E3 pasó de `flora/detalle` a NEUTRO. Si no alcanzan fotos-paisaje únicas → **menos láminas o pendiente**; el pill lo dice a la cara: **«Faltan fotos»** (regex `/foto/i` sobre la razón) vs «Falta insumo» (datos).
- **P2 · peso editorial:** `.edu-claim` pasó de `700 italic` → `300 normal`; el bold/itálica solo para un acento corto (`**...**` → `.edu-claim b`). Retrato con clases (`.edu-cita`/`.edu-retrato-*`), sin estilos inline.
- **P3 · nada de medias piezas:** gate de **≥2 láminas de contenido**; **E4 exige ≥3 épocas** (que cuente el AÑO). Verificado: volcanes (3 épocas) E4 LISTA·4; barranca (2 épocas) E4 PENDIENTE.
- **P4 · la marca susurra:** **E7 «Lo incómodo» ELIMINADA** (de `PIEZAS_E` y su builder → 17 piezas, no 18). Fuera el pie de página (sello grande + etiqueta de momento), el `edu-sign` y la **lámina de cierre genérica** (`eduCierre` borrada — ya no sale «Baja al fondo,» truncado e igual en cada pieza). El sello de las postales (chico, esquina `top:44 left:64`) es el estándar en TODA lámina `.edu` (`<EduSeal/>`).
- **P5 · nada se repite:** el ledger global (portadas primero) → ninguna foto dos veces ni entre láminas contiguas (`takePref` marca la foto propia del guía como usada). **E8 = 4–6 postales**, cada una foto distinta (paisaje/gente/detalle) + eyebrow «NUESTROS VIAJES», sin dato/fuente/CTA.
- **Orden de reparto de fotos** (≠ display): E4 (estrella) → E2 → E3 → E6 (neutro) → E1 (flora) → E5 (gente/comunidad) → E8 (última, así la ciencia se queda el paisaje). `buildSerieE` memoizado por ctx (WeakMap); cada `PIEZAS_E[i].build` delega a `buildSerieE(ctx)[id]`.
- ⚠️ **Gotcha de verificación:** el Kit es inmersivo y pesado; en el Browser pane el scroll/screenshot va al twin (~1Hz) y es poco fiable. Verificar por **JS sobre el DOM** (`[data-piece=Ex] .slide` count, `getComputedStyle` de `.edu-claim`/`.edu-seal`) — así se confirmó peso 300, sello en las 22 láminas, cierre residual 0, E8=6 postales.
- **Verificado E2E** (build Vercel verde, rama `edu-redesign`): volcanes (6 paisaje → E4 lista, E2/E3/E6 «Faltan fotos») y barranca (17 paisaje → E2·7, E3·5 láminas; E4 pendiente por 2 épocas). **NO promovido** (espera visto bueno de Luis).

## Comunicación = sección del panel (el Kit sale de dentro de las experiencias) — 21 jul
- El Kit **ya no vive dentro de la experiencia** (se quitó el botón «Kit de comunicación» del detalle de evento → ahora un botón **«Comunicación →»** que lleva a la sección con `#ev-<slug>`). Nueva sección **`/caminante/admin/comunicacion`** (píldora en `AdminShell`, `AdminSection` "comunicacion").
- **Organización:** arriba la **cola de redes GLOBAL** (toggle Calendario/Lista, reusa `ColaCalendar` + `?view=lista`); abajo **un desplegable POR EVENTO** (`fetchEventos` + `[data-x]` de AdminShell) con: «Abrir Kit →», PDF vertical/horizontal, Flyer redes, Ver evento, y la cola de ESE evento (agrupada de `listRecentPosts`). Un script abre el desplegable si se llega con `#ev-<slug>`. `social-cola` sigue existiendo (enlazada desde el Kit).

## BOLETÍN (newsletter) — 19 jul · CONSTRUIDO, 0028 APLICADA y E2E verificado
- **4 plantillas de Claude Design** (`La carta` · `Un dato` · `Guía de campo` · `Así se vivió`) extraídas **VERBATIM** a `src/lib/newsletter/templates.ts`. ⚠️ **NO "modernizar" esa maquetación**: es HTML de CORREO (tablas `role="presentation"`, CSS 100% inline, 600px fijo, `bgcolor` en los `<td>` porque Outlook ignora `background` en style, preheader oculto con `&zwnj;&nbsp;`, `meta color-scheme` para modo oscuro). ~9KB por correo, muy debajo del corte de Gmail a 102KB.
- ⚠️ **El mockup traía DATOS INVENTADOS** — verificados y corregidos antes de codificar (es la 2ª vez que pasa; la 1ª fueron los roles de guías de la serie E): (1) firmaba **«Andrea, guía Caminante», que NO EXISTE** → firman **LUIS**; (2) domicilio «Insurgentes Sur 1602» → el fiscal REAL de NUMAN HUB, transcrito de los **PDFs de deslinde en `public/legal/`** (Prado Norte 525, Int. 204, Lomas de Chapultepec I Sección, Miguel Hidalgo, C.P. 11000), nunca de memoria; (3) listaba salidas a «Ajusco» y «Nevado de Toluca», que no son nuestras → el bloque es **data-driven desde `experience_slots`** (cupo NULL = «abierta», sin inventar número); (4) referenciaba assets inexistentes → creados `public/email/caminante-mark-{ink,crema}.png` desde el sello.
- **Compositor** (`compose.ts`): pre-llena desde la **MISMA fuente que el resto del Kit** (regla de Luis, un solo origen): dato con su fuente de la **ficha científica** + cuerpo de una **pieza de la serie E** + **salidas reales** del slug. Ficha vacía ⇒ devuelve `faltantes` y la UI lo dice; **jamás inventa**.
- **Envío** (`send.ts` + `actions.ts`): reusa `sendViaResend` (reintento 429/5xx, multipart) y **la baja HMAC que YA existía** (`lib/email/unsubscribe` + `/caminante/api/unsubscribe`, one-click RFC 8058, página brandeada) — **no se construyó una ruta `/baja` nueva**: habría sido un segundo sistema de bajas, y ese es justo el que no debe divergir. Destinatarios = `contacts` con correo y `mailing_unsubscribed_at IS NULL`, dedupe por correo. **Nada del módulo ESCRIBE esa columna: solo la lee para excluir.**
- **Envío real = DOS PASOS**: el primer submit no manda nada, devuelve un token HMAC atado a `(slug, plantilla, asunto, N destinatarios)`; el segundo exige ese token **y que el conteo siga igual** — si alguien se dio de baja entre paso y paso, se aborta y se vuelve a confirmar con el número nuevo. La prueba a `uno@numanhub.com` no pide confirmación (es inofensiva y debe estar a mano). **Sin cron: v1 la dispara Luis.**
- **`0028_newsletters` APLICADA** (la UI se degradaba sola mientras no existía: mostraba la nota en vez de romperse — ya no aplica). **E2E verificado en producción**: prueba real llegó a `uno@numanhub.com` (bandeja, no spam; preheader visible; fotos absolutizadas — ver gotcha abajo) y la vuelta completa de la baja: link firmado del pie marca `mailing_unsubscribed_at` y ese contacto queda fuera del siguiente conteo de destinatarios; el botón nativo "Cancelar suscripción" de Gmail (one-click, POST) también la marca. Apple Mail sin verificar (no se usó control de la máquina del usuario para esa comprobación).
- ⚠️ **Gotchas encontrados en el primer envío real** (el build verde no los detectó — solo el correo entregado de verdad): (1) las fotos de experiencias viejas guardan rutas locales (`/landing/assets/img/…`); en un correo NO hay documento base, así que un `src` relativo no resuelve en NINGÚN cliente → toda URL se absolutiza contra `https://caminante.numanhub.com` antes de salir (`abs()` en `templates.ts`); (2) el dato destacado salía DUPLICADO en «La carta» (como apartado Y como bloque naranja) porque ambos se arman desde la misma ficha → los apartados que repiten el texto del dato se descartan comparando por firma de palabras (`compose.ts`); (3) el titular tomaba el subtítulo completo del hero (4 renglones a 29px) → ahora toma solo la primera oración.

## Boletín: deliverability (Promociones/spam) + logo + corte en iPhone (20 jul)
- **Remitente por defecto de TODO correo a cliente ahora es `Luis · Caminante`** (`src/lib/email/resend.ts`, constante `FROM_NAME`) — antes era `Caminante` a secas. Medido con el boletín: un correo firmado por una PERSONA (no la marca) cae más seguido en Principal/Inbox que en Promociones/spam. La dirección real sigue siendo `caminante@numanhub.com` (DKIM/DMARC verificado) — solo cambia el nombre visible. `fromName` sigue existiendo como override puntual si algún correo futuro quisiera otro nombre. Aplica a los 4 correos a cliente: encuesta (`feedback/send.ts`, 2 call sites), confirmación de compra + recordatorio de deslinde (`notifications/notify-customer.ts`), y el boletín (`newsletter/send.ts`, ya lo tenía). Verificado por Luis vía captura real: Apple Mail iPhone lo mostró en Bandeja de entrada, no en promociones.
- **Sello del header, dos bugs sucesivos hasta quedar nítido**: (1) el PNG se generaba en lienzo CUADRADO 52×52 pero el SVG real del sello mide ≈3.59:1 (437×122) → mostrado a 26×26 se veía como una astilla de ~26×7px, "diminuto". Fix 1: regenerar a proporción real 86×24 mostrado a 43×12. (2) Con ese fix el sello se veía "gris/desvaído" — causa: solo 2× de densidad real para pantallas retina. Fix final: regenerar a **188×52 (4× el tamaño de display 47×13)** para trazos negros sólidos sin anti-aliasing. Ambos PNG (`public/email/caminante-mark-{ink,crema}.png`) y el `<img width/height>` en `templates.ts` quedaron en el tamaño final.
- **Corte de contenido en Apple Mail iPhone** ("se corta un poco hasta abajo del correo"): diagnóstico por evidencia, no adivinado — se leyó el `srcdoc` real del iframe de Vista Previa (mismo HTML que se manda) y se confirmó 11 `<table>` abiertas = 11 cerradas, pie completo presente → **descartado bug de generación de HTML**. Mitigación aplicada (no 100% probada como causa única, pero es la práctica estándar): `salidas()` en `templates.ts` tenía una tabla anidada POR FILA (tabla dentro de tabla, ×N salidas — la estructura más profunda y repetida del documento); se aplanó a una sola fila con dos `<td>` (mismo layout visual de 2 columnas, un nivel menos de anidación total). Verificado con un envío real de prueba tras el fix; pendiente que Luis confirme visualmente en su iPhone si el corte desapareció.

## Cola de redes: la hora mostrada de una PROGRAMADA (fix de display, 21 jul)
- **Síntoma:** la cola y la tarjeta del Kit mostraban "2:00 a.m." en cada pieza programada. Luis vio un post salir ~1pm "cuando decía 2am" y dudó de si algo falló. **La hora engañaba.**
- **Causa (NO es bug de lógica):** `campana.ts` (`atPublishHour`) normaliza `scheduled_at` a **08:00 UTC (≈02:00 CDMX) solo para marcar el DÍA**; el cron de publicación corre **1×/día a las 19:00 UTC = 13:00 CDMX** y toma todo lo que tenga `scheduled_at <= now`. O sea: la hora guardada NUNCA fue la hora de publicación, solo el día. (Dado el cron diario, ~1pm es la hora real incluso para las programadas a mano.)
- **Fix = SOLO display** (no se tocó campana.ts ni el scheduler): una PROGRAMADA muestra `fecha · ~1:00 p.m.` (hora REAL del cron), no la normalizada. Las PUBLICADAS siguen con su `published_at` real. Constante única en **`src/lib/social/publish-hora.ts`** (`HORA_PUBLICACION` "~1:00 p.m." + `HORA_PUBLICACION_CORTA` "~1pm" para el chip angosto). Aplicado en la lista y el calendario de `/admin/social-cola` y en la tarjeta del Kit (`cicloDe` + detalle).
- ⚠️ El cron es **diario** (tope de Hobby). Si algún día se quiere hora exacta por pieza, es una conversación de granularidad aparte — aquí solo se corrigió que la etiqueta no mintiera.

## Captions del Kit: generación POR LOTES (bug de timeout, 20 jul)
- **Síntoma:** «Generar captions con IA» no hacía nada — ni error, ni captions (barrancas y volcanes se quedaron vacíos). **Causa medida** contra la API real: las 18 piezas (10 + serie E) en UNA llamada con Opus tardan **101.6s**; la función corre con `maxDuration=60` (tope de Hobby, no se puede subir), Vercel la mataba a los 60s y el `redirect(?error=)` nunca corría → la UI volvía idéntica. Antes cabía (10 piezas ≈ 2000 tokens); la serie E + el formato narrativo del playbook (párrafos + 3 porqués + pregunta + trigger) triplicó el volumen.
- **Arreglo:** el bucle vive en el CLIENTE (`CaptionsRunner.tsx`) y llama a `generarLoteCaptions(slug, ids)` en **lotes de `LOTE_CAPTIONS`=4** (medido ~28–34s por lote, holgado). Guardado **INCREMENTAL con MERGE** en `data.kitCaptions` (nunca reemplazo) → si un lote falla o se cae la red, lo anterior YA está en la base. La UI muestra progreso («7 de 18…»), resultado, y ante fallo el motivo + cuántas se salvaron (un timeout ya no puede ser invisible). El checklist del formulario usa el MISMO runner (tenía el mismo bug). `LOTE_CAPTIONS` vive en `captions-lote.ts` — un archivo `"use server"` solo exporta funciones async.
- ⚠️ **Se queda OPUS, NO Sonnet.** Se midió como parte del arreglo: Sonnet 5 fue **más lento** (39.5s vs 14.2s en el mismo lote, 3.7× más tokens) y además **inventó una especie** que no estaba en el resumen («Amanita basii»), justo lo que el sistema prohíbe. Cambiar de modelo habría empeorado el timeout y la voz.
- Verificado E2E (barrancas, de 0 a 18): progreso por lotes, guardado incremental confirmado en la base tras cada lote, y prueba de corte de red a mitad (los 8 ya guardados sobrevivieron). Trigger §2/§3 solo en P4–P6/E4 con la palabra correcta («Comenta BARRANCA…»).

## Kit de comunicación — REDISEÑO como dashboard glanceable (20 jul)
- **Por qué:** la página tenía 18 tarjetas gigantes en lista (scroll interminable, 6+ botones y todas las láminas repetidas por pieza) y ningún lugar mostraba el estado real — así se escondió días el bug de barranca/volcanes sin captions. Ahora: **KPIs** arriba (piezas listas, **con caption** — el estado que antes era invisible —, programadas, publicadas) → **una barra de acciones sticky** (funde la barra vieja + `KitToolbar`, que se elimina: sus 3 links viven ahí) → **piezas como filas compactas agrupadas por momento** (M1/M2/M3/E, con resumen tipo «2 programadas · 1 publicada») que se **expanden en acordeón** (`<details>` nativo — la página es inmersiva, sin AdminShell, no hay script `[data-x]`).
- **Ciclo de vida real por pieza** (`src/lib/kit/pieza-estado.ts`, archivo PROPIO — `lib/social/posts.ts` es camino crítico de publicación y no se toca): lee `social_posts` (`piece_id` + `status`) filtrado por `experience_slug`, la fila más reciente no cancelada manda. Pill con punto de color: `Falta insumo` → `Sin caption` → `Lista` → `Programada · fecha` → `Publicada · fecha` (con link a Instagram) → `Falló · motivo`. Best-effort (tabla ausente ⇒ mapa vacío, mismo patrón que los testimonios).
- ⚠️ **`KitPieceControls` (KitClient.tsx) y `CampanaButton`: SOLO se tocaron los strings de sus botones** (sin emoji) — cero cambios de lógica. Siguen leyendo `[data-piece="ID"] .slide` del bloque off-screen (`.off`, al fondo de la página, con `KitDeck` a tamaño real), que se conserva IDÉNTICO: es la fuente de los PNG exportados y de la campaña en vivo.
- **Emojis fuera de TODO el Kit** (decisión de Luis): jerarquía por tipografía, peso y color; los estados son puntos de color (`.pill .dot`), no emoji. El semáforo de `ChecklistComunicacion.tsx` (formulario) ya usaba puntos de color — solo se limpiaron sus strings; ese mismo archivo reusa el runner de captions por lotes (`CaptionsRunner`).
- Verificado en preview con datos reales: hongos (campaña viva) mostró exactamente el estado real de la cola (P1 publicada con fecha y link a IG, P2-P6 programadas); barranca mostró «10/10 con caption» (confirma el fix del bug de timeout); la exportación de PNG (`Vista previa`) se probó y sigue funcionando; en móvil (390px) el regreso queda visible arriba (regla app-first) y todo envuelve bien.

## PROGRAMA DE EMBAJADORES — página pública + aplicación curada + aprobación (23 jul)
- **Qué es:** un embajador (creador / agencia individual / líder de comunidad) vende salidas a su audiencia y gana el **30% de la utilidad neta** (hoja de costeo por experiencia, pactado en el convenio). Programa **CURADO**: aplicación → llamada de 30 min → convenio. Pago a los 7 días del regreso; toda venta por links oficiales de Stripe (la atribución con comisión congelada de la 0016).
- **Migración `0029_ambassador_applications` APLICADA (23 jul):** tabla de aplicaciones (perfil cerrado `creador|agencia|comunidad`, status `pending|approved|rejected`, `operator_id` al aprobar, `decided_at`). Índice único parcial: **una aplicación PENDIENTE por correo** (`lower(email) where status='pending'`) — histórico permitido (re-aplicar tras rechazo sí; duplicar pendiente no → el form muestra `?error=duplicada`). RLS sin policies (solo service-role).
- **Página pública `/caminante/embajadores`** (`page.tsx` + `EmbForm.tsx` + `emb-css.ts`, namespace `.emb-*`, clon del patrón `solicitar`): hero (foto delfines del deck) + tú/nosotros + 4 pasos + banda glass «lo que recibes» + perfil + reglas claras + form (honeypot, radio-cards, `?ok/?error`, sin revalidatePath). Ruta inmersiva en `SiteChrome`. ⚠️ **SIN cifras del deck** (tablas de dinero) — regla de Luis; el «30% de utilidad neta» sí va (es la definición del programa). Fotos en el bucket `experiences/embajadores/`.
- **Correos** (`src/lib/embajadores/emails.ts`, todos por `sendViaResend` = "Luis · Caminante"): confirmación al aplicante + aviso al admin (al enviar), bienvenida (al aprobar), «por ahora no» amable (al rechazar). Best-effort: la aplicación/decisión ya está guardada aunque el correo falle.
- **Admin → Solicitudes, sección «Solicitud embajador»** (`EmbajadorCard.tsx` + `src/lib/admin/embajadores-actions.ts`, cada action re-verifica admin): datos completos + Aprobar/Rechazar + historial. **APROBAR = alta idempotente en `operators`** (reusa por email si existe) → el embajador se monta en la atribución de ventas (0016) y el perfil público opcional (0020). ⚠️ **`commission_pct` queda NULL a propósito**: esa columna es el % que retiene la plataforma, NO el 30% del embajador (que es sobre utilidad y vive en el convenio; documentado en `notes`). El badge del nav de Solicitudes suma embajadores pendientes (best-effort; tabla ausente ⇒ 0, nada se rompe).
- **E2E verificado en preview (rama `embajadores`, build verde):** submit real → fila `pending` + pantalla `?ok=1` + correos · aprobar → `approved` + operador creado + bienvenida · rechazar → `rejected` + correo (los 4 correos llegaron a delarosaluis8@gmail.com / uno@) · datos zz- limpiados (aplicaciones + operador). Gotcha: las server actions del panel pueden tardar >15s en frío (cold start + correo) — el botón se queda en «Aprobando…»; NO es cuelgue, la decisión aterriza.

## Dashboard de admin — REGLA DE PRODUCTO: el formulario CREA, el dashboard OPERA
- **Regla de Luis (1 jul):** contenido + fechas/cupo se crean y editan SOLO en el **formulario de experiencia** — "+ Experiencia" (`/admin/experiencias/nueva`) o el modo **edición** (`/admin/experiencias/[slug]`, precarga contenido y salidas vía `fetchSlotsForAdmin`). El dashboard de eventos **solo opera**: ocupación, cerrar/reabrir ventas, operador/comisión, publicar. **NO agregar mini-forms de creación sueltos al panel** — nada debe nacer vacío. Camino único de fechas: `saveExperienceSlots` (slots-admin.ts; las salidas quitadas del form se CIERRAN, no se borran).
- **⚠️ Salidas en el form de experiencia (fix 7 jul):** el modo edición SOLO carga salidas ABIERTAS (las cerradas se operan en el dashboard con Reabrir — si entraran al form, cada guardado las re-abría: bug de fechas que "resucitaban"). `saveExperienceSlots` es idempotente: una fila sin id primero busca una salida abierta idéntica (fecha+label) y la ACTUALIZA en vez de insertar (guardar 2 veces ya no duplica), y el cierre de salidas quitadas solo toca las abiertas.
- **DASHBOARD COMPLETO (1 jul)**: Panorama · Eventos · Reservas (pago manual, cancelar) · Personas · Roster (print/CSV) · Dinero (/admin/dinero: KPIs+spark, pendiente de cobro, ingresos por experiencia→salida, payout por operador con % congelado y 'por definir', ledger) · Encuesta (quién respondió/pendiente + testimonios con consentimiento). ⚠️ Reservas de JUNIO sin operator_id (pre-0016) → fuera del payout; backfill opcional. "Cobrar por link" por reserva sigue diferido (0014 sin aplicar).
- Backfill 1 jul (instrucción de Luis): reservas de Ensenada junio → `paid` con pagos `transfer` $16,000/persona ($384,000). Pagos fuera del sistema se capturan así (UI de "pago manual" llega en F3).

## Dashboard de admin (`/caminante/admin`) — F1 Panorama **EN PRODUCCIÓN (1 jul)**
- **Plan por fases** (F1 Panorama ✅ · F2 eventos/salidas CRUD · F3 reservas/personas/roster · F4 dinero/payout · F5 encuesta). Diseño de **Claude Design** (`dashboard admin.zip`, cubre TODAS las secciones — reusar sus patrones en F2–F5): CSS scopeado `.adm` en `admin/ui/admin-css.ts`, shell en `admin/ui/AdminShell.tsx` (nav píldoras, secciones futuras como "pronto"), expandibles por delegación `[data-x]` sin client components. Regla: **ningún número es callejón sin salida** (todo se expande a su desglose).
- **`src/lib/admin/queries.ts`** = fuente única de KPIs: ingresos = `payments` paid (excluye refunded), corte de mes en **America/Mexico_City**; personas = Σ `num_people` HOLDING; deslindes por salida = registrations/titulares; satisfacción de `experience_feedback` submitted. Tablas chicas → agregación en JS (revisar si algo pasa de ~500 filas). `/caminante/admin` exacto es **inmersivo** en SiteChrome (shell propio).
- **`src/lib/admin/eventos-actions.ts`** (F2, lógica lista): salidas crear/editar/cerrar + operador + publicar. **Cada action re-verifica `isCurrentUserAdmin()`** (el gate del layout NO cubre actions invocadas directo). Guardas: salidas nunca se borran (solo cerrar; cancelar solo sin reservas apartando), cupo nunca < ocupación. `actions.ts` = marketplace dormido, NO tocar.
- ⚠️ **Datos**: hay reservas REALES con `total_amount_mxn=0` (Ensenada junio — cobradas FUERA del sistema): el dashboard las muestra sin ingresos hasta capturarlas como **pago manual** (F3/F4). JAMÁS borrarlas. Datos de prueba = namespace `zz-prueba-dashboard` + `dash-test+N@caminante.test` (seed/cleanup en el scratchpad de la sesión del 1 jul; limpiar al terminar F5).
- Gotcha dev: el worktree necesita symlink de `.env.local` (`ln -sf ~/dev/caminante-app/.env.local <worktree>/`) o `createSupabaseAdminClient` truena con ZodError.

## Migración 0016 (operadores + atribución de ventas) — **APLICADA (1 jul)**
- `operators` (name, email, **`commission_pct` nullable = comisión de plataforma abierta/sin definir**) + `experiences.operator_id` + **snapshot** `reservations.operator_id`/`commission_pct` (congelado en la venta). Seed operador **"Numan · Caminante"** (`uno@numanhub.com`, comisión null) atado a las 3 experiencias. Es la base para el **reporte mensual de payout por operador** (agrupar `payments` pagados por operador → bruto, comisión, neto a depositar).
- ⚠️ **Gotcha para aplicar migraciones vía navegador:** el **SQL Editor de Supabase NO renderiza en el Chrome de Claude si la pestaña está en segundo plano** (Monaco no hidrata; `visibility:hidden`). Truco: traer la pestaña **al frente**, luego se puede inyectar el SQL por `monaco.editor.getModels()[0].setValue(...)` y oprimir Run por JS. Verificar SIEMPRE el resultado por PostgREST.

## Difusión por WhatsApp (Cloud API) — infraestructura de salida (reusable por el bot)
- **`scripts/broadcast-whatsapp.mjs`** + **`scripts/lib/phone.mjs`**: manda un template aprobado (p.ej. el flyer) a la lista de clientes. **Dry-run por defecto** (no manda nada): normaliza a E.164, deduplica, valida y previsualiza. `--send` para enviar de verdad. Ver `scripts/README-broadcast.md`.
- `phone.mjs` (`normalizePhone`, `firstName`): limpia la basura real del CRM — marcas Unicode invisibles (bidi/zero-width/isolates), +52/52/10-dígitos pelones, prefijo móvil legacy `521`, y +1 de EUA. Probado contra la base. **El bot de WhatsApp a futuro reusa esta misma normalización.**
- Destinatarios: `scripts/recipients.json` (semilla exportada de All Clients, **PII → gitignored**) o `--csv` de un export nativo de Notion (columnas Name/Phone). Dry-run validado: 67 en lista → **64 únicos válidos** (US:3, MX:61), 3 omitidos (2 sin teléfono + 1 duplicado Gil/Gilberto Perezalonso).
- **Requisitos para enviar:** (1) creds en `.env.local` `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN` (Meta Business → WhatsApp → API Setup); (2) template `caminante_flyer_v1` (Marketing, `es_MX`, header imagen, body con `{{1}}`=nombre, botón quick-reply "Quiero info") **aprobado** en Meta; (3) flyer hospedado en `public/flyers/…` → URL pública (ver `public/flyers/README.md`).
- ⚠️ WhatsApp exige **template** para escribir a una lista fría (fuera de la ventana de 24h). Las respuestas al botón abren la ventana de 24h; **hoy se contestan a mano** en el WhatsApp Manager / app de Business (el bot inbound = fase posterior, aún sin construir). Costo marketing ≈ $0.03 USD/msg.

## Auth / admin
- Login = magic link de Supabase. `isCurrentUserAdmin()` checa la tabla `admin_whitelist`; `uno@numanhub.com` ya está en la whitelist.
- **Para probar login sin correo** (Gmail "pre-consume" los magic links): genera el token con `supabase.auth.admin.generateLink({type:'magiclink', email})` usando el service-role, y abre directo `…/caminante/auth/confirm?token_hash=<h>&type=magiclink&next=…`.
- `getOrigin()` en `src/lib/auth/actions.ts` usa el **host real** de la petición (sirve en cualquier dominio).
- ⚠️ **Gotcha (resuelto 8 jun):** si el admin en producción **crea sesión pero rebota** del gate (cookie `sb-…-auth-token` presente, sin `?error=`), revisa que `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en Vercel sea la key `sb_publishable_…` y **no** la URL ni un valor viejo. GoTrue (login) tolera un apikey malo, pero PostgREST (consulta a `admin_whitelist`) lo rechaza → `isCurrentUserAdmin()` devuelve false → rebote. El login NO depende de la service-role.
- ⚠️ **Gotcha (resuelto 8 jun, commit `4de22a6`):** `createSupabaseServerClient` (`src/lib/supabase/server.ts`) DEBE envolver `setAll` en try/catch. `caminante/layout.tsx` lee la sesión en cada página vía `getCurrentUser()`; al refrescar el token, `@supabase/ssr` intenta escribir la cookie en un Server Component (solo-lectura) → excepción → **500 para usuarios logueados** en TODA página de `/caminante`. El middleware ya refresca la sesión, así que swallowear el error es seguro. **No quites el try/catch.** (Anónimos no lo ven → por eso curl daba 200 y solo el navegador logueado 500.)

## Alta con elección de camino: viajero vs OPERADOR (8 jul)
- **El alta pregunta el camino** (`/caminante/signup` sin `?tipo` = chooser de 2 puertas): **Viajero** (`?tipo=viajero`) = alta normal → sitio; **Operador/marca** (`?tipo=operador`) = crea cuenta (SIGUE siendo caminante) + registra una SOLICITUD de acceso al panel.
- ⚠️ **Nadie se auto-nombra admin** (a propósito). El "operador" NO obtiene el rol al registrarse. `elegirOperador()` (`auth/actions.ts`) pone la cookie `cam_op_intent` (1h, sobrevive cualquier método de login); `/caminante/bienvenida` la lee y registra la solicitud como fila en **`admin_whitelist` con `is_active=FALSE`** (pendiente; `roleForClient` exige `is_active=true` → sigue siendo viajero) + `notifyAccesoOperador` (correo+WhatsApp). Idempotente por email (no pisa un admin activo). **Sin migración** (reusa admin_whitelist). Constante del cookie en `auth/op-intent.ts` (un archivo `"use server"` no puede exportar consts).
- **Aprobación**: la bandeja vive en **`/caminante/admin/solicitudes` → sección "Solicitud operador"** (14 jul se fundió "Accesos" en "Solicitudes"; `/admin/accesos` ahora REDIRIGE ahí y el badge de Solicitudes suma fechas + accesos). Lista pendientes → `approveOperador` (`is_active=true` → pasa a admin) / `rejectOperador` (borra la fila, solo si sigue pendiente). Cada action re-verifica `isCurrentUserAdmin()`. Quitar acceso = `is_active=false` a mano en Supabase.
- Gotcha: un Server Component (bienvenida) puede LEER cookies pero no borrarlas (Next 15) → la cookie no se borra, expira sola (el registro es idempotente).

## Perfiles (roles) + login multi-método (29 jun — EN PRODUCCIÓN, Google E2E OK)
- **DOS perfiles separados.** Rol DERIVADO (no hay columna): `admin` = `admin_whitelist` activo; `caminante` = usuario autenticado que no es admin; `null` = sin sesión. Helpers en `src/lib/auth/authorization.ts`: `getCurrentRole()`, `roleForClient(supabase)` (resuelve con un cliente que YA tiene sesión, para usar justo tras login), e `isCurrentUserAdmin()` (ahora = `getCurrentRole()==='admin'`).
- **Gating por rol (server-side):** `/caminante/admin/*` solo admin (layout, ya existía). `/caminante/perfil` rebota al admin a `/caminante/admin` (el admin no es viajero). `/caminante/registro/[slug]` rebota al admin a `/caminante/admin?notice=admin_no_registro` (el admin no compra/reserva). Ambos guards son reversibles (un `if (await isCurrentUserAdmin())`).
- **Redirect por rol tras autenticar:** si `next` es el genérico `/caminante` → admin a `/caminante/admin`, caminante a `/caminante/perfil`; un `next` explícito se respeta (la página destino guarda por rol). Implementado en `confirm/route.ts` (magic link/signup), `auth/callback/route.ts` (OAuth) y `signInWithPassword`/`signUpWithPassword` (`postAuthDestination`).
- **Login (`/caminante/login`) y signup (`/caminante/signup`)** ofrecen 3 métodos: **Google OAuth**, **email+contraseña** (`signInWithPassword`/`signUpWithPassword`), y el **magic link** de siempre. Re-skin a la marca (voz "tú", sin emoji). Panel admin (`admin/page.tsx`) con tarjetas etiquetadas.
- ✅ **Google OAuth — config y gotchas (resueltos 29 jun):** el provider Google YA estaba habilitado en Supabase (Client ID/Secret de marzo, proyecto Google Cloud `numan-caminante`, client `oauth-1`). Dos bugs lo tenían muerto: (1) el **redirect URI en Google Cloud estaba incompleto** — decía `https://hnyoahirxmzkshivgvnm.supabase.co` SIN `/auth/v1/callback` (corregido); (2) el OAuth se iniciaba **client-side** → `exchangeCodeForSession` fallaba con *"PKCE code verifier not found in storage"*. **FIX:** iniciar el OAuth en una **server action** `signInWithGoogle` (`actions.ts`) que guarda el code_verifier como cookie SSR; `GoogleButton.tsx` ahora es un `<form>` que la postea. El callback (`src/app/caminante/auth/callback/route.ts`) hace el `exchangeCodeForSession`. **E2E verificado en prod:** Google → `/caminante/admin`. La allowlist de Supabase ya cubre `/caminante/auth/callback` vía el wildcard `…/caminante/*`.
- ⚠️ **Contraseña para cuentas viejas:** los usuarios creados por magic link NO tienen contraseña. Para que `uno@numanhub.com` (admin) entre con contraseña, Luis debe fijarla (signUp con ese correo da "User already registered"; usar "reset password" o entrar por magic link/Google). Email+contraseña sí funciona out-of-the-box para cuentas nuevas (provider email ya habilitado).

## Correos de auth (magic link) — EN PRODUCCIÓN (11 jun)
- **Remitente:** `Caminante <caminante@numanhub.com>` vía **Resend SMTP** (cuenta Resend con GitHub de Luis, workspace "numanhub", dominio `numanhub.com` verificado). Config en Supabase → Authentication → Emails → SMTP Settings: host `smtp.resend.com`, puerto 465, user `resend`, pass = API key de Resend (`supabase-auth-smtp`, sending-only; la pega Luis, no se puede ver una vez guardada). Rate limit con SMTP propio: 30/h (ajustable).
- **Templates brandeados** (Magic Link + Confirm signup) pegados en el dashboard y **versionados en `supabase/templates/`** (`magic-link.html` / `confirm-signup.html`, idénticos salvo `type=magiclink`/`type=signup`). Asunto: "Tu acceso a Caminante 🌊". Diseño de Claude Design (tablas+inline, VML para Outlook). Si se edita el archivo, re-pegar en el dashboard (el repo es la fuente).
- **Flujo a prueba de allowlist:** `sendMagicLink` manda `emailRedirectTo = destino final` (p.ej. `/caminante/bienvenida`); el TEMPLATE arma el link del confirm él mismo: `{{ .SiteURL }}/caminante/auth/confirm?token_hash={{ .TokenHash }}&type=…&next={{ .RedirectTo }}`. Así el link nunca depende del matching de la allowlist. `confirm/route.ts` valida `next` (ruta interna o URL del mismo host / host canónico; otro origen → `/caminante`).
- **URL Configuration (Supabase Auth):** Site URL = `https://caminante.numanhub.com` (⚠️ era localhost:3000 — causa del bug "link lleva a localhost"). Allowlist con wildcards: `…numanhub.com/caminante/*`, `localhost:3000/caminante/*`, `caminante-*-uno-1425s-projects.vercel.app/caminante/*`.
- **`/caminante/bienvenida`:** aterrizaje post-auth de cuentas nuevas (sin sesión → login). El botón "Crear mi cuenta" del registro manda ahí.
- E2E verificado 11 jun: correo de numan + template + link → sesión → bienvenida. ✅

## Deploy (IMPORTANTE)
- Flujo: commit → `git push origin HEAD:deploy/caminante-site` → Vercel hace **preview** → **promover a producción** desde la UI de Vercel (menú "..." → Promote to Production).
- ⚠️ Local `main` y `origin/main` tienen **historias NO relacionadas** (dos lineages distintos). **Nunca hagas force-push a main.** Usa siempre el flujo de promover-preview.
- GitHub: `uno-git-numan/caminante-app`. Auth de GitHub vía `gh` (en `~/.local/bin/gh`).
- Vercel: equipo `uno-1425s-projects`, proyecto `caminante-app`.

## TRANSFERENCIAS: la cuarta puerta de venta (11 ago)
- **El caso.** Hasta hoy solo había tres puertas para que naciera una reserva: checkout web
  (Stripe), `/admin/cobro` (link de pago) y el deslinde. **Quien pagaba por transferencia
  simplemente no existía para la plataforma.** Lo destapó Lorena Saravia: transfirió $16,500 para
  Barrancas 8-oct el 29 de julio y no había contacto, ni reserva, ni ingreso — y **la salida se veía
  en 4/12 cuando iba en 5/12, justo su punto de equilibrio**, con ella lista para viajar sin firmar
  deslinde. Es el caso Enyd otra vez, por un camino que no existía.
- **`0034_transferencias` APLICADA:** `payments.comprobante_url` + `referencia`, con índice único
  **parcial** sobre `referencia` (los cobros de Stripe no traen referencia bancaria). Es la defensa
  contra capturar dos veces el mismo movimiento — el error más fácil conciliando a mano.
- **`registrarTransferencia`** (`src/lib/admin/transferencias.ts`) hace lo mismo que el webhook de
  Stripe para que la venta quede igual de completa: contacto con dedupe → reserva `paid` atribuida
  al operador → `payments` con `method='transfer'` → correo de confirmación **con el CTA del
  deslinde** → aviso al admin. ⚠️ **`stripe_fee_mxn` se queda NULL a propósito**: «no aplica» no es
  lo mismo que «fue cero», y el tablero de rentabilidad distingue las dos cosas.
- ⚠️ **`channel = 'admin'`, NO `'transferencia'`**: el CHECK de la 0007 solo admite
  `web|whatsapp|email|admin`. La forma de pago vive en `payments.method`, que es su lugar. (Se
  detectó antes de correr: habría sido un 23514 en producción.)
- **El comprobante va a un bucket PRIVADO nuevo, `comprobantes`** (creado 11 ago; `experiences` es
  público). Trae nombre, monto y a veces dígitos de cuenta: no puede quedar tras una URL pública y
  eterna. Se guarda la **RUTA** del objeto en `comprobante_url` (nunca una URL) y se ve por URL
  firmada de 5 min vía `/caminante/api/admin/comprobante`, gateada a admin. El nombre del archivo se
  sustituye por bytes aleatorios (el original suele traer el nombre del cliente).
- **UI:** sección «Registrar una transferencia» en `/caminante/admin/dinero` con desplegable de
  experiencia y salida (el slug a mano de `/admin/cobro` ya ha costado errores). El ledger suma la
  columna **Respaldo** con la referencia y el link al comprobante.

## PAGO MANUAL con enlace de alta (transferencia / efectivo) — 11 ago
- **El flujo lo definió Luis:** el admin captura en Dinero con lo POCO que sabe —evento, salida,
  nombre, lugares, comprobante— y el sistema devuelve un **ENLACE** para mandarle a la persona,
  donde ella se da de alta y firma el deslinde **como cualquier otro cliente**. Por eso el correo
  **no es obligatorio**: basta el WhatsApp, que es por donde va el link. Devuelve además el mensaje
  de WhatsApp armado (patrón CobroForm, con botón de copiar).
- El **monto se calcula solo** (precio de la salida × lugares) y queda editable: casi nunca coincide
  con la lista (descuentos, anticipos, grupos) y manda lo que de verdad entró a la cuenta.
- Sin correo, el contacto nace por teléfono (`findOrCreateContactByPhone`): `contacts.email` es
  nullable desde la **0015**, justo para esto.
- ⚠️ **EMPALME, el bug que este flujo habría causado:** al firmar, `submitRegistration` hacía dedupe
  contra el correo que ELLA teclea → nacía un contacto **NUEVO** y la reserva se quedaba apuntando
  al viejo: dos fichas de la misma persona y un roster que no cuadra. Ahora, si el contacto de la
  reserva todavía no tiene correo, **se completa ese** en vez de crear otro.

## SALIDAS VENCIDAS: se cierran solas (11 ago)
- **Nada las cerraba.** Quedaban `open` para siempre y las dos consultas públicas
  (`fetchPublicAvailability`, `fetchOpenSlotsForTemplate`) filtran solo por `status='open'`, sin
  mirar la fecha. El 11 de agosto había **dos abiertas ya pasadas** (hongos Jun 26-27 y Jul 26): el
  sitio anunciaba junio como «próxima fecha» y `createCheckout` la habría cobrado.
- **Cron diario `cerrar-salidas`** (14:00 UTC = 8am CDMX, antes que todos los demás) →
  `cerrarSalidasVencidas` en `src/lib/experiences/cerrar-vencidas.ts`. Cerrada la salida desaparece
  del sitio, del checkout, del picker del deslinde y del formulario **de un solo golpe**, sin tocar
  ninguno de ellos.
- Decisiones: el corte es por **`starts_at`, no `ends_at`** (una salida de Oct 8-11 no se vende el 9,
  el grupo ya va en camino); se cierra cuando el **DÍA** de salida pasó en CDMX (la que arranca hoy a
  las 7am sigue vendible hoy); solo toca `open` y el update repite el filtro para no pisar a quien la
  reabrió o canceló; **cerrar no borra** (se reabre desde el dashboard).
- ✅ **Cerrar es seguro para la encuesta**: `runSurveyDispatch` busca por `ends_at` y por las
  reservas, **nunca** por el status de la salida. Verificado antes de construirlo.

## SITIO PÚBLICO MÓVIL — es la vista móvil, no un sitio nuevo (11 ago)
- **Encargo de Luis:** *«hoy la página se ve bien en escritorio; solo es integrar para que en
  teléfono se vea bien, sin tocar escritorio»*. El entregable de Claude Design
  (`design/publico-movil/`, 25 pantallas) NO es una app nueva ni un rediseño.
- **Contrato de integración: `design/publico-movil/PATRON.md`** (léelo antes de tocar nada). Mapa
  pantalla→dato: `design/publico-movil/INTEGRACION.md`. Referencia viva:
  `src/app/caminante/nosotros/page.tsx`.
- **CSS** (`src/lib/publico/movil-css.ts`, extracción verbatim con el selector prefijado `.pub`):
  `PUB_CSS_MOVIL` envuelve TODO en `@media (max-width:699px)` y `PUB_SWAP_CSS` esconde el marcado de
  escritorio abajo de 700px (`.pub-no`). Se renderizan los dos marcados y el CSS decide — olfatear el
  user-agent rompería el caché de Vercel. Las rutas NUEVAS usan `PUB_CSS` a secas (`modo="solo"`).
- ⚠️ **Cuatro desviaciones mecánicas, todas documentadas en el encabezado del módulo.** Las que
  importan: las 17 variables pasaron de `:root` a `.pub` (en `:root` aplican a TODA página de Next y
  el `--olive` del entregable, `#776F67`, no es el del sitio, `#637154` → integrarlo tal cual
  repintaba el panel de admin); y **`.pub` lleva `height:100dvh`, no `min-height`** — con
  `min-height` el `height:100%` del `.pub-app` no resuelve, `.pub-scroll` deja de scrollear por
  dentro y se pierde justo el comportamiento de app (cabecera que se vuelve crema, barra de compra,
  tabbar).
- **Shell** (`src/app/caminante/ui/pub/`): la demo era una pila de React sin URLs; aquí la pila la
  lleva el router y cada pantalla conserva su dirección — hay **7 puntos de entrada que llegan por
  link desde fuera** (regreso de Stripe `?session_id=`, liga mágica, `/feedback/[token]`, deslinde
  `?reserva=`, grupo `?grupo=`, baja firmada, facturación firmada) y sin URL no tendrían dónde
  aterrizar. `PubShell` (tabbar, hojas, toast), `atoms.tsx`, `PubStyles.tsx`.
- **Integradas:** `/nosotros` (era link muerto del nav) · `/experiencias` (ídem; + `fetchDestinos()`
  nuevo en `lib/destinos/queries.ts`) · `/aprende` · `/experiencias/[slug]` (vista móvil encima del
  v2 de escritorio, que **no se tocó**; `?grupo=` se propaga a todos los CTA de reserva).
- **`/aprende`:** `PubAprende` está definida DOS veces en el entregable y la que gana en la demo pide
  una tabla de cápsulas que **no existe** (barrido 0001–0034: ni `articles`, ni `posts`, ni
  `capsulas`). Decisión de Luis: poner la pantalla con un estado honesto de «estamos produciendo el
  contenido» y llenarla con lo que SÍ está poblado — la **ficha científica**, con su fuente siempre a
  la vista. Cero artículos, minutos de lectura o fechas inventados.
- **Datos que el mockup inventa y NO se inventan** (lista completa en INTEGRACION.md): el guía
  estructurado `{nombre, rol, cita}` (la heurística `guias()` del Kit ya retrató variedades de hongo
  como personas), `e.cat`, `e.nueva`, el punto de encuentro con mapa, los colores de marca del
  operador, y `hola@numanhub.com` (el real es `uno@numanhub.com`).
- **«Avísame»** no tenía tabla: se monta sobre **`leads` (0015)**, cuyo `source` ya admite `'web'`.
  Idempotente, sin migración. Ojo: avísame ≠ `slot_requests` (aquel es PEDIR fecha y genera trabajo
  para el admin; esto no).
- **Luis aprobó agregar los campos que al mockup le faltan** (11 ago) en el mismo lenguaje visual:
  el deslinde sin PDF ni cláusulas reales, la encuesta con 3 secciones fijas, solicitar sin WhatsApp
  (que el servidor exige → el form fallaría siempre) y embajadores con 3 campos de menos. El diseño
  no manda sobre las reglas del sistema. **Esas cuatro pantallas siguen pendientes.**
- **Estrellas en público:** van por EXPERIENCIA con su número de respuestas (decisión de Luis, 11
  ago: «los ratings no son por salida, son por experiencia») y **NUNCA encima de la foto** — en
  naranja sobre una imagen se pierden. Átomo `Estrellas` en `ui/pub/atoms.tsx`, con el mismo
  tratamiento del escritorio (estrella y número en naranja, conteo en olivo, estilos en línea como
  `exp-grid.js`). La foto se conserva; la calificación baja al fondo claro.
- **`/caminante` dejó de ser un rewrite.** Un rewrite manda un documento entero o ninguno, así que no
  puede convivir con el intercambio móvil/escritorio en el mismo documento. La ruta es React y sirve
  `public/landing/index.html` tal cual para escritorio (ese archivo sigue siendo la única fuente; los
  3 scripts son IIFE y se re-emiten con `next/script`). ⚠️ En Vercel `public/` no viaja dentro de la
  función: va `outputFileTracingIncludes` en `next.config.ts`. **Verificado en preview** (grilla en
  vivo con sus 9 tarjetas y `exp-grid.js` corriendo).
- **Integradas también:** Inicio, Reservar, Éxito, Deslinde, Destino, Calendario y Operador.
  ⚠️ `reservar` y `exito` viven bajo el nav compartido: se marcan con `.pub-no` en `SiteChrome` (no
  en `isImmersive`, que dejaría al escritorio sin nav).
- Gotcha de verificación: **el guard de admin rebota `/reservar` y `/registro`** («el admin no
  compra»), así que esas dos vistas móviles no se pueden ver con sesión de admin.
- Gotcha de verificación: `npm run dev` no arranca en el sandbox (EPERM sobre el npm de fnm) y el
  preview de Vercel pide sesión, así que el Browser pane no lo alcanza. Se verifica con el Chrome
  conectado, metiendo la página en un **iframe de 390px** (las media queries responden al ancho del
  iframe) y leyendo el DOM por JS.

## ONBOARDING DE OPERADOR: recorrido verificado y los tres bugs que destapó (11 ago)
- **Guía con las pantallas reales** (artifact, para la llamada de alta):
  https://claude.ai/code/artifact/90a7a826-5172-49c6-918d-d8c0dfebc1aa
- **Las dos puertas.** `/caminante/embajadores` (vende, Caminante opera, 30% de
  utilidad neta **en el convenio, no en el sistema**, aprobar NO da acceso al panel) vs
  `/caminante/signup?tipo=operador` (opera lo suyo, aprobar SÍ abre el panel). Las dos
  crean la fila en `operators`, que es lo único que hace que sus ventas se atribuyan.
- ⚠️ **REGLA QUE CUESTA DINERO: asignar el operador ANTES de la primera venta.** La
  atribución se congela reserva por reserva al cobrar (0016) y **no se rellena hacia
  atrás**. Prueba viva: los **$103,500** de «Hacienda y hongos» están atribuidos a
  Numan · Caminante, no a Kéntro. Pendiente de Luis: decidir cómo se salda.
- ⚠️ **`operators.slug` no lo asignaba NADA.** Numan y Kéntro lo tenían de un update a
  mano en 0020/0030; toda operadora nacida de una aprobación quedaba sin dirección
  pública → link a la nada, vista previa muerta y «Publicar» marcándola pública sin ser
  alcanzable (el chip «Operada por» filtra por slug). Ahora `ensureOperador` lo calcula
  del nombre (`lib/operators/slug.ts`), `saveOperatorProfile` rescata a los que ya
  nacieron sin él **la primera vez y nunca después** (renombrar rompe links vivos), y
  `setOperatorPublic` se niega a publicar sin slug en vez de fingir.
- ⚠️ **El «%» del detalle de experiencia heredaba la comisión del operador anterior.**
  Pasar la experiencia de Kéntro (15%) a otra persona y darle Guardar le escribía 15% a
  la nueva — y `commission_pct` vive en el OPERADOR, así que le aplicaba a todo lo suyo.
  `OperadorSelect.tsx` (client) hace que el % siga al operador elegido y cada opción
  muestra su comisión o «% por definir».
- **Datos de prueba vivos** (namespace `zz-prueba`, sin experiencias ni ventas):
  aplicación aprobada de «zz-prueba Operadora Demo» (`uno+zzoperadora@numanhub.com`) +
  su fila en `operators` con comisión 12% y datos fiscales **inventados** (RFC
  `XAXX010101000`, el genérico del SAT). Su perfil quedó en **borrador** tras verificar
  que publica y despublica bien.
- **Lo que NO existe y hay que decirlo en la llamada:** white-label (colores y marca de
  ella en el funnel — el modelo de datos está, la pantalla no), correos con su marca,
  dominio propio, Kit/PDF con su marca, Stripe Connect (el dinero llega completo a NUMAN
  y se le transfiere a mano) y panel recortado para ella.

## PANEL MÓVIL COMPLETO (11 ago)
- Las cinco pestañas de `/caminante/admin/m` con datos reales: Panorama, Eventos, Gente,
  Recursos y Más. Nueve pantallas nuevas + sus hojas y diálogos, cableadas en
  `ui/MovilApp.tsx` y cargadas en paralelo desde `m/page.tsx`.
- **Cero consultas nuevas para los mismos números**: los adaptadores de
  `lib/admin/movil/` reusan `queries.ts` y `rentabilidad.ts`. Si el teléfono y la
  computadora discreparan en una cifra, el bug sería imposible de explicar.
- **Cero escritura nueva.** Las server actions que `redirect()` al escritorio se
  partieron en un núcleo `{ok,error}` + la acción de formulario de siempre, para que
  disparadas desde el teléfono no saquen al usuario del panel.
- El **Kit** y el **perfil de operador** no se precargan (decenas de consultas y 160+
  builds de pieza por carga, para algo que casi nunca se mira): piden sus datos al
  abrirse, con `use()` + `Suspense`.
- ⚠️ Cada entrada de `roots`/`screens`/`sheets`/`dialogs` es una **función que devuelve
  `<Pantalla/>`**, nunca la pantalla llamada como función: sus hooks contarían como
  hooks del shell y al cambiar de pestaña React truena con «rendered fewer hooks».

## EN TELÉFONO, EL PANEL **ES** EL PANEL-APP (12 ago)
- **El panel móvil se construyó el 11 ago y NADIE lo enlazaba.** Luis lo reportó dos veces: abría
  el panel desde el celular y recibía la tabla de escritorio. El primer arreglo (que
  `/caminante/entrar` rutee por rol Y dispositivo) no bastó porque **el botón «Panel» del nav
  apuntaba DIRECTO a `/caminante/admin`**, saltándose la única pieza que sabe decidir.
- **Los tres eslabones, y los tres hacen falta:**
  1. `SiteChrome` manda a **`/caminante/entrar`** — y con **`<a>`, no `<Link>`**: es un route
     handler, y el router le pediría su carga RSC.
  2. El **ÍNDICE** `/caminante/admin` redirige a `/caminante/admin/m` si el UA es un teléfono.
  3. El panel-app tiene **«Panel de escritorio» (`?escritorio=1`)** en Más, o el teléfono queda
     encerrado.
- ⚠️ **Solo se redirige el ÍNDICE, jamás `/admin/*` completo.** Las rutas hijas o rasterizan el DOM
  de escritorio (`kit`, `print`, `social`, `preview` producen los PNG y PDFs leyendo `.slide` del
  documento) o son formularios largos que el panel-app no reemplaza (`experiencias`). Además el
  propio panel-app enlaza a varias como «ver completo» (`recursos`, `operadores`, `encuesta`): un
  redirect general las rebotaría **a sí mismo**.
- **`esTelefono` vive en `src/lib/ui/dispositivo.ts`**, con la regla escrita al lado: olfatear el
  user-agent sigue **PROHIBIDO en las páginas públicas** (el sitio móvil se resuelve con CSS, ver
  «SITIO PÚBLICO MÓVIL»). Solo es admisible donde la ruta es `force-dynamic` **y** lo único que se
  decide es a dónde redirigir, no qué HTML emitir. Las tablets van a escritorio a propósito.
- **Invariante #8** (`scripts/invariantes.mjs`) tumba el build si cualquiera de los tres eslabones
  se rompe. Esto ya se rompió dos veces en un día; que lo cace el build y no Luis.

## RESUELTO: «Application error» + login imposible = SESIÓN MUERTA (11 ago)
- **Síntomas, los dos a la vez y sin relación aparente:** en el iPhone de Luis la home mostraba
  «Application error: a client-side exception has occurred», y el login contestaba «No pudimos
  completar el inicio de sesión» **aunque el enlace mágico fuera recién pedido**.
- **Causa, encontrada en los logs de runtime de Vercel** (no adivinada):
  `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` en `/caminante`,
  `/caminante/login`, `/caminante/entrar` y `/caminante/auth/callback`. Sus cookies traían un
  refresh token que Supabase ya no reconocía; **nadie atrapaba el error** y subía hasta la página.
  Se realimentaba solo: la cookie podrida seguía ahí en cada intento.
- ⚠️ **CAUSA DE FONDO: `middleware.ts` estaba en la RAÍZ del repo con el código en `src/`.**
  Next lo ignora **sin un solo warning**, así que NUNCA corrió — y su único trabajo es
  `updateSession`, o sea refrescar la cookie de Supabase en cada request. Sin eso el token caduca
  sin reemplazo hasta pudrirse. Movido a **`src/middleware.ts`**. Prueba de que ya corre: el alias
  `caminante-app.vercel.app` por fin responde **308** al dominio canónico (ese redirect llevaba
  meses escrito sin ejecutarse jamás).
- **Los tres arreglos:** (1) `roleForClient` y `getCurrentUser` atrapan el error —`getUser()`
  **LANZA**, no solo devuelve `{error}`— y devuelven `null`, que es la verdad: no hay sesión;
  (2) `auth/confirm` y `auth/callback` llaman a `limpiarSesion()` **antes** de canjear el token,
  para que una cookie podrida no tumbe un login limpio; (3) el middleware en su lugar.
  Todo en `src/lib/auth/sesion-rota.ts`.
- ⚠️ **Diagnóstico equivocado que costó horas, para no repetirlo:** primero se culpó al caché (falso:
  cerró pestañas, reinició Chrome, y el HTML se sirve `no-store`) y luego, por un bisect que revirtió
  producción y «arregló» la home, al commit del tabbar `3991991`. Era **correlación**: el crash
  depende de si el access token ya venció en ese instante, no del build. La lección: con un síntoma
  que solo aparece en el dispositivo del usuario, **ir a los logs del servidor ANTES de bisectar**.

## GUARDIÁN DE INVARIANTES — `npm run verificar` / `prebuild` (11 ago)
- **`scripts/invariantes.mjs` corre en CADA build** (`prebuild` en package.json) y **tumba el
  deploy** si se rompe alguna de estas reglas (hoy 8), cada una nacida de un incidente real:
  1. el middleware vive en `src/` (no en la raíz, donde Next lo ignora en silencio);
  2. el middleware sigue llamando a `updateSession`;
  3. `authorization.ts` y `session.ts` protegen la lectura de sesión con `esSesionMuerta`;
  4. `auth/confirm` y `auth/callback` llaman a `limpiarSesion` antes de canjear;
  5. el `setAll` de `createSupabaseServerClient` conserva su try/catch (incidente del 8 jun);
  6. el middleware no se mete con `/caminante/auth/` (se llevaba el verificador de PKCE);
  7. `cookiesDeSesion` nunca borra la cookie `-code-verifier`;
  8. el panel móvil sigue siendo alcanzable: nav → `/entrar`, el índice del panel redirige al
     panel-app en teléfono, y el panel-app conserva su salida `?escritorio=1` (12 ago).
- **Probado rompiendo cada una a propósito**: las cuatro comprobables se cazaron, y con el código
  sano pasa 5/5. `node scripts/invariantes.mjs --autoprueba` verifica que las reglas de verdad
  detectan lo que dicen (un guardián callado no sirve de nada).
- **El mensaje de error explica el incidente**, no solo la regla — quien lo vea en un build fallido
  entiende por qué existe sin tener que venir a este archivo.

## Pendientes (al retomar)
1. **Dar de alta las 5 experiencias** desde localhost (`/caminante/admin/experiencias/nueva`). Aparecen en vivo (base compartida).
2. **Llaves "Needs Attention" en Vercel** (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) están viejas (marzo). Actualizarlas (las pega el usuario) para que **Stripe y las _escrituras_ de admin en producción** (guardar experiencias, subir fotos vía `createSupabaseAdminClient`) funcionen. **OJO: estas NO afectan el _login_ de admin** — el gate (`isCurrentUserAdmin`) solo usa la publishable key + la tabla `admin_whitelist`.
3. ✅ **HECHO (8 jun):** Login de admin en vivo **arreglado** + commit `a9f22a5` (auth host-aware) promovido a prod. La causa real del rebote **NO** era la service-role (ese fue un diagnóstico equivocado): en Vercel `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` tenía pegado el **valor de la URL** en vez de la key `sb_publishable_…` → el cliente Supabase de prod usaba un apikey inválido → PostgREST rechazaba la consulta a `admin_whitelist` → rebote. (GoTrue era permisivo, por eso la sesión se creaba sin `?error=` y despistaba.) Corregido el valor + redeploy → admin en vivo entra. Allowlist de Supabase Auth ya tenía `…/caminante/auth/confirm`.
4. ✅ **HECHO (1 jul): Stripe en LIVE.** Cuenta NUMAN HUB activada; llaves live + webhook live en Vercel; pago web verificado con cobro real. (Ver sección "Pago DIRECTO en web".) Pendiente ligado: conectar CFDI/Facturapi (otra sesión) — cobros reales entran como `por-emitir` mientras tanto.
5. **Independizar de Squarespace** (futuro): mover registro/DNS a Cloudflare sin perder el dominio; decidir qué va en la raíz (hoy sitio Squarespace); re-crear MX del correo (Google Workspace).

## Dominio / correo
- `numanhub.com`: registro en Squarespace, DNS en nameservers de Google, **correo en Google Workspace** (MX → google). El sitio raíz es Squarespace. `caminante.numanhub.com` → CNAME → `cname.vercel-dns.com` (Vercel).
- ⚠️ El DNS se edita en **Squarespace → Dominios → numanhub.com → DNS** con la cuenta **delarosaluis8@gmail.com** (NO uno@numanhub.com — esa cuenta de Squarespace está vacía). Editar registros pide re-verificación con Google (la hace Luis).
- Registros de Resend (11 jun, NO tocar los MX raíz de Google): TXT `resend._domainkey` (DKIM), MX `send` → `feedback-smtp.us-east-1.amazonses.com` (prio 10), TXT `send` → `v=spf1 include:amazonses.com ~all`, TXT `_dmarc` → `v=DMARC1; p=none;`. Viven en subdominios — cero conflicto con el correo de Workspace.

## WHITE-LABEL DE OPERADORES — F0 + onboarding nativo + portal (24 jul)
- **Qué es:** Caminante como backend discreto. El operador externo pone su marca (logo, colores) y
  la plataforma pone la infraestructura; «powered by NMN Caminante» chico. Camino elegido por Luis:
  **theming sobre NUESTRAS plantillas** (no headless, no dominio propio en v1) → path-based
  `/caminante/o/<slug>`. Dominio propio = F3.
- **`0030_operator_branding` APLICADA (24 jul):** `operators.branding jsonb` (tema) + `operators.legal
  jsonb` (entidad del deslinde del operador). Solo aditiva, sin policies nuevas.
- **Contrato + motor del tema** (`src/lib/operators/branding.ts`): el operador da **logo + 2 colores**
  (primary/accent) y `themeCssFor(scope, branding)` emite el **override de las CSS vars de la casa**
  (--olive/--orange/--cream/--charcoal/--forest + derivados con `color-mix`). Como TODO el design
  system ya corre sobre esas vars, vestir una superficie = inyectar ese `<style>` después del CSS
  base — sin tocar una sola regla. `fetchOperatorTheme` / `BySlug` / `ForExperience` son
  **best-effort: sin branding (o sin migrar) devuelven null y todo se ve Caminante**.
- **Onboarding nativo `/caminante/admin/operadores/nuevo`** (botón «+ Onboarding de operador» en
  Operador): identidad → marca con **preview en vivo** (mini hero + botones pintados con las mismas
  vars que emitirá themeCssFor) → entidad legal → trato → atribución de experiencias. `?op=<id>`
  COMPLETA un operador existente (p. ej. un embajador aprobado). `onboardOperator` re-verifica admin,
  no pisa el slug de otro operador y **solo atribuye las experiencias marcadas** (jamás des-atribuye).
- **Portal `/caminante/o/[slug]`** (namespace `.opw`, ruta inmersiva): logo + colores del operador,
  sus experiencias publicadas como tarjetas fotográficas, pie con su razón social y «powered by»
  discreto. **Sin branding ⇒ 404** (el portal solo existe si el onboarding lo vistió).
- ⚠️ **Especificidad (segunda vez que muerde, tras el CTA de embajadores):** una regla base tipo
  `.opw a{color:var(--olive)}` (0-1-1) **le gana a una clase sola** (0-1-0) → el título de la tarjeta
  salía del color primario del operador (negro sobre pasto claro = invisible). **Todo texto sobre foto
  va prefijado con el scope** (`.opw .opw-card .t`). Además **el velo es obligatorio**: la foto de un
  operador puede ser clarísima, así que hero y tarjetas llevan degradado propio (en `.ph::after` /
  `.bg::after`, dentro de la capa de la imagen, no con z-index negativo suelto).
- **Piloto Kéntro dado de alta POR EL FLUJO REAL (no seed SQL)**, en la rama: operador `kentro`
  (#212121 + #9a3b2d, logo del bucket) + `el-bosque-de-los-volcanes` («Hacienda y hongos - Kentro»)
  atribuida. ⚠️ **Sus datos legales son PROVISIONALES** (marcados así en `legal.responsable` y en
  `notes`) y el correo es `uno+kentro@numanhub.com` a propósito — nada le llega a un tercero real.
  `commission_pct` queda NULL (por negociar). **Revertir = regresar `operator_id` a Numan·Caminante.**
- **Decisiones de Luis pendientes de ejecución externa:** el deslinde de viajes del operador va a
  **su** nombre (NUMAN cobra y factura como comercializador → el convenio necesita cláusula de
  indemnización, y **el tratamiento fiscal lo valida el contador antes del primer convenio**).
- Siguiente (F1): tematizar el FUNNEL (experiencia v2 + reservar + registro/deslinde + éxito) leyendo
  el tema del operador dueño, con **prueba de no-regresión por hash** de estilos computados para
  garantizar que las páginas de Caminante no cambian ni un pixel. Luego F2 correos, F3 dominio,
  F4 kit/PDF, F5 checkout con Stripe Connect.
