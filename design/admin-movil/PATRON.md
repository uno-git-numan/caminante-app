# Patrón de integración del panel de admin en móvil

Contrato único para transcribir las pantallas de `design/admin-movil/*.jsx`.
Referencia viva y ya en producción: **`src/app/caminante/admin/m/ui/Recursos.tsx`** y
**`Panorama.tsx`**. Léelas antes de escribir una línea.

## Qué es esto

`/caminante/admin/m` es el panel como app de teléfono. El shell (`ui/AppShell.tsx`) ya está: 5
pestañas, pila con historial, hojas, diálogos y toast. Faltan pantallas.

**Hoy están vivas:** Panorama y Recursos. El resto muestra un placeholder que manda al panel de
escritorio.

## Reglas duras

1. **El entregable es la fuente del diseño. Se transcribe, no se rediseña.** Markup y clases 1:1.
   Si algo no se entiende, se reporta — no se improvisa.
2. **Los datos del mockup son de ejemplo y se tiran.** `INIT` en `adm-core.jsx` es un objeto de
   demo. Todo sale de la base. **Si un dato no existe, se omite el bloque** — jamás se inventa.
   (Ya pasó dos veces en este repo: guías inventados y un domicilio fiscal falso.)
3. **Las pantallas se montan como COMPONENTES.** El shell hace `<Pantalla nav={} ui={} params={} />`.
   Nunca llamar la función: sus hooks contarían como hooks de AppShell y al cambiar de pestaña React
   truena con «rendered fewer hooks than expected».
4. **`.adm-x` es el cuerpo de un desplegable; `.dtl` (en el tablero) es un contenedor de tabla.**
   Ninguno es un `<details>`. Usarlos como envoltura anidada apila paddings y saca el triángulo
   nativo encima del chevron del diseño. Ese error ya se cometió una vez.
5. **Cero lógica de escritura nueva.** Las mutaciones ya existen y están probadas:
   `lib/admin/eventos-actions.ts`, `solicitudes-actions.ts`, `embajadores-actions.ts`,
   `lib/payments/cobro.ts`, `lib/admin/transferencias.ts`. Se reusan. Cada server action
   re-verifica admin por su cuenta — no le quites eso.
6. **`<span className="sl">//</span>` rompe el build** (ESLint lo lee como comentario JSX).
   Va `{"//"}`.

## Estructura

```
src/app/caminante/admin/m/ui/<Pantalla>.tsx   ← la pantalla ("use client")
src/lib/admin/movil/<area>.ts                 ← su adaptador de datos (server)
```

El adaptador **reusa las queries del escritorio** (`lib/admin/queries.ts`,
`lib/admin/rentabilidad.ts`). No escribas consultas nuevas para los mismos números: si el teléfono
y la computadora discreparan en una cifra, el bug sería imposible de explicar.

## Contrato de la pantalla

```tsx
"use client";
import type { Nav, Ui } from "./AppShell";

export default function Eventos({ d, nav, ui }: { d: EventosMovil; nav: Nav; ui: Ui }) {
  return <div className="adm-screen">…</div>;
}
```

- `nav`: `{ tab, setTab(id), push(id, params?), pop() }`
- `ui`: `{ toastify, copy, openSheet, closeSheet, openDialog, closeDialog, run, pendiente }`
- `ui.run(fn, label)` envuelve una server action: pone `pendiente`, hace toast y `router.refresh()`.
  Úsalo para todas las mutaciones en vez de tu propio try/catch.

Primitivas en `ui/kit.tsx`: `fmt` `fmtS` `fmtD` `Chip` `Chev` `Prow` `ProwN` `Sub` `Gap` `Eyebrow`
`Status` `Head` `NavBar` `Fld` `Seg` `CopyBox` `Life` `Empty` `TabIcon`.
**Si falta un átomo del entregable, extráelo a `kit.tsx` y dilo en el reporte.**

## Qué NO tocar

`ui/AppShell.tsx` · `ui/MovilApp.tsx` · `m/page.tsx` · `ui/kit.tsx` (salvo agregar un átomo que
falte) · `lib/admin/movil-css.ts` · `lib/admin/movil-datos.ts` · nada de `/admin` de escritorio.

**El cableado lo hago yo al final.** Tú exportas la pantalla y su adaptador; no edites `MovilApp`.

## Antes de terminar

```bash
export PATH="/Users/luisdelarosa/Desktop/acting/caminante/.tools/fnm-data/node-versions/v22.22.0/installation/bin:$PATH"
npx tsc --noEmit && npx eslint <tus archivos>
```

Los dos limpios. `npm run dev` **no** corre en este sandbox y el preview de Vercel pide sesión: el
verificador es el build. **No hagas commit** — reporta archivos tocados, de dónde sale cada dato,
qué omitiste y por qué, y cualquier cosa del entregable que contradiga al sistema.
