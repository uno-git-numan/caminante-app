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
- Solo **Ensenada de Muertos** está publicada. Faltan dar de alta: Acatenango, Monarca, Iztaccíhuatl, Pico de Orizaba, Combo Volcanes.

## Cómo correr (gotchas importantes)
- El proyecto vive en `~/dev/caminante-app` (se movió de ~/Documents porque iCloud hacía el dev server lentísimo — NO regresarlo a Documents/iCloud).
- **npm/node NO están en el PATH.** Usa fnm:
  `export PATH="/Users/luisdelarosa/Desktop/acting/caminante/.tools/fnm-data/node-versions/v22.22.0/installation/bin:$PATH"`
- **Next 16.1.6 usa webpack, NO Turbopack** (Turbopack truena al compilar páginas). Los scripts `dev` y `build` ya tienen `--webpack`. No lo quites.
- Arranca con `npm run dev` (si el dev server no enlaza el puerto, córrelo con el sandbox deshabilitado).
- `start-dev.command` (doble clic en Finder) levanta dev + el listener de Stripe. Está en .gitignore (rutas de máquina + lee la llave de .env.local).
- `.env.local` tiene las llaves (gitignored). Local y prod usan **la misma base de Supabase**.

## Arquitectura
- `src/lib/experiences/` — `types.ts` (contrato Experience), `queries.ts` (lee de Supabase), `data.ts` (fallback en código), `card.ts` (tarjeta), `actions.ts` (saveExperience, generateStripeLink), `template-assets.ts` (CSS inyectado).
- `src/app/caminante/experiencias/[slug]/` — página dinámica + `ExperienceTemplate.tsx` (lee con `fetchExperienceBySlug`).
- `src/app/caminante/admin/experiencias/nueva` + `ExperienceForm.tsx` — formulario (gated por admin).
- `src/app/caminante/calendario/page.tsx` — calendario dinámico.
- `src/app/caminante/SiteChrome.tsx` — oculta el nav viejo en rutas inmersivas.
- API: `/caminante/api/experiences` (tarjetas), `/caminante/api/admin/upload` (Supabase Storage, bucket `experiences`), `/caminante/api/admin/seed-experiences` (siembra dev).
- Landing: **estático** en `public/landing/index.html`, servido por un rewrite (`beforeFiles`) en `next.config.ts` para `/caminante`. El grid se llena en cliente desde la API.
- Supabase: tabla `experiences` (slug, status, data jsonb). Migraciones en `supabase/migrations/` se aplican **a mano en el SQL Editor** (no hay CLI).
- ⚠️ **Los archivos de migración ≠ el estado real de la base.** Antes del `0007`, la base solo tenía **4 tablas**: `admin_whitelist` (0002), `experiences` (0006), y `listings` + `providers` vacías (parte del 0001). El resto del marketplace del `0001` (profiles, trips, bookings, **payments**, etc.) **nunca se aplicó** a esta base — existe solo en el código. Si vas a alterar una tabla "vieja", verifica primero que exista (Database → Tables).
- ✅ **`0007_crm_experience_direct` APLICADA (8 jun).** Agregó `contacts`, `experience_slots`, `reservations`, `payments` (creada desde cero, atada a reservations — NO la del marketplace), `notion_sync_log`, y `experiences.notion_trip_url`. Total: 9 tablas. Es la base de la capa CRM/reservas (ver "Caminante · Arquitectura de Plataforma" en Notion).
- ✅ **`0008_registrations_medical` APLICADA (11 jun).** `medical_profiles` (perfil de seguridad reutilizable 1:1 contact, incl. bloque aseguradora: CURP, beneficiario…) + `registrations` (snapshot legal congelado por firma, **APPEND-ONLY: trigger bloquea UPDATE/DELETE incluso al service-role** — corregir un dato = editar `medical_profiles` y, si importa legalmente, re-firmar con nueva `waiverVersion`) + `contacts.birth_date` y `contacts.mailing_unsubscribed_at` (**las bajas de mailing son sagradas**: nada las reactiva salvo el propio usuario en su perfil). Slots de Ensenada sembrados (Jun 12-15 / Jun 18-21, cap. 13).

## Registro nativo (11 jun) — reemplaza al Google Form
- **`/caminante/registro/[slug]`**: formulario de registro + firma de deslinde con branding del sitio (diseño de Claude Design integrado en `RegistrationForm.tsx`). Se activa por experiencia desde el admin (sección "Registro y deslinde": versión, URL del doc del sistema legal, cláusulas-resumen).
- **Flujo del server action** (`src/lib/registration/actions.ts`): dedupe de contact en cascada (user_id → email → teléfono últimos-10-dígitos, helpers en `src/lib/crm/contacts.ts`) → upsert `medical_profiles` → reserva `confirmed` (reusa la existente, nunca retrocede status; descuenta cupo solo al crear) → insert `registrations` (idempotente por unique reserva×contact×versión) → `notion_sync_log` con payload SOLO comercial (datos médicos JAMÁS van a Notion — LFPDPPP).
- **`/caminante/perfil`**: gated por login; el usuario ve/edita sus datos + perfil médico (lecturas vía RLS select_own) e historial de firmas (solo lectura). La liga user↔contact ocurre en `auth/confirm/route.ts` (`ensureContactLink`, por email, solo si `user_id is null`) + refuerzo lazy en el perfil.
- Sync al CRM: skill local `/sincronizar-registros` (lee `notion_sync_log` pendientes vía PostgREST con la service-role de `.env.local`, matching contra All Clients, write-back de `notion_page_url`/`notion_pipeline_url`).
- ⚠️ Datos de PRUEBA en la base: `test-registro-1@caminante.test` (contact+medical+reserva+registration con sync_log en `error` para que no sincronice). Limpiarlos en la "Fase 8" (requiere drop temporal del trigger de registrations).

## Auth / admin
- Login = magic link de Supabase. `isCurrentUserAdmin()` checa la tabla `admin_whitelist`; `uno@numanhub.com` ya está en la whitelist.
- **Para probar login sin correo** (Gmail "pre-consume" los magic links): genera el token con `supabase.auth.admin.generateLink({type:'magiclink', email})` usando el service-role, y abre directo `…/caminante/auth/confirm?token_hash=<h>&type=magiclink&next=…`.
- `getOrigin()` en `src/lib/auth/actions.ts` usa el **host real** de la petición (sirve en cualquier dominio).
- ⚠️ **Gotcha (resuelto 8 jun):** si el admin en producción **crea sesión pero rebota** del gate (cookie `sb-…-auth-token` presente, sin `?error=`), revisa que `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en Vercel sea la key `sb_publishable_…` y **no** la URL ni un valor viejo. GoTrue (login) tolera un apikey malo, pero PostgREST (consulta a `admin_whitelist`) lo rechaza → `isCurrentUserAdmin()` devuelve false → rebote. El login NO depende de la service-role.
- ⚠️ **Gotcha (resuelto 8 jun, commit `4de22a6`):** `createSupabaseServerClient` (`src/lib/supabase/server.ts`) DEBE envolver `setAll` en try/catch. `caminante/layout.tsx` lee la sesión en cada página vía `getCurrentUser()`; al refrescar el token, `@supabase/ssr` intenta escribir la cookie en un Server Component (solo-lectura) → excepción → **500 para usuarios logueados** en TODA página de `/caminante`. El middleware ya refresca la sesión, así que swallowear el error es seguro. **No quites el try/catch.** (Anónimos no lo ven → por eso curl daba 200 y solo el navegador logueado 500.)

## Deploy (IMPORTANTE)
- Flujo: commit → `git push origin HEAD:deploy/caminante-site` → Vercel hace **preview** → **promover a producción** desde la UI de Vercel (menú "..." → Promote to Production).
- ⚠️ Local `main` y `origin/main` tienen **historias NO relacionadas** (dos lineages distintos). **Nunca hagas force-push a main.** Usa siempre el flujo de promover-preview.
- GitHub: `uno-git-numan/caminante-app`. Auth de GitHub vía `gh` (en `~/.local/bin/gh`).
- Vercel: equipo `uno-1425s-projects`, proyecto `caminante-app`.

## Pendientes (al retomar)
1. **Dar de alta las 5 experiencias** desde localhost (`/caminante/admin/experiencias/nueva`). Aparecen en vivo (base compartida).
2. **Llaves "Needs Attention" en Vercel** (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) están viejas (marzo). Actualizarlas (las pega el usuario) para que **Stripe y las _escrituras_ de admin en producción** (guardar experiencias, subir fotos vía `createSupabaseAdminClient`) funcionen. **OJO: estas NO afectan el _login_ de admin** — el gate (`isCurrentUserAdmin`) solo usa la publishable key + la tabla `admin_whitelist`.
3. ✅ **HECHO (8 jun):** Login de admin en vivo **arreglado** + commit `a9f22a5` (auth host-aware) promovido a prod. La causa real del rebote **NO** era la service-role (ese fue un diagnóstico equivocado): en Vercel `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` tenía pegado el **valor de la URL** en vez de la key `sb_publishable_…` → el cliente Supabase de prod usaba un apikey inválido → PostgREST rechazaba la consulta a `admin_whitelist` → rebote. (GoTrue era permisivo, por eso la sesión se creaba sin `?error=` y despistaba.) Corregido el valor + redeploy → admin en vivo entra. Allowlist de Supabase Auth ya tenía `…/caminante/auth/confirm`.
4. **Stripe sigue en modo TEST.** Pasar a live cuando la cuenta de Stripe esté activada (verificación de negocio).
5. **Independizar de Squarespace** (futuro): mover registro/DNS a Cloudflare sin perder el dominio; decidir qué va en la raíz (hoy sitio Squarespace); re-crear MX del correo (Google Workspace).

## Dominio / correo
- `numanhub.com`: registro en Squarespace, DNS en nameservers de Google, **correo en Google Workspace** (MX → google). El sitio raíz es Squarespace. `caminante.numanhub.com` → CNAME → `cname.vercel-dns.com` (Vercel).
