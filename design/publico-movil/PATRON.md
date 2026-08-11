# Patrón de integración del sitio público móvil

Contrato único para transcribir las pantallas de `design/publico-movil/*.jsx` al sitio real.
Referencia viva y ya en la rama: **`src/app/caminante/nosotros/page.tsx`**. Léela antes de escribir.

## La regla que manda

Es la **vista móvil del sitio que ya existe**, no un sitio nuevo (Luis, 11 ago: *«hoy la página se ve
bien en escritorio; solo es integrar para que en teléfono se vea bien, sin tocar escritorio»*).

- **Ruta que YA tiene escritorio** → `<PubStyles />` (modo `swap`, el default). Se renderizan los dos
  marcados: el de hoy envuelto en `<div className="pub-no">` y el nuevo dentro de `<PubShell>`. El
  CSS decide cuál se ve (corte en 700px). **No se toca ni una línea del marcado de escritorio.**
- **Ruta NUEVA** (hoy da 404) → `<PubStyles modo="solo" />`. No hay escritorio que respetar.

## Piezas

```tsx
import PubStyles from "@/app/caminante/ui/pub/PubStyles";
import PubShell from "@/app/caminante/ui/pub/PubShell";
import { Eyeb, Sec, HeadFloat, NavCream, Testi } from "@/app/caminante/ui/pub/atoms";
import { pfmt, usePubUI } from "@/app/caminante/ui/pub/PubShell";
```

- `PubShell` acepta `tab` (`"inicio"|"experiencias"|"aprende"|"espacio"`, o nada si es pantalla
  empujada), `sesion`, `pendiente`, `buypad` (deja aire para la barra de compra fija).
- `usePubUI()` da `abrirHoja("menu"|"avisame", params)` y `toast(t, s)` — solo en componentes cliente.
- `pfmt(n)` = el formato de precio del entregable (`$16.500`).

## Cómo se transcribe

1. **El marcado y las clases van VERBATIM.** El CSS extraído los espera tal cual. No renombres nada,
   no "mejores" la estructura, no metas Tailwind.
2. `nav.push("exp",{id})` → `<Link href="/caminante/experiencias/<slug>">`. `nav.pop()` → el back del
   router (`HeadFloat`/`NavCream` ya lo hacen; pásales `backHref` cuando haya un padre claro).
3. `<Ph cat="..." slug="..."/>` es un rectángulo de color con la pista de qué foto va ahí. Se
   reemplaza por la foto REAL: la de la experiencia/destino si la pantalla es de una, o
   `unaFotoDelBanco([...])` / `fotosDelBanco([...])` de `@/lib/publico/fotos` para las genéricas.
   **Si no hay foto, el bloque se esconde. Jamás se rellena con algo que no es del lugar.**
4. `<span className="sl">//</span>` **rompe el build** (ESLint lo lee como comentario JSX).
   Va `<span className="sl">{"//"}</span>`.
5. Los `<img>` crudos se quedan (el CSS hace `object-fit:cover` sobre ellos); antes de cada uno,
   `{/* eslint-disable-next-line @next/next/no-img-element */}`.
6. Rutas nuevas: agrégalas a `isImmersive` en `src/app/caminante/SiteChrome.tsx`, o el nav viejo las
   envuelve.

## Lo que el mockup inventa — NO se inventa aquí

`design/publico-movil/INTEGRACION.md` los lista todos. Los que más muerden:

| Inventado | Qué se hace |
|---|---|
| `e.guia = {nombre, rol, cita}` | **No existe ese modelo.** La heurística `guias()` del Kit ya confundió variedades de hongo con personas. Se omite el bloque hasta que haya dato real. |
| `e.cat` (Hiking/Trekking/Ocean Safari) | No hay campo de categoría. Lo más cercano es `brandSmall`, texto libre. No agrupes por algo que no existe. |
| Punto de encuentro + mapa | No hay campo. Se omite. |
| `hola@numanhub.com` | No existe. Es `uno@numanhub.com`. |
| «4,8 de 5 · 12 respuestas» en el home | Hardcodeado, y es justo el número que el panel **dejó de mostrar** el 10 ago porque escondía dos salidas distintas. Si va, sale de `fetchExperienceRatings` por salida. |
| Testimonios firmados con nombre | Se firman con **iniciales** y exigen `publish_status='approved'` + `testimonial_consent=true`. |
| Colores de marca del operador | Es el plan white-label, no está construido. |

## Los cuatro formularios que piden de menos

El diseño se respeta, pero **los campos faltantes se agregan** en su mismo lenguaje visual
(`.pub-fld`, `.pub-acts`, `.pub-cta`). Decisión de Luis, 11 ago.

- **Deslinde** (`/registro/[slug]`): el mockup escribe una cláusula genérica y no enlaza el PDF. Van
  las cláusulas reales de `Experience.registration.waiverClauses` **y el link a `waiverDocUrl`** —
  quien firma siempre debe poder leer el documento (`deslindeListo`, regla que bloquea publicar y
  cobrar).
- **Encuesta** (`/feedback/[token]`): las secciones son data-driven (`Experience.feedback.sections`),
  no las tres fijas del mockup. Faltan y van: `overallStars`, `lovedText`, `improveText`,
  `expectedGapText`, `rebookInterest`, `testimonialStars`, `photoConsent`.
- **Solicitar fecha**: falta **WhatsApp**, que `submitSlotRequest` exige (sin él el form falla
  siempre), más `nota` y `tipo` (privada/abierta).
- **Embajadores**: faltan WhatsApp, el perfil (`creador|agencia|comunidad`) y al menos un link con
  tamaño de audiencia.

Y dos transiciones que no pueden vivir dentro de la app:

- **Reservar** cobra con un `setTimeout` en la demo. En vivo `createCheckout` **redirige a Stripe** y
  el regreso llega a `/caminante/reserva/exito?session_id=`. La pantalla se queda igual; el botón
  redirige.
- **Éxito** manda siempre al deslinde. Solo va el CTA si `registration.active`; si no, es un 404.

## Antes de terminar

```bash
export PATH="/Users/luisdelarosa/Desktop/acting/caminante/.tools/fnm-data/node-versions/v22.22.0/installation/bin:$PATH"
npx tsc --noEmit && npx eslint <tus archivos>
```

Los dos tienen que salir limpios. `npm run dev` **no** corre en el sandbox: el verificador es el
build de Vercel. No hagas commit — reporta qué archivos tocaste.
