---
paths:
  - "src/lib/experiences/**"
  - "src/lib/registration/**"
  - "src/lib/feedback/**"
  - "src/app/caminante/experiencias/**"
  - "src/app/caminante/admin/experiencias/**"
  - "src/app/caminante/admin/eventos/**"
  - "src/app/caminante/registro/**"
  - "src/lib/destinos/**"
---

# Experiencias, deslinde y salidas

## REGLA DE PRODUCTO: el formulario CREA, el dashboard OPERA

Contenido y fechas/cupo se crean y editan **solo** en el formulario de experiencia
(`/admin/experiencias/nueva` o `[slug]`). El dashboard **solo opera**: ocupación,
cerrar/reabrir ventas, operador, publicar.

**No agregues mini-forms de creación al panel.** Nada debe nacer vacío. Camino
único de fechas: `saveExperienceSlots` — las salidas quitadas del form **se
CIERRAN, no se borran**.

⚠️ El modo edición **solo carga salidas ABIERTAS**. Si entraran las cerradas, cada
guardado las re-abriría: fechas que resucitan.

## «Prendido TODO antes de publicar»

`listaParaPublicar(exp)` (`lib/experiences/flujo-venta.ts`) es el candado ÚNICO de
publicar y lo consultan **los dos caminos** (el form y `setExperienceStatus` — este
último era el bypass del gate).

- **`deslindeListo`** = `registration.active` && ≥1 cláusula && **`waiverDocUrl`
  presente**. Quien firma SIEMPRE debe poder leer el PDF.
- **`encuestaLista`** = activa && ≥1 categoría && `locationLabel`.

⚠️ **El deslinde también bloquea COBRAR** (`createCheckout` rebota
`?error=deslinde`). La encuesta **no** bloquea cobrar: una venta con la encuesta
apagada no le hace daño al cliente. El candado va en publicar.

**De dónde salieron las dos reglas:** Enyd pagó 2 lugares de una experiencia
publicada **sin deslinde activo**, y la pantalla de éxito prometía un correo que no
existía. Y la salida de hongos del 26 jul viajó con **18 personas y nadie recibió
encuesta** — la casilla nacía apagada, ningún gate la exigía, y el único síntoma
fue el silencio.

## Fechas: el fin nunca antes del inicio

Una salida de volcanes tenía `ends_at` en **julio** para un viaje de agosto. Como
`ends_at` dispara la encuesta (+24h), con la encuesta activa les habría llegado
«¿cómo te fue?» a 6 clientes que aún no viajaban. Hay guard en **los tres** caminos
que escriben `ends_at`.

**Las salidas vencidas se cierran solas** (cron `cerrar-salidas`, 8am CDMX). El
corte es por **`starts_at`, no `ends_at`**: una salida de Oct 8-11 no se vende el 9,
el grupo ya va en camino. Cerrar **no borra** — se reabre desde el dashboard.

## Salidas privadas

Solo existen con su link `?grupo=<token>`. **Sanitiza SIEMPRE con `cleanGrupoToken`**
antes de un filtro PostgREST. Los puntos que filtran `visibility='public'`:
`fetchOpenSlotsForTemplate`, `fetchPublicAvailability`, `/reservar` y el picker del
deslinde. El form de experiencia no las ve ni las toca.

## Diseño v2 data-driven

`Experience.page.blocks` = arreglo ordenado de bloques tipados. La plantilla
`ExperienceTemplateV2.tsx` los renderiza contra CSS y script **extraídos VERBATIM**
del HTML (`template-v2-css.ts`, `template-v2-script.ts`, byte-idénticos). **Si el
diseño cambia, RE-EXTRAER del HTML — no editar a mano.**

Los `.html` en `public/landing/experiencias/` son **respaldo y fuente del diseño**,
ya no se sirven.

⚠️ **El copy de la página NO lleva fechas, conteos ni temporada.** Las fechas reales
viven SOLO en las date-cards, llenadas desde la BD. El resto del copy es atemporal.

## La IA solo PRE-LLENA

`lib/ai/prellenar.ts` + `aplicar-prellenado.ts`. **Merge NO destructivo: jamás pisa
con vacío**, preserva fotos por índice. Lo que falte queda vacío + reportado en
`notas` — **nunca se inventa**. El humano revisa y guarda.

Las categorías cerradas (estado, moneda, lens key) se **normalizan**, y los campos
de patrón se estampan por índice — no se le piden a la IA.

## Guardas que ya salvaron datos

- **`saveExperience` bloquea guardar sobre un slug existente** salvo que sea el que
  se edita o el admin confirme. El upsert por slug pisaba experiencias completas —
  casi pasa con `recoleccion-de-hongos` (Amecameca vs Xalatlaco, con ventas reales).
- **`guardarMedicoAction` FUSIONA** sobre el perfil actual. Sin el merge se
  borrarían CURP/género/beneficiario capturados en el deslinde. No lo quites.
- **Empalme de contacto**: si el contacto de la reserva aún no tiene correo, se
  **completa ese** en vez de crear otro. Si no, quedan dos fichas de la misma
  persona y un roster que no cuadra.
