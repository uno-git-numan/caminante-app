# 2 · Descripción del flujo de operaciones

NUMAN HUB S.A. de C.V. — plataforma **Caminante** (`caminante.numanhub.com`)
18 ago 2026

> Preparado para el punto 2 del correo del 29 de julio. Incluye el flujo de pago
> por Stripe, que es lo que pidieron para el análisis de PLD.

---

## Situación actual, en una línea

**Hoy el 100% de las experiencias son propias.** No hay operadores externos
vendiendo por la plataforma. Lo que describe la sección B es el modelo que
estamos por habilitar y que sometemos a su revisión **antes** de encenderlo.

---

## A · Experiencias PROPIAS (lo que opera hoy)

### Quién es quién
- **Numan** diseña la experiencia, contrata a los proveedores (hospedaje,
  transporte, guías locales), vende y cobra.
- **El cliente** es persona física, siempre usuario final. No hay agencias ni
  plataformas de por medio: todo el tráfico llega de redes sociales propias y de
  recomendación directa.
- **Los proveedores** (un hotel, una operadora de transporte, un guía local) le
  facturan a Numan. Numan les paga por transferencia o en efectivo.

### El flujo del dinero
1. El cliente entra a la página de la experiencia y elige fecha y número de
   personas.
2. Paga con tarjeta a través de **Stripe** (cuenta de NUMAN HUB, modo live desde
   el 1 de julio de 2026). El importe completo entra a la cuenta de Numan.
3. Stripe descuenta su comisión (3.6% + $3 MXN + IVA) y deposita el neto en la
   cuenta bancaria de NUMAN HUB, con periodicidad semanal.
4. La plataforma registra la venta, genera el deslinde para firma y le manda al
   cliente su comprobante por correo.
5. Numan paga a sus proveedores por separado, contra factura.

### La otra forma de cobrar
- **Transferencia bancaria**: el cliente deposita a la cuenta de NUMAN HUB y el
  comprobante se captura en el sistema. Es el camino de menor volumen.

**Todo lo demás pasa por la página web.** No existen links de pago automáticos
por WhatsApp: cuando alguien pregunta por mensaje, se le manda la liga de su
experiencia y paga en el sitio, por el mismo camino que cualquier otro cliente.
Es decir, hay **un solo canal de cobro con tarjeta** —el checkout del sitio— más
la transferencia. Lo aclaramos porque en la reunión pudo entenderse que ya
operábamos un cobro asistido por mensajería.

### Facturación al cliente
Hoy Numan **no emite CFDI automáticamente**. El motor de facturación está
construido y sin encender: espera el sello digital (CSD) de NUMAN HUB. Las ventas
realizadas están marcadas internamente como *pendientes de emitir*.

---

## B · Experiencias de TERCEROS (el modelo propuesto, aún no operando)

### Quién es quién
- **El operador** es una guía u operadora local con operación propia. Diseña y
  ejecuta su experiencia; Numan no la opera.
- **Numan** aporta la plataforma: página, cobro, deslinde legal, expediente
  médico de participantes, comunicación y panel de control.
- **El cliente** sigue siendo persona física, usuario final.

### El flujo del dinero propuesto
1. El cliente paga con tarjeta en la plataforma.
2. **El cobro se genera directamente en la cuenta de Stripe DEL OPERADOR**
   (figura de *cargo directo* en Stripe Connect). El operador es el vendedor
   frente al cliente.
3. En ese mismo cobro, Numan retiene automáticamente tres conceptos:
   su **comisión** por intermediación, el **ISR** y el **IVA** que la ley obliga
   a retener a las plataformas tecnológicas.
4. El remanente se deposita en la cuenta bancaria del operador.
   **El ingreso del operador no pasa en ningún momento por las cuentas de Numan.**
5. **El operador emite el CFDI al cliente** con su propio sello digital, desde el
   motor de facturación de la plataforma.
6. **Numan le emite al operador** el CFDI por su comisión y la constancia de
   retención.
7. Numan entera las retenciones al SAT antes del día 17 del mes siguiente.

### Por qué elegimos que el dinero NO pase por Numan
Es la decisión de arquitectura más importante y la tomamos por dos motivos:

- **Fiscal:** Numan solo reconoce como ingreso su comisión, que fue lo que
  entendimos de la reunión del 22 de julio.
- **PLD:** Numan **no custodia fondos de terceros**. Lo único que retiene es su
  propia comisión y el impuesto que la ley la obliga a retener y enterar. Si el
  dinero pasara por Numan para luego transferirse, estaríamos manteniendo
  recursos ajenos en nuestras cuentas.

**Es justamente este punto el que nos gustaría que confirmen.**

---

## C · Datos para el análisis de PLD

| | |
|---|---|
| Medio de pago dominante | Tarjeta vía Stripe. Numan **no recibe efectivo de clientes** |
| Operaciones registradas | **51 pagos** por **$659,300 MXN** desde junio de 2026 |
| Ticket | de $2,550 a $18,560 MXN por persona |
| Origen de los clientes | Redes sociales propias y recomendación. Sin intermediarios |
| Perfil del cliente | Persona física, usuario final del viaje |
| Pagos en efectivo | Solo de Numan **hacia** proveedores locales (guías de comunidad) |
| Operaciones internacionales | Ninguna. Todo en pesos, clientes y proveedores en México |
| Fondos de terceros en custodia | **Ninguno hoy.** En el modelo propuesto, tampoco |

⚠️ **Corrección a lo dicho en la reunión:** se mencionó una expectativa de ~500
facturas diarias. Ese es un escenario de crecimiento, no la operación actual. El
volumen real es el de la tabla.
