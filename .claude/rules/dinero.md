---
paths:
  - "src/lib/payments/**"
  - "src/lib/facturacion/**"
  - "src/app/caminante/api/payments/**"
  - "src/app/caminante/admin/dinero/**"
  - "src/app/caminante/reservar/**"
  - "src/app/caminante/reserva/**"
---

# Dinero: cobros, webhook y facturación

**Stripe está en LIVE desde el 1 jul 2026.** Todo lo que se toca aquí mueve dinero
real de clientes reales. Si dudas, no lo toques y pregunta.

## Las cuatro puertas por las que nace una reserva

Son cuatro a propósito, y **las cuatro tienen que quedar igual de completas**:

1. **Web self-serve** — `/caminante/reservar/[slug]` → `createCheckout`
   (`lib/payments/checkout.ts`) → webhook → `finalize-selfserve.ts`.
2. **WhatsApp** — `/admin/cobro` arma la reserva y su **página de pago**
   `/caminante/pago/<token>` (`reservation-links.ts`, `reservations.pago_token`,
   0074) → la persona toca «Pagar» → `pagina-pago.ts` crea la Checkout Session
   → webhook → `finalize-reservation.ts` → `/caminante/reserva/exito` con
   «Firmar mi deslinde». **Ya no se crean Payment Links de Stripe** (3 nov
   2026: la persona llegaba a Stripe sin contexto y al pagar se perdía).
3. **Transferencia / efectivo** — `/admin/dinero` → `lib/admin/transferencias.ts`.
4. **Pago manual con enlace de alta** — el admin captura lo poco que sabe y el
   sistema devuelve un link para que la persona se dé de alta y firme.

La puerta 2 tiene una variante desde el 29 oct: el **link de pago especial** por
salida (descuento en % o monto fijo, con motivo escrito en `reservations.notes`),
`lib/payments/link-especial.ts`. Misma página de pago, mismo webhook, misma
comisión sobre lo cobrado. Ver `rules/experiencias.md`.

**Códigos de descuento (0074, 3 nov 2026):** son **de una salida**: se crean
desde la cápsula de esa salida en Salidas (`admin/salidas/CodigoDescuento.tsx`;
`codigos_descuento` con `slot_id` siempre puesto: % o pesos, usos máximos,
vencimiento). El 4 nov Luis los sacó de Recursos: «cada salida puntual tiene su
código individual». «Copiar mensaje» da el texto con la liga del grupo de esa
salida y `?codigo=`. Como de la liga del grupo a `/reservar` hay varios brincos
(crear cuenta, verificar celular, login) que tiran la query, el **middleware**
guarda el código en la cookie `caminante_codigo` (`lib/descuentos/cookie.ts`,
30 días, último toque) y `/reservar` lo lee de la query o de la cookie, lo cotiza
en el servidor y arranca con el descuento puesto. El de la cookie que no aplique
a esa salida se ignora en silencio; el de la query avisa. La persona también
puede teclearlo a mano. `createCheckout` lo resuelve
server-side (`lib/descuentos/codigos.ts`), lo manda a Stripe como cupón de un
uso (`discounts`) y el webhook lo congela en la reserva
(`codigo_descuento_id`, `descuento_mxn`, `precio_lista_mxn`) y sube `usos` con
`usar_codigo_descuento`. **Aplica al viaje, no a los complementos; la comisión
va sobre lo cobrado.** Los usos se gastan al pagar, no al cotizar.

⚠️ Hasta el 11 ago la 3 y la 4 **no existían**, y quien pagaba por transferencia
simplemente no existía para la plataforma. Lo destapó Lorena Saravia: transfirió
$16,500 y la salida se veía en 4/12 cuando iba en 5/12, con ella lista para viajar
sin firmar deslinde.

## El webhook es el único camino rastreado

`api/payments/webhook/route.ts`. Orden: `finalizeReservationCheckout` (WhatsApp)
→ si `handled=false`, `finalizeSelfServeCheckout` (web). Idempotente por
`payments.provider_ref` (= PaymentIntent id).

**Verifica con DOS secretos de firma** — ver `rules/operadores-connect.md`.

`charge.refunded` → `finalizeRefund`. Sin eso un cobro devuelto seguía contando
como ingreso y como bruto del operador.

`payment_intent.succeeded` está **guardado por `intent.metadata.trip_id`**: es el
camino marketplace dormido (trips/bookings). Los PI de Payment Links no lo traen.

⚠️ **Los links de Stripe generados a mano quedaron eliminados.** No pasaban por
webhook → no registraban ni atribuían. Hay **un solo camino web rastreado**.

## Reglas que no se rompen

- **El monto se resuelve SIEMPRE server-side.** `createCheckout` calcula el precio
  por índice contra `priceTiers` guardado — **jamás un monto que venga del
  cliente**. Prioridad: tier elegido → `slot.price_mxn` → `price.amount`.
- **El status solo avanza, nunca retrocede** (RANK en `finalize-*`). No toca
  `completed` ni `cancelled`.
- **Check de cupo real antes de cobrar**, y token exacto para salidas privadas.
- **El gate del deslinde bloquea cobrar** (`deslindeListo`). Aunque algo se cuele
  publicado, no se cobra sin deslinde.
- **`stripe_fee_mxn` en NULL cuando no aplica** (transferencias): «no aplica» no es
  «fue cero», y el tablero de rentabilidad distingue las dos cosas.
- **Datos médicos JAMÁS salen a Notion** ni a ninguna herramienta externa (LFPDPPP).
  `notion_sync_log` lleva payload solo comercial.

## La comisión real de Stripe MX (medida, no estimada)

**3.6% + $3 MXN + 16% de IVA sobre la comisión = 4.229% all-in.** El IVA es
acreditable, así que el costo fiscal real es 3.646%. Una tarjeta Amex extranjera
midió 4.1% + $3.

Si el cliente absorbe la comisión, el cálculo es **`total = (base + 3) / (1 − 0.036)`**.
El ingenuo `base × 1.036` deja **$15 corto por transacción** a $11,500.

## Facturación (CFDI)

**El mapa y el modelo viven en `design/contabilidad/MAPA-FACTURACION.md`** (9 nov
2026): operamos como Airbnb. La OPERADORA factura al cliente (B1, con su CSD desde
el portal); NUMAN factura a la operadora sólo su comisión + IVA (B2); NUMAN retiene
y emite el CFDI de retenciones (R1). La comisión de Stripe va dentro de la de NUMAN.
Las experiencias propias las operará **DRUIDAS** (empresa de turismo por constituir).

**Fase 1 (código, 9 nov):** `lib/facturacion/emitir.ts` es el ÚNICO núcleo que
timbra (conceptos: viaje por persona con el descuento como `discount` + cada
complemento; lo que suma tiene que ser lo cobrado o cae a un solo concepto). Lo
llaman la autofactura pública por token (`facturacion/actions.ts`) y «Facturar»
en Mi espacio (`lib/perfil/facturacion-actions.ts`) con la ficha de
`datos_fiscales` (0075, una por cuenta, congelada en cada CFDI). `estadoFacturable`
decide si el botón existe. **El emisor es la operadora de la experiencia**: en
Fase 1 sólo la casa (la organización de `FACTURAPI_SECRET_KEY`); una venta de
operadora externa dice «cuando su facturación quede conectada» (Fase 2:
`operators.facturapi_org_id`, una organización por operadora). Clave por defecto
**90121501** (no 90121500, que es la familia), o `experience.data.fiscal`.

**Fase 1.5 (9 nov, rehecha el 17 nov — SIN recibos de Facturapi, 0086/0087):**
⚠️ **No usar los recibos (E-Receipts) de Facturapi**: son un producto aparte de
**$599/mes POR ORGANIZACIÓN** + $0.40 por recibo (visto en la cuenta el 17 nov);
la API de $299 no los incluye, pero sí emite la global como CFDI normal. El
flujo: cada pago → **comprobante nuestro** por correo con su **folio**
(`payments.folio` → `CAM-000123`; `lib/facturacion/comprobantes.ts`, cron
`comprobantes` cada hora + best-effort al cobrar) → si piden factura, **factura
de ingreso directa** por lo neto (`emitir.ts`), sólo **hasta el fin del mes del
cobro** (`enPlazoParaFacturar`; ese plazo es lo que impide facturar dos veces)
→ si no, **global** de cada mes cerrado (`global.ts` + `global-plan.ts` puro,
cron `factura-global` **diario**, 7:00 CDMX): un CFDI a XAXX010101000 con el
nodo `global`, **un concepto por pago** (01010101, ACT, «Venta», el folio como
número de identificación; D21 lo confirmó), por lo neto, **forma de pago la
del PAGO INDIVIDUAL más grande** (D21 bis, guía del CFDI global 4.0; NO la que
suma más en el mes), y **fechada el último día del mes que factura** (lo pidió
Marisol el 12 nov; el SAT deja hasta 72 h atrás — si corre más tarde sale con
fecha de hoy y avisa). **Pago capturado tarde** (su mes ya tiene global) →
**global COMPLEMENTARIA** de ese mismo mes en la siguiente corrida, con fecha
del día y su propia llave de idempotencia (`modoDeGlobal`); cada global avisa
a la casa por correo (`notifyFacturaGlobal`) para que lo sepa la contadora.
**El plazo se le dice al cliente antes de pagar** (`aviso-plazo.ts`, en
reservar y en la página de pago, sólo si ese emisor factura aquí) y en el
comprobante, que además lleva RFC y régimen del emisor, lugar, fecha, servicio,
total y folio (condiciones de D21). Los pagos quedan
`publico-general` + `cfdi_global_id` (`cfdi_globales.pagos`). Emisor por pago en
`emisor.ts`; organización por operadora en `organizacion.ts` (datos legales +
CSD en memoria desde Mi alta → Cobrar; llaves cifradas con
`FACTURAPI_KEY_SECRET`). Env: `FACTURAPI_SECRET_KEY` (la casa), `FACTURAPI_USER_KEY`
(organizaciones), `FACTURAPI_KEY_SECRET` (32 bytes base64), `FACTURACION_CLIENTES`.

**Dos interruptores y un corte (candados legales, 12 nov 2026, 0083 —
`lib/facturacion/corte.ts`):**
- `FACTURAPI_SECRET_KEY` sola (`facturacionActiva()`) prende **sólo el CFDI de
  retenciones** a las operadoras. Retener es obligación de NUMAN aunque lo demás espere.
- Comprobantes, autofactura y global a clientes piden además `FACTURACION_CLIENTES=1`
  (`facturacionClientesActiva()`; lo usan `emisor.ts`, `comprobantes.ts`, las pantallas).
  Apagado hasta el visto bueno de la contadora.
- **El corte es código:** `CORTE_FACTURACION_CLIENTES` = **00:00 CDMX del 1 nov
  2026** (D21, aprobado por Luis el 17 nov: el sistema factura MESES COMPLETOS;
  octubre y lo anterior los cierra Marisol tras conciliar contra banco y Stripe,
  y hasta entonces no se marca nada). Nada se emite sobre un cobro anterior: ni
  comprobante, ni autofactura (`estadoFacturable`), ni global (`planGlobal`).
  Cambiar la fecha es un commit, no una variable. (Sustituyó a
  `FACTURAPI_RECIBOS_DESDE`, que además comparaba contra medianoche UTC.)
- Lo posterior al corte que la contadora ya facturó: `status_cfdi = 'externo'` +
  `cfdi_externo_uuid` (su folio) + `cfdi_externo_nota`. El check exige el UUID.
  Se marca por SQL con la lista de ella y aprobación de Luis.
- **A la global sólo entra** lo `por-emitir`, cobrado en el periodo y desde el
  corte, con algo neto por facturar (`planGlobal`): lo facturado al cliente, lo
  `externo`, lo devuelto completo y lo anterior al corte quedan fuera solos.
- **Antes de prender `FACTURACION_CLIENTES` (D21):** la operación de noviembre
  que Marisol ya facturó marcada `externo` con su UUID (falta su XML); la
  emisión de prueba de la global en sandbox cotejada por legal; y la
  aprobación de Luis.

**Devoluciones en los papeles (D19, 0084, 17 nov 2026 — `lib/facturacion/devoluciones.ts`):**
el MISMO día en que Stripe confirma, `finalizeRefund` corrige el documento; el
cron `comprobantes` reintenta lo que falle. Qué toca lo decide `planDevolucion`
(puro, `devolucion-plan.ts`): sin CFDI → **nada** (la factura o la global que
salgan después ya van por lo neto); con CFDI (factura del cliente o global) →
**CFDI de egreso** relacionado 01, uso G02, forma de pago del cobro, PUE. El
concepto lo arma `conceptoDeEgreso` (D21 bis): **contra una global**, a público
en general, clave **84111506** con el folio de la operación como número de
identificación, cantidad 1, unidad ACT; **contra la factura del cliente**, la
clave de la experiencia. ⚠️ La llave de idempotencia de la global repetida tras
un timbrado exitoso contesta **409** (no duplica ni devuelve la factura): nunca
se genera una llave nueva para el mismo emisor, mes y modo; se busca en
Facturapi por `external_id` y se anota. La cancelación del original
(motivo 03) NO es automática: el egreso es la regla general y el numeral/plazo
de la cancelación sin aceptación lo confirma la contadora (M19). Lo `externo`
lo documenta la contadora (la pantalla de facturación lo cuenta).
`devuelto_al_facturar_mxn` = lo devuelto que el CFDI de ingreso YA salió
descontando; un egreso sólo ampara lo devuelto después. Cada egreso se identifica por el
acumulado que documenta (índice único): webhook + panel no timbran dos.
⚠️ **`marcarYCerrar` ya no existe**: ponía `refunded` a ciegas (una devolución
parcial desde el panel quedaba como total). Ahora el panel lee el cargo de
Stripe (`cerrarDesdeStripe`) y corre el mismo `finalizeRefund` que el webhook.

**Facturación desde el portal (D20, 0084 — `lib/facturacion/portal.ts`, Cobrar →
«Facturación desde Caminante»):** la operadora nunca ve Facturapi. Tres pasos,
cada uno con candado en el servidor: (1) **activa** aceptando el §1 bis del
convenio vigente, recortado del texto publicado (`uno-bis.ts`), guardado en
`operator_facturacion_portal` (append-only, texto + hash + versión + quién);
(2) **sube su CSD**: los dos archivos y la contraseña viajan EN MEMORIA a
Facturapi en una petición (`subirCsdAction`); no hay bucket, ni disco, ni log, y
sólo queda `facturapi_csd_serial` + `csd_vence_at` (D20 bis); (3) **firma su
carta manifiesto** en el módulo incrustado de Facturapi
(`facturapi.io/embedded/manifiesto`, con aviso visible de que es página de
Facturapi); la firmada se lee de `pending_steps`. Sólo ella activa y sube (o la
casa sobre una operadora `propia`); la casa puede desactivar. Desactivar o
`estado = baja` (cron) apaga la emisión al instante y da de baja el CSD en
Facturapi. `emisorDeFila` exige activación + CSD + manifiesto.

**La factura de la comisión a la operadora (B2, 0088 — `lib/facturacion/comisiones.ts`
+ `comision-plan.ts` puro; D7, D8, D9; convenio Décima tercera §2 y §4):**
tercer interruptor, **`FACTURACION_COMISIONES=1`** (además de la llave de la
casa). Sólo para cobros por **cuenta conectada** (`canal_cobro = 'connect'`):
ahí la operadora es el comercio y lo único que NUMAN factura es su comisión.
En `casa` no hay B2 (la operadora le factura a NUMAN, D6). Emite la casa, a la
operadora (RFC, razón social, régimen y CP de su constancia; uso G03), clave
**80141628**, **forma de pago 17 (compensación)**, PUE: el total es
exactamente lo retenido al cobrar (`fee_retenido_mxn`); si no cuadra, NO se
timbra. La **cuota de admisión** ($20, IVA incluido) va como segundo concepto
en la venta que la pagó. Si la venta se devuelve: **egreso proporcional**
(`tipo = 'egreso-comision'`, relación 01, G02), y la admisión sólo vuelve en
devolución total. Lo corre el cron `comprobantes` y `finalizeRefund`. Si el
cobro y la emisión caen en meses distintos, el CFDI de comisión se fecha el día
del cobro dentro de las 72 h (`fechaDeComision`, D24), como la global.

Sin la llave, Mi espacio enseña los pagos como «Por facturar». **Sandbox primero.**

Cobros reales sin CFDI entran como `status_cfdi = por-emitir`.

## Cancelaciones: política, calculadora y bonificación (D23, 0089–0091)

**La política** (`lib/cancelacion/politica.ts`, puro; texto transcrito de
`design/legal/POLITICA-CANCELACION-CLIENTE-2026-11.md` y comparado por una
prueba): dos variantes por experiencia (`data.politicaCancelacion`: `estandar`
30/15 o `expedicion` 60/30; sin variante no se publica). Se ve completa en la
ficha y resumida en reservar y en la página de pago, con la frase «Al pagar
aceptas…» junto al botón. **La prueba queda en la reserva**
(`politica_variante`, `politica_hash`, `politica_aceptada_at`): si el texto
cambia, cada reserva conserva el que aceptó.

**La calculadora** (Salidas → «Reembolsar o cancelar»): el sistema PROPONE
cuánto devolver (`proponerReembolso`: cancela la operación → arrepentimiento
legal de 5 días hábiles → 24 horas → ventanas de la variante) a partir de
**cuándo se recibió el aviso** (se captura; no es la hora del clic). La casa
confirma o cambia el monto, y **cambiarlo exige el motivo** (lo valida el
servidor, que recalcula). En `reembolsos` quedan `aviso_at`, `regla` y
`propuesto_mxn`. **Precisiones de D24:** el piso legal (cancela la operación;
arrepentimiento del art. 56) aplica SIEMPRE, también sin variante; una reserva
que no aceptó la política en línea se calcula con la variante de la experiencia
**sólo como referencia** — la pantalla lo dice, nunca dice «aceptaste», y
devolver exige motivo escrito (en la duda, a favor del cliente); los 5 días
hábiles corren desde lo último entre aceptación y primer pago (`plazoDesde`),
la anticipación de 10 días hábiles desde la aceptación. Sin variante y fuera
del piso legal **no hay propuesta** y decide la casa con motivo. Días
hábiles: lista por año del art. 74 LFT en `DESCANSOS_OBLIGATORIOS`; un año que
no esté **no se calcula** (hoy 2026 y 2027: agregar 2028 antes de vender 2028).

**Cancelar una salida pide la causa** (`experience_slots.cancelacion_causa`):
`imputable` (causa de quien opera; **«cupo mínimo no alcanzado» cae aquí y
genera bonificación**, D24.3: hacerlo causa aparte exige texto nuevo de la
política y es decisión de Luis) o `fuerza-mayor` con su clase de D14. **La
fuerza mayor pide el ARCHIVO que la acredita** (D24.4, 0092): se sube al bucket
privado `fuerza-mayor` (`api/admin/fuerza-mayor`, `lib/cancelacion/documento.ts`)
y sin él no se cancela. Excepción: `emergencia-guia` se acredita con la
declaración de la operadora en el motivo y **no guarda archivo** (un parte
médico es dato de salud; el candado de la base lo exige NULL). La causa se
escribe ANTES de pedir las devoluciones: si no se puede escribir, no se
devuelve nada.

**La bonificación del 20 %** (`lib/cancelacion/bonificaciones.ts`, tabla
`bonificaciones`): con causa imputable se crea una «por pagar» por cada reserva
pagada (20 % de lo pagado, complementos incluidos; vence a los 5 días hábiles),
se avisa a la casa y el correo de la cancelación le pide al cliente su cuenta.
**La transfiere Luis**; en Pagos se captura fecha, importe (nunca menos del
20 %), últimos 4 dígitos y clave de rastreo. **La cuenta del cliente no se
guarda.** `operator_id` = la operadora de la que se recupera (NULL = costo de
la casa). No va en el CFDI de egreso (M24, la contadora). ⚠️ Falta construir
el cobro de vuelta a la operadora (compensación contra ventas futuras) y la
penalización de la Quinta §3: hoy la bonificación sólo dice de quién se recupera.

⚠️ **«Reembolsar o cancelar» estuvo ocho semanas sin dibujarse** (24 sep–17
nov 2026): Salidas decidía «es la casa» con `!operatorId`, que es lo que se
MIRA, y desde el sombrero la casa siempre mira por una operadora. Nadie pudo
devolver dinero desde el panel y nada falló. Ahora sale de `alcanceActual()`
(invariante #26), y la guarda de los reembolsos rechaza todo lo que no sea la
casa (antes dejaba pasar al equipo de numan). **Una pantalla de dinero se
verifica ENTRANDO a ella en producción, no leyendo el código.**

**Antes de pagar, a quién reclamar** (LFPC 76 Bis III; D24 y D25): reservar y
la página de pago enseñan «Reclamaciones y aclaraciones»: el contacto de
**Caminante siempre** (responde por la devolución aunque venda una operadora),
el de quien opera si es distinto (`contactoDeVenta`, `contactoPropioDe`), y la
razón social y el **domicilio de NUMAN**. Lo mismo va en el pie del sitio
(escritorio, ficha y menú móvil) y en el aviso de privacidad (LFPDPPP art. 15 I).
Todo sale de `lib/legal/responsable.ts`; una prueba lo compara contra el
documento de legal. **El domicilio de la operadora NO se publica** (muchas son
personas físicas y es su casa); lo resuelve la siguiente versión del convenio.
Si la oficina de NUMAN cambia, primero el SAT y luego ese archivo.

## Nunca inventes un número

Si un dato no está, dilo y di de dónde tendría que salir. **Un reporte con un
número inventado es peor que no tener reporte.** Y nada de parches: si falta algo
para cuadrar, se pide — jamás se tapa con un ajuste.
