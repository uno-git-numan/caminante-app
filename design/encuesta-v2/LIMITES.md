# Quién manda sobre cada dato: Experiencias vs Salidas

Complemento de `PROPUESTA.md`. Resuelve el traslape antes de dibujar nada.

---

## El diagnóstico

El traslape no empezó con la propuesta. Ya existe, y es estructural: **el panel
está organizado por TABLA, no por TRABAJO.**

| pantalla | su eje es | y por eso trae |
|---|---|---|
| Eventos | la experiencia | estado, operador, salidas abiertas, próxima, personas, ingresos · adentro: cupo, precio, ocupación, encuesta, roster |
| Reservas | la transacción | persona, experiencia/salida, personas, monto, estado, canal, **deslinde**, pago |
| Personas | el contacto | contacto, etapa, reservas, **deslindes**, total pagado |
| Encuesta | ninguno claro | links, **deslindes** pendientes, satisfacción |

«¿Firmó el deslinde?» es a la vez atributo de una reserva, de una persona y de una
salida — así que aparece en **tres** pantallas. Lo mismo con «cuánta gente va».
Agregar Salidas sin poner un límite haría una cuarta.

## La regla

> **Donde se ACTÚA sobre un dato, ahí vive. Verlo en otro lado es contexto, y el
> contexto no lleva botones.**

Reservas puede mostrar la columna «Desl. ✓ / pendiente» —es contexto útil de esa
transacción— pero el botón «Recordar» existe en **un solo** lugar. Personas puede
decir «2 deslindes» sin ofrecer mandarlos. Así nadie tiene que preguntarse en
cuál de las tres pantallas se hace algo.

## El corte entre las dos que nos ocupan

> **Experiencias = LA OFERTA (lo que se puede comprar).
> Salidas = EL GRUPO (quien ya compró).**

La prueba de una frase, que sirve para cualquier campo nuevo:
**¿esto es sobre lo que se vende, o sobre quién ya viene?**

| dato | pregunta que contesta | dueño |
|---|---|---|
| Publicada / borrador | ¿se puede comprar? | Experiencias |
| Operador y comisión | ¿de quién es el negocio? | Experiencias |
| Precio | ¿cuánto cuesta? | Experiencias |
| Cupo total | ¿cuántos lugares hay a la venta? | Experiencias |
| Qué fechas existen · próxima | ¿qué se puede comprar y cuándo? | Experiencias |
| Cerrar / reabrir ventas | ¿sigue a la venta? | Experiencias |
| Ingresos | ¿cuánto se vendió? | Experiencias |
| **Quiénes van** | ¿quién viene? | **Salidas** |
| **Deslindes firmados y pendientes** | ¿pueden subir al cerro? | **Salidas** |
| **Roster** | ¿qué necesita el guía en campo? | **Salidas** |
| **Respuestas · ★ · NPS** | ¿cómo salió esa salida? | **Salidas** |
| Fotos · piezas del Kit · testimonios publicables | ¿cómo se cuenta el producto? | Experiencias |
| Solicitudes de grupo | ¿quién está pidiendo? | **el CRM** (por construir) |
| Interruptor de la encuesta | configuración del producto | **el formulario** |

## Qué se MUEVE de Experiencias (y no se queda en las dos)

1. **La columna «Encuesta»** de la tabla de salidas. Su interruptor vive en el
   formulario y su resultado en Salidas; ahí solo era un semáforo repetido.
2. **El botón «Roster»**. El roster es la lista de gente de una salida: es del
   grupo. Se llega desde la cápsula.
3. **«Ocupación» como 6/8** pasa a leerse como oferta: «quedan 2 lugares».

## DECIDIDO: las fechas SALEN del formulario de la experiencia

La versión anterior de este documento dejaba las fechas viviendo en la
experiencia, «su calendario de venta». Eso conservaba el traslape. La decisión
es más limpia:

> **La experiencia es la PLANTILLA atemporal. La salida es la INSTANCIA que se
> vende.** Crear una salida es un camino propio: eliges experiencia → fecha →
> cupo → publicas.

⚠️ **Por qué no es opcional sacarlas del formulario.** `saveExperienceSlots` trata
hoy la lista del formulario como la verdad completa:

```
// Cerrar (no borrar) las salidas ABIERTAS PÚBLICAS que el form ya no incluye.
```

Con las dos puertas abiertas pasaría esto: creas una salida desde Salidas →
alguien entra a esa experiencia a corregir una foto y guarda → la salida nueva no
estaba en la lista del formulario → **se cierra sola y deja de venderse, en
silencio**. Un solo dueño lo evita sin candados nuevos.

Y de paso muere un cuidado que solo existía por esto: hoy el modo edición «solo
carga salidas ABIERTAS, porque si entraran las cerradas cada guardado las
re-abriría». El formulario deja de tocarlas y el problema desaparece.

Dentro de la ficha de la experiencia, sus salidas quedan como **reflejo de solo
lectura** —«estas son sus fechas publicadas»— con enlace a la salida. Sin editar,
sin cerrar, sin crear.

## Una experiencia publicada NO necesita salidas

Decisión de producto: una experiencia puede estar **publicada para siempre sin
ninguna fecha planeada**, con **«solicitar grupo» siempre abierto**. Siempre está
disponible para venderse.

Esto cambia cómo se lee el vacío: una experiencia sin salidas **no es un
pendiente ni un error**, es un modo de operar. La pantalla no debe empujar a
«agregarle fechas»; enuncia el hecho —«sin fechas planeadas · se vende por
solicitud»— sin alerta.

**Las solicitudes en sí NO viven aquí.** Van a un CRM que se construirá aparte.
Experiencias se queda con tres cosas y nada más: **la información del producto,
sus fotos y su comunicación.**

⚠️ **Consecuencia que hay que arreglar en el código:** `evaluarChecklist` tiene
una dimensión «Salidas» que marca *falta* cuando no hay fechas. Con esta
decisión, una experiencia sana quedaba felicitada y castigada por el mismo
hecho: «Lista para vender · sin fechas planeadas» junto a «4 de 6» donde una de
las que faltaban era, justamente, no tener fechas. En la tarjeta de Experiencias
la armadura son **CINCO** dimensiones (fotos · ficha · guías · deslinde ·
encuesta); «Salidas» se queda solo en el Kit, donde sí importa —sin fecha no se
puede programar una campaña—. El subconjunto se declara **en el mismo módulo**
que la función, para que las dos listas no puedan separarse.

## El único traslape que sí se queda

**La ocupación.** Es literalmente el punto donde la oferta se convierte en grupo,
y las dos pantallas la necesitan con marcos distintos:

- Experiencias: **«quedan 2 lugares»** — decisión de venta.
- Salidas: **«6 personas»** — decisión de operación.

Es el mismo número y **se calcula una sola vez**. Si algún día discrepan, el bug
sería imposible de explicar.

## El nombre

Propongo **Eventos → «Experiencias»**.

Hoy «Eventos» significa *experiencias*, y una salida es mucho más un evento que
una experiencia. Esa colisión es parte de por qué el traslape se siente peor de
lo que es: dos pantallas cuyos nombres no dicen cuál es cuál.

Nav resultante: Panorama · **Experiencias** · **Salidas** · Comunicación ·
Solicitudes · Reservas · Personas · Recursos.

## Lo que NO propongo tocar

- **Reservas** y **Personas** se quedan. No son duplicados: son otros ejes
  (la transacción y el CRM). Solo pierden sus **botones** de deslinde, que se
  concentran en Salidas.
- **El dinero** no entra a Salidas. Vive en Experiencias, Reservas, Panorama y
  Recursos. Salidas la ve también un operador externo con su alcance podado, y
  meter monto ahí obligaría a podar una superficie más sin ganar nada para el
  trabajo que esa pantalla hace.

---

## Las tres cuentas de una salida (26 ago 2026)

Un roster tiene **tres** números distintos y ninguna pantalla debe presentarlos
como uno solo. El bug: la cápsula decía «Lugares 5/18» y el roster «6 personas ·
6/6 con deslinde», y los dos tenían razón.

| Cuenta | Qué es | De dónde sale |
|---|---|---|
| **Lugares pagados** | lo que se cobró | Σ `reservations.num_people` de las que apartan lugar |
| **En la lista** | quién sube al cerro | filas del roster: titular + participantes capturados + lugares pagados sin capturar |
| **Deslindes** | firmas reales | `registrations` por RESERVA — lo firma el titular, el acompañante lo hereda |

⚠️ **«En la lista» puede pasar de «lugares pagados»**: un titular puede capturar
más participantes de los que compró. Eso es dinero y es una persona en el cerro.
**No se cuadra bajando un número en la consulta** — se avisa con las dos salidas
(cobrar el lugar, o corregir la reserva) y lo resuelve una persona.

Y el número peligroso era «6/6 con deslinde»: un guía que lo lee cree que tiene
seis firmas y tiene cuatro.

## Editar una salida vive en Salidas

Al sacar las fechas del formulario de experiencia, el cupo de una salida ya
creada se quedó sin editor en escritorio — el teléfono podía y la computadora
no. «Editar cupo y fechas» está en el pie de la cápsula y reusa `updateSlot`,
la misma acción del panel móvil, con sus dos guardas: cupo nunca por debajo de
lo vendido, fin nunca antes del inicio.
