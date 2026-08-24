# White-label F1 · el funnel del cliente con la marca del operador

Estado al cerrar la sesión del 24 ago 2026. Los **cimientos están puestos,
verificados y commiteados** (`deb2514`). Falta el cableado y su prueba.

## Qué es F1 y por qué importa

Hoy el tema del operador **solo viste su portal** `/caminante/o/<slug>`. En cuanto
alguien pica «Reservar», ve Caminante: logo, colores, todo. Eso contradice lo que
se le promete al operador en la llamada de alta —«va a parecer que tienes una
app»— así que F1 es lo que hace verdadera esa frase.

Las cuatro pantallas por las que pasa quien compra:

| Ruta | Archivo |
|---|---|
| `/caminante/experiencias/[slug]` | `src/app/caminante/experiencias/[slug]/page.tsx` |
| `/caminante/reservar/[slug]` | `src/app/caminante/reservar/[slug]/page.tsx` |
| `/caminante/registro/[slug]` | `src/app/caminante/registro/[slug]/page.tsx` |
| `/caminante/reserva/exito` | `src/app/caminante/reserva/exito/page.tsx` |

## Lo que YA está hecho (commit deb2514)

### 1 · Se abrió la cascada de Tailwind

`src/app/globals.css` → `@theme inline` tenía los colores en **hex literal**:

    --color-lagoon: #3E4836;      /* antes */
    --color-lagoon: var(--lagoon); /* ahora */

Con hex literal, `text-lagoon` resolvía a un valor fijo y **sobreescribir
`--lagoon` no hacía nada**. Sin este cambio F1 es imposible.

Los 12 colores se enrutaron por variable. Se verificó uno por uno que resuelvan
al MISMO hex que antes: cero cambio visual, solo se abrió la cascada.

### 2 · Se agregó `themeCssAppFor` en `src/lib/operators/branding.ts`

⚠️ **Hay DOS vocabularios de variables con los mismos nombres.** Es el hallazgo
que más fácil se olvida y el que produce un resultado equivocado sin fallar:

| Variable | landing · `.pub` · kit | `globals.css` (Tailwind) |
|---|---|---|
| `--olive` | el **verde** de marca | un **gris cálido** de texto |
| `--dune` | tinte claro del acento | el **naranja** de acento |
| `--lagoon` | no existe | el **verde** primario |

`themeCssFor` emite el primero (viste el portal, ya funciona).
`themeCssAppFor` emite el segundo. **Cada superficie usa el suyo.**

Decisiones tomadas dentro de `themeCssAppFor`, no las deshagas sin razón:
- `--olive` NO se toca: aquí es texto secundario. Pintarlo del color del
  operador haría ilegible medio párrafo.
- `--forest` y `--clay` tampoco: son **semánticos** (éxito y peligro). Un
  operador con marca roja no debe volver rojo el «qué incluye».

## Lo que FALTA

### A · Cablear las cuatro pantallas

En cada una: resolver el operador dueño de la experiencia, y si tiene marca
completa, envolver el contenido en un scope e inyectar el `<style>` DESPUÉS del
CSS base.

- `fetchThemeForExperience(slug)` ya existe en `branding.ts` — es best-effort:
  sin tema devuelve `null` y todo se ve Caminante. **Compat total.**
- `marcaLista(branding)` en `src/lib/operators/marca.ts` dice si la marca
  alcanza para vestir (exige los dos colores).
- Ojo con `/caminante/reserva/exito`: no recibe slug. Resuelve la reserva desde
  `session_id` (ya lo hace para el CTA del deslinde) y de ahí el operador.

### B · La prueba de no-regresión por hash

**Requisito de Luis, no opcional.** Las páginas de Caminante no pueden cambiar
ni un pixel. El patrón ya se usó en el rediseño de la serie E:

1. En una experiencia de Caminante (sin operador con marca), capturar la huella
   de estilos computados de los nodos clave.
2. Aplicar el cambio.
3. La huella debe ser IDÉNTICA.

Gotcha ya conocido: el Kit y las páginas pesadas no son fiables por screenshot
en el Browser pane (el scroll va al twin, ~1Hz). **Verificar por JS sobre el
DOM**, con `getComputedStyle`.

### C · Probar con un operador real

`Kéntro` (slug `kentro`) ya tiene branding en la base: `#212121` + `#9a3b2d`.
Su experiencia atribuida es `el-bosque-de-los-volcanes`.

Para comparar, `recoleccion-de-hongos` está atribuida a Numan · Caminante, que
NO tiene branding — o sea, debe verse exactamente igual que hoy.

## Reglas de esta casa que aplican aquí

- **Migraciones**: solo aditivas, se aplican a mano en el SQL Editor y se
  comparan por SHA-256 antes de Run. F1 no debería necesitar ninguna.
- **Nunca `git add -A`**: rutas explícitas. Hay varias sesiones en el repo.
- **Antes de empujar**: chequeo estructural. En esta sesión un backtick dentro
  de un `String.raw` tumbó el build. No hay `node` local para `tsc`; el
  verificador es el build de Vercel, así que lo que se pueda validar con grep o
  Python se valida ANTES.
- **Rama compartida**: `deploy/caminante-site`. Hacer `fetch` antes de empujar y
  **verificar el contenido del tip**, no solo que el push haya devuelto 0.
- **Promover**: si la lista de deployments de Vercel se atora en esqueletos, la
  ruta alterna es **Overview → enlace directo al deployment → su menú de tres
  puntos**. Ahí «Promote to Production» sí aparece.

## Contexto de negocio

Luis tiene su **primer onboarding de operador**. El alta completa ya está en
producción y probada de punta a punta. F1 es lo que hace que, cuando le enseñe
la pantalla, se vea suyo.

**F2 (correos), F3 (dominio propio) y F4 (Kit/PDF) NO son parte de esto.** F3 en
particular depende de que el operador apunte su DNS y de tiempos de propagación.
