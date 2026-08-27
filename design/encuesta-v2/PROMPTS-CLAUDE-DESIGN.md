# Dos prompts para Claude Design

Van **en el MISMO chat**, uno después del otro, en este orden. El segundo depende
de que el primero ya esté en el hilo.

Reemplaza al `PROMPT-CLAUDE-DESIGN.md` anterior, que asumía que las fechas seguían
viviendo en la experiencia.

---
---

# PROMPT 1 — La pantalla «Salidas»

> Copia desde aquí ↓

## ANTES DE DIBUJAR NADA: REUSA LO QUE YA HICISTE

**No empieces de cero y no inventes un sistema visual nuevo.** En este mismo chat
ya diseñaste el panel de administración de **Caminante** — Panorama con sus KPIs,
Eventos, Reservas, Personas, el Roster, Dinero y la pantalla de Encuesta.

Búscalo en el hilo, ábrelo, y **construye esta pantalla con las mismas piezas**.
Lo que me entregues tiene que poder ponerse al lado de esas pantallas y parecer
la misma aplicación, hecha el mismo día, por la misma persona.

Estos componentes **ya existen y tienen nombre**. Úsalos tal cual, sin
renombrarlos y sin recrearlos:

| clase | qué es | estructura interna |
|---|---|---|
| `.page` · `.sec` · `.sec-head` | contenedor, sección y su encabezado | |
| `.eyebrow` + `<span class="sl">//</span>` | el rótulo olivo con las dos diagonales naranjas | |
| `.display` + `<em class="ac">` | título grande peso 200 + remate itálico naranja | |
| `.card` · `.pad` · `.glass` | tarjeta, su padding, el vidrio | |
| `.kpis` › `.kpi` | bloque de cifra grande | `.k-lbl` · `.k-val` (+ `.u`) · `.k-sub` |
| `.prog` (+ `.prog.warn`) | **barra de progreso con fracción** | `.tk2 > i` (la barra) · `.fr` (la fracción en mono) |
| `.progrow` | renglón «etiqueta + barra» en rejilla 130px/1fr | |
| `.xhead` / `.xbody` / `.xbody.on` / `.xpad` / `.xh4` / `.chev2` | **el acordeón que ya usas en Panorama** | |
| `.pchips` › `.pchip` (+ `.ok` / `.pend`) | **la persona como chip** | `.av` (iniciales) · `.stt` (estado) · `.dt` (fecha mono) |
| `.chip` + `.c-pub` / `.c-draft` / `.c-conf` / `.c-paid` / `.c-canc` / `.c-full` / `.c-sol` | etiquetas de estado | `.cd` (el puntito) |
| `.btn` + `.btn-glass` / `.btn-orange` / `.btn-ghost` / `.btn-sm` | botones | |
| `.tbl-wrap` › `table` | tabla | |
| `.stars-lg` · `.tick` · `.spark` · `.dot` / `.dots` · `.testi` · `.tcard` | estrellas, palomita, chispa, puntos, testimonios | |
| `.empty` · `.mut` · `.mono` · `.subtitle` | vacío, texto atenuado, cifras, subtítulo | |

**La cápsula de esta pantalla se arma casi entera con piezas que ya tienes:**
`.card` por fuera, `.xhead`/`.xbody` para abrir y cerrar, dos `.prog` para las
barras, `.pchips` para la gente adentro. Si necesitas algo que no existe,
constrúyelo con las variables de abajo y **dime al final qué inventaste y por
qué**.

Las variables del panel (no agregues colores nuevos):

```css
--cream:#fbfbf7;  --charcoal:#20211c;  --lagoon:#1c6f6a;  --forest:#20392b;
--olive:#637154;  --olive-d:#4f5d44;   --sand:#b6ada5;    --dune:#c9b79c;
--salvia:#d6d8c7; --orange:#ff5d36;
--panel:#f1eee7;  --bg:#eceae3;
--line:rgba(32,33,28,.13);  --ink-soft:rgba(32,33,28,.6);
--r:16px;  --shadow:0 12px 34px -22px rgba(32,33,28,.42);
```

Tipografía **Geist** (títulos en 200–300, nunca bold pesado) y **Geist Mono** para
cifras. **Cero emojis** — el panel se purgó a propósito; usa ★ ↑ ↓ ✓ ⚠ · o nada.
Glassmorphism en tarjetas y botones. Español de México, trato de «tú», sin
lenguaje de dashboard corporativo («KPI», «insights», «engagement» prohibidos).

## QUÉ ES ESTA PANTALLA

Se llama **«Salidas»** y es nueva. Una *salida* es un viaje con fecha concreta;
una *experiencia* es la plantilla que se repite.

**Una salida tiene un antes y un después, y son dos trabajos distintos:** antes se
persiguen las firmas del deslinde (la carta de responsabilidad que cada viajero
firma antes de subir al cerro); después se lee la encuesta de satisfacción.

La pantalla se parte **por tiempo**: `PRÓXIMAS · 4 salidas` y `PASADAS · 6 salidas`.
Cada salida es una **cápsula** que se abre en su lugar (acordeón `.xhead`/`.xbody`,
no navega a otra página) y muestra a las personas de esa salida con sus acciones.

Esta pantalla es también donde se **crean** las salidas: hay un botón principal
**«+ Agregar salida»** que abre un camino corto — eliges experiencia → fecha →
cupo → publicas. Dibújalo también.

## CÁPSULA DE SALIDA PRÓXIMA

No es una tarjeta informativa: es un **checklist de despegue**. Contesta «¿esta
salida puede viajar?». Cerrada, se tiene que poder barrer en un segundo: si todo
está en orden, **no debe pedir atención**.

- Experiencia · fecha legible · lugar
- **Cuenta regresiva**: «en 43 días» / «en 3 días» / «mañana» / «hoy». Es lo que
  decide si hay que preocuparse — dos firmas pendientes a 43 días no son nada, a
  dos días sí.
- **Ocupación**: «6 de 8 lugares» → un `.prog`
- **Deslindes**: «4 de 6 firmados» → otro `.prog`, en `.warn` si faltan
- Alertas cuando aplican: «2 personas sin firmar» · «esta salida va a viajar sin
  encuesta» (crítica: ya pasó que 18 personas viajaron y nadie recibió encuesta
  porque la casilla estaba apagada)
- «Operada por <nombre>» solo cuando el viaje es de un operador externo

Datos reales para dibujar:

```
Trekking Barrancas del Cobre · Oct 8–11 · Chihuahua · Nomádika
   en 43 días · 6 de 8 lugares · 4 de 6 deslindes · encuesta armada
Hacienda y hongos · Ago 29–30 · Estado de México · Kéntro
   en 3 días · 8 de 12 lugares · 6 de 8 deslindes · 2 sin firmar
Recolección de hongos · Domingo 27 sep · Xalatlaco, Estado de México
   en 32 días · 4 de 17 lugares · 4 de 4 deslindes · SIN ENCUESTA
Ensenada de Muertos · Oct 3–4 · Baja California Sur
   en 38 días · 2 de 13 lugares · 0 de 2 deslindes
```

## CÁPSULA DE SALIDA PASADA

Aquí la pregunta es «¿cómo estuvo y qué aprendimos?».

⚠️ **Regla dura: ningún promedio se dibuja sin su denominador al lado.** 4.6
estrellas de 9 respuestas sobre 18 personas es una cosa muy distinta de 4.6 de 17
sobre 18, y el número grande solo no las distingue. La tasa de respuesta va
pegada al promedio, no en otra esquina.

- Experiencia · fecha · lugar · «hace 31 días»
- Métricas: **★ promedio** · **NPS** con su desglose · **tasa de respuesta**
- Hallazgos, cada uno solo si existe:
  «↓ Lo más bajo: Comida (3.5)» — la categoría peor calificada, porque el promedio
  esconde justo lo que hay que arreglar · «2 testimonios listos para publicar» ·
  «4 quieren repetir» · «1 dijo qué faltó»

```
Recolección de hongos · 26 jul · Xalatlaco · hace 31 días
   ★ 4.6 · NPS +67 (8 promotores, 1 pasivo) · 9 de 18 respondieron (50%)
   ↓ Lo más bajo: Comida (3.5) · 2 testimonios publicables · 4 quieren repetir
Ensenada de Muertos · 12–15 jun · Baja California Sur · hace 75 días
   ★ 4.8 · NPS +100 (5 promotores) · 5 de 13 respondieron (38%)
   3 testimonios publicables · 5 quieren repetir
El fondo de la barranca · 2 ago · Veracruz · hace 24 días
   Sin respuestas todavía · 0 de 6
```

## LA CÁPSULA ABIERTA

Misma lista de personas en los dos casos; solo cambia la columna derecha.

**Próxima** — estado del deslinde + acciones:
```
JD   John David O Donnell     Pendiente     [✉ Recordar] [Copiar link] [WhatsApp]
FE   Fabiola Escobosa         Pendiente     [✉ Recordar] [Copiar link] [WhatsApp]
MQ   Monica Quintero Mateos   ✓ 26 ago
RB   Regina Bueno Ros         ✓ 24 jul
```
(«Copiar link» sale siempre; «WhatsApp» solo si esa persona tiene teléfono.)

**Pasada** — lo que contestó:
```
MQ   Monica Quintero Mateos   ★ 5   NPS 10   «El bosque huele distinto…»   publicable
RB   Regina Bueno Ros         ★ 4   NPS 8    —
SR   Sylvia Rivera Jauregui   sin responder            [✉ Recordar] [Copiar link]
```

Pie: próxima → **Ver roster** · **Recordar a los que faltan**.
Pasada → **Link de grupo de la encuesta** (generar / copiar) · **Recordar a los que faltan**.

## ESTADOS QUE TAMBIÉN NECESITO DIBUJADOS

1. **Salidas próximas sin ninguna reserva** — colapsadas en una línea discreta:
   «3 salidas próximas sin reservas ▾», expandible.
2. **Salida pasada sin ninguna respuesta.**
3. **Sin salidas próximas** — el vacío completo de esa columna. Ojo: **no es un
   error**. Una experiencia puede vivir publicada sin fechas, vendiéndose por
   «solicitar grupo». El vacío debe decir eso, no regañar.
4. **Todo en orden** — una cápsula próxima con 100% de firmas y encuesta armada,
   para ver cómo se siente cuando NO pide atención.
5. **El camino de «+ Agregar salida»** — elegir experiencia, fecha, cupo, publicar.

## DETALLES

- Las alertas van en **naranja de acento**, no en rojo de error: son pendientes,
  no fallas. La única que puede verse más grave es «va a viajar sin encuesta».
- Barras finas y sobrias, sin gradientes (usa `.prog`, ya la tienes).
- Cerrada legible de un vistazo; abierta puede ser densa.
- Escritorio, pero **tiene que aguantar teléfono**: se usa camino a una salida.
- **Nada de dinero** en esta pantalla. La ven también operadores externos y sus
  ingresos viven en otra.

## ENTREGA

Un HTML autocontenido con el CSS adentro y los datos de ejemplo en el marcado:
los dos grupos, las cápsulas cerradas, al menos una abierta de cada tipo, los
cinco estados de arriba.

**Y al final del archivo, en un comentario, escribe la lista de componentes que
REUSASTE del panel que ya habías diseñado, y cuáles tuviste que inventar y por
qué.** Si esa lista sale corta, es señal de que volviste a empezar de cero y hay
que repetir el ejercicio.

> Copia hasta aquí ↑

---
---

# PROMPT 2 — La pantalla «Experiencias» (era «Eventos»)

> Mándalo en el MISMO chat, después de recibir el primero.
> Copia desde aquí ↓

## CONTINÚA LO QUE ACABAS DE HACER

Esta pantalla es la **pareja** de «Salidas», que acabas de diseñar arriba en este
mismo chat. Ábrela otra vez antes de empezar: los encabezados, las tarjetas, los
chips de estado, las tablas y los botones tienen que ser **exactamente los
mismos**. Y sigue usando el panel de administración de Caminante que ya habías
diseñado antes en este hilo (Panorama, Reservas, Personas, Roster, Dinero) —
mismos componentes, mismos nombres de clase, mismas variables.

No inventes un sistema nuevo. No renombres clases. Si algo te falta, ármalo con
lo que ya existe y dime al final qué agregaste.

## EL CAMBIO DE FONDO

La pantalla se llamaba «Eventos» y ahora se llama **«Experiencias»**, porque eso
es lo que lista. La regla que separa a las dos pantallas:

> **Experiencias = LA OFERTA (lo que se puede comprar).
> Salidas = EL GRUPO (quien ya compró).**

**Lo que SALE de esta pantalla** (ya vive en Salidas, no lo dibujes aquí):
gestión de fechas, ocupación como «6 de 8», estado de la encuesta, botón de
Roster, y quiénes van.

**Lo que se queda:** el catálogo y su salud comercial.

## LA LISTA

Columnas: Experiencia · Estado (`.chip.c-pub` / `.c-draft`) · Operador · Salidas
publicadas · Próxima fecha · Personas · Ingresos.

Con datos reales:
```
Recolección de hongos      Publicada   Numan · Caminante   2   27 sep   18   $45,900
Ensenada de Muertos        Publicada   Numan · Caminante   1   Oct 3–4  13   $241,280
El fondo de la barranca    Publicada   Numan · Caminante   0   —         6   $52,800
Trekking Barrancas         Publicada   Nomádika            1   Oct 8–11  8   $96,000
Hacienda y hongos          Publicada   Kéntro              1   Ago 29    12  $31,200
Amanalco lobo glamp        Borrador    Numan · Caminante   0   —         0   —
```

⚠️ Fíjate en «El fondo de la barranca»: **publicada, con cero salidas, y no es un
error.** Una experiencia puede vivir así para siempre, vendiéndose por «solicitar
grupo». En vez de un hueco o un regaño, esa fila debe mostrar su canal abierto:
**«Sin fechas · solicitar grupo abierto · 2 solicitudes»**. Dibuja ese estado con
cuidado, es el que más se va a repetir.

## LA FICHA DE UNA EXPERIENCIA

Encabezado con nombre, estado y operador. Y adentro, tres bloques:

1. **Sus salidas — SOLO LECTURA.** Fecha · cupo · precio · estado, y un enlace
   «Abrir salida →» que lleva a Salidas. Sin editar, sin cerrar, sin crear: esta
   pantalla ya no manda sobre las fechas. Que se vea claramente que es un reflejo
   y no un panel de control.
2. **Solicitudes de grupo** — cuántas hay esperando y de quién, con enlace.
   Es el canal de venta cuando no hay fechas.
3. **Operador y comisión** — quién opera y bajo qué trato.

Y una barra de acciones de la experiencia: **Editar contenido** (abre el
formulario) · **Publicar / Pasar a borrador** · **Ver página pública** · **Kit de
comunicación**.

## ESTADOS QUE NECESITO

1. Experiencia **publicada sin salidas**, con solicitudes de grupo esperando.
2. Experiencia **publicada sin salidas y sin solicitudes**.
3. Experiencia en **borrador**.
4. La lista **vacía** (aún no hay experiencias).

## ENTREGA

Un HTML autocontenido, mismo formato que el anterior: CSS adentro, datos en el
marcado, la lista completa + una ficha + los cuatro estados.

**Y al final, el mismo comentario que en el prompt anterior:** qué componentes
reusaste de lo que ya habías diseñado en este chat, y qué tuviste que inventar.
Las dos pantallas tienen que verse como hermanas — si la lista de reúso sale
corta, algo se salió del sistema.

> Copia hasta aquí ↑
