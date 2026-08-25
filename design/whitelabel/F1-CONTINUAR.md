# White-label F1 · el funnel del cliente con la marca del operador

**ENTREGADO Y VERIFICADO** el 24 ago 2026. Esta nota deja de ser un pendiente y
pasa a ser el mapa de cómo funciona. Lo que sigue después es F2 (correos), F3
(dominio propio) y F4 (Kit/PDF), que **no** son parte de esto.

## Qué hace

Las cuatro pantallas por las que pasa quien compra se visten con la marca del
operador **dueño del viaje**. Sin operador con marca no se pinta nada: ni un
`<style>`, ni una clase de más.

| Ruta | Archivo |
|---|---|
| `/caminante/experiencias/[slug]` | `src/app/caminante/experiencias/[slug]/page.tsx` |
| `/caminante/reservar/[slug]` | `src/app/caminante/reservar/[slug]/page.tsx` |
| `/caminante/registro/[slug]` | `src/app/caminante/registro/[slug]/page.tsx` |
| `/caminante/reserva/exito` | `src/app/caminante/reserva/exito/page.tsx` |

El interruptor único es `src/app/caminante/ui/wl/WhiteLabelStyles.tsx`. Cada
página resuelve el tema y lo pasa; el componente decide si hay algo que pintar.

## Las tres cosas que no son obvias

### 1 · El enchufe de Tailwind es `--app-*`, NO `var(--lagoon)`

`globals.css` dice `--color-lagoon: var(--app-lagoon, #3E4836)`.

Enrutarlo a `var(--lagoon)` a secas —que fue el primer intento— abre de más:
**seis hojas que se inyectan por página redefinen `:root{--lagoon…}` con otro
vocabulario y otros valores** (`template-v2-css`, `destino-css`, `deck-css`,
`kit-css`, `tablero-css`, `admin/movil-css`). Ahí `--lagoon` es un turquesa
`#1c6f6a`, `--olive` el verde de marca y `--dune` un arena. Con la cascada
abierta a los nombres pelones, la página de experiencia, los destinos, el Kit y
el tablero le entregaban sus utilidades de Tailwind a un vocabulario ajeno.

Nadie define `--app-*` en `:root`. Sin white-label la utilidad cae al hex de
siempre — el mismo byte que antes, **por construcción y no por revisión**.

⚠️ Si agregas un color al `@theme inline`, va con su respaldo al hex literal.

### 2 · Dos clases, porque en el funnel conviven los DOS vocabularios

Y dos de las cuatro pantallas **no son Tailwind en escritorio**, aunque desde la
página lo parezcan: las pinta el CSS propio de su componente.

| superficie | vocabulario | clase |
|---|---|---|
| escritorio de reservar / éxito / «salida completa» | Tailwind | `wl-app` |
| escritorio de la experiencia (`TEMPLATE_V2_CSS`) | el de marca | `wl-doc` |
| escritorio del deslinde (`.reg-page`) | el de marca | `wl-doc` |
| shell móvil (`.pub`) | el de marca | `wl-doc` |

Poner `wl-app` donde va `wl-doc` no falla: simplemente no pinta.

Los dos juegos de variables son **disjuntos** (`--app-*` contra los nombres de
marca), así que pueden convivir hasta en el mismo elemento sin pisarse.

### 3 · El selector va DOBLE: `.wl-doc.wl-doc`

El CSS base declara sus variables **sobre el propio elemento** (`.pub{--olive:…}`,
`.reg-page{…}`) y varias de esas hojas se inyectan DENTRO del componente — o sea,
después de este `<style>` en el documento. Con la misma especificidad ganaba la
última y el deslinde se quedaba sin marca. Duplicar la clase sube a (0,2,0) y el
override deja de depender del orden.

## Decisiones que no conviene deshacer

- **`--olive` no se toca** en el vocabulario de la app: aquí es el gris de texto
  secundario. Pintarlo del color del operador haría ilegible medio párrafo.
- **`--forest` y `--clay` tampoco**: son semánticos (éxito y peligro). Un
  operador con marca roja no debe volver rojo el «qué incluye».
- **La pantalla de éxito resuelve el tema desde `reservations.operator_id`**, no
  desde la experiencia. La 0016 congela el operador al vender: quien compró hoy
  debe seguir viendo la marca de quien le vendió — la misma que dice su deslinde
  y la que va a facturarle. Si el webhook no ha aterrizado, cae al dueño actual.
- **`fetchThemeForExperience` NO filtra por `is_public`**, al revés que el portal
  por slug. `is_public` decide si el operador tiene PERFIL público; esto decide
  de quién es el viaje que se está vendiendo.

## Lo que quedó fuera, a propósito

- **El template legacy de experiencia** (`ExperienceTemplate`) no se viste: no
  hay ninguna experiencia publicada con ese diseño y su CSS es otro vocabulario
  más. Si alguna vez vuelve a publicarse una legacy de un operador, hay que darle
  su propio scope.
- **El logo del operador no se usa en el funnel.** F1 es color. El logo entra en
  F2/F4.

## ⚠️ Trampa abierta: marca sin logo = sin white-label

`fetchOperatorTheme` exige `branding.logoUrl` además de los dos colores, pero
`marcaLista` (y el comentario de `armarMarca`) dicen que **el logo es opcional**
porque «hay operadores que solo tienen paleta al arrancar». Resultado: un
operador con los dos colores y sin logo **no recibe tema y nadie se entera** — ni
la pantalla falla ni el panel avisa. Hoy no muerde porque los operadores dados de
alta traen logo. Vale arreglarlo antes del segundo onboarding, decidiendo cuál de
los dos contratos manda.

## Cómo se verifica (y por qué así)

`scripts/verificacion/` tiene las dos herramientas. En esta máquina **no hay
node**: el único compilador es el build de Vercel, así que lo que se pueda
validar antes, se valida antes.

- **`estructura.py`** — delimitadores, template literals sin cerrar, imports
  inexistentes e imports sin usar. Un backtick suelto dentro de un `String.raw`
  ya tumbó un build.
- **`huella.js`** — la huella de estilos computados de **todos** los nodos de una
  página. Se corre sobre la MISMA URL en dos despliegues y se comparan los hashes.

⚠️ Cuatro cosas cambian entre dos despliegues sin que se haya movido un pixel, y
las cuatro hacen fallar la prueba por la razón equivocada. Están resueltas dentro
de `huella.js`, con su comentario:

1. `<vercel-live-feedback>` aparece en unos previews y no en otros.
2. `background-image` serializa con el host del despliegue.
3. **Los decimales del color.** Con hex literal, Tailwind resuelve `bg-cream/90`
   en el BUILD y hornea `oklab(0.986983 …)`. Detrás de un `var()` ya no puede y
   emite un `color-mix()` que resuelve el navegador: `oklab(0.986977 …)`. Misma
   tinta, otros decimales, **mismo byte de sRGB**. Por eso el color se compara
   RASTERIZÁNDOLO en un canvas de 1×1. Abrir la cascada obliga a ese cambio: no
   hay forma de tener white-label y conservar la constante horneada.
4. **Transiciones congeladas.** `.pub .pub-cta{transition:background .18s}` y en
   el Browser pane el reloj de animación del gemelo va parado: el botón se queda
   pintado del color VIEJO y `getComputedStyle` devuelve ese. La huella apaga
   transiciones antes de medir.

### Resultado de la no-regresión (24 ago 2026)

Preview del tip de deploy (`6679c25`, lo mismo que corría en producción) contra
el preview de `whitelabel-f1`, anónimo en los dos lados, sobre
`recoleccion-de-hongos` — que es de la casa:

| pantalla | 1280 px | 390 px |
|---|---|---|
| experiencias | `72eef35d9ce0cdab` | `69a665acf7d41830` |
| reservar | `c18bfd4efa9780df` | `b102224eb6e7f408` |
| registro | `e0410341b679f377` | `4110c5a34faa0e69` |
| éxito | `24f7f2f3bd8cb0a9` | `a2695109e88ab01f` |

Idénticas las ocho. Ni un pixel.

### Cómo probar que SÍ pinta

Hace falta un operador con marca que **posea una experiencia publicada**. Al
cerrar esta sesión ninguno la tenía: Kéntro tiene marca cargada pero sus
experiencias siguen atribuidas a Numan · Caminante (ver la regla que cuesta
dinero en `.claude/rules/operadores-connect.md`).

Se verificó con un operador ficticio, **Bruma Expediciones** (`#1f4d46` +
`#e0a458`), dueño de una experiencia `zz-demo-bruma` clonada de hongos. Las
cuatro pantallas tomaron la marca; `text-olive` se quedó gris y el «incluye»
verde, como debe ser. El fixture se borró al terminar: una experiencia publicada
de demo se ve en `/caminante/experiencias`, y eso es dato demo en superficie
pública.
