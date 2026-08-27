# Prompt para Claude Design — Salidas y Experiencias en el panel MÓVIL

> Se pega tal cual en el mismo chat donde ya construiste el panel móvil y las
> dos pantallas de escritorio. Depende de que ese chat tenga a la vista
> «Caminante Admin App» y los dos entregables de escritorio.

---

En este mismo chat ya construiste tres cosas que importan aquí. Búscalas y
tenlas a la vista antes de dibujar nada:

1. **«Caminante Admin App»** — el panel de admin como app de teléfono: el
   `.adm-app` con `.adm-head` pegajoso arriba, `.adm-tabbar` de cinco pestañas
   abajo, y el sistema de pila con `.adm-screen`, hojas `.adm-sheet` y diálogos
   `.adm-dlg`. Ahí definiste `.adm-card`, `.adm-li` (la fila desplegable con su
   `.adm-x` de cuerpo), `.adm-ros` (la fila de persona con avatar), `.adm-kpi4`
   (la tira de cuatro cifras), `.adm-seg` (el segmentado), `.adm-prog`,
   `.adm-chip`, `.adm-life`, `.adm-steps`, `.adm-state` (el vacío con su
   círculo), `.adm-note-warn` / `.adm-note-forest` / `.adm-note-info`.
2. **«Admin Salidas v2»** — la línea de tiempo de escritorio.
3. **«Admin Experiencias v3»** — el catálogo de escritorio.

**Lo que te pido: las pantallas 2 y 3 para el teléfono, con el sistema de la 1.**

No es un rediseño y no es una versión encogida. Es la misma información,
reorganizada para un pulgar. Reusa las clases que ya inventaste; si necesitas
una nueva, que sea la excepción y dila por su nombre.

---

## Por qué esto importa y desde dónde se mira

Quien abre esto en el teléfono casi nunca está en un escritorio: está en la
carretera, en el campo, o a punto de subir gente a una camioneta. La pregunta
que trae es **«¿qué me falta para el viaje que viene?»**, no «¿cómo va el
catálogo?».

Por eso te pido un cambio de jerarquía, y quiero que lo confirmes o me lo
discutas con argumento:

- Hoy la segunda pestaña se llama **Eventos** y mezcla las dos cosas.
- Propongo que la segunda pestaña sea **Salidas** —los viajes con fecha— y que
  **Experiencias** deje de ser pestaña y pase a ser una pantalla a la que se
  llega desde Salidas y desde «Más».
- Las cinco pestañas quedarían: **Panorama · Salidas · Gente · Recursos · Más**.

El razonamiento: en el teléfono se OPERA, y lo que se opera es un grupo con
fecha. El catálogo es trabajo de escritorio —fotos, textos, precios— y en el
teléfono se consulta, no se edita. Si crees que hay una jerarquía mejor,
proponla, pero dime por qué.

---

## PANTALLA A · Salidas

En escritorio la pantalla se parte por TIEMPO, no por tipo de trabajo: una
salida tiene un ANTES (perseguir firmas del deslinde) y un DESPUÉS (leer la
encuesta). Los dos grupos se llaman **«Lo que viene»** y **«Lo que fue»**, y
cada uno lleva el mismo peso tipográfico que el título de la pantalla.

### El encabezado y las cuatro cifras

En escritorio son cuatro tarjetas `.kpi`. En el teléfono creo que van en tu
`.adm-kpi4`, pero dos de ellas traen frase larga debajo y ahí no cabe. Resuélvelo
como tú decidas —tira de cuatro con la frase de la más urgente aparte, o dos
tarjetas de dos— y explícame la decisión.

Éstos son los números **reales de producción de hoy**, no de ejemplo:

| Cifra | Valor | La frase que la acompaña |
|---|---|---|
| Por viajar | **3** salidas | La más cercana en **3 días** · 22 personas suben |
| Firmas pendientes | **4** de 17 | Reparto: 2 en Hacienda y hongos, 2 en Trekking Barrancas |
| Sin encuesta armada | **0** salidas | Todas las que vienen van a poder medirse |
| Respuestas por leer | **20** de 41 | 49% respondió · 13 testimonios listos · 16 quieren repetir |

«Sin encuesta armada» existe por un incidente: una salida viajó con 18 personas
y nadie recibió encuesta, porque la casilla nacía apagada y el único síntoma fue
el silencio. Cuando ese número es mayor que cero tiene que verse **caro**, en
naranja. Cuando es cero, tiene que verse tranquilo. Dibújame los dos.

### La cápsula de una salida

En escritorio cada salida es una tarjeta que se expande. En el teléfono creo que
es tu `.adm-li` con su `.adm-x`, pero decide tú.

Cerrada muestra: nombre de la experiencia · fecha · lugar · quién la opera · la
cuenta regresiva en mono · **Lugares 11/16** · **Deslindes 5/7**.

Abierta se parte en dos grupos, y este orden importa: **primero los que faltan
por firmar**, después los que ya firmaron. Cada persona es una `.adm-ros` con su
avatar de iniciales, y las pendientes traen dos acciones: **Copiar link** y
**WhatsApp**. En el teléfono ese botón de WhatsApp abre la app: es probablemente
lo más usado de toda la pantalla, así que no lo escondas en un menú.

Tres salidas reales para que dibujes con material verdadero. **Los nombres de
participantes son inventados a propósito** —los reales no salen de nuestros
sistemas—, pero los conteos, fechas y estados son los de producción:

**1 · La que aprieta.** «Hacienda y hongos», Ago 29-30, Estado de México,
temporada de lluvias, operada por Numan · Caminante. **En 3 días.** Lugares
11/16. Deslindes 5/7. Aviso: *«2 personas sin firmar, y la salida es en 3
días»*. Encuesta armada ✓. Faltan por firmar: 2 (usa «Ana Robles» y «Diego
Palma»). Éste es el caso feo y el que más importa que se vea bien.

**2 · La tranquila.** «Recolección de hongos», domingo 27 sep, Estado de México.
En 32 días. Lugares 5/18. Deslindes 4/4 · **✓ Todos firmaron**. Encuesta armada
✓. Al pie: «Ver roster» y «Cerrar ventas». Ésta es la que necesito ver sin una
sola alerta: cuando todo está bien, la pantalla tiene que sentirse en calma, no
igual de ruidosa que la anterior.

**3 · La lejana.** «Trekking Barrancas del Cobre», Oct 8–11, Chihuahua. En 43
días. Y ojo: esta experiencia **no puede cobrar por web** porque le falta el
documento del deslinde. Dime si eso se dice aquí o solo en Experiencias.

### «Lo que fue»

Las salidas pasadas, la más reciente arriba. Aquí la cápsula abre a las
respuestas de la encuesta, agrupadas igual: **quiénes respondieron y quiénes
no**, con el mismo botón de WhatsApp para pedirla.

Regla dura de la casa: **ningún promedio se muestra sin su denominador.** «4,2»
solo, no. «4,2 de 8 respuestas sobre 18 personas», sí. Necesito ver cómo lo
resuelves en un ancho de teléfono sin que se vuelva un párrafo.

### Estados que hay que dibujar

- **Sin salidas por delante.** Y no es un pendiente: una experiencia puede
  venderse por solicitud de grupo sin tener fechas. El vacío tiene que decir
  eso, no regañar. Usa tu `.adm-state`.
- **Salidas publicadas que nadie ha comprado.** En escritorio se colapsan en una
  sola línea que dice «N salidas próximas sin reservas — publicadas, nadie ha
  comprado lugar todavía». Tampoco son un pendiente.
- **El alta.** El botón «+ Agregar salida» abre cuatro pasos numerados
  (experiencia → fecha → cupo → cómo se muestra). En escritorio es un panel que
  se despliega; en el teléfono creo que es tu `.adm-sheet` con `.adm-steps`, pero
  decide y explícame. La experiencia se elige con píldoras, no con un `select`, y
  **solo aparecen las publicadas**.

---

## PANTALLA B · Experiencias

El catálogo. Aquí vive el PRODUCTO: si puede venderse, cómo se ha vendido y qué
tan armado está.

En escritorio son tarjetas con foto grande en reja de tres. En un teléfono una
columna de tarjetas con foto se convierte en un scroll larguísimo. Dame **tu
solución**, y si es una fila compacta con foto chica en vez de tarjeta, me
parece bien: dime por qué.

Cada producto trae:

- **El semáforo de venta**, que es lo primero: *Lista para vender* / *No vende:
  falta el documento del deslinde* / *En borrador, todavía no se vende*. No es
  cosmético: el mismo candado bloquea publicar **y cobrar**.
- **Tres cifras**: ingresos, clientes, estrellas (con su denominador).
- **La armadura**: cinco dimensiones con nombre y tres estados —completa, a
  medias, falta—: fotos, ficha científica, saber de los guías, deslinde,
  encuesta. En escritorio son cinco píldoras con un punto. En el teléfono cinco
  píldoras quizá no quepan; si las resumes, que se siga entendiendo **cuál**
  falta, no solo cuántas.
- **El calendario, como enunciado y no como alerta**: «Sin fechas planeadas · se
  vende por solicitud» es un estado perfectamente sano, no un pendiente. Una
  experiencia puede vivir publicada para siempre sin fechas.

Datos reales de producción, siete productos y dos operadores:

- **Ensenada de Muertos · Ocean Safari** — publicada, lista para vender.
  $384,000 · 23 clientes · 4,8 estrellas de 12 respuestas sobre 23. Armadura 2
  de 5 (le faltan fotos por tipo, ficha científica y saber de los guías).
  Sin fechas planeadas.
- **El fondo de la barranca** — publicada pero **NO VENDE**: falta el documento
  del deslinde. $99,000 · 6 clientes. Éste es el caso que tiene que saltar.
- **Recolección de hongos** — publicada, vendiendo, con encuesta contestada.
- Y una en **borrador**, que no se vende y no pasa nada.

La banda de arriba, en escritorio, son cuatro cifras de la casa: ingresos de la
plataforma, cuántas no pueden vender, cuántas tienen la armadura completa, y las
estrellas de la casa. Dime si en el teléfono valen la pena o si aquí sobran.

Y los filtros de escritorio son cuatro: buscar, operador, estado, orden. En el
teléfono cuatro controles en fila no caben. Resuélvelo.

**Nota:** un operador externo ve esta pantalla sin la banda de cifras, sin
filtros y sin la línea de quién opera cada producto — tiene una sola cartera.
No hace falta que dibujes esa variante completa, pero tenla en cuenta para que
quitar esas tres cosas no rompa el layout.

---

## Lo que NO va

- **Nada de solicitudes de grupo.** Eso vive en un CRM que se construye aparte.
- **Nada de editar contenido de la experiencia** desde el teléfono: fotos,
  textos, itinerario y precios se editan en el escritorio. Aquí se consulta y se
  opera.
- **Ningún dato inventado.** Si un número no está arriba, no lo pongas: déjalo
  como hueco visible. Ya se coló contenido inventado hasta producción una vez.

---

## Cómo quiero la entrega

- Un HTML autocontenido, como los anteriores, con el CSS del panel móvil
  **reusado**, no reescrito. Ancho de iPhone.
- **Todos los estados en la misma lámina**, no solo el bonito: la salida que
  aprieta y la que está en calma, el catálogo con una experiencia frenada y el
  catálogo vacío, la tira de cifras con el cero tranquilo y con el número caro.
- Al final, **un recibo de qué reusaste**: la lista de clases del panel móvil que
  aplicaste tal cual, y la lista —espero que corta— de las que tuviste que
  inventar, con el motivo de cada una. Si esa segunda lista sale larga, es señal
  de que empezaste de cero en vez de partir de lo que ya hiciste.
- Y tus tres decisiones explicadas: la jerarquía de pestañas, cómo resolviste las
  cuatro cifras en ancho de teléfono, y qué hiciste con las cinco píldoras de la
  armadura.
