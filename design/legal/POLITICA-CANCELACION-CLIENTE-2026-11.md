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
botón bastan como aceptación (LFPC 76 Bis fracción V: informar los términos
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

## 7 · Cláusula de cupo mínimo (18 nov 2026; Luis la aprobó: «Sí, escríbela»)

Hasta hoy cancelar por falta de grupo genera la bonificación del 20 %, porque
el texto aceptado no trae excepción. Esta cláusula la crea **sólo para las
salidas que la muestren antes de pagar**. No cambia nada de las reservas ya
hechas: cada una conserva el texto que aceptó.

### 7.1 · El texto (bloque nuevo, después de «Si la salida se cancela»)

Se muestra sólo cuando la salida tiene la cláusula activa (7.3). `N` y la
fecha son los de esa salida.

> **Si no se junta el grupo mínimo**
> - Esta salida necesita un mínimo de **N personas** con su lugar pagado. Te
>   confirmamos si sale a más tardar el **[día] de [mes] de [año]**.
> - Si para esa fecha no se juntó el mínimo, la salida se puede cancelar. Te
>   avisamos a más tardar ese día y te devolvemos el **100 %** de lo que
>   pagaste. En este caso no hay bonificación, porque es una condición que
>   conoces desde antes de pagar.
> - Si te avisamos después de esa fecha, o si cancelamos por falta de grupo
>   una salida que ya te habíamos confirmado, se trata como una cancelación
>   atribuible a quien opera: el 100 % más la bonificación del 20 %.
> - Mientras no te confirmemos la salida, te recomendamos no comprar vuelos ni
>   transporte que no se pueda cambiar o reembolsar.

En el resumen de reservar y de la página de pago, el tercer renglón queda:

> Si la salida se cancela, te devolvemos el 100 %. Esta salida necesita N
> personas; te confirmamos a más tardar el [día] de [mes].

En el comprobante por correo, un renglón más:

> Esta salida necesita un mínimo de N personas. Te confirmamos a más tardar
> el [día] de [mes] de [año].

### 7.2 · Por qué se sostiene

- La ley da la bonificación cuando el servicio no se presta «por causas
  imputables al proveedor» (LFPC 92 Bis). Una condición objetiva, con número y
  fecha, informada antes de pagar, no es incumplimiento.
- Sin número ni fecha sería nula: dejaría al proveedor «sustraerse
  unilateralmente de sus obligaciones» (LFPC 90 fracción I). Por eso los dos
  datos son obligatorios y van en el texto aceptado.
- La norma de contratos turísticos pide que el paquete especifique «el número
  mínimo de personas que conformen el grupo» y que el contrato diga las
  causales de rescisión y sus consecuencias para ambas partes
  (NOM-010-TUR-2001, 6.2.5 y 5.2.4).
- La ley mexicana no fija con cuánta anticipación avisar. Tomo como piso de
  razonabilidad (LFPC 85: sin obligaciones inequitativas) la regla europea de
  viajes combinados, Directiva (UE) 2015/2302, artículo 12, apartado 3, letra
  a), leída en EUR-Lex: 20 días antes en viajes de más de seis días; 7 días en
  viajes de dos a seis días; 48 horas en viajes de menos de dos días. No es
  derecho mexicano: es la referencia.

### 7.3 · Cuándo está activa la cláusula en una salida

Las cuatro cosas a la vez:

1. La salida tiene **mínimo** y **fecha límite de confirmación**, los dos
   capturados a propósito por una persona. El mínimo es el campo que ya existe
   (`minimo`). La fecha de confirmación es un **campo propio**: no es la
   «fecha para apartar» del espacio del grupo (`fecha_limite`), que el sistema
   llena solo y significa otra cosa (corrección de producto, 18 nov). Un
   mínimo o una fecha puestos por el sistema nunca activan la cláusula.
2. La fecha límite respeta el piso según la duración de la salida:

   | Duración de la salida | La fecha límite es, a más tardar |
   |---|---|
   | Menos de dos días (sin pernocta) | 48 horas antes del inicio |
   | De dos a seis días | 7 días naturales antes del inicio |
   | Más de seis días | 20 días naturales antes del inicio |

   Quien opera puede fijar una fecha más temprana, nunca más tardía. Si la
   fecha capturada no respeta el piso, la cláusula **no se muestra** y cancelar
   por falta de grupo es atribuible a quien opera.
3. La salida no está confirmada.
4. La fecha límite **no ha pasado**. A quien compra después de ese día no se
   le puede prometer una confirmación en una fecha ya vencida: esa reserva va
   sin cláusula.

Cómo se mide el piso: la fecha límite es un día sin hora y vale hasta las
23:59 del centro de México. En salidas de menos de dos días, ese instante debe
caer 48 horas o más antes del inicio. En las otras, la fecha debe ser 7 o 20
días naturales antes del día de inicio, o anterior.

### 7.4 · Qué se guarda en cada reserva

El texto mostrado **con N y la fecha ya escritos** entra en la huella de la
política aceptada. Además, en la reserva quedan el mínimo y la fecha límite
que vio (copia, no referencia a la salida). Una reserva sin esa copia no tiene
la cláusula.

Candado en la salida: con una reserva pagada que trae la cláusula, **no se
sube el mínimo ni se mueve la fecha límite a más tarde**. Bajarlo o adelantar
la fecha sí se puede: favorece al cliente.

### 7.5 · Confirmar la salida

- Cuentan las **personas** con un pago confirmado, anticipo incluido: una
  reserva de tres personas cuenta tres. Una reserva sin pago, o devuelta
  completa, no cuenta.
- Al llegar al mínimo, el sistema propone confirmar; confirma una persona de
  la casa o de la operadora. Si llega la fecha límite con el mínimo cubierto,
  se confirma sola.
- Al confirmar se avisa a todo el grupo: «Tu salida está confirmada».
- Una persona puede confirmar **sin haber llegado al mínimo**, si quien opera
  decide salir de todos modos. Sólo le añade obligaciones a quien opera.
- **El día límite el sistema obliga a decidir**: avisa a la casa por la mañana.
  Si termina el día sin confirmar ni cancelar, la salida queda **confirmada** y
  se avisa al grupo: al cliente se le prometió una respuesta ese día, y desde
  entonces cancelar ya sería atribuible a quien opera.
- **Una salida confirmada ya no se cancela por cupo.** Si después se cae gente
  y se cancela, es atribuible a quien opera.

### 7.6 · Cancelar por cupo mínimo (causa nueva en la pantalla de cancelar)

Sólo se ofrece si la cláusula está activa, los lugares pagados son menos que
el mínimo y el aviso sale **a más tardar el día de la fecha límite**, hora del
centro de México. El sistema guarda la hora en que salió el aviso: es la
prueba.

- A todas las reservas: **100 %**, a la misma forma de pago, ese mismo día.
- Reservas **con** la cláusula en su copia: sin bonificación.
- Reservas **sin** la cláusula (anteriores): bonificación del 20 %, como hoy.
- Fuera de esas condiciones no existe «cupo mínimo»: es causa de quien opera.

Correo al cliente:

> **Tu salida no se juntó.** Para [experiencia · fecha] hacían falta N
> personas y al [fecha límite] éramos M. Como te lo dijimos antes de pagar, la
> salida se cancela. Hoy mismo pedimos la devolución del **100 %** de lo que
> pagaste, a la misma forma de pago, y te avisamos en cuanto quede hecha. Si
> quieres, te ayudamos a pasarte a otra fecha.

El aviso sale **al cancelar**, a todas las reservas con pago, sin esperar al
procesador: lo que cuenta para el plazo es la hora del aviso, y se guarda en
la salida. La confirmación de cada devolución sigue su correo de siempre,
cuando el procesador la confirma. Si una devolución falla, el cliente la sigue
teniendo ganada y la casa recibe la alerta.

### 7.7 · Frente a la operadora (convenio)

**Decidido por Luis el 19 nov: exenta.** La operadora que cancela por cupo
mínimo dentro del plazo no paga bonificación ni penalización. Queda escrito
en la Quinta §3 bis del convenio **v3.4**, preparado y todavía sin publicar.
Fuera de plazo, con la salida confirmada o con la fecha fuera del piso, la
cancelación le es imputable y aplican la bonificación y la penalización de la
Quinta §3. Cuando producto construya el cobro de la penalización, la causa
«cupo mínimo» válida no la genera.

### 7.8 · La cláusula también va en la ficha (18 nov, noche)

La aceptación ocurre en reservar y en la página de pago, y ahí queda la
prueba. Pero la ficha es la oferta, y la oferta tiene que decirlo: la norma
pide que el paquete «a disposición de los usuarios-turistas» especifique «el
número mínimo de personas que conformen el grupo» (NOM-010-TUR-2001, 6.2.5),
y la información de lo que se ofrece debe ser clara y no inducir a error
(LFPC 7 y 32). **Se construye antes de capturar la primera fecha de
confirmación en una salida publicada.**

Junto a cada fecha con la cláusula activa:

> Mínimo N personas · se confirma a más tardar el [día] de [mes]

Y cuando la salida está confirmada:

> Salida confirmada

En la sección «Cancelación y devoluciones» de la ficha, si alguna fecha
publicada tiene la cláusula activa, este bloque informativo (no es el texto
que se acepta; ése es el de 7.1, con el número y la fecha de la salida
elegida):

> **Si no se junta el grupo mínimo**
> - Algunas fechas de esta experiencia necesitan un mínimo de personas para
>   salir. Junto a cada fecha ves cuántas y el día en que te confirmamos.
> - Si ese día no se juntó el grupo, la salida se puede cancelar y te
>   devolvemos el **100 %**. Las condiciones completas las ves antes de pagar.

### 7.9 · Precisiones de producto, confirmadas (18 nov, noche)

1. La confirmación automática al terminar el día límite ocurre sólo si la
   cláusula se le pudo enseñar a alguien (fecha dentro del piso y mínimo
   válido). Con la fecha fuera del piso nadie recibió la promesa y el sistema
   no confirma por su cuenta.
2. El mínimo es de **dos personas o más**. Con uno, quien compra ya lo cumple.
3. A quien no trae la cláusula, el aviso de cancelación va sin la frase «Como
   te lo dijimos antes de pagar». Su bonificación se le anuncia en el correo
   de la devolución, ese mismo día.
4. Si la salida cambió entre abrir la pantalla y pagar, no se cobra: lo que se
   cobra es lo que se enseñó.
5. No se captura una fecha de confirmación que ya pasó.

### 7.10 · Dos frases que el aviso de cancelación por cupo añade según el caso (18 nov, noche)

El aviso es el único correo seguro que recibe todo el mundo ese día: quien
pagó por transferencia no tiene correo automático de devolución. Por eso lo
que se le debe a cada persona va **en el aviso**.

A quien **no trae la cláusula** (tiene bonificación), sea cual sea su forma de
pago, después del párrafo principal:

> Además te corresponde una **bonificación del 20 %** de lo que pagaste. Para
> pagártela por transferencia, respóndenos con tu CLABE y el nombre del
> titular. La recibes a más tardar en 5 días hábiles.

A quien **pagó por transferencia**, en lugar de «a la misma forma de pago, y
te avisamos en cuanto quede hecha»:

> por transferencia, igual que pagaste. Respóndenos con la CLABE y el nombre
> del titular de la cuenta donde quieres recibirla.

A quien pagó **una parte con tarjeta y otra por transferencia**, en ese mismo
lugar:

> a la misma forma de pago de cada uno de tus pagos. Lo que pagaste con
> tarjeta vuelve a tu tarjeta. Para lo que pagaste por transferencia,
> respóndenos con la CLABE y el nombre del titular de la cuenta donde quieres
> recibirlo.

Fundamento: la devolución va por la misma forma de pago (LFPC 92) y el
proveedor informa lo que se obligó a dar (LFPC 7). La cuenta no se guarda
(§5).
