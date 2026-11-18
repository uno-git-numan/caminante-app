# Política de cancelación: el texto que ve el cliente (D12–D14, D23)

**17 nov 2026 · Sesión legal y fiscal, para producto.** Producto encontró que
la política de cancelación sólo se pinta en la plantilla vieja: ni la ficha
actual ni la pantalla de reservar la muestran, y los reembolsos se calculan a
mano. El convenio publicado (Quinta §1) promete que la política «se publica en
la página de cada experiencia antes de que el cliente pague». Este archivo trae
el texto, dónde va, qué se guarda y cómo se paga la bonificación. El texto se
transcribe tal cual; los números son los de la Cláusula Quinta del convenio
v3.3 y no se cambian aquí.

## 1 · El texto (dos variantes; cambia sólo el primer bloque)

> **Cancelación y devoluciones**
>
> **Si cancelas tú** *(política Estándar)*
> - Con 30 días o más antes de la salida: te devolvemos el **100 %**.
> - De 15 a 29 días antes: el **50 %**.
> - Con menos de 15 días: no hay devolución.
>
> **Si cancelas tú** *(política Expedición)*
> - Con 60 días o más antes de la salida: te devolvemos el **100 %**.
> - De 30 a 59 días antes: el **50 %**.
> - Con menos de 30 días: no hay devolución.
>
> **Tu derecho a arrepentirte**
> - Dentro de las **24 horas** siguientes a tu reserva, si la salida está a 7
>   días o más, te devolvemos el **100 %**.
> - Además, por ley: si reservaste con **más de 10 días hábiles** de
>   anticipación a la salida, puedes cancelar sin dar motivo dentro de los
>   **5 días hábiles** siguientes a tu reserva y te devolvemos el **100 %**
>   (artículo 56 de la Ley Federal de Protección al Consumidor).
>
> **Si la salida se cancela**
> - Te devolvemos siempre el **100 %** de lo que pagaste.
> - Si se cancela por una causa atribuible a quien opera la experiencia,
>   recibes además una **bonificación del 20 %** de lo que pagaste (artículos
>   92 Bis y 92 Ter de la misma ley). La bonificación no aplica cuando la
>   cancelación es por fuerza mayor: mal tiempo que impida operar con
>   seguridad, cierre del área natural, del camino o del puerto por la
>   autoridad, contingencia sanitaria o bloqueo que impida llegar, o
>   emergencia médica del guía sin sustituto posible.
>
> **Cómo se devuelve**
> - Las devoluciones se hacen a la **misma forma de pago** que usaste.
> - La bonificación se paga por transferencia a la cuenta que nos indiques, a
>   más tardar en 5 días hábiles.
> - Los plazos en días se cuentan en días naturales hasta el inicio de la
>   salida. Los días hábiles son de lunes a viernes, sin los días de descanso
>   obligatorio.
> - Para cancelar, hazlo desde tu espacio o escríbenos. Cuenta la fecha y la
>   hora en que recibimos tu aviso.

Voz: segunda persona, sin la palabra «operadora» ni el nombre del procesador.
Las referencias a la ley se quedan: son las que le dan al cliente su piso.

## 2 · Dónde va

| Lugar | Qué se muestra |
|---|---|
| Ficha de la experiencia (escritorio y móvil) | El texto completo, en su propia sección «Cancelación y devoluciones», con la variante de esa experiencia |
| Reservar y página de pago | Un resumen de tres renglones (los porcentajes de la variante, el arrepentimiento y «si la salida se cancela, 100 %») con el texto completo desplegable, y junto al botón de pagar: **«Al pagar aceptas la política de cancelación de esta experiencia.»** |
| Comprobante por correo | Liga a la política que aceptó y la fecha límite de su arrepentimiento, ya calculada |

No hace falta casilla: el texto visible antes de pagar y la frase junto al
botón bastan como aceptación (LFPC 76 Bis fracción III: informar los términos
antes de la transacción). Lo que sí hace falta es la **prueba**.

## 3 · Qué se guarda en cada reserva

La variante (Estándar o Expedición), la **huella (sha-256) del texto mostrado**
y la fecha y hora en que se creó el cobro. Igual que con el convenio: si el
texto cambia después, cada reserva conserva el que aceptó. Una experiencia sin
variante elegida **no se puede publicar** (el convenio obliga a elegir una).

## 4 · La calculadora del reembolso

Al devolver desde el panel, el sistema **propone** el importe y dice por qué;
la persona de la casa lo confirma o lo cambia escribiendo el motivo. Orden de
las reglas (gana la más favorable al cliente):

1. Cancela la operación (operadora o casa): **100 %**, siempre.
2. Arrepentimiento legal: reserva hecha con más de 10 días hábiles de
   anticipación y aviso dentro de los 5 días hábiles siguientes: **100 %**.
3. Arrepentimiento de 24 horas con la salida a 7 días o más: **100 %**.
4. Ventanas de la variante, en días naturales al inicio de la salida.

Días hábiles: lunes a viernes sin los días de descanso obligatorio del artículo
74 de la Ley Federal del Trabajo (lista por año en una constante con su
fuente; no se calcula de memoria). Los complementos siguen a la reserva.

## 5 · La bonificación del 20 %

El procesador no devuelve más de lo cobrado, así que son **dos movimientos**:

1. **El 100 %** vuelve por el procesador a la misma forma de pago (LFPC 92),
   como cualquier devolución.
2. **El 20 %** se paga **por transferencia bancaria** al cliente. La ley fija el
   mínimo (92 Ter) pero no el medio; la regla de «misma forma de pago» es para
   la devolución del precio.

Cómo opera:

- Al registrar una cancelación de la operación como **imputable** (no fuerza
  mayor), el sistema crea por cada reserva pagada una **bonificación por
  pagar** = 20 % de lo que esa persona pagó, complementos incluidos, y avisa a
  la casa. Con fuerza mayor, que se registra con su documento (D14), no se crea.
- **La paga la casa** (Caminante es garante frente al cliente, D13) y **la
  transfiere Luis**: el sistema calcula y avisa, no mueve dinero. Plazo: 5 días
  hábiles desde la cancelación.
- **La cuenta del cliente no se guarda.** Se le pide por el canal en que se le
  avisa de la cancelación; en el sistema quedan sólo la fecha, el importe, los
  últimos 4 dígitos y la clave de rastreo de la transferencia. Es un dato
  financiero (LFPDPPP art. 7) y no hay razón para conservarlo.
- **Se recupera de la operadora** junto con la devolución y la penalización,
  por la Quinta §3 y §9 del convenio (reversión de la transferencia,
  compensación contra ventas futuras o pago en 5 días hábiles). En una
  experiencia de la casa, la bonificación es costo de la casa.
- **Papeles:** la bonificación **no** va en el CFDI de egreso de la venta (el
  egreso no puede exceder al ingreso). Cómo se documenta y se deduce, y si la
  penalización que cobra Caminante causa IVA, lo confirma Marisol (**M24**).

## 6 · Lo que no cambia y lo que queda abierto

- No cambia ningún número ni el convenio: todo esto ya está en la Quinta de
  v3.3. No hay versión nueva.
- **Abierto (legal lo revisa en la fuente, no detiene la construcción):** la
  NOM-010-TUR-2001 fija el contenido mínimo de los contratos con el turista y
  PROFECO lleva un registro de contratos de adhesión; falta leer si a Caminante
  o a la operadora les obliga a registrar el suyo.
