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
| **Respuestas · ★ · NPS · testimonios** | ¿cómo salió? | **Salidas** |
| Interruptor de la encuesta | configuración del producto | **el formulario** |

## Qué se MUEVE de Experiencias (y no se queda en las dos)

1. **La columna «Encuesta»** de la tabla de salidas. Su interruptor vive en el
   formulario y su resultado en Salidas; ahí solo era un semáforo repetido.
2. **El botón «Roster»**. El roster es la lista de gente de una salida: es del
   grupo. Se llega desde la cápsula.
3. **«Ocupación» como 6/8** pasa a leerse como oferta: «quedan 2 lugares».

Lo que queda en la ficha de la experiencia es su **calendario de venta**:
Salida · Fecha · Cupo · Precio · Estado · [cerrar/reabrir] · «Abrir salida →».

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
