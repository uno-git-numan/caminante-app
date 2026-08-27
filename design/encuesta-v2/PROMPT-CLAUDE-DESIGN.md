Necesito rediseñar una pantalla del panel de administración de **Caminante**
(plataforma de experiencias en naturaleza de NUMAN, México). Entrégame un solo
archivo HTML autocontenido, con datos de ejemplo adentro, que yo pueda transcribir
verbatim a React.

---

## EL SISTEMA VISUAL (respétalo, ya existe)

El panel entero corre bajo el scope `.adm` con estas variables. Úsalas tal cual y
no inventes colores nuevos:

```css
--cream:#fbfbf7;  --charcoal:#20211c;  --lagoon:#1c6f6a;  --forest:#20392b;
--olive:#637154;  --olive-d:#4f5d44;   --sand:#b6ada5;    --dune:#c9b79c;
--salvia:#d6d8c7; --orange:#ff5d36;
--panel:#f1eee7;  --bg:#eceae3;
--line:rgba(32,33,28,.13);  --ink-soft:rgba(32,33,28,.6);
--r:16px;  --shadow:0 12px 34px -22px rgba(32,33,28,.42);
```

- Tipografía **Geist** (variable) para todo y **Geist Mono** para cifras y datos
  duros. Los pesos son ligeros: los títulos van en 200–300, nunca en bold pesado.
- El patrón de encabezado de sección es: un *eyebrow* en mayúsculas pequeñas
  color olivo, precedido de `//` en naranja; debajo un título grande en peso 200
  con un remate en **itálica naranja** (`<em class="ac">`).
- **Glassmorphism** en tarjetas y botones — es la firma de la marca.
- **Cero emojis.** El panel se purgó de emojis a propósito; usa símbolos
  tipográficos (★ ↑ ↓ ✓ ⚠ ·) o nada.
- Fondo de la página `--bg`, tarjetas en `--cream`, superficies internas en
  `--panel`.
- Español de México. Trato de «tú». Voz sobria, sin lenguaje de dashboard
  corporativo («KPI», «insights», «engagement» están prohibidos).

---

## QUÉ PANTALLA ES

Se llama **«Salidas»**. Es donde se administra cada salida (un viaje con fecha
concreta) de todas las experiencias a la vez.

Una salida tiene un **antes** y un **después**, y son dos trabajos distintos:

- **Antes del viaje** se persiguen las firmas del deslinde (la carta de
  responsabilidad que cada viajero debe firmar antes de subir al cerro).
- **Después del viaje** se lee la encuesta de satisfacción.

Hoy esos dos trabajos están en una sola columna sin jerarquía y agrupados de
formas distintas, y quien la usa tiene que reconstruir en su cabeza a qué viaje
pertenece cada cosa. La pantalla nueva se parte **por tiempo**:

```
PRÓXIMAS · 4 salidas          PASADAS · 6 salidas
```

Cada salida es una **cápsula**. Al picarla se expande en su lugar (no navega a
otra página) y muestra las personas de esa salida con sus acciones.

---

## 1 · CÁPSULA DE SALIDA PRÓXIMA

No es una tarjeta informativa: es un **checklist de despegue**. Contesta «¿esta
salida puede viajar?». Se tiene que poder barrer en un segundo: si todo está en
orden, no debe pedir atención.

Contenido:

- Nombre de la experiencia · fecha legible («Oct 8–11») · lugar
- **Cuenta regresiva**: «en 43 días» / «en 3 días» / «mañana» / «hoy». Es lo que
  decide si hay que preocuparse — dos firmas pendientes a 43 días no son nada, a
  dos días sí.
- **Ocupación**: «6 de 8 lugares», con barra
- **Deslindes**: «4 de 6 firmados», con barra. Es el número que la pantalla
  existe para mover.
- **Alertas** cuando aplican:
  - «2 personas sin firmar»
  - «Esta salida va a viajar sin encuesta» (crítica: ya pasó que un grupo de 18
    personas viajó y nadie recibió encuesta porque la casilla estaba apagada)
- «Operada por <nombre>» solo cuando el viaje es de un operador externo

Datos de ejemplo (úsalos, son reales):

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

Orden: la más cercana arriba.

---

## 2 · CÁPSULA DE SALIDA PASADA

Aquí la pregunta es otra: «¿cómo estuvo y qué aprendimos?».

⚠️ **Regla dura del diseño: ningún promedio se dibuja sin su denominador al
lado.** 4.6 estrellas de 9 respuestas sobre 18 personas es una cosa muy distinta
de 4.6 de 17 sobre 18, y el número grande solo no las distingue. La tasa de
respuesta tiene que vivir pegada al promedio, no en otra esquina.

Contenido:

- Nombre · fecha · lugar · «hace 31 días»
- Fila de métricas: **★ promedio** · **NPS** (con su desglose promotores /
  pasivos / detractores) · **tasa de respuesta** («9 de 18 · 50%»)
- Fila de hallazgos, cada uno solo si existe:
  - «↓ Lo más bajo: Comida (3.5)» — la categoría peor calificada. El promedio
    esconde justo lo que hay que arreglar.
  - «2 testimonios listos para publicar»
  - «4 quieren repetir»
  - «1 dijo qué faltó» — el texto más valioso de la encuesta

Datos de ejemplo:

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

Orden: la más reciente arriba.

---

## 3 · LA CÁPSULA ABIERTA

Al picar, se expande **en su lugar**. Adentro va la misma lista de personas en
los dos casos; solo cambia la columna de la derecha.

**Próxima** — estado del deslinde + acciones:

```
JD   John David O Donnell     Pendiente     [✉ Recordar] [Copiar link] [WhatsApp]
FE   Fabiola Escobosa         Pendiente     [✉ Recordar] [Copiar link] [WhatsApp]
MQ   Monica Quintero Mateos   ✓ 26 ago
RB   Regina Bueno Ros         ✓ 24 jul
```

(El avatar es un círculo con las iniciales. «Copiar link» sale siempre; «WhatsApp»
solo si esa persona tiene teléfono.)

**Pasada** — lo que contestó:

```
MQ   Monica Quintero Mateos   ★ 5   NPS 10   «El bosque huele distinto…»   publicable
RB   Regina Bueno Ros         ★ 4   NPS 8    —
SR   Sylvia Rivera Jauregui   sin responder            [✉ Recordar] [Copiar link]
```

Pie de la cápsula abierta:
- Próxima: **Ver roster** · **Recordar a los que faltan**
- Pasada: **Link de grupo de la encuesta** (generar / copiar) · **Recordar a los
  que faltan**

---

## 4 · ESTADOS QUE TAMBIÉN NECESITO DIBUJADOS

1. **Salidas próximas sin ninguna reserva.** De 11 salidas reales, solo 6 tienen
   gente. Que se colapsen en una sola línea discreta: «3 salidas próximas sin
   reservas ▾», expandible.
2. **Salida pasada sin ninguna respuesta** (ejemplo arriba).
3. **Sin salidas próximas** — el vacío completo de esa columna.
4. **Todo en orden**: una cápsula próxima con 100% de firmas y encuesta armada,
   para ver cómo se siente cuando NO pide atención.

---

## 5 · DETALLES QUE IMPORTAN

- Las alertas («sin firmar», «sin encuesta») van en **naranja de acento**, no en
  rojo de error: son pendientes, no fallas. La única que puede verse más grave es
  «va a viajar sin encuesta».
- Las barras de progreso son finas y sobrias, no gruesas ni con gradientes.
- La cápsula cerrada debe leerse completa de un vistazo; la abierta puede ser
  densa.
- Es un panel de escritorio, pero **tiene que aguantar teléfono**: se usa en
  camino a una salida.
- No pongas dinero en ninguna parte. Esta pantalla también la ven operadores
  externos, y sus ingresos viven en otra pantalla.

## QUÉ ENTREGAR

Un HTML autocontenido con todo lo anterior en una sola página: las dos columnas
(o dos secciones apiladas, tú decides qué funciona mejor), las cápsulas cerradas,
al menos una abierta de cada tipo, y los cuatro estados de la sección 4. Con el
CSS adentro y los datos de ejemplo escritos en el marcado.
