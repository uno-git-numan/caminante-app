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
| Panel del operador externo (alcance) | `design/panel-operador/README.md` |
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

## Estado (24 ago 2026)

**En producción:** experiencias v2 data-driven · registro y deslinde nativos ·
cobro web con Stripe LIVE · transferencias y pago manual · panel de admin completo
(escritorio y móvil) · Kit de comunicación con publicador nativo a Instagram ·
boletín · programa de embajadores · portales de operador white-label ·
**white-label F1** (el funnel del cliente se viste del operador) ·
**rol «operador»**: el mismo panel, podado a sus experiencias
(`design/panel-operador/`) · **Stripe Connect A1 y A2**.

**El cobro sigue corriendo por `createCheckout` sin cambios.** La bifurcación a
cargo directo es lo último que se toca, a propósito.

**Desde el 26 ago:** el **deslinde del operador se FUSIONA** con el nuestro en vez
de reemplazarlo (regla e invariante #11 en `.claude/rules/experiencias.md`), las
cláusulas saben si son obligatorias y de quién son, el formulario avisa cuando el
precio que se muestra no es el que se cobra, y una experiencia nueva hereda el
contacto de SU dueño. Migración **0043** aplicada.

**Siguiente:** A3, facturación multi-emisor con Facturapi.

⚠️ **Corrección (25 ago 2026):** aquí decía que el plan multi-organización era «un
requisito, no un detalle», como si fuera caro y aparte. **No lo es.** El plan base
—«API de Facturación CFDI», $299 MXN/mes + $0.60 por timbre— YA es multi-RFC y no
cobra por emisor adicional. Los planes que amarran a un solo RFC son los otros
(Facturación Web, E-Receipts y Autofactura, Facturapi para Stripe): NO contratar
ésos aunque el nombre suene a lo nuestro.

**Estado real:** la 0019 está APLICADA y verificada; el código de facturación vive
en la rama y está apagado por `FACTURAPI_SECRET_KEY`. Los datos fiscales de NUMAN ya
están en `operators` (RFC NHU250826CS8 · razón social **NUMAN HUB**, exacta y SIN
«S.A. de C.V.» · régimen 601 · CP 11000), leídos de la CSF.

**Bloqueado por Luis:** la cuenta de Facturapi, la llave, el CSD, y —lo importante—
que el SAT registre la actividad de turismo: las 15 actividades de la CSF son de
medios y software, y el CFDI timbraría con clave 90121500 (organización de viajes).
Ver `.claude/rules/dinero.md` y la memoria `caminante-facturacion-cfdi`.

**Y antes de facturar:** hay **49 pagos cobrados sin CFDI** según la base contra 31
en el ledger de contabilidad. Esa diferencia se cuadra ANTES de emitir.

**También pendiente:** definir la comisión de Kéntro — hoy `commission_pct` está en
NULL y el gate no deja vender por Connect sin ella.

**Pendiente conocido:** ningún operador tiene `convenio_firmado_at`; independizar
el DNS de Squarespace.
