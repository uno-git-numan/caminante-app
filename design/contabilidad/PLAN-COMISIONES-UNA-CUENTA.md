# Comisiones con una sola cuenta, y cómo se separa después

## El problema

Caminante le cobra comisión a NUMAN y a Kéntro, pero las tres son la misma
empresa y comparten una cuenta de banco. El dinero no se mueve a ningún lado.

La tentación es esperar a tener las cuentas para empezar a contabilizar. Sería
un error: **cada venta que entra sin registrar su comisión es una venta que hay
que reconstruir a mano después.** Y el día que separes las entidades vas a
necesitar el histórico, no un número redondo.

## La regla

**Separar el registro no requiere separar el dinero.** La comisión se calcula,
se congela y se asienta en cada venta desde hoy. Que el peso no se mueva de
cuenta es un detalle de tesorería, no de contabilidad.

## Cómo queda hoy

```
  El viajero paga  →  Stripe  →  CUENTA ÚNICA (la de ahora)
                                      │
                                      ├── comisión de Caminante   ← se queda
                                      └── lo del operador          ← se queda TAMBIÉN,
                                                                     pero registrado
                                                                     como deuda
```

En la base, cada venta escribe tres cosas:

| Dónde | Qué | Para qué |
|---|---|---|
| `reservations.commission_pct` | la tasa efectiva | histórico |
| `payments.platform_fee_mxn` | **el monto congelado** | el ingreso de Caminante |
| `operator_payables` (`origen='manual'`) | lo que se le debe al operador | lo que se va a transferir |

El panel de Caminante suma `platform_fee_mxn`. El de NUMAN ve lo mismo como
costo. Los dos números salen de la misma fila, así que no pueden discrepar.

### Sobre el «funnel distinto en Stripe»

No hace falta y no conviene todavía. Una segunda cuenta de Stripe partiría el
checkout en dos y duplicaría la configuración —webhooks, llaves, productos— para
resolver algo que hoy es una columna.

La separación física en Stripe llega sola **con Connect en cargo de destino**: el
`application_fee` cae en la cuenta de la plataforma y el resto en la del
operador, sin que nadie transfiera nada. Ése es el momento de partirlo, no antes.

## El handoff, cuando abras las cuentas

El trabajo pesado —calcular, congelar, asentar— ya estará hecho. Lo que cambia
es sólo **a dónde va el dinero**, y son cuatro pasos:

**1 · Se abre la cuenta de operadores** (Kéntro y NUMAN comparten al principio).
La cuenta de hoy se queda como la de Caminante: ahí viven las comisiones.

**2 · Se registran los datos bancarios por operadora.** Ya hay dónde: los datos
fiscales de `operators`. Falta la CLABE y el titular.

**3 · La primera transferencia sale de la suma de los renglones**, no de un
cálculo nuevo. `select sum(monto) from operator_payables where origen='manual'
and estado='pendiente'` y eso es exactamente lo que se transfiere. Si el número
no cuadra con lo que esperabas, el problema está en un renglón concreto que se
puede señalar — no en una hoja de cálculo.

**4 · Se marcan los renglones como pagados**, con el comprobante. La mecánica de
transferencias con comprobante ya existe (tareas #96 y #97).

**Y después, cuando haya volumen:** se enciende Connect en cargo de destino y los
pasos 3 y 4 dejan de ser manuales. La contabilidad no cambia: el mismo renglón
pasa de `origen='manual'` a `origen='connect'`, que es justo la distinción que la
0036 dejó preparada.

## Qué NO hacer

- **No esperar a las cuentas para empezar a registrar.** Es la única decisión de
  este documento que es irreversible: lo que no se registró hoy hay que
  reconstruirlo con recibos.
- **No transferir «a ojo» y cuadrar después.** El renglón manda.
- **No mezclar la comisión con el margen.** Cuando NUMAN opera con un proveedor
  —Ecotravel en Barrancas, por ejemplo— el proveedor es un COSTO, no un
  operador, y ahí no hay comisión que registrar. Confundirlos infla el ingreso
  de Caminante con dinero que nunca fue comisión.

## Fecha de corte

**1 de septiembre de 2026.** Las ventas anteriores no llevan comisión y no se
tocan. Vive en `operators.comision_desde`, por operadora, desde la 0047.
