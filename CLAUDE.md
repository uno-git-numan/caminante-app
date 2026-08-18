# CLAUDE.md — Caminante

**Lee esto completo antes de tocar nada.** Es el índice; el detalle vive en
`.claude/rules/`, que se carga solo cuando trabajas en el área correspondiente.

Master plan (estrategia y visión) en Notion:
https://app.notion.com/p/378b0498350f813e806bcb8bf4404a7f
Si algo importante cambia, actualízalo **ahí y aquí**.

## Qué es

Caminante = la expansión de NUMAN al mundo natural: plataforma de experiencias en
naturaleza + contenido educativo + conservación. Voz «científico-poeta». Las
**4 caras** de cada lugar: 🌿 Naturaleza · 🌊 Conservación · 🤝 Comunidades ·
⚠️ Problemas.

**En vivo:** https://caminante.numanhub.com · **Stripe en LIVE desde el 1 jul 2026**
— todo lo que toca cobros mueve dinero real.

Dos negocios: experiencias propias (100% de Numan) y **operadores externos** que
rentan la plataforma con comisión negociada.

---

# ⚠️ REGLAS DURAS

Estas no se negocian y aplican en cualquier tarea.

**1 · Nunca trabajes en un working tree que otra sesión esté usando.** Este repo
usa **un worktree por tarea** (`caminante-edu`, `caminante-emb`, `caminante-wl`…).
Si hay otra sesión, crea el tuyo:
`git worktree add ../caminante-<tarea> <rama>` + `ln -sf <repo>/.env.local <worktree>/`.

**2 · JAMÁS `git add -A` ni `git add .`** — siempre rutas explícitas, y `git status`
antes de commitear. El 18 ago un `add -A` se llevó los archivos a medio escribir de
otra sesión y rompió el build de la rama compartida.

**3 · Las migraciones las aplica Luis a mano, y el hash se compara antes de correr.**
Ver `rules/migraciones.md`. Ya cazó dos corrupciones de pegado.

**4 · Nunca inventes un número.** Si un dato no está, dilo y di de dónde tendría que
salir. Un reporte con un número inventado es peor que no tener reporte.
**Verifica contra la fuente antes de afirmar.**

**5 · Nada de parches ni ajustes temporales.** Si falta un dato para cuadrar, se
pide — jamás se tapa con un ajuste.

**6 · Lo obsoleto se elimina en el mismo ciclo, migrando antes sus datos.** No se
quieren dos sistemas conviviendo.

**7 · Luis mueve el dinero y teclea los secretos.** Claude calcula, concilia,
reporta y prepara; las transferencias, los pagos y las llaves las hace él.

**8 · Datos médicos y personales de clientes JAMÁS salen a herramientas externas.**

**9 · Prendido TODO antes de publicar**: deslinde con PDF **y** encuesta activa son
gate duro. Ver `rules/experiencias.md`.

**10 · El panel se viste con el HTML de Claude Design, no se rediseña.**

**11 · Todo sistema nuevo se documenta** (aquí + Notion + Drive) pensado para
handover.

---

## Dónde está cada cosa

| Si trabajas en… | Lee |
|---|---|
| Cobros, webhook, facturación | `.claude/rules/dinero.md` |
| Operadores externos y Stripe Connect | `.claude/rules/operadores-connect.md` |
| Migraciones y base | `.claude/rules/migraciones.md` |
| Sesión, auth, middleware, invariantes | `.claude/rules/auth-sesion.md` |
| Experiencias, deslinde, salidas | `.claude/rules/experiencias.md` |
| Kit, redes, captions, boletín | `.claude/rules/kit-comunicacion.md` |
| Móvil y diseño | `.claude/rules/movil-y-diseno.md` |

**Planes y entregables de diseño:** `design/` — el plan de Connect
(`design/contabilidad/PLAN-CONNECT-MULTIEMISOR.md`), el contrato del sitio móvil
(`design/publico-movil/PATRON.md`), el funnel de operadores, los handoffs.

Estas reglas se cargan **solas** cuando abres archivos del área. No hace falta
pedirlas.

---

## Cómo correr

**npm y node NO están en el PATH.** Usa fnm:

```
export PATH="/Users/luisdelarosa/Desktop/acting/caminante/.tools/fnm-data/node-versions/v22.22.0/installation/bin:$PATH"
```

- **Next 16.1.6 usa webpack, NO Turbopack.** Los scripts ya traen `--webpack`.
  No lo quites.
- `.env.local` tiene las llaves (gitignored). **Local y producción usan la MISMA
  base de Supabase.**
- ⚠️ **Dos `tsc`/`build` concurrentes deadlockean el FS sandboxeado** → procesos en
  estado `U`/`E` que ni `kill -9` mata (solo reboot). Corre uno a la vez, en tu
  propio worktree, o **deja que el build de Vercel sea el verificador de tipos**.
- El proyecto no vive en Documents/iCloud a propósito (dev server lentísimo).

## Deploy

```
git push origin HEAD:deploy/caminante-site   # → preview en Vercel
```

Luego **promover desde la UI de Vercel** (menú «…» → Promote to Production).

- **Todas las sesiones trabajan sobre UNA rama: `deploy/caminante-site`.** Haz
  `fetch` antes de empujar y promueve el tip integrado.
- ⚠️ Local `main` y `origin/main` tienen **historias no relacionadas**. **Nunca
  force-push a main.**
- Si `git push` falla con HTTP 400 o «sideband disconnect», no es el tamaño:
  `git config http.version HTTP/1.1`.
- GitHub `uno-git-numan/caminante-app` (cuenta de usuario, no org) · Vercel
  `uno-1425s-projects/caminante-app`.
- **Vercel captura las env vars al construir**: tras guardar una key nueva, rebuild
  antes de promover.

## Verificar

`npm run verificar` corre el guardián de invariantes (8 reglas, cada una nacida de
un incidente). Corre solo en cada `prebuild` y **tumba el deploy** si se rompe una.

Preferencia de verificación: **build de Vercel** (aislado y fiel) > `tsc` local en
tu worktree > el Browser pane, que en páginas pesadas va a un twin poco fiable.

---

## Estado (18 ago 2026)

**En producción:** experiencias v2 data-driven · registro y deslinde nativos ·
cobro web con Stripe LIVE · transferencias y pago manual · panel de admin completo
(escritorio y móvil) · Kit de comunicación con publicador nativo a Instagram ·
boletín · programa de embajadores · portales de operador white-label ·
**Stripe Connect A1 y A2** (cimientos, onboarding y webhook `account.updated`).

**El cobro sigue corriendo por `createCheckout` sin cambios.** La bifurcación a
cargo directo es lo último que se toca, a propósito.

**Siguiente:** A3, facturación multi-emisor con Facturapi. Bloqueada por dos cosas
de Luis: contratar Facturapi **con plan multi-organización** (requisito, no
detalle) y **definir la comisión de Kéntro** — hoy `commission_pct` está en NULL y
el gate no deja vender por Connect sin ella.

**Pendiente conocido:** ningún operador tiene `convenio_firmado_at`; independizar
el DNS de Squarespace.
