Reemplaza al «PROMPT 2» de `PROMPTS-CLAUDE-DESIGN.md`. Va en el MISMO chat,
después de recibir el diseño de Salidas.

> Copia desde aquí ↓

---

## CONTINÚA LO QUE ACABAS DE HACER — NO EMPIECES DE CERO

Esta pantalla es la **pareja** de «Salidas», que acabas de diseñar arriba en este
mismo chat. **Ábrela otra vez antes de escribir una línea.** Y sigue teniendo a la
mano el panel de administración de Caminante que ya habías diseñado antes en este
hilo (Panorama, Eventos, Reservas, Personas, Roster, Dinero).

Lo que me entregues tiene que poder ponerse al lado de Salidas y parecer **la
misma aplicación, hecha el mismo día, por la misma persona**. Mismos
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
| `.chip` + `.c-pub` / `.c-draft` | estado publicada / borrador | `.cd` (puntito) |
| `.btn` + `.btn-glass` / `.btn-orange` / `.btn-ghost` / `.btn-sm` | botones | |
| `.tbl-wrap` › `table` · `.empty` · `.mut` · `.mono` · `.subtitle` | tabla, vacío, texto | |
| `.stars-lg` · `.tick` · `.dot`/`.dots` | estrellas, palomita, puntos | |

**FOTOS: usa las que ya tienes en tus assets de este chat** — las de bosque,
hongos, mar de Cortés, barranca, montaña que ya trabajaste para Caminante. No
uses placeholders grises ni stock genérico: estas tarjetas viven de su foto y el
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
emojis** (usa ★ ↑ ↓ ✓ ⚠ ·) · glassmorphism · español de México, trato de «tú», sin
lenguaje de dashboard corporativo («KPI», «insights», «engagement» prohibidos).

## QUÉ ES ESTA PANTALLA

Se llamaba «Eventos» y ahora es **«Experiencias»**: el catálogo de productos.

```
Experiencia = la PLANTILLA atemporal (el producto).
Salida      = la INSTANCIA con fecha (ya la diseñaste).
```

Aquí **no se administran fechas** — eso vive en Salidas. Aquí se ve el producto:
si puede venderse, cómo se ha vendido, y qué tan armado está.

⚠️ **Una experiencia puede vivir publicada para siempre sin ninguna fecha
planeada**, vendiéndose por «solicitar grupo». Eso **no es un error ni un
pendiente**: es un modo normal de operar, y va a ser el caso más común. No lo
dibujes como un hueco ni empujes a «agregarle fechas».

## 1 · EL CATÁLOGO — TARJETAS, NO FILAS

Una tarjeta por experiencia, **con su foto principal**. Cada una trae:

- Foto · nombre · chip de estado (Publicada / Borrador)
- **El semáforo de venta.** Una experiencia no puede venderse sin deslinde con
  documento **y** encuesta activa — es candado duro en el sistema, bloquea
  publicar y cobrar. Hoy solo te enteras al intentar publicar. La tarjeta debe
  decirlo: *«Lista para vender»* o *«No vende: falta el documento del deslinde»*.
- **Tres cifras**: ingresos · clientes que han pasado · ★ acumulado **con su
  denominador** (nunca un promedio solo: «★ 4.7 de 23 respuestas»)
- **La armadura**: seis puntitos con cuántos están completos — fotos por tipo,
  ficha científica, saber de los guías, deslinde, encuesta, salidas. «4 de 6»
- **«2 solicitudes esperando»** cuando las haya

Con eso, entrar a la ficha debe ser **opcional**.

Datos reales:
```
Recolección de hongos · Publicada · lista para vender
   $45,900 · 18 clientes · ★ 4.6 de 9 · armadura 5 de 6 · 2 solicitudes
Ensenada de Muertos · Publicada · lista para vender
   $241,280 · 13 clientes · ★ 4.8 de 5 · armadura 6 de 6
El fondo de la barranca · Publicada · lista para vender · SIN FECHAS
   $52,800 · 6 clientes · sin respuestas aún · armadura 4 de 6 · 3 solicitudes
Trekking Barrancas del Cobre · Publicada · No vende: falta el documento del deslinde
   $96,000 · 8 clientes · sin respuestas aún · armadura 3 de 6
Amanalco lobo glamp · Borrador
   sin ventas · armadura 1 de 6
```

**Orden: por lo que necesitan, no alfabético.** Arriba las que no pueden vender,
luego las que están vendiendo, al final las dormidas. Que el orden ya sea una
respuesta.

## 2 · LA FICHA (se navega, no se expande)

Picar una tarjeta lleva a su página. Arriba: foto de portada, nombre, estado y el
semáforo de venta en grande. Y una barra de acciones: **Editar contenido** · **Ver
página pública** · **Kit de comunicación** · **Publicar / Pasar a borrador**.

Cinco bloques:

1. **Cómo va** — ingresos · clientes · salidas corridas · ★ acumulado con
   denominador · solicitudes esperando.
2. **Sus salidas — SOLO LECTURA.** Fecha · cupo · estado · «Abrir salida →».
   Sin crear, sin editar, sin cerrar: que se vea que es un reflejo, no un panel
   de control.
3. **Solicitudes de grupo** — quién está pidiendo fecha, con nombre y cuándo.
   Es su canal de venta cuando no hay fechas: si hay tres esperando y nadie las
   ve, es dinero parado. Dale peso.
4. **Qué le falta** — las seis dimensiones de la armadura, cada una enlazando a
   donde se arregla.
5. **Tu trato / Operador** — ver abajo, cambia según quién mira.

## 3 · LA MISMA PANTALLA TIENE DOS PÚBLICOS

Esto es lo más importante del encargo y quiero que lo dibujes **dos veces**.

El panel lo usan **la casa** (Caminante, que ve todas las experiencias de todos
los operadores) y **cada operador externo** (que ve solo las suyas).

**Diseña primero la del OPERADOR.** Para él, «operador» siempre sería él mismo:
como campo no dice nada. Lo de la casa se **agrega encima**.

| | operador | casa |
|---|---|---|
| Columna / campo «Operador» | **no existe** | sí, y sirve de filtro |
| Comisión | **la suya**, como DATO de solo lectura, bajo el título «Tu trato» | editable, y la de todos |
| Dinero | sus ingresos | el total de la plataforma |
| Asignar operador · crear operador | **no existe** | sí |

Para el operador, el bloque 5 se ve así: el título **«Tu trato»**, su porcentaje
en grande y en mono («15%»), y una línea que explique que se congela en cada
venta y que ajustarla aplica a ventas futuras. **Nada que se pueda picar.**

Dibuja el catálogo y la ficha **en las dos versiones**, una debajo de otra, con un
rótulo que diga cuál es cuál.

## 4 · ESTADOS QUE NECESITO DIBUJADOS

1. Experiencia **publicada sin fechas, con solicitudes esperando** (el caso más
   común: dale la mejor versión).
2. Experiencia **publicada sin fechas y sin solicitudes**.
3. Experiencia que **no puede vender** por el candado del deslinde.
4. Experiencia en **borrador**, sin ventas ni armadura.
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
