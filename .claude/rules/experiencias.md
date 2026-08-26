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

## El deslinde del operador se FUSIONA con el nuestro

Casi todo operador con oficio ya trae su carta, escrita por alguien que conoce su
terreno. `lib/ai/fusionar-deslinde.ts` la concilia con la nuestra, en este orden:

1. La cláusula está en **las dos** → se queda **la suya**, con su redacción.
2. Solo la tenemos **nosotros** → se conserva.
3. Solo la tiene **él** → se agrega.

**Es una UNIÓN, nunca una intersección**, y hay un candado numérico: si la fusión
devuelve MENOS cláusulas de las que entraron, se rechaza entera. Un modelo que
«consolida» viñetas para acortar la lista produce un deslinde más débil que se lee
perfectamente razonable — esa es justo la forma en que esto podría hacer daño.
Invariante #11 lo protege.

⚠️ **Las CONTRADICCIONES no se resuelven solas.** Si su carta dice que el operador
provee seguro de gastos médicos y la nuestra declara que no se provee, no hay
fusión posible: hay una decisión de riesgo. Salen en `registration.waiverConflictos`
y el formulario las muestra en rojo.

El marco genérico E–J de `deslinde-doc.ts` (quién es el Organizador, el límite de
responsabilidad al monto pagado, datos personales, aceptación electrónica) **no
entra a la fusión**: no describe la actividad, define quién responde ante quién.

**Se sube desde tres lugares**, y los tres van al mismo endpoint: arriba del
formulario (junto al itinerario), en las secciones de deslinde y encuesta, y una
vez en el onboarding del operador (`operators.documentos`, 0043) — de ahí sirve
para todas sus experiencias con «usar el que ya subiste».

## Las cláusulas son objetos, y hay UN solo lector

`lib/legal/clausulas.ts`. Cada cláusula lleva `texto`, `obligatoria` y `origen`
(`casa` | `operador` | `fusion`). Las cadenas sueltas guardadas hasta el 26 ago
siguen siendo válidas — el lector las normaliza, por eso no hubo migración de datos.

**`obligatoria: false` solo para lo que el participante ELIGE** (uso de imagen,
boletín). El documento maestro lo plantea como una elección; listarlo con el mismo
peso que la liberación de responsabilidad le decía a quien firma que acepta todo o
no entra. En el registro solo se marca lo opcional: marcar las dos cosas convierte
la lista en un tablero de etiquetas y la distinción se pierde.

⚠️ **No leas `waiverClauses` a mano.** Con dos normalizadores las dos formas se
separan y vuelve el bug.

## El precio que se MUESTRA y el que se COBRA

`v2.tariff.price` es texto de portada; `price.amount` (o el `priceTier` más barato)
es lo que Stripe cobra. **No se sincronizan solos** —cuál de los dos está bien lo
decide quien vende— pero el formulario avisa cuando difieren y ofrece igualarlos en
un clic. Con Stripe en LIVE, divergir en silencio es dinero real.

## Contacto base: quien NO va en la salida

`Experience.baseContact`. Quien guía está donde ocurre el problema y muchas veces
sin señal; tiene que haber alguien afuera con el itinerario y la lista de
participantes. Sale como **sección propia** del deslinde generado (no como una
viñeta más): quien lo busca está en una emergencia y no va a leer la lista entera.

## El contacto de una experiencia es el de QUIEN LA OPERA

Dos capas, y hacen falta las dos:

- **Al crear**: `emptyExperience(dueno)` siembra `email`/`instagram`/`whatsapp` del
  operador que está dando de alta.
- **Al renderizar**: `fetchOperatorContactoForExperience` resuelve el bloque de
  cierre contra la ficha del operador dueño (`contactosDe` en el template).

Sembrar no bastaba: las páginas ya guardadas —la de Nomádika, en producción—
seguían invitando a escribir a `uno@numanhub.com` y a seguir a `@somos.caminante`,
porque el contacto se había copiado como texto dentro de la página. Resolviendo al
renderizar se corrigen solas en cuanto el operador captura sus datos, sin volver a
editar experiencia por experiencia.

Solo se sustituyen las tres etiquetas que el sistema conoce (WhatsApp · Email o
Correo · Instagram) y solo si el operador tiene ese dato; lo demás queda como está,
porque alguien lo escribió a mano.

## «Para tu seguro» es OPCIONAL y por experiencia

`registration.insurance`, y **nace apagado**. Prendido, el registro pide el
expediente que la aseguradora necesita: sexo, nacionalidad, CURP, identificación,
**domicilio** (`medical_profiles.address`, 0043), ocupación y beneficiario.

Apagado no se pide nada de eso, y esa es la razón de que exista el interruptor: son
ocho campos de datos personales y pedírselos a alguien que va a caminar cuatro
horas a un bosque, sin póliza detrás que los use, es recolectar datos sensibles sin
motivo. Donde sí hay póliza, sin el expediente no se puede dar de alta al
participante.

⚠️ Este bloque se anunciaba en la vista previa del admin **sin existir en el
formulario público**. Las tres superficies —vista previa, escritorio y teléfono—
se renumeran solas según el interruptor; si se toca una, se tocan las tres.

## El roster abre FICHA por persona

`RosterTabla.tsx`. La tabla resume para poder barrerla; la ficha es para cuando hay
que ACTUAR: llamar, escribir, o leerle a un médico lo que esa persona declaró. El
teléfono ya venía en la consulta y no se dibujaba en ningún lado, y alergias,
padecimientos y dieta se concatenaban en una sola celda.

⚠️ **La fila de detalle se renderiza SIEMPRE y se esconde con CSS**, nunca con un
`&&` de React. Es lo que hace que al **imprimir** salgan todas las fichas abiertas:
el guía se lleva la hoja al cerro, donde no hay a quién darle clic. Con render
condicional, imprimir daría una hoja con los datos que de verdad hacen falta
escondidos.

Un acompañante no es `contacts`: no tiene teléfono ni correo propios y la ficha lo
dice con todas sus letras en vez de quedarse en blanco.

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
