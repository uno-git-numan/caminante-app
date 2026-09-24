# El dinero en cada escenario — para discutir con el abogado

**23 sep 2026.** Este documento no es parte del convenio: es el material de
trabajo para cerrar sus cláusulas Cuarta, Quinta y Décima tercera. Sirve para
una sola cosa: poner enfrente **qué pasa con cada peso en cada caso**, para que
la conversación con el abogado sea sobre decisiones y no sobre mecánica.

**Todos los números de aquí están medidos, no estimados**, y cada tabla dice de
dónde salió el suyo. Lo que no está medido se dice que no lo está.

---

## La venta de referencia

Se usa la misma en todo el documento: una salida real de `corral-de-piedra`,
que es lo que Nomádika ha vendido doce veces.

| | |
|---|---|
| Precio al cliente | **$1,750.00** |
| Base sin IVA | $1,508.62 |
| Comisión de Caminante (escala de venta, primer tramo: 20%) | **$301.72** |
| IVA de la comisión | $48.28 |
| **Lo que retiene Caminante** (`application_fee`) | **$350.00** |
| **Lo que recibe el Operador** | **$1,400.00** |

*Fuente: `comisionDeVenta` con la escala vigente, y la corrida contra Stripe en
modo prueba del 23 sep 2026, que dio exactamente estos importes.*

Y un costo que no se ve en esa tabla porque no lo paga ninguno de los dos
directamente:

| | |
|---|---|
| Lo que se queda el procesador de pagos | **$83.94** |

*Fuente: los 20 pagos del histórico que ya tienen conciliada su comisión de
Stripe — de $215,400.00 cobrados, el procesador se quedó $10,331.87, el
**4.80%**. Aplicado a $1,750.*

> ⚠️ Ese 4.80% medido está **por encima del 4.23%** que asume el modelo de costos
> de la plataforma. No está resuelto por qué —la sospecha es tarjetas
> internacionales, que en México cuestan más—, y conviene resolverlo antes de
> usar cualquiera de los dos números en una negociación.

---

## Escenario 1 · La salida ocurre

Nadie cancela. Es el caso normal y el único que hoy está completamente cerrado.

| Quién | Recibe | Factura que emite |
|---|---|---|
| Operador | $1,400.00 | CFDI al cliente por $1,750.00 |
| Caminante | $350.00 | CFDI al Operador por $301.72 + IVA |
| Procesador | $83.94 | — |

**Resultado para Caminante:** ingresa $301.72 de comisión y paga $83.94 de
procesamiento. Margen $217.78.

Las dos facturas cierran a cero: lo que Caminante retiene es, al peso, el total
del CFDI que le emite al Operador.

---

## Escenario 2 · El cliente cancela y se le devuelve TODO

| Movimiento | Importe |
|---|---|
| Al cliente | −$1,750.00 |
| Del saldo del Operador se jala de vuelta | −$1,400.00 |
| Caminante devuelve su comisión | −$350.00 |
| El procesador **no devuelve nada** | $83.94 se quedan perdidos |

**Resultado para Caminante: −$83.94.** Pierde el costo de procesar una venta
que se deshizo.

*Medido: la reversión completa dejó el saldo de la operadora exactamente como
estaba antes de la venta.*

🔸 **PREGUNTA 1 PARA EL ABOGADO** *(Luis la mandó explícitamente a esta mesa el
23 sep 2026: es de redacción, no de criterio propio)*. Hoy ese −$83.94 lo
absorbe Caminante **por omisión**: la Cláusula Cuarta dice que absorbe los costos de procesamiento, sin
distinguir el caso de una venta cancelada. Las opciones que hay que redactar:

- **(a) Lo absorbe Caminante**, como hoy. Simple, y a volumen se vuelve un costo
  de operación previsible.
- **(b) Lo absorbe el Operador** cuando la cancelación es imputable a él o a su
  política. Requiere definir «imputable».
- **(c) Se reparte**, o sale del importe que el Operador retiene por su política
  de cancelación.

Con cien cancelaciones al año sobre este ticket, la diferencia entre (a) y (b)
son **$8,394**. No es el número lo que decide: es de quién es el riesgo.

---

## Escenario 3 · El cliente cancela y la política devuelve la MITAD

Es el caso que hizo falta construir. **El Operador retiene el 50% conforme a su
política publicada; el cliente recibe el otro 50%.**

| Movimiento | Importe |
|---|---|
| Al cliente | −$875.00 |
| Del saldo del Operador se jala de vuelta | −$700.00 |
| Caminante devuelve la mitad de su comisión | −$175.00 |
| El Operador conserva | $700.00 |
| Caminante conserva | $175.00 |

**Medido contra Stripe el 23 sep 2026**, no calculado: pedirle el parcial con
reversión de transferencia y devolución de comisión repartió exactamente así,
en las dos patas, sin que el sistema tuviera que partir nada.

La regla que queda dicha, y que coincide con la de Airbnb: **la comisión sigue a
lo que el cliente acabó pagando.** Si conserva el 50%, Caminante conserva
comisión sobre ese 50%.

🔸 **PREGUNTA 2 PARA EL ABOGADO.** El costo de procesamiento sigue siendo
$83.94 completo —no se reduce a la mitad porque el cobro sí ocurrió entero—
así que en este escenario Caminante ingresa $175.00 y paga $83.94. **El margen
cae de $217.78 a $91.06.** ¿La cláusula dice algo sobre eso, o se acepta como
parte del negocio?

---

## Escenario 4 · El Operador ya dispuso del dinero y luego hay devolución

Es consecuencia directa de la decisión de Luis del 23 sep: **no se le fija
retraso de pago**, porque tener el dinero antes de la salida es lo que le
permite operar.

| Momento | Qué pasa |
|---|---|
| Se cobra | $1,400.00 entran a la cuenta del Operador |
| El Operador retira a su banco | Puede hacerlo antes de la salida |
| El cliente cancela | El sistema jala de vuelta lo que corresponda |
| Si ya no hay saldo | **La cuenta del Operador queda en descubierto** |

El sistema ejecuta la reversión igual; lo que no puede hacer es sacar dinero de
donde no hay. El adeudo queda contra el Operador.

🔸 **PREGUNTA 3 PARA EL ABOGADO, y es la que más importa de este documento.** La
Cláusula Cuarta dice hoy que el Operador «reintegrará por transferencia o por
compensación contra liquidaciones futuras». Falta redactar:

- **Qué pasa si no hay liquidaciones futuras** —el Operador deja de vender, o se
  va—. ¿Hay garantía, retención de un porcentaje, plazo de exigibilidad?
- **Quién le responde al cliente mientras tanto.** El cliente le pagó al
  Operador (es el comercio del cargo) pero **reservó en Caminante**. Si el
  Operador no reintegra, ¿Caminante le devuelve al cliente de su bolsa y
  persigue al Operador después? Esa decisión define si Caminante es
  intermediaria o garante, y es exactamente la línea que separa una plataforma
  de un comercializador.
- **El contracargo.** Si el cliente va con su banco en vez de con nosotros, la
  disputa llega a la cuenta del Operador, que es el comercio. La Cláusula Quinta
  dice que los contracargos por el servicio son del Operador — hay que
  confirmar que eso sigue siendo cierto ahora que el cargo es a su nombre.

---

## Escenario 5 · Se cae la salida por causa del Operador

El Operador cancela: no juntó grupo, se lesionó el guía, no salió el permiso.

Hoy el sistema hace lo mismo que en el escenario 2 —devuelve todo a todos y
cierra la fecha— y **no cobra ninguna penalización**.

🔸 **PREGUNTA 4 PARA EL ABOGADO.** Airbnb sí penaliza al anfitrión que cancela:
retiene una comisión de cancelación de su siguiente liquidación, y la condona
ante causas de fuerza mayor.
([Host Cancellation Policy](https://www.airbnb.com/help/article/990))

¿Caminante quiere algo equivalente? Tiene consecuencias de las dos clases:

- **A favor:** una cancelación del Operador le cuesta a Caminante los $83.94 por
  cliente **y** el cliente que no vuelve. Con doce personas son $1,007.28 y una
  salida completa de reputación.
- **En contra:** una penalización mal redactada espanta a operadoras chicas, que
  es justo a quienes el programa quiere. Y hay que definir la fuerza mayor —en
  montaña, el clima cancela salidas de verdad.

---

## Escenario 6 · Lo que el sistema todavía NO sabe hacer

Para que no se redacte una cláusula que prometa esto:

| | Estado |
|---|---|
| Devolución total | ✅ construida y en producción |
| Devolución **parcial** | ✅ construida el 23 sep, **falta aplicar la 0063 en producción** |
| Varias parciales sobre el mismo cobro | ✅ construida (la 0063 afina el candado que lo impedía) |
| Devolver dinero **sin cancelar** la reserva | ❌ no existe. Un parcial hoy cancela la reserva y libera el lugar: es el desenlace de una cancelación con política, no un descuento a alguien que sí viene. Si hace falta, es otra operación y otra puerta. |
| Penalizar al Operador que cancela | ❌ no existe |
| Cobrar el costo de procesamiento a alguien | ❌ no existe: hoy lo absorbe Caminante por omisión |

---

## Resumen de lo que hay que decidir

| # | Pregunta | Quién |
|---|---|---|
| 1 | **¿De quién es el costo de procesar una venta cancelada** ($83.94 por venta de $1,750)? Las tres redacciones están en el escenario 2 | **ABOGADO** — Luis lo mandó a la mesa el 23 sep en vez de resolverlo a ojo |
| 2 | ¿La cláusula dice algo del margen que cae en una devolución parcial? | Luis |
| 3 | Si el Operador no reintegra, ¿Caminante le devuelve al cliente y persigue después? **Define si es intermediaria o garante.** | **Abogado** — es la más importante |
| 4 | ¿Penalización al Operador que cancela, como hace Airbnb? ¿Y qué es fuerza mayor? | Luis, con el abogado |
| 5 | Ahora que el cargo es a nombre del Operador, ¿los contracargos siguen siendo suyos? | Abogado |
