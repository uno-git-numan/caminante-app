---
paths:
  - "src/app/caminante/admin/m/**"
  - "src/lib/admin/movil/**"
  - "src/lib/publico/**"
  - "src/app/caminante/ui/pub/**"
  - "src/app/caminante/SiteChrome.tsx"
  - "src/app/caminante/admin/ui/**"
  - "design/**"
---

# Móvil y diseño

## El entregable de Claude Design se TRANSCRIBE, no se reconstruye

Los `.dc.html` son componentes con los datos dentro: se transcriben **verbatim**.
No se borran. Si algo no se entiende, **se pregunta con un prompt para Claude
Design** — no se improvisa.

**El panel de Caminante SIEMPRE usa el HTML de Claude Design.** Se viste con datos;
no se rediseña.

**Cuando el entregable ES el look visual, Claude Design va ANTES del backend** —
nunca «provisional con estilos existentes».

**Glassmorphism** en botones y tarjetas de Caminante, siempre.

⚠️ **Nunca datos demo en superficie pública.** El fallback del `.dc.html` vale en
pantallas internas; donde va el nombre real de un cliente, la sección se oculta.

## El sitio móvil es la VISTA móvil, no un sitio nuevo

Contrato: **`design/publico-movil/PATRON.md`** — léelo antes de tocar nada.
Mapa pantalla→dato: `INTEGRACION.md`. Referencia viva: `caminante/nosotros/page.tsx`.

Se renderizan **los dos marcados y el CSS decide** (`@media max-width:699px` +
`.pub-no`). Olfatear el user-agent rompería el caché de Vercel.

⚠️ Dos desviaciones mecánicas que importan:
- Las variables pasaron de `:root` a `.pub`. En `:root` aplican a TODA página de
  Next, y el `--olive` del entregable **no es el del sitio** → repintaba el panel
  de admin.
- **`.pub` lleva `height:100dvh`, no `min-height`.** Con `min-height` el
  `height:100%` del `.pub-app` no resuelve, `.pub-scroll` deja de scrollear por
  dentro y se pierde el comportamiento de app.

**Hay 7 puntos de entrada que llegan por link desde fuera** (regreso de Stripe,
liga mágica, feedback, deslinde, grupo, baja firmada, facturación). Por eso cada
pantalla conserva su URL: sin ella no tendrían dónde aterrizar.

## En teléfono, el panel ES el panel-app

**Tres eslabones, y los tres hacen falta** (invariante #8):
1. `SiteChrome` manda a `/caminante/entrar` — y con **`<a>`, no `<Link>`**: es un
   route handler y el router le pediría su carga RSC.
2. El **ÍNDICE** `/caminante/admin` redirige al panel-app si el UA es teléfono.
3. El panel-app conserva **«Panel de escritorio» (`?escritorio=1`)**, o el teléfono
   queda encerrado.

⚠️ **Solo se redirige el ÍNDICE, jamás `/admin/*` completo.** Las rutas hijas
rasterizan el DOM de escritorio (`kit`, `print`, `social`, `preview` producen los
PNG y PDFs leyendo `.slide` del documento) o son formularios largos. Además el
propio panel-app enlaza a varias como «ver completo»: un redirect general las
rebotaría a sí mismo.

## Reglas del panel-app

- **Cero consultas nuevas para los mismos números.** Los adaptadores reusan
  `queries.ts` y `rentabilidad.ts`. Si el teléfono y la computadora discreparan en
  una cifra, el bug sería imposible de explicar.
- **Cero escritura nueva.** Las actions que `redirect()` se partieron en un núcleo
  `{ok,error}` + la action de formulario.
- ⚠️ Cada entrada de `roots`/`screens`/`sheets` es una **función que devuelve
  `<Pantalla/>`**, nunca la pantalla llamada como función: sus hooks contarían como
  hooks del shell y React truena con «rendered fewer hooks».

## Regla app-first

Se construye como app de App Store: **regreso visible en CADA página** (nunca el
back del navegador), móvil primero. Gotcha: los scripts inline mueren con hydration
mismatch → usar `next/script`.

## Gotchas de render que ya costaron

- **NO centrar cards con `transform: translateY(-50%)`** en el deck: Chrome
  fragmenta el desborde SIN el transform al imprimir. Usar flex.
- **Glass con blur real en PDF**: `backdrop-filter` no se rasteriza al imprimir,
  pero **CSS `filter: blur()` sí**. El script clona el fondo dentro de cada card.
- **Los logos de colaborador se auto-recortan al subir**, salida SIEMPRE PNG — el
  compresor JPEG mataría la transparencia.
- **Especificidad**: una regla base tipo `.scope a{color:…}` (0-1-1) le gana a una
  clase sola (0-1-0). Ya mordió dos veces. Todo texto sobre foto va prefijado con
  el scope, y **el velo sobre la imagen es obligatorio**.
- ⚠️ **El Kit es pesado y en el Browser pane el scroll y el screenshot van a un twin
  a ~1Hz.** Verificar por **JS sobre el DOM**, no por captura.
