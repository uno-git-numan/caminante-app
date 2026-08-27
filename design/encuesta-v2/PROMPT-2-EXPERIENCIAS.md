Va en el MISMO chat, después de recibir el diseño de Salidas.

> Copia desde aquí ↓

---

## CONTINÚA LO QUE ACABAS DE HACER — NO EMPIECES DE CERO

Esta pantalla es la **pareja** de «Salidas», que acabas de diseñar arriba en este
mismo chat. **Ábrela otra vez antes de escribir una línea.** Y ten a la mano el
panel de administración de Caminante que ya habías diseñado antes en este hilo
(Panorama, Eventos, Reservas, Personas, Roster, Dinero).

Lo que me entregues tiene que poder ponerse al lado de Salidas y parecer **la
misma aplicación, hecha el mismo día, por la misma persona**: mismos
encabezados, mismas tarjetas, mismos chips, mismos botones, mismos nombres de
clase.

Componentes que **ya tienes y debes reusar**, sin renombrarlos ni recrearlos:

| clase | qué es | estructura interna |
|---|---|---|
| `.page` · `.sec` · `.sec-head` | contenedor, sección, encabezado | |
| `.eyebrow` + `<span class="sl">//</span>` | rótulo olivo con las diagonales naranjas | |
| `.display` + `<em class="ac">` | título peso 200 + remate itálico naranja | |
| `.card` · `.pad` · `.glass` | tarjeta, padding, vidrio | |
| `.kpis` › `.kpi` | cifra grande | `.k-lbl` · `.k-val` (+`.u`) · `.k-sub` |
| `.prog` (+`.prog.warn`) | barra con fracción | `.tk2 > i` · `.fr` |
| `.chip` + `.c-pub` / `.c-draft` | publicada / borrador | `.cd` (puntito) |
| `.btn` + `.btn-glass` / `.btn-orange` / `.btn-ghost` / `.btn-sm` | botones | |
| `.tbl-wrap` › `table` · `.empty` · `.mut` · `.mono` · `.subtitle` | tabla, vacío, texto | |
| `.stars-lg` · `.tick` · `.dot`/`.dots` · `.tcard` · `.testi` | estrellas, palomita, puntos, testimonios | |

**FOTOS: usa las que ya tienes en tus assets de este chat** — bosque, hongos, mar
de Cortés, barranca, montaña, las que ya trabajaste para Caminante. Nada de
placeholders grises ni stock genérico: estas tarjetas viven de su foto y el
diseño solo se puede juzgar con las imágenes reales.

Variables (no agregues colores):
```css
--cream:#fbfbf7; --charcoal:#20211c; --lagoon:#1c6f6a; --forest:#20392b;
--olive:#637154; --olive-d:#4f5d44; --sand:#b6ada5; --dune:#c9b79c;
--salvia:#d6d8c7; --orange:#ff5d36; --panel:#f1eee7; --bg:#eceae3;
--line:rgba(32,33,28,.13); --ink-soft:rgba(32,33,28,.6);
--r:16px; --shadow:0 12px 34px -22px rgba(32,33,28,.42);
```
Geist (títulos 200–300, nunca bold pesado) · Geist Mono para cifras · **cero
emojis** (usa ★ ↑ ↓ ✓ ⚠ ·) · glassmorphism · español de México, trato de «tú»,
sin lenguaje de dashboard corporativo («KPI», «insights», «engagement»
prohibidos).

## QUÉ ES ESTA PANTALLA

Se llamaba «Eventos» y ahora es **«Experiencias»**: el catálogo de productos.

```
Experiencia = la PLANTILLA atemporal (el producto).
Salida      = la INSTANCIA con fecha (ya la diseñaste).
```

Aquí viven **tres cosas y nada más**:

1. **La información del producto** — si puede venderse y cómo se ha vendido.
2. **Sus fotos** — el banco de imágenes de la experiencia.
3. **Su comunicación** — las piezas del Kit y los testimonios publicables.

Todo lo demás está en otra pantalla. **No dibujes aquí**: gestión de fechas
(vive en Salidas), listas de participantes, deslindes pendientes, ni
solicitudes de clientes (van a vivir en un CRM aparte que todavía no existe).

⚠️ **Una experiencia puede vivir publicada para siempre sin ninguna fecha
planeada.** Se vende por solicitud de grupo. Eso **no es un error ni un
pendiente**: es un modo normal de operar y va a ser el caso más común. Se
enuncia como un hecho —«Sin fechas planeadas · se vende por solicitud»— sin
número, sin alerta y sin empujar a agregar fechas.

## 1 · EL CATÁLOGO — TARJETAS, NO FILAS

Una tarjeta por experiencia, **con su foto principal**:

- Foto · nombre · chip de estado (Publicada / Borrador)
- **El semáforo de venta.** Una experiencia no puede venderse sin deslinde con
  documento **y** encuesta activa — es candado duro del sistema: bloquea
  publicar y bloquea cobrar. Hoy solo te enteras al intentar publicar. La
  tarjeta lo dice: *«Lista para vender»* o *«No vende: falta el documento del
  deslinde»*.
- **Tres cifras**: ingresos · clientes que han pasado · ★ acumulado **con su
  denominador** (nunca un promedio solo: «★ 4.6 de 9»)
- **La armadura: CINCO dimensiones**, con sus nombres visibles — no solo un
  conteo. Fotos por tipo · Ficha científica · Saber de los guías · Deslinde ·
  Encuesta. Cada una tiene tres estados (completa / a medias / falta), así que
  la representación necesita distinguir tres, no dos, y llevar leyenda.
- Al pie, el estado del calendario como enunciado: «Una fecha publicada ·
  Oct 8–11» o «Sin fechas planeadas · se vende por solicitud».

Con eso, entrar a la ficha debe ser **opcional**.

Datos reales:
```
Recolección de hongos · Publicada · lista para vender
   $45,900 · 18 clientes · ★ 4.6 de 9 · armadura 4 de 5 · una fecha · 27 sep
Ensenada de Muertos · Publicada · lista para vender
   $241,280 · 13 clientes · ★ 4.8 de 5 · armadura 5 de 5 · una fecha · Oct 3–4
El fondo de la barranca · Publicada · lista para vender
   $52,800 · 6 clientes · sin respuestas aún · armadura 4 de 5 · sin fechas planeadas
Trekking Barrancas del Cobre · Publicada · No vende: falta el documento del deslinde
   $96,000 · 8 clientes · sin respuestas aún · armadura 3 de 5 · una fecha · Oct 8–11
Amanalco lobo glamp · Borrador
   sin ventas · armadura 1 de 5 · sin fechas planeadas
```

**Orden: por lo que necesitan, no alfabético.** Arriba las que no pueden vender,
luego las que están vendiendo, al final las dormidas. Que el orden ya sea una
respuesta.

## 2 · LA FICHA (se navega, no se expande)

Picar una tarjeta lleva a su página. Arriba: foto de portada, nombre, estado y
el semáforo de venta en grande. Barra de acciones: **Editar contenido** · **Ver
página pública** · **Kit de comunicación** · **Publicar / Pasar a borrador**.

Cinco bloques, en este orden:

1. **Cómo va** — ingresos · clientes · salidas corridas · ★ acumulado con su
   denominador.
2. **Sus fotos** — el banco por tipo (paisaje, gente, flora, detalle, retrato),
   como mosaico, marcando qué tipos están vacíos. Es la materia prima de todo
   lo demás y hoy no se ve en ningún lado.
3. **Su comunicación** — cuántas piezas del Kit están listas, programadas y
   publicadas; y los **testimonios publicables** que dejó la encuesta (hay 9
   aprobados en el sistema y ninguna pantalla lo dice). Con enlace al Kit.
4. **Qué le falta** — las cinco dimensiones de la armadura, con nombre, estado y
   enlace a donde se arregla.
5. **Tu trato / Operador** — ver abajo: cambia según quién mira.

Y como cierre, discreto: **sus fechas publicadas, en SOLO LECTURA**, con
«Abrir salida →». Sin crear, sin editar, sin cerrar — que se lea como un reflejo
y no como un panel de control.

## 3 · LA MISMA PANTALLA TIENE DOS PÚBLICOS

Esto es lo más importante del encargo y quiero que lo dibujes **dos veces**.

El panel lo usan **la casa** (Caminante, que ve las experiencias de todos los
operadores) y **cada operador externo** (que ve solo las suyas).

**Diseña primero la del OPERADOR.** Para él, «operador» siempre sería él mismo:
como campo no dice nada. Lo de la casa se **agrega encima**.

| | operador | casa |
|---|---|---|
| Campo / columna «Operador» | **no existe** | sí, y sirve de filtro |
| Comisión | **la suya**, como DATO de solo lectura, bajo el título «Tu trato» | editable, y la de todos |
| Dinero | sus ingresos | el total de la plataforma |
| Asignar operador · crear operador | **no existe** | sí |

Para el operador, el bloque 5 se ve así: título **«Tu trato»**, su porcentaje en
grande y en mono («15%»), y una línea explicando que se congela en cada venta y
que ajustarlo aplica a ventas futuras. **Nada que se pueda picar.**

Dibuja el catálogo y la ficha **en las dos versiones**, una debajo de otra, con
un rótulo que diga cuál es cuál.

## 4 · ESTADOS QUE NECESITO DIBUJADOS

1. Experiencia **publicada sin fechas planeadas** — el caso más común. Dale la
   mejor versión: tiene que verse sana, no incompleta.
2. Experiencia que **no puede vender** por el candado del deslinde.
3. Experiencia en **borrador**, sin ventas y con la armadura casi vacía.
4. Experiencia **sin respuestas de encuesta todavía** (el lugar de las estrellas
   cuando no hay ninguna).
5. El catálogo **vacío** (aún no hay experiencias).

## 5 · ENTREGA

Un HTML autocontenido, mismo formato que Salidas: CSS adentro, fotos reales de
tus assets, datos en el marcado. El catálogo completo + una ficha + los cinco
estados + las dos versiones (operador y casa).

**Y al final, en un comentario: qué componentes REUSASTE de lo que ya diseñaste
en este chat y cuáles tuviste que inventar, con el porqué.** Las dos pantallas
tienen que verse como hermanas — si la lista de reúso sale corta, algo se salió
del sistema y hay que repetirlo.

> Copia hasta aquí ↑
