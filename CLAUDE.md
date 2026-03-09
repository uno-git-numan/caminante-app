# CLAUDE.md — Caminante

## 1. PROJECT OVERVIEW

**Caminante** is a Spanish-language hiking and walking social community / travel marketplace for Mexican outdoor enthusiasts. Built under the numanhub.com brand.

**Current state:** Early-stage but functional. Auth, listings, trip creation, checkout, and admin panel are all wired up. No public social/community features yet (posts, follows, comments) — current UX is closer to a travel booking marketplace.

**Key user flows:**
- Browse/search published listings (activities, packages, accommodations, transport)
- Magic-link login → create a trip → add items → checkout via Stripe
- Compare activities or packages side-by-side
- Read magazine content
- Admin: manage providers, listings, bookings, payouts, support requests

**Language:** All UI content is in Spanish. Currency: MXN.

---

## 2. TECH STACK & ARCHITECTURE

**Framework:** Next.js 16.1.6 — **App Router** only. No Pages Router.

**Runtime:** React 19 + TypeScript 5 (strict mode).

**Key dependencies:**
- `@supabase/ssr` + `@supabase/supabase-js` — auth & database (PostgreSQL, no ORM)
- `stripe` + `@stripe/react-stripe-js` — payments (Embedded Checkout)
- `zod` — env validation and API input validation
- `tailwindcss` v4 — styling (no separate config file; uses `@theme` in CSS)

**Folder structure:**
```
src/
  app/
    caminante/          # All app routes live here
      admin/            # Admin-only routes (whitelist-gated)
      api/              # Route handlers (REST)
      compare/          # Compare activities/packages
      listings/[id]/    # Listing detail
      login/ signup/    # Auth pages
      trips/[id]/       # Trip detail, hub, checkout
    layout.tsx          # Root layout
    page.tsx            # Redirects → /caminante
  components/
    payments/           # EmbeddedCheckout component
  lib/
    admin/              # Admin server actions
    auth/               # session.ts, actions.ts, authorization.ts
    listings/           # DB queries
    payments/           # Stripe helpers + queries
    supabase/           # Client factories (server, browser, admin, middleware)
    trips/              # Trip server actions
supabase/
  migrations/           # 5 SQL migrations (run in order)
public/images/          # Hero images + SVG icons
```

**State management:** None (no Zustand/Redux). Relies on:
- React Server Components + `cache()` for server data
- URL search params for filters
- `useState` for local UI state in client components

**API patterns:**
- Route handlers (`src/app/caminante/api/`) for client-facing ops (listings search, Stripe intents, webhook)
- Server actions (`src/lib/*/actions.ts`) for auth and admin mutations
- Direct Supabase SDK queries — no ORM, raw SQL via RPC or `.from()` chaining

**Auth:** Supabase Magic Link (OTP). Session managed via middleware cookie refresh. Admin access via `admin_whitelist` table (email-based).

**Database:** Supabase PostgreSQL. RLS enforced. Core tables: `providers`, `listings`, `trips`, `trip_items`, `bookings`, `payments`, `admin_whitelist`.

**Path alias:** `@/*` → `./src/*`

---

## 3. CODE STYLE & CONVENTIONS

**Files/folders:** `kebab-case` for directories and filenames. `page.tsx`, `layout.tsx`, `route.ts` follow Next.js conventions.

**Components:** PascalCase exports. Server components by default — add `"use client"` only when needed (event handlers, browser APIs, Stripe Elements).

**Functions/variables:** `camelCase`. Server actions use suffix `Action` (e.g., `createListingAction`).

**CSS:** Tailwind utility classes inline. Color palette: white/stone grays + emerald accents. Responsive: mobile-first, `md:` breakpoints. Custom font: "Avenir Next" / "Gill Sans" / "Optima" (set in `globals.css` `@theme`).

**Imports:** Use `@/` alias for all internal imports. Group: external → internal → types.

**No shared UI component library** — raw Tailwind markup, no shadcn/headlessui.

---

## 4. DEVELOPMENT GUIDELINES

**Run locally:**
```bash
npm run dev       # Dev server on http://localhost:3000
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint
```

**Required env vars** (see `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

**Database setup:** Run 5 migrations in order (`supabase/migrations/`). See `SUPABASE_SETUP.md` for full setup including bootstrap admin user and Stripe webhook config.

**Stripe webhook:** Must point to `/caminante/api/payments/webhook`. Run `stripe listen` locally for dev.

---

## 5. CLAUDE-SPECIFIC INSTRUCTIONS

- **Read before writing.** Always read existing components and pages before creating new ones. Duplication is the #1 risk in this codebase.
- **Edit, don't create.** Prefer modifying existing files over adding new ones.
- **One responsibility per component.** Keep components focused. Split if a file exceeds ~150 lines.
- **Follow established patterns.** Match the RSC-first approach: default to server components, add `"use client"` only when necessary.
- **Never delete or overwrite files** without explicit confirmation from Luis.
- **TypeScript strict.** Avoid `any`. Use `unknown` + narrowing, or define proper types. Zod is available for runtime validation.
- **No global state.** Don't introduce Zustand/Redux/Context for things that can be URL params or RSC props.
- **UI changes:** Describe what the user will see before writing code.
- **Ask before assuming.** When intent is ambiguous, ask one focused question before proceeding.
- **End each task** with a brief summary: what changed, what file(s), and why.
- **Use `/compact`** during long sessions to manage context window.
- **Spanish UI content** — all user-facing text should be in Spanish.
- **Admin routes** are gated by `requireAdmin()` from `src/lib/auth/authorization.ts`. Always check this for any new admin page.

---

## 6. CURRENT PRIORITIES

- [ ] <!-- Luis: fill in priority 1 -->
- [ ] <!-- Luis: fill in priority 2 -->
- [ ] <!-- Luis: fill in priority 3 -->

---

## 7. KNOWN ISSUES / DO NOT TOUCH

<!-- Luis: fill in known issues, fragile areas, WIP branches, etc. -->
