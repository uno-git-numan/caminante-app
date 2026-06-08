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

## Auth / admin
- Login = magic link de Supabase. `isCurrentUserAdmin()` checa la tabla `admin_whitelist`; `uno@numanhub.com` ya está en la whitelist.
- **Para probar login sin correo** (Gmail "pre-consume" los magic links): genera el token con `supabase.auth.admin.generateLink({type:'magiclink', email})` usando el service-role, y abre directo `…/caminante/auth/confirm?token_hash=<h>&type=magiclink&next=…`.
- `getOrigin()` en `src/lib/auth/actions.ts` usa el **host real** de la petición (sirve en cualquier dominio).

## Deploy (IMPORTANTE)
- Flujo: commit → `git push origin HEAD:deploy/caminante-site` → Vercel hace **preview** → **promover a producción** desde la UI de Vercel (menú "..." → Promote to Production).
- ⚠️ Local `main` y `origin/main` tienen **historias NO relacionadas** (dos lineages distintos). **Nunca hagas force-push a main.** Usa siempre el flujo de promover-preview.
- GitHub: `uno-git-numan/caminante-app`. Auth de GitHub vía `gh` (en `~/.local/bin/gh`).
- Vercel: equipo `uno-1425s-projects`, proyecto `caminante-app`.

## Pendientes (al retomar)
1. **Dar de alta las 5 experiencias** desde localhost (`/caminante/admin/experiencias/nueva`). Aparecen en vivo (base compartida).
2. **3 llaves "Needs Attention" en Vercel** (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) están viejas (marzo). Actualizarlas (las pega el usuario) para que el **admin y Stripe funcionen en producción**.
3. **Promover el commit `a9f22a5`** (auth host-aware) a prod, para el magic-link por correo en el dominio nuevo. El usuario ya agregó `https://caminante.numanhub.com/caminante/auth/confirm` a la allowlist de Supabase Auth.
4. **Stripe sigue en modo TEST.** Pasar a live cuando la cuenta de Stripe esté activada (verificación de negocio).
5. **Independizar de Squarespace** (futuro): mover registro/DNS a Cloudflare sin perder el dominio; decidir qué va en la raíz (hoy sitio Squarespace); re-crear MX del correo (Google Workspace).

## Dominio / correo
- `numanhub.com`: registro en Squarespace, DNS en nameservers de Google, **correo en Google Workspace** (MX → google). El sitio raíz es Squarespace. `caminante.numanhub.com` → CNAME → `cname.vercel-dns.com` (Vercel).
